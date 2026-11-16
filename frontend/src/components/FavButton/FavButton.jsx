import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import toggleFav from "../../services/toggleFav";

function FavButton({ favorited, favoritesCount, handler, right, slug, text }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { headers, isAuth } = useAuth();

  const buttonPosition = right ? "pull-xs-right" : "";
  const buttonStyle = favorited ? "active" : "";
  const buttonText = text ? (favorited ? "Favorited" : "Favorite") : "Like";

  const handleClick = () => {
    if (!isAuth) return;

    setLoading(true);
    setError("");

    toggleFav({ slug, favorited, headers })
      .then(handler)
      .catch((requestError) => setError(requestError.message || "Unable to update favorite status."))
      .finally(() => setLoading(false));
  };

  return (
    <span className="favorite-control">
    <button
      className={`btn btn-sm btn-outline-primary ${buttonPosition} ${buttonStyle}`}
      aria-label={isAuth ? `${favorited ? "Unlike" : "Like"} article` : "Sign in to like this article"}
      aria-busy={loading}
      data-testid="favorite-button"
      data-favorited={Boolean(favorited)}
      disabled={loading || !isAuth}
      onClick={handleClick}
      title={!isAuth ? "Sign in to like this article" : undefined}
    >
      <i aria-hidden="true" className="ion-heart"></i> {loading ? "Updating…" : buttonText}
      {isAuth && <span className="counter"> ( {favoritesCount} )</span>}
    </button>
    {error && <span className="interaction-error" role="alert">{error}</span>}
    </span>
  );
}

export default FavButton;
