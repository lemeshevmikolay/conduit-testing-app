import axios from "./api";
import handleApiError from "../helpers/handleApiError";

async function userUpdate({ headers, bio, email, image, password, username }) {
  try {
    const { data } = await axios({
      data: { user: { bio, email, image, password, username } },
      headers,
      method: "PUT",
      url: "api/user",
    });

    const { user } = data;
    const updatedHeaders = { Authorization: `Token ${user.token}` };

    const loggedIn = { headers: updatedHeaders, isAuth: true, loggedUser: user };

    localStorage.setItem("loggedUser", JSON.stringify(loggedIn));

    return loggedIn;
  } catch (error) {
    throw handleApiError(error);
  }
}

export default userUpdate;
