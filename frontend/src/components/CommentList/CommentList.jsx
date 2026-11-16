import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import dateFormatter from "../../helpers/dateFormatter";
import deleteComment from "../../services/deleteComment";
import getComments from "../../services/getComments";
import CommentAuthor from "./CommentAuthor";

function CommentList({ triggerUpdate, updateComments }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const { headers, isAuth, loggedUser } = useAuth();
  const { slug } = useParams();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    getComments({ slug })
      .then((items) => { if (active) setComments(items); })
      .catch((loadError) => { if (active) setError(loadError.message || "Unable to load comments."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [slug, triggerUpdate]);

  const handleClick = (commentId) => {
    if (!isAuth) alert("You need to login first");

    const confirmation = window.confirm("Want to delete the comment?");
    if (!confirmation) return;

    setDeletingId(commentId);
    deleteComment({ commentId, headers, slug })
      .then(updateComments)
      .catch((deleteError) => setError(deleteError.message || "Unable to delete comment."))
      .finally(() => setDeletingId(null));
  };

  if (loading) return <p className="interaction-status" role="status" aria-live="polite">Loading comments…</p>;
  if (error) return <p className="interaction-error" role="alert">{error}</p>;
  return comments?.length > 0 ? (
    comments.map(({ author, author: { username }, body, createdAt, id }) => {
      return (
        <div className="card" data-testid="comment-card" key={id}>
          <div className="card-block">
            <p className="card-text">{body}</p>
          </div>
          <div className="card-footer">
            <CommentAuthor {...author} />
            <span className="date-posted">{dateFormatter(createdAt)}</span>
            {isAuth && loggedUser.username === username && (
              <button
                className="btn btn-sm btn-outline-secondary pull-xs-right"
                aria-label={deletingId === id ? "Deleting comment" : "Delete comment"}
                aria-busy={deletingId === id}
                data-testid="delete-comment"
                disabled={deletingId !== null}
                onClick={() => handleClick(id)}
                type="button"
              >
                {deletingId === id ? "Deleting…" : <i aria-hidden="true" className="ion-trash-a"></i>}
              </button>
            )}
          </div>
        </div>
      );
    })
  ) : (
    <div>There are no comments yet...</div>
  );
}

export default CommentList;
