import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import getArticle from "../../services/getArticle";
import setArticle from "../../services/setArticle";
import { normalizeTagInput, validateArticleText, validateTagInput } from "../../helpers/validation";
import FormFieldset from "../FormFieldset";

const emptyForm = { title: "", description: "", body: "", tagList: "" };
const initialForm = (value) => ({
  ...emptyForm,
  ...value,
  tagList: Array.isArray(value?.tagList) ? value.tagList.map((tag) => `#${tag.replace(/^#+/, "")}`).join(" ") : value?.tagList || "",
});

function ArticleEditorForm() {
  const { state } = useLocation();
  const [form, setForm] = useState(() => initialForm(state));
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { isAuth, headers, loggedUser } = useAuth();
  const navigate = useNavigate();
  const { slug } = useParams();

  useEffect(() => {
    if (!isAuth) {
      navigate("/login", { replace: true, state: { from: window.location.hash } });
      return;
    }
    if (state || !slug) return;
    getArticle({ headers, slug })
      .then((article) => {
        if (article.author.username !== loggedUser.username) {
          navigate(`/profile/${loggedUser.username}`, { replace: true });
          return;
        }
        setForm(initialForm(article));
      })
      .catch((error) => setErrors({ form: error.message || "Unable to load article." }));
  }, [headers, isAuth, loggedUser.username, navigate, slug, state]);

  const inputHandler = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const validate = () => ({
    title: validateArticleText(form.title, "title", 5, 240),
    description: validateArticleText(form.description, "description", 5, 240),
    body: validateArticleText(form.body, "body", 20, 9000),
    tagList: validateTagInput(normalizeTagInput(form.tagList)),
  });

  const formSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;
    setLoading(true);
    try {
      const payload = {
        headers,
        slug,
        body: form.body,
        description: form.description,
        tagList: normalizeTagInput(form.tagList),
        title: form.title,
      };
      let nextSlug;
      try {
        nextSlug = await setArticle(payload);
      } catch (error) {
        if (slug || error.status !== 409 || !window.confirm("Article with a similar Title already exists. Do you want to continue?")) throw error;
        nextSlug = await setArticle({ ...payload, allowDuplicateTitle: true });
      }
      navigate(`/article/${nextSlug}`);
    } catch (error) {
      setErrors({ form: error.message || "Unable to save the article." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={formSubmit} noValidate>
      <fieldset disabled={loading}>
        {errors.form && <p className="error-messages" role="alert">{errors.form}</p>}
        <FormFieldset placeholder="Article Title" name="title" required minLength={5} maxLength={240} value={form.title} handler={inputHandler} error={errors.title} />
        <FormFieldset normal placeholder="What's this article about?" name="description" required minLength={5} maxLength={240} value={form.description} handler={inputHandler} error={errors.description} />
        <fieldset className="form-group">
          <textarea
            aria-describedby={errors.body ? "body-error" : undefined}
            aria-invalid={errors.body ? "true" : undefined}
            className="form-control"
            maxLength={9000}
            minLength={20}
            name="body"
            onChange={inputHandler}
            placeholder="Write your article (in markdown)"
            required
            rows={8}
            style={{ resize: "vertical" }}
            value={form.body}
          />
          {errors.body && <small className="error-messages" id="body-error" role="alert">{errors.body}</small>}
        </fieldset>
        <FormFieldset normal placeholder="Enter tags, separated by spaces or commas" name="tags" value={form.tagList} handler={(event) => {
          setForm((current) => ({ ...current, tagList: event.target.value }));
          setErrors((current) => ({ ...current, tagList: "" }));
        }} error={errors.tagList} />
        <button className="btn btn-lg pull-xs-right btn-primary" type="submit">
          {loading ? "Saving…" : slug ? "Update Article" : "Publish Article"}
        </button>
      </fieldset>
    </form>
  );
}

export default ArticleEditorForm;
