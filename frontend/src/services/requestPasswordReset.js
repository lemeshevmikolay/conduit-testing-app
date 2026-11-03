import axios from "./api";
import handleApiError from "../helpers/handleApiError";

export default async function requestPasswordReset(email) {
  try {
    const { data } = await axios.post("api/users/forgot-password", { email });
    return data.message;
  } catch (error) {
    throw handleApiError(error);
  }
}
