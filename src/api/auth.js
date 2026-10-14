import api from "./client";

export const studentLogin = async (admissionNumber) => {
  const { data } = await api.post("/storefront/login", {
    admissionNumber: admissionNumber.trim(),
  });

  return data.data.student;
};

export const getCurrentStudent = async () => {
  const { data } = await api.get("/storefront/me");
  return data.data.student;
};

export const studentLogout = async () => {
  await api.post("/storefront/logout");
};