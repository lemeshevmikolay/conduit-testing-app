import errorHandler from "./errorHandler";

export default function handleApiError(error) {
  const message = error.response?.data?.errors?.body?.[0];
  if (!message) return errorHandler(error);
  const apiError = new Error(message);
  apiError.status = error.response.status;
  return apiError;
}
