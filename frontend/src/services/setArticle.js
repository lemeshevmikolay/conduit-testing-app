import axios from "./api";
import handleApiError from "../helpers/handleApiError";

async function setArticle({ allowDuplicateTitle, body, description, headers, slug, tagList, title }) {
  try {
    const { data } = await axios({
      data: { article: { title, description, body, tagList, allowDuplicateTitle } },
      headers,
      method: slug ? "PUT" : "POST",
      url: slug ? `api/articles/${slug}` : "api/articles",
    });

    return data.article.slug;
  } catch (error) {
    throw handleApiError(error);
  }
}

export default setArticle;
