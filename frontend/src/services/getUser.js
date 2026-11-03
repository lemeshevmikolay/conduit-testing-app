import axios from "./api";
import errorHandler from "../helpers/errorHandler";

async function getUser({ headers }) {
  try {
    const { data } = await axios({ headers, url: "api/user" });

    return data.user;
  } catch (error) {
    errorHandler(error);
  }
}

export default getUser;
