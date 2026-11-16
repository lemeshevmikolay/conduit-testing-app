import ArticlesPagination from "../components/ArticlesPagination";
import ArticlesPreview from "../components/ArticlesPreview";
import { useFeedContext } from "../context/FeedContext";
import useArticleList from "../hooks/useArticles";

function HomeArticles() {
  const { tabName, tagName } = useFeedContext();

  const { articles, articlesCount, loading, error, setArticlesData } = useArticleList({
    location: tabName,
    tabName,
    tagName,
  });

  return loading ? (
    <div className="article-preview" role="status" aria-live="polite" aria-busy="true">
      <em>Loading articles list...</em>
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
        location={tabName}
        tagName={tagName}
        updateArticles={setArticlesData}
      />
    </>
  ) : (
    <div className="article-preview">Articles not available.</div>
  );
}

export default HomeArticles;
