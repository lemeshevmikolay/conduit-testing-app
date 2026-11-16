import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import toggleFollow from "../../services/toggleFollow";

function FollowButton({ followersCount, following, handler, username }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { headers, isAuth } = useAuth();

  const buttonStyle = following ? "btn-secondary" : "";
  const iconStyle = following ? "ion-minus-round" : "ion-plus-round";
  const text = !isAuth ? "Followers" : following ? " Unfollow " : " Follow ";

  const handleClick = () => {
    if (!isAuth) return alert("You need to login first");

    setLoading(true);
    setError("");

    toggleFollow({ following, headers, username })
      .then(handler)
      .catch((requestError) => setError(requestError.message || "Unable to update follow status."))
      .finally(() => setLoading(false));
  };

  return (
    <>
      {error && <span className="interaction-error" role="alert">{error}</span>}
      <button
        className={`btn btn-sm action-btn ${buttonStyle}`}
        aria-busy={loading}
        data-testid="follow-button"
        disabled={loading}
        onClick={handleClick}
      >
        {loading ? "Updating…" : <>{isAuth && <i aria-hidden="true" className={iconStyle}></i>} {text} {isAuth && username}</>}
        <span className="counter"> ( {followersCount} )</span>
      </button>{" "}
    </>
  );
}

export default FollowButton;
