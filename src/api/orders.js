import api from "./client";

export const createStudentOrder = async (payload) => {
  const { data } = await api.post(
    "/storefront/orders",
    payload
  );

  return data.data;
};

export const getStudentOrders = async () => {
  const { data } = await api.get("/storefront/orders");
  return data.data;
};