import { useEffect, useMemo, useState } from "react";
import {
  Link,
  useLocation,
  useSearchParams,
} from "react-router-dom";

import {
  Check,
  ArrowRight,
  PackageCheck,
  ShoppingBag,
  ClipboardList,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";

import { useStore } from "../context/StoreContext";

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const isPaid = (order) =>
  String(order?.paymentStatus || "").toLowerCase() === "paid";

export default function OrderSuccess() {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const {
    student,
    authLoading,
    orders = [],
    refreshOrders,
  } = useStore();

  const orderId = searchParams.get("orderId");
  const orderNumber = searchParams.get("orderNumber");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loadedOrders, setLoadedOrders] = useState(null);

  useEffect(() => {
    if (authLoading) return;

    if (!student?.id) {
      setLoading(false);
      return;
    }

    let active = true;

    const loadOrder = async () => {
      setLoading(true);
      setError("");

      try {
        const result = await refreshOrders();

        if (active) {
          setLoadedOrders(
            Array.isArray(result) ? result : []
          );
        }
      } catch (err) {
        if (active) {
          setError(
            err?.message ||
              "Unable to load your order details."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadOrder();

    return () => {
      active = false;
    };
  }, [
    student?.id,
    authLoading,
    orderId,
    orderNumber,
  ]);

  const order = useMemo(() => {
    const source = loadedOrders ?? orders;

    if (!orderId && !orderNumber) {
      return null;
    }

    return source.find((item) => {
      const matchesId =
        orderId &&
        String(item.id) === String(orderId);

      const matchesNumber =
        orderNumber &&
        String(item.orderNumber) ===
          String(orderNumber);

      return (matchesId || matchesNumber) && isPaid(item);
    }) || null;
  }, [loadedOrders, orders, orderId, orderNumber]);

  if (authLoading || loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#F7F9FC] px-4">
        <div className="text-center">
          <LoaderCircle
            size={38}
            className="mx-auto animate-spin text-[#4F39F6]"
          />

          <p className="mt-4 text-sm font-semibold text-slate-600">
            Loading your payment details...
          </p>
        </div>
      </main>
    );
  }

  if (!student) {
    return (
      <MessageCard
        icon={PackageCheck}
        title="Login Required"
        message="Please login to view your order."
        link="/"
        linkText="Back to Home"
      />
    );
  }

  if (error) {
    return (
      <MessageCard
        icon={ClipboardList}
        title="Unable to Load Order"
        message={error}
        link="/profile"
        linkText="View My Orders"
      />
    );
  }

  if (!order) {
    return (
      <MessageCard
        icon={ClipboardList}
        title="Payment Not Confirmed"
        message="A verified successful payment was not found for this order. Please check your order history. If money was deducted, wait for payment confirmation before trying again."
        link="/profile"
        linkText="View My Orders"
      />
    );
  }

  const items = Array.isArray(order.items)
    ? order.items
    : [];

  const itemCount = items.reduce(
    (sum, item) =>
      sum + Number(item.quantity || 0),
    0
  );

  const subtotal = Number(order.subtotal || 0);
  const shipping = Number(order.shipping || 0);
  const gstIncluded = Number(order.gstIncluded || 0);
  const total = Number(order.total || 0);

  return (
    <main className="flex min-h-[75vh] items-center justify-center bg-[#F7F9FC] px-3 py-8 sm:px-6 sm:py-12">
      <div className="w-full max-w-[580px] overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">

        {/* SUCCESS HEADER */}

        <div className="px-5 pb-6 pt-8 text-center sm:px-8">
          <div className="mx-auto flex h-[70px] w-[70px] items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <Check size={34} strokeWidth={3} />
          </div>

          <h1 className="mt-5 text-[23px] font-extrabold tracking-tight text-[#07152D] sm:text-[28px]">
            Order Placed Successfully!
          </h1>

          <p className="mx-auto mt-2 max-w-[410px] text-[13px] leading-6 text-slate-500 sm:text-sm">
            Thank you for shopping with Brassleaf.
            Your payment was successful and your
            school uniform order has been confirmed.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-700">
            <ShieldCheck size={16} />
            Payment Successful
          </div>
        </div>

        {/* ORDER INFORMATION */}

        <div className="mx-4 rounded-xl border border-[#E8EDF4] bg-[#FAFBFD] p-4 sm:mx-6 sm:p-5">
          <div className="flex items-center gap-2 border-b border-[#E8EDF4] pb-3">
            <PackageCheck
              size={19}
              className="text-[#4F39F6]"
            />

            <h2 className="text-sm font-extrabold text-[#07152D]">
              Order Summary
            </h2>
          </div>

          <div className="mt-4 space-y-3">
            <DetailRow
              label="Order ID"
              value={order.orderNumber || order.id}
            />

            <DetailRow
              label="Order Date"
              value={formatDate(order.createdAt)}
            />

            <DetailRow
              label="Student Name"
              value={order.student?.name || student.name}
            />

            <DetailRow
              label="Admission No."
              value={
                order.student?.admissionNo ||
                student.admissionNo
              }
            />

            <DetailRow
              label="Total Items"
              value={itemCount}
            />

            <DetailRow
              label="Payment Method"
              value="Paytm"
            />

            <DetailRow
              label="Payment Status"
              value="Paid"
            />
          </div>
        </div>

        {/* PURCHASED PRODUCTS */}

        {items.length > 0 && (
          <div className="mx-4 mt-5 sm:mx-6">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-[#07152D]">
              <ShoppingBag
                size={17}
                className="text-[#4F39F6]"
              />
              Purchased Items
            </h3>

            <div className="max-h-[260px] divide-y divide-[#EDF0F5] overflow-y-auto rounded-xl border border-[#E8EDF4]">
              {items.map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  className="flex items-center gap-3 p-3"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#F7F9FC]">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name || "Product"}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <ShoppingBag
                        size={22}
                        className="text-slate-300"
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-[#07152D]">
                      {item.name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {item.size
                        ? `Size: ${item.size} • `
                        : ""}
                      Qty: {item.quantity}
                    </p>
                  </div>

                  <strong className="shrink-0 text-xs font-extrabold text-[#07152D] sm:text-sm">
                    {money(
                      item.total ??
                        Number(item.price || 0) *
                          Number(item.quantity || 0)
                    )}
                  </strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PAYMENT BREAKDOWN */}

        <div className="mx-4 mt-5 rounded-xl border border-[#E8EDF4] bg-[#FAFBFD] p-4 sm:mx-6 sm:p-5">
          <h3 className="mb-4 text-sm font-extrabold text-[#07152D]">
            Payment Details
          </h3>

          <div className="space-y-3">
            <DetailRow
              label="Subtotal"
              value={money(subtotal)}
            />

            <DetailRow
              label="Shipping"
              value={money(shipping)}
            />

            <DetailRow
              label="GST (Included)"
              value={money(gstIncluded)}
            />

            <p className="text-[11px] text-slate-500">
              GST is already included in product prices.
            </p>

            <div className="border-t border-dashed border-slate-200 pt-3">
              <DetailRow
                label="Total Paid"
                value={money(total)}
                highlight
              />
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS */}

        <div className="grid grid-cols-2 gap-3 p-4 sm:p-6">
          <Link
            to="/profile"
            className="flex min-h-11 items-center justify-center rounded-xl border border-[#D8D3FF] bg-white px-3 text-center text-xs font-bold text-[#4F39F6] transition hover:bg-[#F8F7FF] sm:text-sm"
          >
            My Orders
          </Link>

          <Link
            to="/"
            className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#4F39F6] px-3 text-center text-xs font-bold text-white transition hover:bg-[#3F2BE0] sm:text-sm"
          >
            Continue Shopping
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </main>
  );
}

function DetailRow({
  label,
  value,
  highlight = false,
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-xs text-slate-500 sm:text-[13px]">
        {label}
      </span>

      <strong
        className={`break-all text-right ${
          highlight
            ? "text-base font-extrabold text-[#4F39F6]"
            : "text-xs font-bold text-[#07152D] sm:text-[13px]"
        }`}
      >
        {value ?? "-"}
      </strong>
    </div>
  );
}

function MessageCard({
  icon: Icon,
  title,
  message,
  link,
  linkText,
}) {
  return (
    <main className="flex min-h-[65vh] items-center justify-center bg-[#F7F9FC] px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center">
        <Icon
          size={38}
          className="mx-auto text-[#4F39F6]"
        />

        <h1 className="mt-4 text-xl font-extrabold text-[#07152D]">
          {title}
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          {message}
        </p>

        <Link
          to={link}
          className="mt-5 inline-flex rounded-xl bg-[#4F39F6] px-5 py-3 text-sm font-bold text-white"
        >
          {linkText}
        </Link>
      </div>
    </main>
  );
}



// import { Link, useLocation, useSearchParams } from "react-router-dom";
// import {
//   Check,
//   ArrowRight,
//   PackageCheck,
//   CalendarDays,
//   ShoppingBag,
//   ClipboardList,
// } from "lucide-react";

// import { useStore } from "../context/StoreContext";

// const money = (value) =>
//   `₹${Number(value || 0).toLocaleString("en-IN", {
//     minimumFractionDigits: 2,
//     maximumFractionDigits: 2,
//   })}`;

// const formatDate = (value) => {
//   if (!value) return "-";

//   const date = new Date(value);

//   if (Number.isNaN(date.getTime())) return "-";

//   return date.toLocaleDateString("en-IN", {
//     day: "2-digit",
//     month: "short",
//     year: "numeric",
//   });
// };

// export default function OrderSuccess() {
//   const location = useLocation();
//   const [searchParams] = useSearchParams();

//   const { student, orders = [] } = useStore();

//   const orderId = searchParams.get("orderId");

//   // Order from navigation state, only if it belongs
//   // to the current student and matches the URL.
//   const stateOrder = location.state?.order;

//   const validStateOrder =
//     stateOrder &&
//     student &&
//     stateOrder.student?.admissionNo === student.admissionNo &&
//     (!orderId || String(stateOrder.id) === orderId)
//       ? stateOrder
//       : null;

//   // Restore order after page refresh.
//   const savedOrder = orderId
//     ? orders.find(
//         (item) => String(item.id) === orderId
//       )
//     : null;

//   const order = validStateOrder || savedOrder;

//   if (!student) {
//     return (
//       <main className="flex min-h-[65vh] items-center justify-center bg-[#F7F9FC] px-4">
//         <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center">
//           <PackageCheck
//             size={38}
//             className="mx-auto text-[#4F39F6]"
//           />

//           <h1 className="mt-4 text-xl font-extrabold text-[#07152D]">
//             Login Required
//           </h1>

//           <p className="mt-2 text-sm text-slate-500">
//             Please login to view your order.
//           </p>

//           <Link
//             to="/"
//             className="mt-5 inline-flex rounded-xl bg-[#4F39F6] px-5 py-3 text-sm font-bold text-white"
//           >
//             Back to Home
//           </Link>
//         </div>
//       </main>
//     );
//   }

//   if (!order) {
//     return (
//       <main className="flex min-h-[65vh] items-center justify-center bg-[#F7F9FC] px-4">
//         <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center">
//           <ClipboardList
//             size={38}
//             className="mx-auto text-slate-400"
//           />

//           <h1 className="mt-4 text-xl font-extrabold text-[#07152D]">
//             Order Not Found
//           </h1>

//           <p className="mt-2 text-sm leading-6 text-slate-500">
//             We couldn't find the requested order
//             in your order history.
//           </p>

//           <Link
//             to="/profile"
//             className="mt-5 inline-flex rounded-xl bg-[#4F39F6] px-5 py-3 text-sm font-bold text-white"
//           >
//             View My Orders
//           </Link>
//         </div>
//       </main>
//     );
//   }

//   const items = Array.isArray(order.items)
//     ? order.items
//     : [];

//   const itemCount = items.reduce(
//     (total, item) =>
//       total + Number(item.quantity || 0),
//     0
//   );

//   return (
//     <main className="flex min-h-[75vh] items-center justify-center bg-[#F7F9FC] px-3 py-8 sm:px-6 sm:py-12">
//       <div className="w-full max-w-[580px] overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">

//         {/* SUCCESS HEADER */}

//         <div className="px-5 pb-6 pt-8 text-center sm:px-8">
//           <div className="mx-auto flex h-[70px] w-[70px] items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
//             <Check size={34} strokeWidth={3} />
//           </div>

//           <h1 className="mt-5 text-[23px] font-extrabold tracking-tight text-[#07152D] sm:text-[28px]">
//             Order Placed Successfully!
//           </h1>

//           <p className="mx-auto mt-2 max-w-[410px] text-[13px] leading-6 text-slate-500 sm:text-sm">
//             Thank you for shopping with Brassleaf.
//             Your school uniform order has been placed.
//           </p>
//         </div>

//         {/* ORDER INFORMATION */}

//         <div className="mx-4 rounded-xl border border-[#E8EDF4] bg-[#FAFBFD] p-4 sm:mx-6 sm:p-5">
//           <div className="flex items-center gap-2 border-b border-[#E8EDF4] pb-3">
//             <PackageCheck
//               size={19}
//               className="text-[#4F39F6]"
//             />

//             <h2 className="text-sm font-extrabold text-[#07152D]">
//               Order Summary
//             </h2>
//           </div>

//           <div className="mt-4 space-y-3">
//             <DetailRow
//               label="Order ID"
//               value={order.orderNumber || order.id}
//             />

//             <DetailRow
//               label="Order Date"
//               value={formatDate(order.createdAt)}
//             />

//             <DetailRow
//               label="Admission No."
//               value={order.student?.admissionNo || student.admissionNo}
//             />

//             <DetailRow
//               label="Total Items"
//               value={itemCount}
//             />

//             <DetailRow
//               label="Payment Method"
//               value={order.paymentMethod || "COD"}
//             />

//             <div className="border-t border-dashed border-slate-200 pt-3">
//               <DetailRow
//                 label="Total Amount"
//                 value={money(order.total)}
//                 highlight
//               />
//             </div>
//           </div>
//         </div>

//         {/* PURCHASED PRODUCTS */}

//         {items.length > 0 && (
//           <div className="mx-4 mt-5 sm:mx-6">
//             <h3 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-[#07152D]">
//               <ShoppingBag
//                 size={17}
//                 className="text-[#4F39F6]"
//               />
//               Purchased Items
//             </h3>

//             <div className="max-h-[260px] divide-y divide-[#EDF0F5] overflow-y-auto rounded-xl border border-[#E8EDF4]">
//               {items.map((item, index) => (
//                 <div
//                   key={`${item.id}-${index}`}
//                   className="flex items-center gap-3 p-3"
//                 >
//                   <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#F7F9FC]">
//                     {item.image ? (
//                       <img
//                         src={item.image}
//                         alt={item.name || "Product"}
//                         className="h-full w-full object-contain"
//                       />
//                     ) : (
//                       <ShoppingBag
//                         size={22}
//                         className="text-slate-300"
//                       />
//                     )}
//                   </div>

//                   <div className="min-w-0 flex-1">
//                     <p className="text-[13px] font-bold text-[#07152D]">
//                       {item.name}
//                     </p>

//                     <p className="mt-1 text-xs text-slate-500">
//                       {item.size
//                         ? `Size: ${item.size}  •  `
//                         : ""}
//                       Qty: {item.quantity}
//                     </p>
//                   </div>

//                   <strong className="shrink-0 text-xs font-extrabold text-[#07152D] sm:text-sm">
//                     {money(
//                       item.total ??
//                         Number(item.price || 0) *
//                           Number(item.quantity || 1)
//                     )}
//                   </strong>
//                 </div>
//               ))}
//             </div>
//           </div>
//         )}

//         {/* ACTION BUTTONS */}

//         <div className="grid grid-cols-2 gap-3 p-4 sm:p-6">
//           <Link
//             to="/profile"
//             className="flex min-h-11 items-center justify-center rounded-xl border border-[#D8D3FF] bg-white px-3 text-center text-xs font-bold text-[#4F39F6] transition hover:bg-[#F8F7FF] sm:text-sm"
//           >
//             My Orders
//           </Link>

//           <Link
//             to="/"
//             className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#4F39F6] px-3 text-center text-xs font-bold text-white transition hover:bg-[#3F2BE0] sm:text-sm"
//           >
//             Continue Shopping
//             <ArrowRight size={16} />
//           </Link>
//         </div>
//       </div>
//     </main>
//   );
// }

// function DetailRow({
//   label,
//   value,
//   highlight = false,
// }) {
//   return (
//     <div className="flex items-start justify-between gap-4">
//       <span className="text-xs text-slate-500 sm:text-[13px]">
//         {label}
//       </span>

//       <strong
//         className={`break-all text-right ${
//           highlight
//             ? "text-base font-extrabold text-[#4F39F6]"
//             : "text-xs font-bold text-[#07152D] sm:text-[13px]"
//         }`}
//       >
//         {value ?? "-"}
//       </strong>
//     </div>
//   );
// }


