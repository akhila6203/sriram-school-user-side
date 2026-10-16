import api from "./client";

export const initiatePaytmPayment = async (orderId) => {
  const { data } = await api.post(
    "/storefront/payments/paytm/initiate",
    { orderId }
  );

  return data.data;
};

export const getPaytmPaymentStatus = async (
  orderNumber
) => {
  const { data } = await api.get(
    `/storefront/payments/paytm/status/${encodeURIComponent(
      orderNumber
    )}`
  );

  return data.data;
};

export const recordPaytmAttempt = async (orderId) => {
  const { data } = await api.post(
    "/storefront/payments/paytm/attempt",
    { orderId }
  );

  return data.data;
};