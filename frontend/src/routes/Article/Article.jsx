import Markdown from "markdown-to-jsx";
import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import ArticleMeta from "../../components/ArticleMeta";
import ArticlesButtons from "../../components/ArticlesButtons";
import ArticleTags from "../../components/ArticleTags";
import BannerContainer from "../../components/BannerContainer";
import { useAuth } from "../../context/AuthContext";
import getArticle from "../../services/getArticle";

function Article() {
  const { state } = useLocation();
  const [article, setArticle] = useState(state || {});
  const [loading, setLoading] = useState(!state);
  const { title, body, tagList, createdAt, author, sourceUrl } = article || {};
  const { headers, isAuth } = useAuth();
  const navigate = useNavigate();
  const { slug } = useParams();

  useEffect(() => {
    if (state) return;
    let active = true;
    setLoading(true);
    getArticle({ slug, headers })
      .then((result) => { if (active) setArticle(result); })
      .catch((error) => {
        console.error(error);
        if (active) navigate("/not-found", { replace: true });
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isAuth, slug, headers, state, navigate]);

  return (
    <div className="article-page">
      <BannerContainer>
        {loading ? <p className="interaction-status" role="status" aria-live="polite">Loading article…</p> : <>
          <h1>{title}</h1>
          <ArticleMeta author={author} createdAt={createdAt}>
            <ArticlesButtons article={article} setArticle={setArticle} />
          </ArticleMeta>
        </>}
      </BannerContainer>

      <div className="container page">
        <div className="row article-content">
          <div className="col-md-12">
            {body && <Markdown options={{ forceBlock: true }}>{body}</Markdown>}
            {sourceUrl && (
              <p className="article-source">
                <a href={sourceUrl} target="_blank" rel="noreferrer">
                  Читати джерело на Habr ↗
                </a>
              </p>
            )}
            <ArticleTags tagList={tagList} />
          </div>
        </div>

        <hr />

        <div className="article-actions">
          <ArticleMeta author={author} createdAt={createdAt}>
            <ArticlesButtons article={article} setArticle={setArticle} />
          </ArticleMeta>
        </div>

        <Outlet />
      </div>
    </div>
  );
}

export default Article;
