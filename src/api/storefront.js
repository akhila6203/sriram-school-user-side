import api from "./client";



export const loginStudent = async (admissionNumber) => {
  const { data } = await api.post("/storefront/login", {
    admissionNumber: String(admissionNumber).trim(),
  });

  return data.data.student;
};

export const getStudentSession = async () => {
  const { data } = await api.get("/storefront/session");
  return data.data.student;
};

export const logoutStudent = async () => {
  const { data } = await api.post("/storefront/logout");
  return data;
};

export const fetchStudentCatalog = async () => {
  const { data } = await api.get("/storefront/catalog");
  return data.data;
};


export const getStudentProfile = async () =>
  (await api.get("/storefront/profile")).data;

export const saveStudentProfile = async (data) =>
  (await api.patch("/storefront/profile", data)).data;

export const getStudentAddresses = async () =>
  (await api.get("/storefront/addresses")).data;

export const createStudentAddress = async (data) =>
  (await api.post("/storefront/addresses", data)).data;

export const editStudentAddress = async (id, data) =>
  (await api.put(`/storefront/addresses/${id}`, data)).data;

export const removeStudentAddress = async (id) =>
  (await api.delete(`/storefront/addresses/${id}`)).data;

export const makeDefaultAddress = async (id) =>
  (await api.patch(`/storefront/addresses/${id}/default`)).data;

export const getStudentCart = async () =>
  (await api.get("/storefront/cart")).data;

export const addStudentCartItem = async (data) =>
  (await api.post("/storefront/cart/items", data)).data;

export const editStudentCartItem = async (id, data) =>
  (await api.patch(`/storefront/cart/items/${encodeURIComponent(id)}`, data)).data;

export const removeStudentCartItem = async (id) =>
  (await api.delete(`/storefront/cart/items/${encodeURIComponent(id)}`)).data;

export const getStudentOrders = async () =>
  (await api.get("/storefront/orders")).data;

export const submitStudentOrder = async (data) =>
  (await api.post("/storefront/orders", data)).data;







