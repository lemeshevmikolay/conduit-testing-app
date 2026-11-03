import axios from "./api";
import handleApiError from "../helpers/handleApiError";

export default async function resetPassword({ email, code, password }) {
  try {
    const { data } = await axios.post("api/users/reset-password", { email, code, password });
    return data.message;
  } catch (error) {
    throw handleApiError(error);
  }
}
