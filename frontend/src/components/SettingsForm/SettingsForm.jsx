import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import userUpdate from "../../services/userUpdate";
import userLogout from "../../services/userLogout";
import { validateEmail, validatePassword, validateUsername } from "../../helpers/validation";
import FormFieldset from "../FormFieldset";

const validateImage = (value) => {
  if (!value) return "";
  try {
    const url = new URL(value);
    return ["http:", "https:", "data:"].includes(url.protocol) ? "" : "URL of profile picture is invalid";
  } catch {
    return "URL of profile picture is invalid";
  }
};

function SettingsForm() {
  const { headers, isAuth, loggedUser, setAuthState } = useAuth();
  const [form, setForm] = useState({
    bio: loggedUser.bio || "",
    email: loggedUser.email || "",
    image: loggedUser.image || "",
    password: "",
    username: loggedUser.username || "",
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuth) navigate("/login", { replace: true, state: { from: "#/settings" } });
  }, [isAuth, navigate]);

  const inputHandler = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setSuccess("");
  };

  const validate = () => ({
    username: validateUsername(form.username),
    email: validateEmail(form.email),
    image: validateImage(form.image),
    bio: form.bio.length > 9000
      ? "Short bio must not exceed 9000 characters."
      : form.bio.trim() !== form.bio || / {2,}/.test(form.bio)
        ? "Short bio must not start or end with spaces or contain repeated spaces."
        : "",
    password: form.password ? validatePassword(form.password) : "",
  });

  const formSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) return;
    setSaving(true);
    setSuccess("");
    try {
      const authState = await userUpdate({ headers, ...form });
      setAuthState(authState);
      setForm((current) => ({ ...current, password: "" }));
      setSuccess("Settings updated.");
    } catch (error) {
      if (error.message?.toLowerCase().includes("username")) setErrors((current) => ({ ...current, username: error.message }));
      else if (error.message?.toLowerCase().includes("email")) setErrors((current) => ({ ...current, email: error.message }));
      else if (error.message?.toLowerCase().includes("password")) setErrors((current) => ({ ...current, password: error.message }));
      else setErrors((current) => ({ ...current, form: error.message || "Unable to update settings." }));
    } finally {
      setSaving(false);
    }
  };

  const logout = () => {
    setAuthState(userLogout());
    navigate("/", { replace: true });
  };

  if (!isAuth) return null;
  return (
    <form onSubmit={formSubmit} noValidate>
      <fieldset disabled={saving}>
        {errors.form && <p className="error-messages" role="alert">{errors.form}</p>}
        {success && <p role="status">{success}</p>}
        <FormFieldset placeholder="URL of profile picture" name="image" maxLength={2048} value={form.image} handler={inputHandler} error={errors.image} />
        <FormFieldset placeholder="Your Name" name="username" required maxLength={40} autoComplete="username" value={form.username} handler={inputHandler} error={errors.username} />
        <fieldset className="form-group">
          <textarea aria-describedby={errors.bio ? "bio-error" : undefined} aria-invalid={errors.bio ? "true" : undefined} className="form-control form-control-lg" maxLength={9000} rows={8} placeholder="Short bio about you" name="bio" value={form.bio} onChange={inputHandler} />
          {errors.bio && <small className="error-messages" id="bio-error" role="alert">{errors.bio}</small>}
        </fieldset>
        <FormFieldset type="email" placeholder="Email" name="email" required maxLength={254} autoComplete="email" value={form.email} handler={inputHandler} error={errors.email} />
        <FormFieldset type="password" name="password" value={form.password} placeholder="New password" autoComplete="new-password" minLength={8} maxLength={30} preventCopy handler={inputHandler} error={errors.password} />
        <button type="submit" className="btn btn-lg btn-primary pull-xs-right">{saving ? "Saving…" : "Update Settings"}</button>
        <button type="button" className="btn btn-outline-danger" onClick={logout}>Or click here to logout</button>
      </fieldset>
    </form>
  );
}

export default SettingsForm;
