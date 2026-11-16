import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import getArticles from "../services/getArticles";

function useArticles({ location, tabName, tagName, username }) {
  const [{ articles, articlesCount }, setArticlesData] = useState({
    articles: [],
    articlesCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { headers } = useAuth();

  useEffect(() => {
    if (!headers && tabName === "feed") return;

    let active = true;
    setLoading(true);
    setError("");

    getArticles({ headers, location, tabName, tagName, username })
      .then((data) => { if (active) setArticlesData(data); })
      .catch((loadError) => { if (active) setError(loadError.message || "Unable to load articles."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [headers, location, tabName, tagName, username]);

  return { articles, articlesCount, loading, error, setArticlesData };
}

export default useArticles;
