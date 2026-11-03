import axios from "./api";
import handleApiError from "../helpers/handleApiError";

export default async function verifyEmail({ email, code }) {
  try {
    const { data } = await axios.post("api/users/verify-email", { email, code });
    const headers = { Authorization: `Token ${data.user.token}` };
    const loggedIn = { headers, isAuth: true, loggedUser: data.user };
    localStorage.setItem("loggedUser", JSON.stringify(loggedIn));
    return loggedIn;
  } catch (error) {
    throw handleApiError(error);
  }
}
