import axios from "./api";
import handleApiError from "../helpers/handleApiError";

async function userSignUp({ username, email, password }) {
  try {
    const { data } = await axios({
      data: { user: { username, email, password } },
      method: "POST",
      url: "api/users",
    });

    return data.user;
  } catch (error) {
    throw handleApiError(error);
  }
}

export default userSignUp;
