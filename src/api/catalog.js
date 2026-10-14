import api from "./client";

export const getStudentCatalog = async () => {
  const { data } = await api.get("/storefront/catalog");
  return data.data;
};