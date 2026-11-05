import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import toggleFav from "../../services/toggleFav";

function FavButton({ favorited, favoritesCount, handler, right, slug, text }) {
  const [loading, setLoading] = useState(false);
  const { headers, isAuth } = useAuth();

  const buttonPosition = right ? "pull-xs-right" : "";
  const buttonStyle = favorited ? "active" : "";
  const buttonText = text ? (favorited ? "Favorited" : "Favorite") : "Like";

  const handleClick = () => {
    if (!isAuth) return;

    setLoading(true);

    toggleFav({ slug, favorited, headers })
      .then(handler)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  return (
    <button
      className={`btn btn-sm btn-outline-primary ${buttonPosition} ${buttonStyle}`}
      aria-label={isAuth ? `${favorited ? "Unlike" : "Like"} article` : "Sign in to like this article"}
      data-testid="favorite-button"
      data-favorited={Boolean(favorited)}
      disabled={loading || !isAuth}
      onClick={handleClick}
      title={!isAuth ? "Sign in to like this article" : undefined}
    >
      <i className="ion-heart"></i> {buttonText}
      {isAuth && <span className="counter"> ( {favoritesCount} )</span>}
    </button>
  );
}

export default FavButton;
