import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  UserRound,
  UsersRound,
  ShoppingBag,
  PackageCheck,
  ArrowRight,
  Minus,
  Plus,
  Trash2,
  MapPin,
  Mail,
  Phone,
  IdCard,
} from "lucide-react";
import {
  initiatePaytmPayment,
  getPaytmPaymentStatus,
} from "../api/payments";

import {
  openPaytmCheckout,
  closePaytmCheckout,
} from "../utils/paytmCheckout";

import { useStore } from "../context/StoreContext";

const money = (value) =>
  `₹${Number(value || 0).toFixed(2)}`;

const formatAddress = (address) => {
  if (!address) return "Address not provided";

  if (typeof address === "string") return address;

  return (
    [
      address.fullAddress,
      address.addressLine1,
      address.addressLine2,
      address.address,
      address.landmark,
      address.city,
      address.state,
      address.pincode || address.postalCode,
    ]
      .filter(Boolean)
      .join(", ") || "Address not provided"
  );
};

const getSizeLabel = (size) =>
  typeof size === "object" && size !== null
    ? size.label
    : size;

const waitForVerifiedPayment = async (orderNumber) => {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const response = await getPaytmPaymentStatus(orderNumber);
      const result = response?.data ?? response;

      const status = String(
        result?.paymentStatus || ""
      ).toLowerCase();

      if (status === "paid") {
        return result;
      }

      if (status === "failed") {
        throw new Error("Payment failed.");
      }
    } catch (error) {
      if (error.message === "Payment failed.") {
        throw error;
      }

      console.error("Payment verification:", error);
    }

    await new Promise((resolve) =>
      setTimeout(resolve, 2000)
    );
  }

 throw new Error(
  "Your payment is awaiting confirmation from Paytm. " +
  "Please check My Orders. Do not pay again until the payment status is verified."
);
};

export default function Cart() {
  const navigate = useNavigate();

  const {
    student,
    profile,
    defaultAddress,
    cart,
    shippingAmount,
    kitPurchased,
    updateCartSize,
    updateQuantity,
    removeFromCart,
    createOrder,
    refreshCart,
    refreshOrders,
    
refreshCatalog,
cartSubtotal,
gstAmount,
cartTotal,
  } = useStore();

  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState("");

useEffect(() => {
  if (!student?.id) return;

  let active = true;

  const loadLatestCart = async () => {
    try {
      await Promise.all([
        refreshCatalog(),
        refreshCart(),
      ]);

      if (active) setError("");
    } catch (err) {
      if (active) {
        setError(
          err.message || "Unable to refresh cart"
        );
      }
    }
  };

  loadLatestCart();

  return () => {
    active = false;
  };
}, [student?.id]);

  const visibleCart = Array.isArray(cart) ? cart : [];

const hasKit = visibleCart.some(
  (item) => item.isKitItem === true
);

 
  const gstIncluded = Number(gstAmount || 0);

  const visibleSubtotal = Number(cartSubtotal || 0);

// const shipping = visibleCart.length > 0 ? 200 : 0;
// const shipping = visibleCart.length > 0 ? 0 : 0;
const shipping =
  visibleCart.length > 0
    ? Number(shippingAmount ?? 0)
    : 0;

const total = Number(cartTotal || 0);

  const profileFields = [
    {
      label: "Student Name",
      value: profile?.name || student?.name,
      icon: UserRound,
    },
    {
      label: "Admission Number",
      value: student?.admissionNo,
      icon: IdCard,
    },
    {
  label: "Gender",
  value: profile?.gender || student?.gender,
  icon: UsersRound,
},
   {
  label: "Mobile Number",
  value:
    profile?.phone ||
    profile?.mobile ||
    profile?.mobileNumber ||
    profile?.mobile_number ||
    student?.phone ||
    student?.mobile ||
    student?.mobile_number,
  icon: Phone,
},
{
  label: "Email Address",
  value:
    profile?.email ||
    profile?.emailAddress ||
    profile?.email_address ||
    student?.email ||
    student?.email_address,
  icon: Mail,
},
{
  label: "Shipping Address",
  value: formatAddress(
    defaultAddress ||
    profile?.address ||
    profile?.fullAddress ||
    student?.address
  ),
  icon: MapPin,
},
  ];

 const handleQuantity = async (item, difference) => {
  if (item.isKitItem || item.quantityLocked) return;

  const nextQuantity = Math.max(
    1,
    Number(item.quantity || 1) + difference
  );

  try {
    setError("");
    await updateQuantity(item.cartKey, nextQuantity);
  } catch (err) {
    setError(
      err.message || "Unable to update quantity"
    );
  }
};

const handleDelete = async (item) => {
  if (item.isKitItem || item.quantityLocked) return;

  try {
    setError("");
    await removeFromCart(item.cartKey);
  } catch (err) {
    setError(
      err.message || "Unable to remove product"
    );
  }
};

const handleSizeChange = async (item, newSize) => {
  try {
    setError("");
    await updateCartSize(item.cartKey, newSize);
  } catch (err) {
    setError(
      err.message || "Unable to update product size"
    );
  }
};

 const handlePlaceOrder = async () => {
  if (!visibleCart.length || placing) return;

  if (!student) {
    setError("Please login to continue.");
    return;
  }

  const shippingAddress =
    defaultAddress ||
    profile?.address ||
    student?.address;

  if (!shippingAddress) {
    setError("Shipping address is required.");
    return;
  }

  setPlacing(true);
  setError("");

  try {
    // 1. Create pending order on backend
    const order = await createOrder({
      shippingAddress,
      paymentMethod: "Paytm",
    });

    if (!order?.id) {
      throw new Error("Unable to create order.");
    }

    // 2. Initiate Paytm using saved admin credentials
    const payment = await initiatePaytmPayment(order.id);

    // 3. Open Paytm checkout
   
const orderNumber =
  payment.orderNumber || order.orderNumber;

if (!orderNumber) {
  throw new Error("Order number missing for payment verification.");
}

const checkoutOutcome = openPaytmCheckout(payment).then(
  (result) => ({ type: "checkout", result }),
  (error) => ({ type: "checkout-error", error })
);

const verificationOutcome = waitForVerifiedPayment(
  orderNumber
).then(
  (result) => ({ type: "verified", result }),
  (error) => ({ type: "verification-error", error })
);

// The Paytm popup response is not proof of payment.
// Only the backend's verified status can confirm payment.
const first = await Promise.race([
  checkoutOutcome,
  verificationOutcome,
]);

let verified;

if (first.type === "verified") {
  verified = first.result;
} else if (first.type === "verification-error") {
  throw first.error;
} else {
  // Even if the popup closes or fails, check whether
  // Paytm has already processed the transaction.
  const outcome = await verificationOutcome;

  if (outcome.type === "verification-error") {
    throw outcome.error;
  }

  verified = outcome.result;
}

if (
  String(verified?.paymentStatus || "").toLowerCase() !==
  "paid"
) {
  throw new Error("Payment not confirmed.");
}


   // Payment already verified as paid above.


await closePaytmCheckout();

const refreshResults = await Promise.allSettled([
  refreshOrders(),
  refreshCart(),
]);

refreshResults.forEach((result, index) => {
  if (result.status === "rejected") {
    console.error(
      index === 0
        ? "Orders refresh failed:"
        : "Cart refresh failed:",
      result.reason
    );
  }
});

// Payment has already been verified as paid by backend.
navigate(
  `/order-success?orderId=${encodeURIComponent(order.id)}`,
  { replace: true }
);


  } catch (error) {
    setError(
      error.message || "Unable to complete payment."
    );
  } finally {
    setPlacing(false);
  }
};

  return (
    <main className="min-h-[75vh] bg-[#F5F8FC] px-4 py-7 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16">
      <div className="mx-auto w-full max-w-[1480px]">

        {/* PAGE HEADING */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl font-black tracking-tight text-[#07152D] sm:text-3xl">
            Shopping Cart
          </h1>

          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Review your details and selected items before placing your order.
          </p>
        </div>

        {/* RESPONSIVE CART GRID */}
        <div className="cart-layout">

          {/* LEFT: STUDENT PROFILE */}
          <aside className="cart-profile min-w-0 self-start rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">

            <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <UserRound size={21} />
              </div>

              <div className="min-w-0">
                <h2 className="text-base font-extrabold text-[#07152D] sm:text-lg">
                  Student Profile
                </h2>

                <p className="text-xs text-slate-500">
                  Registered student details
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              {profileFields.map(
                ({ label, value, icon: Icon }) => (
                  <div
                    key={label}
                    className="flex min-w-0 items-start gap-3"
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
                      <Icon size={16} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-slate-500">
                        {label}
                      </p>

                      <p className="mt-0.5 break-words text-[13px] font-bold leading-5 text-slate-900">
                        {value || "Not provided"}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          </aside>

          {/* MIDDLE: PRODUCTS */}
          <section className="cart-products flex min-w-0 min-h-0 flex-col">

            <div className="mb-3 flex shrink-0 items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2">
                <ShoppingBag
                  size={20}
                  className="text-indigo-600"
                />

                <h2 className="text-base font-extrabold text-[#07152D] sm:text-lg">
                  {hasKit
                    ? "Your School Kit"
                    : "Your Products"}
                </h2>
              </div>

              <span className="shrink-0 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600">
                {visibleCart.length} Items
              </span>
            </div>

            {/* ONLY THIS AREA SCROLLS */}
            <div className="cart-products-scroll min-h-0 space-y-3">

              {!visibleCart.length && (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                  <ShoppingBag
                    size={35}
                    className="mx-auto mb-3 text-slate-300"
                  />

                  <p className="font-semibold text-slate-600">
                    Your cart is empty.
                  </p>

                  <Link
                    to="/"
                    className="mt-3 inline-block text-sm font-bold text-indigo-600 underline"
                  >
                    Continue Shopping
                  </Link>
                </div>
              )}

              {visibleCart.map((item, index) => {
                const isKitItem =
                  item.isKitItem === true ||
                  item.quantityLocked === true;

                const quantity = Number(
                  item.quantity || 1
                );

                const itemTotal =
                  Number(item.price || 0) * quantity;

                const sizes = Array.isArray(item.sizes)
                  ? item.sizes
                  : [];

                return (
                  <article
                    key={
                      item.cartKey ||
                      `${item.id}-${index}`
                    }
                    className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4"
                  >
                    <div className="flex min-w-0 items-start gap-3">

                      {/* PRODUCT IMAGE */}
                      <div className="h-[105px] w-[82px] shrink-0 overflow-hidden rounded-xl bg-slate-50 sm:h-[112px] sm:w-[90px] xl:h-[118px] xl:w-[96px]">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-contain"
                        />
                      </div>

                      {/* PRODUCT DETAILS */}
                      <div className="min-w-0 flex-1">

                        {/* NAME, PRICE, ITEM TOTAL */}
                        <div className="flex min-w-0 items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-[13px] font-extrabold leading-5 text-[#07152D] sm:text-[15px]">
                              {item.name}
                            </h3>

                            <p className="mt-0.5 text-[13px] font-extrabold text-indigo-600 sm:text-sm">
                              {money(item.price)}
                            </p>
                          </div>

                          <div className="flex shrink-0 items-start gap-1">
                            <div className="text-right">
                              <p className="text-[12px] font-black text-[#07152D] sm:text-[14px]">
                                {money(itemTotal)}
                              </p>

                              <p className="text-[9px] font-medium text-slate-400">
                                Item Total
                              </p>
                            </div>

                            {!isKitItem && (
                              <button
                                type="button"
                                aria-label={`Remove ${item.name}`}
                                title="Remove product"
                                onClick={() =>
                                  handleDelete(item)
                                }
                                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* SIZE + QUANTITY */}
                        <div className="mt-3 flex flex-wrap items-end gap-2 sm:gap-3">

                          {/* SIZE */}
                          <div className="w-[100px] max-w-full sm:w-[112px]">
                            <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">
                              Size
                            </label>

                            {sizes.length > 0 ? (
                              <select
                                value={item.size ?? ""}
                               onChange={(event) =>
                                  handleSizeChange(
                                    item,
                                    event.target.value
                                  )
                                }
                                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold text-[#07152D] outline-none focus:border-indigo-500"
                              >
                                {sizes.map(
                                  (size, sizeIndex) => {
                                    const label =
                                      getSizeLabel(size);

                                    return (
                                      <option
                                        key={`${label}-${sizeIndex}`}
                                        value={label}
                                      >
                                        {label}
                                      </option>
                                    );
                                  }
                                )}
                              </select>
                            ) : (
                              <div className="flex h-9 items-center rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-600">
                                {item.size || "Free Size"}
                              </div>
                            )}
                          </div>

                          {/* QUANTITY */}
                          <div className="shrink-0">
                            <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">
                              Quantity
                            </label>

                            {isKitItem ? (
                              <div className="flex h-9 w-[72px] items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-extrabold text-[#07152D]">
                                {quantity}
                              </div>
                            ) : (
                              <div className="flex h-9 items-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                                <button
                                  type="button"
                                  aria-label="Decrease quantity"
                                  disabled={quantity <= 1}
                                  onClick={() =>
                                    handleQuantity(item, -1)
                                  }
                                  className="flex h-full w-7 items-center justify-center text-slate-500 hover:bg-indigo-50 disabled:opacity-30"
                                >
                                  <Minus size={12} />
                                </button>

                                <span className="flex h-full min-w-[25px] items-center justify-center border-x border-slate-200 px-1 text-xs font-extrabold text-[#07152D]">
                                  {quantity}
                                </span>

                                <button
                                  type="button"
                                  aria-label="Increase quantity"
                                  onClick={() =>
                                    handleQuantity(item, 1)
                                  }
                                  className="flex h-full w-7 items-center justify-center text-slate-500 hover:bg-indigo-50"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {/* RIGHT: ORDER SUMMARY */}
          <aside className="cart-summary min-w-0 self-start rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">

            <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <PackageCheck size={21} />
              </div>

              <h2 className="text-lg font-extrabold text-[#07152D]">
                Order Summary
              </h2>
            </div>

            <div className="space-y-4 text-[13px] sm:text-sm">

              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">
                  Subtotal
                </span>

                <span className="font-extrabold text-[#07152D]">
                  {money(visibleSubtotal)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">
                  Shipping
                </span>

                <span className="font-extrabold text-[#07152D]">
                  {money(shipping)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-600">
                    GST (Included)
                  </p>

                  <p className="mt-0.5 text-[11px] text-slate-400">
                    CGST + SGST
                  </p>
                </div>

                <span className="font-extrabold text-[#07152D]">
                  {money(gstIncluded)}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-5">
                <span className="text-lg font-black text-[#07152D]">
                  Total
                </span>

                <span className="text-xl font-black text-[#07152D]">
                  {money(total)}
                </span>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-600"
              >
                {error}
              </p>
            )}

            <button
              type="button"
              disabled={!visibleCart.length || placing}
              onClick={handlePlaceOrder}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#5039F6] px-4 py-3.5 text-sm font-extrabold text-white shadow-[0_6px_18px_rgba(80,57,246,0.20)] transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {placing
                ? "Processing..."
                : "place order"}

              {!placing && <ArrowRight size={17} />}
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
}






// import { useState } from "react";
// import { Link, useNavigate } from "react-router-dom";

// import {
//   UserRound,
//   ShoppingBag,
//   PackageCheck,
//   ArrowRight,
//   Minus,
//   Plus,
//   Trash2,
//   MapPin,
//   School,
//   Mail,
//   Phone,
//   IdCard,
// } from "lucide-react";

// import { useStore } from "../context/StoreContext";

// const money = (value) =>
//   `₹${Number(value || 0).toFixed(2)}`;

// const formatAddress = (address) => {
//   if (!address) return "Address not provided";

//   if (typeof address === "string") return address;

//   return (
//     [
//       address.fullAddress,
//       address.addressLine1,
//       address.addressLine2,
//       address.address,
//       address.landmark,
//       address.city,
//       address.state,
//       address.pincode || address.postalCode,
//     ]
//       .filter(Boolean)
//       .join(", ") || "Address not provided"
//   );
// };

// const getSizeLabel = (size) =>
//   typeof size === "object" && size !== null
//     ? size.label
//     : size;

// export default function Cart() {
//   const navigate = useNavigate();

//   const {
//     student,
//     profile,
//     defaultAddress,
//     cart,
//     shippingAmount,
//     kitPurchased,
//     updateCartSize,
//     updateQuantity,
//     removeFromCart,
//     createOrder,
//   } = useStore();

//   const [placing, setPlacing] = useState(false);
//   const [error, setError] = useState("");

//   // Existing purchase stage logic unchanged.
//   const visibleCart = cart.filter((item) =>
//     kitPurchased
//       ? !item.isKitItem
//       : item.isKitItem === true
//   );

//   const hasKit = !kitPurchased;

//   const visibleSubtotal = visibleCart.reduce(
//     (sum, item) =>
//       sum +
//       Number(item.price || 0) *
//         Number(item.quantity || 1),
//     0
//   );

//   // const shipping = visibleCart.length
//   //   ? Number(shippingAmount ?? 200)
//   //   : 0;
  
// const shipping = visibleCart.length > 0 ? 200 : 0;


//   const gstIncluded =
//     visibleSubtotal - visibleSubtotal / 1.05;

//   const total = visibleSubtotal + shipping;

//   const profileFields = [
//     {
//       label: "Student Name",
//       value: profile?.name || student?.name,
//       icon: UserRound,
//     },
//     {
//       label: "Admission Number",
//       value: student?.admissionNo,
//       icon: IdCard,
//     },
//     {
//       label: "School",
//       value: student?.school || profile?.school,
//       icon: School,
//     },
//     {
//       label: "Mobile Number",
//       value: profile?.phone || student?.phone,
//       icon: Phone,
//     },
//     {
//       label: "Email Address",
//       value: profile?.email || student?.email,
//       icon: Mail,
//     },
//     {
//       label: "Shipping Address",
//       value: formatAddress(defaultAddress),
//       icon: MapPin,
//     },
//   ];

//   const handleQuantity = (item, difference) => {
//     if (item.isKitItem || item.quantityLocked) return;

//     const nextQuantity = Math.max(
//       1,
//       Number(item.quantity || 1) + difference
//     );

//     updateQuantity(item.cartKey, nextQuantity);
//   };

//   const handleDelete = (item) => {
//     if (item.isKitItem || item.quantityLocked) return;

//     removeFromCart(item.cartKey);
//   };

//   const handlePlaceOrder = () => {
//     if (!visibleCart.length || placing) return;

//     if (visibleCart.length !== cart.length) {
//       setError(
//         "Your cart contains items from another purchase stage. Please refresh your cart before placing the order."
//       );
//       return;
//     }

//     if (!student) {
//       setError("Please login to place your order.");
//       return;
//     }

//     setError("");
//     setPlacing(true);

//     try {
//       const order = createOrder({
//         shippingAddress: defaultAddress || {},
//         paymentMethod: "COD",
//       });

//       if (!order) {
//         throw new Error("Unable to place your order.");
//       }

//       // navigate("/order-success", {
//       //   replace: true,
//       //   state: { order },
//       // });
//       navigate(
//   `/order-success?orderId=${encodeURIComponent(order.id)}`,
//   {
//     replace: true,
//     state: { order },
//   }
// );
//     } catch (err) {
//       setError(
//         err.message || "Unable to place your order."
//       );
//     } finally {
//       setPlacing(false);
//     }
//   };

//   return (
//     <main className="min-h-[75vh] bg-[#F5F8FC] px-4 py-7 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16">
//       <div className="mx-auto w-full max-w-[1480px]">

//         {/* PAGE HEADING */}
//         <div className="mb-6 sm:mb-8">
//           <h1 className="text-2xl font-black tracking-tight text-[#07152D] sm:text-3xl">
//             Shopping Cart
//           </h1>

//           <p className="mt-1 text-xs text-slate-500 sm:text-sm">
//             Review your details and selected items before placing your order.
//           </p>
//         </div>

//         {/* RESPONSIVE CART GRID */}
//         <div className="cart-layout">

//           {/* LEFT: STUDENT PROFILE */}
//           <aside className="cart-profile min-w-0 self-start rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">

//             <div className="mb-4 flex items-center gap-3 border-b border-slate-100 pb-4">
//               <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
//                 <UserRound size={21} />
//               </div>

//               <div className="min-w-0">
//                 <h2 className="text-base font-extrabold text-[#07152D] sm:text-lg">
//                   Student Profile
//                 </h2>

//                 <p className="text-xs text-slate-500">
//                   Registered student details
//                 </p>
//               </div>
//             </div>

//             <div className="space-y-3.5">
//               {profileFields.map(
//                 ({ label, value, icon: Icon }) => (
//                   <div
//                     key={label}
//                     className="flex min-w-0 items-start gap-3"
//                   >
//                     <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
//                       <Icon size={16} />
//                     </div>

//                     <div className="min-w-0 flex-1">
//                       <p className="text-[11px] font-semibold text-slate-500">
//                         {label}
//                       </p>

//                       <p className="mt-0.5 break-words text-[13px] font-bold leading-5 text-slate-900">
//                         {value || "Not provided"}
//                       </p>
//                     </div>
//                   </div>
//                 )
//               )}
//             </div>
//           </aside>

//           {/* MIDDLE: PRODUCTS */}
//           <section className="cart-products flex min-w-0 min-h-0 flex-col">

//             <div className="mb-3 flex shrink-0 items-center justify-between gap-2 px-1">
//               <div className="flex items-center gap-2">
//                 <ShoppingBag
//                   size={20}
//                   className="text-indigo-600"
//                 />

//                 <h2 className="text-base font-extrabold text-[#07152D] sm:text-lg">
//                   {hasKit
//                     ? "Your School Kit"
//                     : "Your Products"}
//                 </h2>
//               </div>

//               <span className="shrink-0 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600">
//                 {visibleCart.length} Items
//               </span>
//             </div>

//             {/* ONLY THIS AREA SCROLLS */}
//             <div className="cart-products-scroll min-h-0 space-y-3">

//               {!visibleCart.length && (
//                 <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
//                   <ShoppingBag
//                     size={35}
//                     className="mx-auto mb-3 text-slate-300"
//                   />

//                   <p className="font-semibold text-slate-600">
//                     Your cart is empty.
//                   </p>

//                   <Link
//                     to="/"
//                     className="mt-3 inline-block text-sm font-bold text-indigo-600 underline"
//                   >
//                     Continue Shopping
//                   </Link>
//                 </div>
//               )}

//               {visibleCart.map((item, index) => {
//                 const isKitItem =
//                   item.isKitItem === true ||
//                   item.quantityLocked === true;

//                 const quantity = Number(
//                   item.quantity || 1
//                 );

//                 const itemTotal =
//                   Number(item.price || 0) * quantity;

//                 const sizes = Array.isArray(item.sizes)
//                   ? item.sizes
//                   : [];

//                 return (
//                   <article
//                     key={
//                       item.cartKey ||
//                       `${item.id}-${index}`
//                     }
//                     className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4"
//                   >
//                     <div className="flex min-w-0 items-start gap-3">

//                       {/* PRODUCT IMAGE */}
//                       <div className="h-[105px] w-[82px] shrink-0 overflow-hidden rounded-xl bg-slate-50 sm:h-[112px] sm:w-[90px] xl:h-[118px] xl:w-[96px]">
//                         <img
//                           src={item.image}
//                           alt={item.name}
//                           className="h-full w-full object-contain"
//                         />
//                       </div>

//                       {/* PRODUCT DETAILS */}
//                       <div className="min-w-0 flex-1">

//                         {/* NAME, PRICE, ITEM TOTAL */}
//                         <div className="flex min-w-0 items-start justify-between gap-2">
//                           <div className="min-w-0 flex-1">
//                             <h3 className="text-[13px] font-extrabold leading-5 text-[#07152D] sm:text-[15px]">
//                               {item.name}
//                             </h3>

//                             <p className="mt-0.5 text-[13px] font-extrabold text-indigo-600 sm:text-sm">
//                               {money(item.price)}
//                             </p>
//                           </div>

//                           <div className="flex shrink-0 items-start gap-1">
//                             <div className="text-right">
//                               <p className="text-[12px] font-black text-[#07152D] sm:text-[14px]">
//                                 {money(itemTotal)}
//                               </p>

//                               <p className="text-[9px] font-medium text-slate-400">
//                                 Item Total
//                               </p>
//                             </div>

//                             {!isKitItem && (
//                               <button
//                                 type="button"
//                                 aria-label={`Remove ${item.name}`}
//                                 title="Remove product"
//                                 onClick={() =>
//                                   handleDelete(item)
//                                 }
//                                 className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
//                               >
//                                 <Trash2 size={16} />
//                               </button>
//                             )}
//                           </div>
//                         </div>

//                         {/* SIZE + QUANTITY */}
//                         <div className="mt-3 flex flex-wrap items-end gap-2 sm:gap-3">

//                           {/* SIZE */}
//                           <div className="w-[100px] max-w-full sm:w-[112px]">
//                             <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">
//                               Size
//                             </label>

//                             {sizes.length > 0 ? (
//                               <select
//                                 value={item.size ?? ""}
//                                 onChange={(event) =>
//                                   updateCartSize(
//                                     item.cartKey,
//                                     event.target.value
//                                   )
//                                 }
//                                 className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold text-[#07152D] outline-none focus:border-indigo-500"
//                               >
//                                 {sizes.map(
//                                   (size, sizeIndex) => {
//                                     const label =
//                                       getSizeLabel(size);

//                                     return (
//                                       <option
//                                         key={`${label}-${sizeIndex}`}
//                                         value={label}
//                                       >
//                                         {label}
//                                       </option>
//                                     );
//                                   }
//                                 )}
//                               </select>
//                             ) : (
//                               <div className="flex h-9 items-center rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-semibold text-slate-600">
//                                 {item.size || "Free Size"}
//                               </div>
//                             )}
//                           </div>

//                           {/* QUANTITY */}
//                           <div className="shrink-0">
//                             <label className="mb-1 block text-[10px] font-bold uppercase text-slate-400">
//                               Quantity
//                             </label>

//                             {isKitItem ? (
//                               <div className="flex h-9 w-[72px] items-center justify-center rounded-lg border border-slate-200 bg-white text-xs font-extrabold text-[#07152D]">
//                                 {quantity}
//                               </div>
//                             ) : (
//                               <div className="flex h-9 items-center overflow-hidden rounded-lg border border-slate-200 bg-white">
//                                 <button
//                                   type="button"
//                                   aria-label="Decrease quantity"
//                                   disabled={quantity <= 1}
//                                   onClick={() =>
//                                     handleQuantity(item, -1)
//                                   }
//                                   className="flex h-full w-7 items-center justify-center text-slate-500 hover:bg-indigo-50 disabled:opacity-30"
//                                 >
//                                   <Minus size={12} />
//                                 </button>

//                                 <span className="flex h-full min-w-[25px] items-center justify-center border-x border-slate-200 px-1 text-xs font-extrabold text-[#07152D]">
//                                   {quantity}
//                                 </span>

//                                 <button
//                                   type="button"
//                                   aria-label="Increase quantity"
//                                   onClick={() =>
//                                     handleQuantity(item, 1)
//                                   }
//                                   className="flex h-full w-7 items-center justify-center text-slate-500 hover:bg-indigo-50"
//                                 >
//                                   <Plus size={12} />
//                                 </button>
//                               </div>
//                             )}
//                           </div>
//                         </div>
//                       </div>
//                     </div>
//                   </article>
//                 );
//               })}
//             </div>
//           </section>

//           {/* RIGHT: ORDER SUMMARY */}
//           <aside className="cart-summary min-w-0 self-start rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">

//             <div className="mb-5 flex items-center gap-3 border-b border-slate-100 pb-4">
//               <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
//                 <PackageCheck size={21} />
//               </div>

//               <h2 className="text-lg font-extrabold text-[#07152D]">
//                 Order Summary
//               </h2>
//             </div>

//             <div className="space-y-4 text-[13px] sm:text-sm">

//               <div className="flex items-center justify-between gap-3">
//                 <span className="text-slate-500">
//                   Subtotal
//                 </span>

//                 <span className="font-extrabold text-[#07152D]">
//                   {money(visibleSubtotal)}
//                 </span>
//               </div>

//               <div className="flex items-center justify-between gap-3">
//                 <span className="text-slate-500">
//                   Shipping
//                 </span>

//                 <span className="font-extrabold text-[#07152D]">
//                   {money(shipping)}
//                 </span>
//               </div>

//               <div className="flex items-center justify-between gap-3">
//                 <div>
//                   <p className="font-semibold text-slate-600">
//                     GST (Included)
//                   </p>

//                   <p className="mt-0.5 text-[11px] text-slate-400">
//                     CGST + SGST
//                   </p>
//                 </div>

//                 <span className="font-extrabold text-[#07152D]">
//                   {money(gstIncluded)}
//                 </span>
//               </div>

//               <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-5">
//                 <span className="text-lg font-black text-[#07152D]">
//                   Total
//                 </span>

//                 <span className="text-xl font-black text-[#07152D]">
//                   {money(total)}
//                 </span>
//               </div>
//             </div>

//             {error && (
//               <p
//                 role="alert"
//                 className="mt-4 rounded-lg bg-red-50 p-3 text-xs text-red-600"
//               >
//                 {error}
//               </p>
//             )}

//             <button
//               type="button"
//               disabled={!visibleCart.length || placing}
//               onClick={handlePlaceOrder}
//               className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#5039F6] px-4 py-3.5 text-sm font-extrabold text-white shadow-[0_6px_18px_rgba(80,57,246,0.20)] transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
//             >
//               {placing
//                 ? "Placing Order..."
//                 : "Place Order"}

//               {!placing && <ArrowRight size={17} />}
//             </button>
//           </aside>
//         </div>
//       </div>
//     </main>
//   );
// }


