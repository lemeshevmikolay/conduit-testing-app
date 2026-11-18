import api from "./api";

export default async function getKnowledgeItems() {
  const { data } = await api.get("/api/knowledge");
  return data.items || [];
}
