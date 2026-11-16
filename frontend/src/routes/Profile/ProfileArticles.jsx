import { useParams } from "react-router-dom";
import ArticlesPagination from "../../components/ArticlesPagination";
import ArticlesPreview from "../../components/ArticlesPreview";
import useArticleList from "../../hooks/useArticles";

function ProfileArticles() {
  const { username } = useParams();

  const { articles, articlesCount, loading, error, setArticlesData } = useArticleList({
    location: "profile",
    username,
  });

  return loading ? (
    <div className="article-preview" role="status" aria-live="polite" aria-busy="true">
      <em>Loading {username} articles...</em>
    </div>
  ) : error ? (
    <p className="interaction-error" role="alert">{error}</p>
  ) : articles.length > 0 ? (
    <>
      <ArticlesPreview
        articles={articles}
        loading={loading}
        updateArticles={setArticlesData}
      />

      <ArticlesPagination
        articlesCount={articlesCount}
        location="profile"
        updateArticles={setArticlesData}
        username={username}
      />
    </>
  ) : (
    <div className="article-preview">{username} doesn't have articles.</div>
  );
}

export default ProfileArticles;
