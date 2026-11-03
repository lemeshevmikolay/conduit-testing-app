import axios from "./api";
import errorHandler from "../helpers/errorHandler";

async function getComments({ slug }) {
  try {
    const { data } = await axios({ url: `api/articles/${slug}/comments` });

    return data.comments;
  } catch (error) {
    errorHandler(error);
  }
}

export default getComments;
