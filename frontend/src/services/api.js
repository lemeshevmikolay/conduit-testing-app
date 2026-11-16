import axios from "axios";

const api = axios.create();

api.interceptors.request.use((config) => {
  config.headers.set("X-Request-Id", crypto.randomUUID());
  config.headers.set("X-System-Code", "front");
  return config;
});

export default api;
