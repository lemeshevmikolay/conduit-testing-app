import { Link, useNavigate } from "react-router-dom";
import { Pencil, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import deleteArticle from "../../services/deleteArticle";
import { useState } from "react";

function ArticleAuthorButtons({ body, description, slug, tagList, title }) {
  const { headers, isAuth } = useAuth();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleClick = () => {
    if (!isAuth) return alert("You need to login first");

    const confirmation = window.confirm("Want to delete the article?");
    if (!confirmation) return;

    setDeleting(true);
    setError("");
    deleteArticle({ headers, slug })
      .then(() => navigate("/"))
      .catch((requestError) => {
        setError(requestError.message || "Unable to delete article.");
        setDeleting(false);
      });
  };

  return (
    <>
      {error && <span className="interaction-error" role="alert">{error}</span>}
      <button
        className="btn btn-sm btn-outline-danger"
        aria-busy={deleting}
        disabled={deleting}
        onClick={handleClick}
        type="button"
      >
        <Trash2 aria-hidden="true" size={15} /> {deleting ? "Deleting…" : "Delete Article"}
      </button>{" "}
      <Link
        className="btn btn-sm btn-outline-secondary"
        state={{ body, description, tagList, title }}
        to={`/editor/${slug}`}
      >
        <Pencil aria-hidden="true" size={15} /> Edit Article
      </Link>{" "}
    </>
  );
}

export default ArticleAuthorButtons;
