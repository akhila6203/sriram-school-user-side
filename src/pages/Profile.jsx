import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  UserRound,
  GraduationCap,
  Hash,
  Layers,
  Mail,
  Phone,
  Package,
  Download,
  CalendarDays,
  ShoppingBag,
  MapPin,
  Cake,
  House,
} from "lucide-react";

import brassleafLogo from "../assets/images/brassleaf-logo.jpeg";

import { jsPDF } from "jspdf";
import { useStore } from "../context/StoreContext";

/* =========================================
   HELPERS
========================================= */

const money = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const getProductImageUrl = (image) => {
  if (!image) return "";

  const url = String(image).trim();

  if (!url) return "";

  if (/^(https?:\/\/|data:|blob:)/i.test(url)) {
    return url;
  }

  const apiUrl = (
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api"
  ).replace(/\/$/, "");

  const backendOrigin = apiUrl.replace(/\/api\/?$/, "");

  return `${backendOrigin}/${url.replace(/^\/+/, "")}`;
};

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

const display = (value) => {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return "-";
  }

  return String(value);
};

const loadLogoForPDF = async () => {
  const image = new Image();

  image.src = brassleafLogo;

  await image.decode();

  const canvas = document.createElement("canvas");

  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Unable to create logo canvas");
  }

  ctx.drawImage(image, 0, 0);

  return canvas.toDataURL("image/jpeg", 0.95);
};
const getOrderAmounts = (order) => {
  const items = Array.isArray(order.items) ? order.items : [];

  const calculatedSubtotal = items.reduce((sum, item) => {
    const qty = Number(item.quantity ?? 1);
    const price = Number(item.price ?? 0);

    return sum + Number(item.total ?? price * qty);
  }, 0);

  const subtotal = Number(
    order.subtotal ?? order.subTotal ?? calculatedSubtotal
  );

  const shipping = Number(
  order.shipping ??
  order.shippingAmount ??
  order.shippingCharge ??
  0
);

  // GST is already included in the product price.
  // Never add this amount to the final total.
  const gstRaw =
    order.gstIncluded ??
    order.gstAmount ??
    order.gst_amount ??
    order.taxIncluded ??
    null;

  const gstIncluded =
    gstRaw === null ? null : Number(gstRaw);

  const total = Number(
    order.total ??
    order.totalAmount ??
    order.grandTotal ??
    subtotal + shipping
  );

  return { subtotal, shipping, gstIncluded, total };
};
/* =========================================
   ORDER PDF
========================================= */

const downloadOrderPDF = async (order, student) => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const logo = await loadLogoForPDF();

  const left = 15;
  const right = 195;
  const pageBottom = 266;

  const navy = [14, 29, 58];
  const muted = [62, 75, 100];

  const value = (v) =>
    v === null || v === undefined || String(v).trim() === ""
      ? "-"
      : String(v);

  const amount = (v) =>
    `Rs. ${Number(v || 0).toFixed(2)}`;

  const customer = {
    ...(student || {}),
    ...(order.student || {}),
  };

  const items = Array.isArray(order.items) ? order.items : [];

  const subtotal = Number(
    order.subtotal ??
    order.subTotal ??
    items.reduce(
      (sum, item) =>
        sum +
        Number(
          item.total ??
          Number(item.price ?? item.unitPrice ?? 0) *
            Number(item.quantity || 1)
        ),
      0
    )
  );

  const total = Number(
    order.total ??
    order.totalAmount ??
    order.grandTotal ??
    subtotal
  );

  const shipping = Number(
    order.shippingAmount ??
    order.shippingCharge ??
    order.shipping ??
    0
  );

  const gst = Number(
    order.gstIncluded ??
    order.gstAmount ??
    order.gst_amount ??
    0
  );

  const orderNumber = value(order.orderNumber || order.id);

  const addressData =
    order.shippingAddress || customer.address || "";

  const address =
    typeof addressData === "string"
      ? addressData
      : [
          addressData.addressLine1,
          addressData.addressLine2,
          addressData.address1,
          addressData.city,
          addressData.state,
          addressData.pincode,
        ]
          .filter(Boolean)
          .join(", ");

  const drawLine = (y, start = left, end = right) => {
    doc.setDrawColor(194, 202, 214);
    doc.setLineWidth(0.25);
    doc.line(start, y, end, y);
  };

  const drawFooter = () => {
    drawLine(282);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...muted);

    doc.text(
      "Note: Any exchanges should be done at the BrassLeaf, Punjagutta store only",
      105,
      288,
      { align: "center" }
    );
  };

  // HEADER — same layout as reference invoice
  doc.addImage(logo, "JPEG", left, 10, 59, 28);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(...navy);
  doc.text("BrassLeaf", 116, 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);

  const businessLines = [
    "6-3-666/B, Pillar No. #1118",
    "Erramanzil Road, Panjagutta,",
    "Hyderabad - 500082",
    "Opp Nims Hospital",
    "GSTIN: 36AACFB1506E1Z5",
  ];

  businessLines.forEach((line, index) => {
    doc.text(line, 116, 22 + index * 4.1);
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.text("INVOICE", left, 57);

  // STUDENT DETAILS — two columns
  const drawField = (label, fieldValue, x, y, labelWidth, maxWidth) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(...navy);
    doc.text(`${label}:`, x, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    const lines = doc.splitTextToSize(
      value(fieldValue),
      maxWidth
    );

    doc.text(lines, x + labelWidth, y);

    return Math.max(8.5, lines.length * 4.3 + 3);
  };

  let leftY = 76;
  let rightY = 76;

  const leftFields = [
    ["Name", customer.name || customer.studentName],
    [
      "Admission Number",
      customer.admissionNo || customer.admissionNumber,
    ],
    ["Address", address],
    ["Class", customer.className || customer.class],
    ["Mobile Number", customer.phone || customer.mobile],
    ["Email Address", customer.email],
    ["Gender", customer.gender],
  ];

  leftFields.forEach(([label, fieldValue]) => {
    leftY += drawField(
      label,
      fieldValue,
      left,
      leftY,
      42,
      46
    );
  });

  const rightFields = [
    ["Order Number", orderNumber],
    [
      "Order Date",
      formatDate(order.createdAt || order.created_at),
    ],
    [
      "Payment Method",
      order.paymentMethod ||
        order.payment_method ||
        "Paytm",
    ],
  ];

  rightFields.forEach(([label, fieldValue]) => {
    rightY += drawField(
      label,
      fieldValue,
      116,
      rightY,
      41,
      36
    );
  });

  // No Invoice Number or Invoice Date

  let y = Math.max(leftY, rightY) + 12;

  const drawTableHeader = () => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...navy);

    doc.text("Product", left, y);
    doc.text("Quantity", 145, y, { align: "center" });
    doc.text("Price", right, y, { align: "right" });

    drawLine(y + 5);
    y += 13;
  };

  drawTableHeader();

  items.forEach((item) => {
    const name = value(
      item.name || item.productName || item.name_snapshot
    );

    const size =
      item.size ||
      item.option_snapshot ||
      item.variant?.label ||
      "";

    const quantity = Number(item.quantity || 1);

    const itemTotal = Number(
      item.total ??
      Number(
        item.price ??
        item.unitPrice ??
        item.unit_price ??
        0
      ) * quantity
    );

    const nameLines = doc.splitTextToSize(name, 100);

    const rowHeight = Math.max(
      16,
      nameLines.length * 4.5 + (size ? 8 : 3)
    );

    if (y + rowHeight > pageBottom) {
      drawFooter();
      doc.addPage();
      y = 22;
      drawTableHeader();
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...navy);
    doc.text(nameLines, left, y);

    if (size) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...muted);
      doc.text(
        `Size: ${value(size)}`,
        left,
        y + nameLines.length * 4.5 + 1
      );
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...navy);

    doc.text(String(quantity), 145, y, {
      align: "center",
    });

    doc.text(amount(itemTotal), right, y, {
      align: "right",
    });

    y += rowHeight;
    drawLine(y);
    y += 9;
  });

  // TOTALS — right aligned, as in reference
  if (y + 65 > pageBottom) {
    drawFooter();
    doc.addPage();
    y = 30;
  }

  y += 5;

  const totalRow = (label, price, bold = false) => {
    doc.setFont(
      "helvetica",
      bold ? "bold" : "normal"
    );

    doc.setFontSize(bold ? 10 : 8.5);
    doc.setTextColor(...navy);

    doc.text(label, 112, y);
    doc.text(amount(price), right, y, {
      align: "right",
    });

    y += bold ? 12 : 10;
  };

  totalRow("Subtotal", subtotal);
  totalRow("Shipping", shipping);
  totalRow("GST (Included CGST & SGST)", gst);

  drawLine(y + 2, 112, right);
  y += 11;

  totalRow("Total Paid", total, true);

  // Footer on each page
  const pages = doc.internal.getNumberOfPages();

  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    drawFooter();
  }

  const safeNumber = orderNumber.replace(
    /[^a-zA-Z0-9-_]/g,
    ""
  );

  doc.save(`BrassLeaf-Invoice-${safeNumber}.pdf`);
};


/* =========================================
   PROFILE PAGE
========================================= */

export default function Profile() {
  const {
  student,
  profile,
  orders = [],
  refreshOrders,
} = useStore();

  const [downloadingId, setDownloadingId] =
    useState(null);

    useEffect(() => {
  if (!student?.id) return;

  refreshOrders().catch((error) => {
    console.error("Unable to load orders:", error);
  });
}, [student?.id]);

  const handleDownload = async (order) => {
  try {
    setDownloadingId(order.id);

    await downloadOrderPDF(
      order,
      { ...student, ...profile }
    );
  } catch (error) {
    console.error("PDF download error:", error);

    alert(
      error.message ||
      "Unable to download PDF. Please try again."
    );
  } finally {
    setDownloadingId(null);
  }
};

  if (!student) {
    return (
      <main className="flex min-h-[65vh] items-center justify-center bg-[#F7F9FC] px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <UserRound
            size={38}
            className="mx-auto text-[#4F39F6]"
          />

          <h2 className="mt-4 text-xl font-bold text-[#07152D]">
            Login Required
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Please login to view your profile and orders.
          </p>

          <Link
            to="/"
            className="mt-5 inline-flex rounded-xl bg-[#4F39F6] px-5 py-3 text-sm font-bold text-white"
          >
            Go to Home
          </Link>
        </div>
      </main>
    );
  }

  const studentData = {
  ...student,
  ...profile,
};

const fullAddress =
  studentData.address ||
  studentData.fullAddress ||
  [
    studentData.address1,
    studentData.address2,
    studentData.city,
    studentData.state,
    studentData.zipcode,
  ]
    .filter(Boolean)
    .join(", ");

const studentDetails = [
  
  {
    icon: Hash,
    label: "Admission Number",
    value:
      studentData.admissionNo ||
      studentData.admissionNumber,
  },
  {
    icon: GraduationCap,
    label: "Class",
    value: studentData.className,
  },
  {
    icon: Cake,
    label: "Age",
    value: studentData.age,
  },
  {
    icon: House,
    label: "House",
    value:
      studentData.house ||
      studentData.houseColor,
  },
  {
    icon: Phone,
    label: "Mobile Number",
    value:
      studentData.phone ||
      studentData.mobile ||
      studentData.mobileNumber,
  },
  {
    icon: Mail,
    label: "Email Address",
    value: studentData.email,
  },
  {
    icon: MapPin,
    label: "Address",
    value: fullAddress,
  },
];

  return (
    <main className="min-h-[75vh] bg-[#F7F9FC] px-3 py-5 sm:px-5 sm:py-6 lg:px-8 lg:py-7">
      <div className="mx-auto max-w-[1250px]">

        {/* PAGE TITLE */}

        <div className="mb-5">
          <h1 className="text-[24px] font-extrabold tracking-tight text-[#07152D] sm:text-[28px]">
            My Account
          </h1>
        </div>

        {/* MAIN GRID */}

        <div className="grid items-start gap-4 md:grid-cols-[260px_minmax(0,1fr)] lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-5">

          {/* =================================
              LEFT - STICKY PROFILE
          ================================= */}

          <aside className="min-w-0 md:sticky md:top-[85px] md:self-start">

            <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">

              {/* PROFILE HEADER */}

              <div className="flex items-center gap-3 border-b border-[#E8EDF4] p-4 sm:p-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#F0EEFF] text-[#4F39F6]">
                  <UserRound size={27} />
                </div>

                <div className="min-w-0">
                  <h2 className="break-words text-[16px] font-extrabold text-[#07152D]">
                    {display(student.name)}
                  </h2>

                  <p className="mt-1 text-xs text-slate-500">
                    Student Profile
                  </p>
                </div>
              </div>

              {/* STUDENT DETAILS */}

              <div className="divide-y divide-[#F0F2F6] px-4 sm:px-5">
                {studentDetails.map((detail) => (
                  <ProfileRow
                    key={detail.label}
                    icon={detail.icon}
                    label={detail.label}
                    value={detail.value}
                  />
                ))}
              </div>

            </div>
          </aside>

          {/* =================================
              RIGHT - ORDERS
          ================================= */}

          <section className="min-w-0 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm sm:p-5">

            {/* ORDERS HEADER */}

            <div className="mb-4 flex items-center justify-between gap-3 border-b border-[#E8EDF4] pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-[#07152D] sm:text-xl">
                  My Orders
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Your purchased school uniforms
                </p>
              </div>

              <span className="rounded-lg bg-[#F0EEFF] px-3 py-1.5 text-xs font-bold text-[#4F39F6]">
                {orders.length}
              </span>
            </div>

            {/* EMPTY ORDERS */}

            {orders.length === 0 ? (
              <div className="py-12 text-center">
                <Package
                  size={35}
                  className="mx-auto text-slate-300"
                />

                <h3 className="mt-3 text-base font-bold text-[#07152D]">
                  No Orders Yet
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Your orders will appear here.
                </p>

                <Link
                  to="/"
                  className="mt-5 inline-flex rounded-xl bg-[#4F39F6] px-5 py-2.5 text-sm font-bold text-white"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-3">

                {orders.map((order) => {
                  const items = Array.isArray(
                    order.items
                  )
                    ? order.items
                    : [];

                const firstItem = items[0] || null;

const remainingCount = Math.max(
  items.length - 1,
  0
);

const { total } = getOrderAmounts(order);

                  
return (
  <article
    key={order.id}
    className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white"
  >
    {/* ORDER HEADER */}
    <div className="border-b border-[#EDF0F5] bg-[#F8FAFC] px-3 py-2.5 sm:px-4">
      <p className="text-xs font-extrabold text-[#07152D] sm:text-sm">
        Order #{display(order.orderNumber || order.id)}
      </p>

      <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
        <CalendarDays size={12} />
        {formatDate(order.createdAt)}
      </p>
    </div>

    {/* COMPACT ORDER ROW */}
    <div className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
      {/* FIRST PRODUCT IMAGE */}
      <div className="flex h-[68px] w-[68px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#EDF0F5] bg-[#F8FAFC] sm:h-[80px] sm:w-[80px]">
        {firstItem?.image ? (
          <img
            // src={firstItem.image}
            src={getProductImageUrl(firstItem.image)}
            alt={firstItem.name || "Product"}
            className="h-full w-full object-contain"
          />
        ) : (
          <ShoppingBag
            size={25}
            className="text-slate-300"
          />
        )}
      </div>

      {/* PRODUCT DETAILS */}
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 text-[12px] font-bold leading-5 text-[#07152D] sm:text-sm">
          {display(firstItem?.name)}
        </h3>

        {firstItem && (
          <p className="mt-1 text-[11px] text-slate-500 sm:text-xs">
            {firstItem.size
              ? `Size: ${firstItem.size} · `
              : ""}
            Qty: {firstItem.quantity ?? 1}
          </p>
        )}

        {remainingCount > 0 && (
          <p className="mt-1 text-[11px] font-semibold text-[#4F39F6]">
            +{remainingCount} more{" "}
            {remainingCount === 1
              ? "product"
              : "products"}
          </p>
        )}

        <p className="mt-2 text-[11px] font-semibold text-slate-600 sm:text-xs">
          Total Amount:{" "}
          <span className="font-extrabold text-[#4F39F6]">
            {money(total)}
          </span>
        </p>
      </div>

      {/* DOWNLOAD PDF */}
      <button
        type="button"
        onClick={() => handleDownload(order)}
        disabled={downloadingId === order.id}
        title="Download Order PDF"
        aria-label="Download Order PDF"
        className="flex shrink-0 flex-col items-center justify-center gap-1 rounded-lg bg-[#F0EEFF] px-2.5 py-2 text-[#4F39F6] transition hover:bg-[#E7E2FF] disabled:opacity-60 sm:flex-row sm:gap-2 sm:px-3"
      >
        <Download size={17} />

        <span className="text-[10px] font-bold sm:text-xs">
          PDF
        </span>
      </button>
    </div>
  </article>
);

                
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

/* =========================================
   PROFILE ROW
========================================= */

function ProfileRow({
  icon: Icon,
  label,
  value,
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F0EEFF] text-[#4F39F6]">
        <Icon size={15} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-slate-500">
          {label}
        </p>

        <p className="mt-0.5 break-words text-[13px] font-bold text-[#07152D]">
          {display(value)}
        </p>
      </div>
    </div>
  );
}





// import { useState } from "react";
// import { Link } from "react-router-dom";
// import {
//   UserRound,
//   GraduationCap,
//   School,
//   Hash,
//   Layers,
//   Mail,
//   Phone,
//   Package,
//   Download,
//   CalendarDays,
//   ShoppingBag,
// } from "lucide-react";

// import { jsPDF } from "jspdf";
// import { useStore } from "../context/StoreContext";

// /* =========================================
//    HELPERS
// ========================================= */

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

// const display = (value) => {
//   if (
//     value === null ||
//     value === undefined ||
//     String(value).trim() === ""
//   ) {
//     return "-";
//   }

//   return String(value);
// };

// /* =========================================
//    ORDER PDF
// ========================================= */

// const downloadOrderPDF = (order, student) => {
//   const doc = new jsPDF();

//   const pageWidth = doc.internal.pageSize.getWidth();
//   const pageHeight = doc.internal.pageSize.getHeight();

//   const left = 16;
//   const right = pageWidth - 16;

//   let y = 20;

//   const checkPage = (height = 15) => {
//     if (y + height > pageHeight - 22) {
//       doc.addPage();
//       y = 20;
//     }
//   };

//   const write = (
//     text,
//     x,
//     positionY,
//     options = {}
//   ) => {
//     doc.text(String(text ?? "-"), x, positionY, options);
//   };

//   const line = () => {
//     doc.setDrawColor(225, 231, 240);
//     doc.line(left, y, right, y);
//   };

//   /* HEADER */

//   doc.setFillColor(79, 57, 246);
//   doc.rect(0, 0, pageWidth, 38, "F");

//   doc.setTextColor(255, 255, 255);
//   doc.setFont("helvetica", "bold");
//   doc.setFontSize(21);

//   write("BRASSLEAF", left, 18);

//   doc.setFontSize(9);
//   doc.setFont("helvetica", "normal");

//   write("School Uniform Store", left, 26);

//   doc.setFontSize(12);
//   doc.setFont("helvetica", "bold");

//   write("ORDER INVOICE", right, 20, {
//     align: "right",
//   });

//   doc.setTextColor(15, 23, 42);

//   y = 50;

//   doc.setFontSize(10);
//   doc.setFont("helvetica", "bold");

//   write(
//     `Order ID: ${display(
//       order.orderNumber || order.id
//     )}`,
//     left,
//     y
//   );

//   y += 8;

//   doc.setFont("helvetica", "normal");
//   doc.setFontSize(9);

//   write(
//     `Date: ${formatDate(order.createdAt)}`,
//     left,
//     y
//   );

//   y += 10;
//   line();
//   y += 10;

//   /* STUDENT */

//   const orderStudent = order.student || student;

//   doc.setFont("helvetica", "bold");
//   doc.setFontSize(11);

//   write("STUDENT DETAILS", left, y);

//   y += 9;

//   doc.setFont("helvetica", "normal");
//   doc.setFontSize(9);

//   const studentRows = [
//     ["Name", orderStudent?.name],
//     ["Admission No.", orderStudent?.admissionNo],
//     ["Class", orderStudent?.className],
//     ["School", orderStudent?.school],
//   ];

//   studentRows.forEach(([label, value]) => {
//     checkPage(12);

//     doc.setFont("helvetica", "bold");
//     write(label, left, y);

//     doc.setFont("helvetica", "normal");

//     const lines = doc.splitTextToSize(
//       display(value),
//       105
//     );

//     doc.text(lines, 65, y);

//     y += Math.max(8, lines.length * 5 + 3);
//   });

//   y += 3;
//   line();
//   y += 10;

//   /* PRODUCTS */

//   doc.setFont("helvetica", "bold");
//   doc.setFontSize(11);

//   write("ORDER ITEMS", left, y);

//   y += 10;

//   doc.setFillColor(245, 247, 252);
//   doc.rect(left, y - 6, right - left, 11, "F");

//   doc.setFontSize(8);

//   write("PRODUCT", left + 3, y);
//   write("SIZE", 111, y);
//   write("QTY", 135, y);
//   write("AMOUNT", right - 3, y, {
//     align: "right",
//   });

//   y += 12;

//   const items = Array.isArray(order.items)
//     ? order.items
//     : [];

//   items.forEach((item) => {
//     checkPage(22);

//     const nameLines = doc.splitTextToSize(
//       display(item.name),
//       75
//     );

//     const rowHeight = Math.max(
//       14,
//       nameLines.length * 5 + 5
//     );

//     doc.setFont("helvetica", "normal");
//     doc.setFontSize(8.5);

//     doc.text(nameLines, left + 3, y);

//     write(display(item.size), 111, y);
//     write(String(item.quantity || 1), 135, y);

//     const amount =
//       item.total !== undefined
//         ? Number(item.total)
//         : Number(item.price || 0) *
//           Number(item.quantity || 1);

//     write(
//       `Rs. ${amount.toFixed(2)}`,
//       right - 3,
//       y,
//       { align: "right" }
//     );

//     y += rowHeight;
//     line();
//     y += 5;
//   });

//   /* TOTAL */

//   checkPage(40);

//   y += 5;

//   const subtotal = Number(
//     order.subtotal ??
//       items.reduce(
//         (sum, item) =>
//           sum +
//           Number(item.price || 0) *
//             Number(item.quantity || 1),
//         0
//       )
//   );

//   const shipping = Number(order.shipping ?? 0);
//   const total = Number(
//     order.total ?? subtotal + shipping
//   );

//   const totalRows = [
//     ["Subtotal", subtotal],
//     ["Shipping", shipping],
//   ];

//   totalRows.forEach(([label, amount]) => {
//     doc.setFont("helvetica", "normal");
//     doc.setFontSize(9);

//     write(label, 115, y);

//     write(
//       `Rs. ${amount.toFixed(2)}`,
//       right,
//       y,
//       { align: "right" }
//     );

//     y += 9;
//   });

//   line();
//   y += 10;

//   doc.setFont("helvetica", "bold");
//   doc.setFontSize(11);

//   write("TOTAL", 110, y);

//   write(
//     `Rs. ${total.toFixed(2)}`,
//     right,
//     y,
//     { align: "right" }
//   );

//   y += 10;

//   doc.setFont("helvetica", "normal");
//   doc.setFontSize(8);
//   doc.setTextColor(100, 116, 139);

//   write("GST included in product prices.", left, y);

//   /* FOOTER */

//   const pageCount = doc.internal.getNumberOfPages();

//   for (let page = 1; page <= pageCount; page++) {
//     doc.setPage(page);

//     doc.setDrawColor(226, 232, 240);
//     doc.line(
//       left,
//       pageHeight - 19,
//       right,
//       pageHeight - 19
//     );

//     doc.setFontSize(8);
//     doc.setTextColor(148, 163, 184);

//     write(
//       "Brassleaf - School Uniform Store",
//       left,
//       pageHeight - 12
//     );

//     write(
//       `Page ${page} of ${pageCount}`,
//       right,
//       pageHeight - 12,
//       { align: "right" }
//     );
//   }

//   const safeId = String(
//     order.orderNumber || order.id || "order"
//   ).replace(/[^a-zA-Z0-9-_]/g, "");

//   doc.save(`Brassleaf-Order-${safeId}.pdf`);
// };

// /* =========================================
//    PROFILE PAGE
// ========================================= */

// export default function Profile() {
//   const {
//     student,
//     orders = [],
//   } = useStore();

//   const [downloadingId, setDownloadingId] =
//     useState(null);

//   const handleDownload = (order) => {
//     try {
//       setDownloadingId(order.id);

//       downloadOrderPDF(order, student);
//     } catch (error) {
//       console.error("PDF download error:", error);

//       alert("Unable to download PDF. Please try again.");
//     } finally {
//       setDownloadingId(null);
//     }
//   };

//   if (!student) {
//     return (
//       <main className="flex min-h-[65vh] items-center justify-center bg-[#F7F9FC] px-4">
//         <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center">
//           <UserRound
//             size={38}
//             className="mx-auto text-[#4F39F6]"
//           />

//           <h2 className="mt-4 text-xl font-bold text-[#07152D]">
//             Login Required
//           </h2>

//           <p className="mt-2 text-sm text-slate-500">
//             Please login to view your profile and orders.
//           </p>

//           <Link
//             to="/"
//             className="mt-5 inline-flex rounded-xl bg-[#4F39F6] px-5 py-3 text-sm font-bold text-white"
//           >
//             Go to Home
//           </Link>
//         </div>
//       </main>
//     );
//   }

//   const studentDetails = [
//     {
//       icon: Hash,
//       label: "Admission No.",
//       value: student.admissionNo,
//     },
//     {
//       icon: GraduationCap,
//       label: "Class",
//       value: student.className,
//     },
//     {
//       icon: Layers,
//       label: "Section",
//       value: student.section,
//     },
//     {
//       icon: School,
//       label: "School",
//       value: student.school,
//     },
//     {
//       icon: Mail,
//       label: "Email",
//       value: student.email,
//     },
//     {
//       icon: Phone,
//       label: "Mobile",
//       value: student.phone,
//     },
//   ];

//   return (
//     <main className="min-h-[75vh] bg-[#F7F9FC] px-3 py-5 sm:px-5 sm:py-6 lg:px-8 lg:py-7">
//       <div className="mx-auto max-w-[1250px]">

//         {/* PAGE TITLE */}

//         <div className="mb-5">
//           <h1 className="text-[24px] font-extrabold tracking-tight text-[#07152D] sm:text-[28px]">
//             My Account
//           </h1>
//         </div>

//         {/* MAIN GRID */}

//         <div className="grid items-start gap-4 md:grid-cols-[260px_minmax(0,1fr)] lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-5">

//           {/* =================================
//               LEFT - STICKY PROFILE
//           ================================= */}

//           <aside className="min-w-0 md:sticky md:top-[85px] md:self-start">

//             <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-sm">

//               {/* PROFILE HEADER */}

//               <div className="flex items-center gap-3 border-b border-[#E8EDF4] p-4 sm:p-5">
//                 <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#F0EEFF] text-[#4F39F6]">
//                   <UserRound size={27} />
//                 </div>

//                 <div className="min-w-0">
//                   <h2 className="break-words text-[16px] font-extrabold text-[#07152D]">
//                     {display(student.name)}
//                   </h2>

//                   <p className="mt-1 text-xs text-slate-500">
//                     Student Profile
//                   </p>
//                 </div>
//               </div>

//               {/* STUDENT DETAILS */}

//               <div className="divide-y divide-[#F0F2F6] px-4 sm:px-5">
//                 {studentDetails.map((detail) => (
//                   <ProfileRow
//                     key={detail.label}
//                     icon={detail.icon}
//                     label={detail.label}
//                     value={detail.value}
//                   />
//                 ))}
//               </div>

//             </div>
//           </aside>

//           {/* =================================
//               RIGHT - ORDERS
//           ================================= */}

//           <section className="min-w-0 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-sm sm:p-5">

//             {/* ORDERS HEADER */}

//             <div className="mb-4 flex items-center justify-between gap-3 border-b border-[#E8EDF4] pb-4">
//               <div>
//                 <h2 className="text-lg font-extrabold text-[#07152D] sm:text-xl">
//                   My Orders
//                 </h2>

//                 <p className="mt-1 text-xs text-slate-500">
//                   Your purchased school uniforms
//                 </p>
//               </div>

//               <span className="rounded-lg bg-[#F0EEFF] px-3 py-1.5 text-xs font-bold text-[#4F39F6]">
//                 {orders.length}
//               </span>
//             </div>

//             {/* EMPTY ORDERS */}

//             {orders.length === 0 ? (
//               <div className="py-12 text-center">
//                 <Package
//                   size={35}
//                   className="mx-auto text-slate-300"
//                 />

//                 <h3 className="mt-3 text-base font-bold text-[#07152D]">
//                   No Orders Yet
//                 </h3>

//                 <p className="mt-1 text-sm text-slate-500">
//                   Your orders will appear here.
//                 </p>

//                 <Link
//                   to="/"
//                   className="mt-5 inline-flex rounded-xl bg-[#4F39F6] px-5 py-2.5 text-sm font-bold text-white"
//                 >
//                   Start Shopping
//                 </Link>
//               </div>
//             ) : (
//               <div className="space-y-3">

//                 {orders.map((order) => {
//                   const items = Array.isArray(
//                     order.items
//                   )
//                     ? order.items
//                     : [];

//                   return (
//                     <article
//                       key={order.id}
//                       className="overflow-hidden rounded-xl border border-[#E2E8F0]"
//                     >

//                       {/* ORDER ID + DATE + DOWNLOAD */}

//                       <div className="flex items-center justify-between gap-2 bg-[#F8FAFC] px-3 py-3 sm:px-4">

//                         <div className="min-w-0">
//                           <p className="break-all text-xs font-extrabold text-[#07152D] sm:text-sm">
//                             Order #
//                             {display(
//                               order.orderNumber ||
//                                 order.id
//                             )}
//                           </p>

//                           <p className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
//                             <CalendarDays size={12} />

//                             {formatDate(
//                               order.createdAt
//                             )}
//                           </p>
//                         </div>

//                         <button
//                           type="button"
//                           onClick={() =>
//                             handleDownload(order)
//                           }
//                           disabled={
//                             downloadingId === order.id
//                           }
//                           title="Download Order PDF"
//                           aria-label="Download Order PDF"
//                           className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#4F39F6] text-white transition hover:bg-[#3F2BE0] disabled:opacity-60 lg:h-10 lg:w-auto lg:gap-2 lg:px-4"
//                         >
//                           <Download size={17} />

//                           <span className="hidden text-xs font-bold lg:inline">
//                             Download PDF
//                           </span>
//                         </button>
//                       </div>

//                       {/* ORDER PRODUCTS */}

//                       <div className="divide-y divide-[#EDF0F5]">
//                         {items.map((item, index) => {
//                           const itemTotal =
//                             item.total !== undefined
//                               ? Number(item.total)
//                               : Number(
//                                   item.price || 0
//                                 ) *
//                                 Number(
//                                   item.quantity || 1
//                                 );

//                           return (
//                             <div
//                               key={`${item.id}-${index}`}
//                               className="flex items-center gap-3 p-3 sm:p-4"
//                             >

//                               {/* IMAGE */}

//                               <div className="flex h-[65px] w-[65px] shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#EDF0F5] bg-[#F8FAFC] sm:h-[75px] sm:w-[75px]">
//                                 {item.image ? (
//                                   <img
//                                     src={item.image}
//                                     alt={
//                                       item.name ||
//                                       "Product"
//                                     }
//                                     className="h-full w-full object-contain"
//                                   />
//                                 ) : (
//                                   <ShoppingBag
//                                     size={23}
//                                     className="text-slate-300"
//                                   />
//                                 )}
//                               </div>

//                               {/* PRODUCT DETAILS */}

//                               <div className="min-w-0 flex-1">
//                                 <h3 className="text-[13px] font-bold leading-5 text-[#07152D] sm:text-sm">
//                                   {display(item.name)}
//                                 </h3>

//                                 <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 sm:text-xs">
//                                   {item.size && (
//                                     <span>
//                                       Size:{" "}
//                                       <strong className="font-semibold text-slate-700">
//                                         {item.size}
//                                       </strong>
//                                     </span>
//                                   )}

//                                   <span>
//                                     Qty:{" "}
//                                     <strong className="font-semibold text-slate-700">
//                                       {item.quantity}
//                                     </strong>
//                                   </span>
//                                 </div>
//                               </div>

//                               {/* AMOUNT */}

//                               <strong className="shrink-0 text-[12px] font-extrabold text-[#07152D] sm:text-sm">
//                                 {money(itemTotal)}
//                               </strong>
//                             </div>
//                           );
//                         })}
//                       </div>

//                       {/* TOTAL AMOUNT */}

//                       <div className="flex items-center justify-between border-t border-[#E8EDF4] bg-[#FAFBFD] px-3 py-3 sm:px-4">
//                         <span className="text-xs font-semibold text-slate-500">
//                           Total Amount
//                         </span>

//                         <strong className="text-sm font-extrabold text-[#4F39F6] sm:text-base">
//                           {money(order.total)}
//                         </strong>
//                       </div>
//                     </article>
//                   );
//                 })}
//               </div>
//             )}
//           </section>
//         </div>
//       </div>
//     </main>
//   );
// }

// /* =========================================
//    PROFILE ROW
// ========================================= */

// function ProfileRow({
//   icon: Icon,
//   label,
//   value,
// }) {
//   return (
//     <div className="flex items-start gap-3 py-3">
//       <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F0EEFF] text-[#4F39F6]">
//         <Icon size={15} />
//       </div>

//       <div className="min-w-0 flex-1">
//         <p className="text-[11px] text-slate-500">
//           {label}
//         </p>

//         <p className="mt-0.5 break-words text-[13px] font-bold text-[#07152D]">
//           {display(value)}
//         </p>
//       </div>
//     </div>
//   );
// }




