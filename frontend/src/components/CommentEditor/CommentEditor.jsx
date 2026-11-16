import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import postComment from "../../services/postComment";
import Avatar from "../Avatar";

function CommentEditor({ updateComments }) {
  const [{ body }, setForm] = useState({ body: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const { headers, isAuth, loggedUser } = useAuth();
  const { username, image } = loggedUser || {};
  const { slug } = useParams();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (body.trim() === "" || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const result = await postComment({ body, headers, slug });
      await updateComments(result);
      setForm({ body: "" });
    } catch (submitError) {
      setError(submitError.message || "Unable to post comment. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setForm({ body: e.target.value });
  };

  return isAuth ? (
    <form className="card comment-form" onSubmit={handleSubmit}>
      {error && <p className="interaction-error" id="comment-submit-error" role="alert">{error}</p>}
      <div className="card-block">
        <textarea
          aria-label="Write a comment"
          aria-describedby={error ? "comment-submit-error" : undefined}
          aria-invalid={error ? "true" : undefined}
          disabled={submitting}
          className="form-control"
          maxLength={9000}
          onChange={handleChange}
          placeholder="Write a comment..."
          rows="3"
          value={body}
        ></textarea>
      </div>

      <div className="card-footer" aria-busy={submitting}>
        <Avatar alt={username} className="comment-author-img" src={image} />
        <button className="btn btn-sm btn-primary" disabled={submitting || !body.trim()} type="submit">
          {submitting ? "Posting…" : "Post Comment"}
        </button>
      </div>
    </form>
  ) : (
    <span>
      <Link to="/login">Sign in</Link> or <Link to="/register">Sign up</Link> to
      add comments on this article.
    </span>
  );
}

export default CommentEditor;
