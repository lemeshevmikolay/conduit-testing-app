import axios from "./api";
import errorHandler from "../helpers/errorHandler";

async function deleteComment({ commentId, headers, slug }) {
  try {
    const { data } = await axios({
      headers,
      method: "DELETE",
      url: `api/articles/${slug}/comments/${commentId}`,
    });

    return data;
  } catch (error) {
    errorHandler(error);
  }
}

export default deleteComment;
