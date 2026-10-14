import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  loginStudent, fetchStudentCatalog,
  getStudentSession, logoutStudent,
  getStudentProfile, saveStudentProfile,
  getStudentAddresses, createStudentAddress, editStudentAddress,
  removeStudentAddress, makeDefaultAddress,
  getStudentCart, addStudentCartItem, editStudentCartItem, removeStudentCartItem,
  getStudentOrders, submitStudentOrder,
} from "../api/storefront";



const StoreContext = createContext(null);
const emptyCatalog = { mode: "individual", kit: null, products: [] };
const list = (response, key) => Array.isArray(response) ? response : (response?.[key] || []);
const unwrap = (response, key) => response?.[key] ?? response;


const normalizeStudent = (s) => {
  if (!s) return null;

  return {
    ...s,

    admissionNo:
      s.admissionNo ??
      s.admissionNumber ??
      s.admission_number,

    name:
      s.name ??
      s.studentName ??
      s.student_name,

    className:
      s.className ??
      s.class_name,

    gender: s.gender ?? "",

    age: s.age ?? null,

    house:
      s.house ??
      s.houseColor ??
      s.house_color ??
      "",

    phone:
      s.phone ??
      s.mobile ??
      s.mobileNumber ??
      s.mobile_number ??
      "",

    email:
      s.email ??
      s.emailAddress ??
      s.email_address ??
      "",

   address:
  s.address ||
  s.fullAddress ||
  s.full_address ||
  [
    s.address1,
    s.address2,
    s.city,
    s.state,
    s.zipcode,
  ]
    .filter(Boolean)
    .join(", "),
  };
};

const API_ORIGIN = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api"
)
  .replace(/\/api\/?$/, "")
  .replace(/\/$/, "");

const resolveImageUrl = (url) => {
  if (!url) return "";

  const value = String(url).trim().replace(/\\/g, "/");

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (value.startsWith("data:") || value.startsWith("blob:")) {
    return value;
  }

  return `${API_ORIGIN}/${value.replace(/^\/+/, "")}`;
};

const mapProduct = (product) => ({
  ...product,
  image: resolveImageUrl(
  product.imageUrl || product.image || product.images?.[0]
),

images: (
  product.images?.length
    ? product.images
    : [product.imageUrl || product.image].filter(Boolean)
).map(resolveImageUrl),
  // image: product.imageUrl || product.image || product.images?.[0] || "",
  price: Number(product.price ?? product.basePrice ?? 0),
  hasSize: (product.variants || product.sizes || []).length > 0,
  sizes: (product.variants || product.sizes || []).map((v) => ({
    id: v.id,
    label: v.label || v.option1Value || v.sku,
    price: Number(v.price ?? v.priceOverride ?? product.price ?? product.basePrice ?? 0),
    stockQty: Number(v.stockQty ?? 0),
  })),
});

export function StoreProvider({ children }) {
  const [student, setStudent] = useState(null);
  const [profile, setProfile] = useState(null);
  const [catalog, setCatalog] = useState(emptyCatalog);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const [authLoading, setAuthLoading] = useState(true);
  const [loginOpen, setLoginOpen] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [cartSummary, setCartSummary] = useState({ subtotal: 0, gstIncluded: 0 });

  const loadCatalog = async (admissionNo) => {
  if (!admissionNo) return null;

  setCatalogLoading(true);
  setCatalogError("");

  try {
    const response = await fetchStudentCatalog(admissionNo);

    const data = unwrap(
      response?.data ?? response,
      "catalog"
    );

    if (
      !data ||
      !["kit", "individual"].includes(data.mode)
    ) {
      throw new Error("Invalid catalog response");
    }

    setCatalog({
      mode: data.mode,
      kit: data.mode === "kit" ? data.kit ?? null : null,
      products:
        data.mode === "individual" &&
        Array.isArray(data.products)
          ? data.products
          : [],
    });

    return data;
  } catch (error) {
    setCatalogError(
      error.message || "Unable to load products"
    );

    throw error;
  } finally {
    setCatalogLoading(false);
  }
};

const refreshCart = async () => {
  const response = await getStudentCart();

  // Preserve the complete backend response,
  // including items and summary.
  const data = response?.data ?? response;

  const items = Array.isArray(data?.items)
    ? data.items
    : Array.isArray(data?.cart)
      ? data.cart
      : [];

  const mappedItems = items.map((item) => ({
    ...item,

    cartKey: String(item.cartKey ?? item.id),

    image: resolveImageUrl(
      item.imageUrl || item.image
    ),

    sizes: Array.isArray(item.sizes)
      ? item.sizes
      : [],

    size: item.size || "",

    price: Number(item.price || 0),

    quantity: Number(item.quantity || 1),

    isKitItem:
      item.isKitItem === true ||
      item.isKitItem === 1,

    quantityLocked:
      item.isKitItem === true ||
      item.isKitItem === 1,
  }));

  setCart(mappedItems);

  setCartSummary(data?.summary ?? {});

  return data;
};

  const refreshOrders = async () => {
  const response = await getStudentOrders();
  const data = response?.data ?? response;

  const result = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.orders)
        ? data.orders
        : [];

  setOrders(result);

  return result;
};

  const refreshAddresses = async () => {
    const response = await getStudentAddresses();
    const result = list(response?.data ?? response, "addresses");
    setAddresses(result);
    return result;
  };

  const refreshProfile = async () => {
  const response = await getStudentProfile();

  const data = response?.data ?? response;
  const result = data?.profile ?? data?.student ?? data;

  const normalized = normalizeStudent(result);

  setProfile(normalized);

  return normalized;
};

  const loadStudentData = async (s) => {
  if (!s?.admissionNo) {
    throw new Error("Admission number missing");
  }

  // Only existing catalog API is required for login
  return await loadCatalog(s.admissionNo);
};

 useEffect(() => {
  let active = true;

  const restoreSession = async () => {
    try {
      const studentData = await getStudentSession();

      if (!active) return;

      const s = normalizeStudent(studentData);

      if (!s?.admissionNo) {
        setStudent(null);
        return;
      }

      setStudent(s);
      setProfile(s);
      setLoginOpen(false);

      // Fetch complete student details from backend
refreshProfile().catch((error) => {
  console.error("Profile loading failed:", error);
});

refreshAddresses().catch((error) => {
  console.error("Addresses loading failed:", error);
});

      // Catalog failure must NOT log out the student.
      try {
        await loadCatalog(s.admissionNo);
      } catch (catalogError) {
        console.error(
          "Catalog loading failed:",
          catalogError
        );
      }
    } catch (authError) {
      // Only session validation failure clears login.
      if (active) {
        setStudent(null);
        setProfile(null);
      }
    } finally {
      if (active) {
        setAuthLoading(false);
      }
    }
  };

  restoreSession();

  return () => {
    active = false;
  };
}, []);

  const login = async (admissionNo) => {
  try {
    const studentData = await loginStudent(admissionNo);

    const s = normalizeStudent(studentData);

    if (!s?.admissionNo) {
      throw new Error("Invalid student response");
    }

    setStudent(s);
    setProfile(s);


    setCart([]);
    setAddresses([]);
    setOrders([]);

    setLoginOpen(false);

        // Fetch logged-in student's complete profile
refreshProfile().catch((error) => {
  console.error("Profile loading failed:", error);
});

refreshAddresses().catch((error) => {
  console.error("Addresses loading failed:", error);
});

    // Load matching Class/Gender catalog
    loadCatalog(s.admissionNo).catch((error) => {
      console.error("Catalog load failed:", error);
    });

    return {
      success: true,
      student: s,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Login failed",
    };
  }
};

const logout = async () => {
  try {
    await logoutStudent();
  } finally {
    setStudent(null);
    setProfile(null);
    setCatalog(emptyCatalog);
    setAddresses([]);
    setOrders([]);
    setCart([]);
    setCartSummary({
      subtotal: 0,
      gstIncluded: 0,
    });
    setLoginOpen(true);
  }
};

  const refreshCatalog = async () => student?.admissionNo ? loadCatalog(student.admissionNo) : null;
  const updateProfile = async (data) => {
    await saveStudentProfile(data);
    return refreshProfile();
  };
  const addAddress = async (data) => {
    const response = await createStudentAddress(data);
    await refreshAddresses();
    return unwrap(response, "address");
  };
  const updateAddress = async (id, data) => {
    const response = await editStudentAddress(id, data);
    await refreshAddresses();
    return response;
  };
  const deleteAddress = async (id) => {
    await removeStudentAddress(id);
    await refreshAddresses();
  };
  const setDefaultAddress = async (id) => {
    await makeDefaultAddress(id);
    await refreshAddresses();
  };
  const defaultAddress = useMemo(() => addresses.find((a) => a.isDefault) || addresses[0] || null, [addresses]);

  const currentKit = useMemo(() => {
    if (!student || catalog.mode !== "kit" || !catalog.kit) return null;
    return {
      ...catalog.kit,
      // image: catalog.kit.imageUrl || catalog.kit.image || "",
      image: resolveImageUrl(
        catalog.kit.imageUrl || catalog.kit.image
      ),
      className: student.className,
      gender: student.gender,
      products: (catalog.kit.items || []).map((item) => ({
        ...mapProduct(item),
        id: item.productId ?? item.id,
        kitQuantity: Number(item.quantity || 1),
      })),
    };
  }, [student, catalog]);
  const availableProducts = useMemo(() => {
    if (!student || catalog.mode !== "individual") return [];
    return catalog.products.map(mapProduct);
  }, [student, catalog]);

  // API accepts product/variant identifiers, not browser-calculated prices.
  const addToCart = async (
  product,
  size = null,
  isKitItem = false,
  quantity = 1
) => {
  const variants = Array.isArray(product.sizes)
    ? product.sizes
    : [];

  const variant = variants.find(
    (v) =>
      String(v.label) === String(size) ||
      String(v.id) === String(size)
  );

  if (variants.length > 0 && !variant?.id) {
    throw new Error("Please select an available size.");
  }

  const finalQuantity = isKitItem
    ? Number(product.kitQuantity || quantity || 1)
    : Number(quantity || 1);

  if (!Number.isInteger(finalQuantity) || finalQuantity < 1) {
    throw new Error("Invalid product quantity.");
  }

  const response = await addStudentCartItem({
    productId: product.id,
    variantId: variant?.id ?? null,
    kitId: isKitItem ? catalog.kit?.id : null,
    isKitItem: Boolean(isKitItem),
    quantity: finalQuantity,
  });

  await refreshCart();

  return response;
};


  const removeFromCart = async (cartKey) => {
    await removeStudentCartItem(cartKey);
    await refreshCart();
  };
  const updateQuantity = async (cartKey, quantity) => {
    const item = cart.find((entry) => String(entry.cartKey ?? entry.id) === String(cartKey));
    if (item?.isKitItem || item?.quantityLocked) return;
    await editStudentCartItem(cartKey, { quantity: Math.max(1, Number(quantity)) });
    await refreshCart();
  };
  const updateCartSize = async (cartKey, newSize) => {
  const item = cart.find(
    (entry) =>
      String(entry.cartKey ?? entry.id) ===
      String(cartKey)
  );

  if (!item) {
    throw new Error("Cart item not found");
  }

  const variant = item.sizes?.find(
    (v) =>
      String(v.label) === String(newSize) ||
      String(v.id) === String(newSize)
  );

  if (!variant?.id) {
    throw new Error(
      "Selected size variant not available"
    );
  }

  if (Number(variant.stockQty) < Number(item.quantity)) {
    throw new Error(
      "Selected size does not have enough stock"
    );
  }

  await editStudentCartItem(cartKey, {
    variantId: variant.id,
  });

  await refreshCart();
};

const cartSubtotal = Number(cartSummary.subtotal ?? 0);

// const shippingAmount =
//   cart.length > 0 ? 200 : 0;
  const shippingAmount =
  cart.length > 0 ? 0 : 0;

const gstAmount = Number(
  cartSummary.gstIncluded ??
  cartSummary.gstAmount ??
  0
);

const cartTotal = Number(
  cartSummary.total ??
  (cartSubtotal + shippingAmount)
);

  const cartCount = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  // Purchase status is informational only; kit visibility is controlled by catalog.mode.
  const kitPurchased = String(student?.kitStatus || "").toLowerCase() === "ordered";
  const completeKitPurchase = async () => {
    // Never mark a kit paid locally; backend verifies payment and updates status.
    const response = await getStudentSession();
    const s = normalizeStudent(unwrap(response?.data ?? response, "student"));
    if (s) setStudent(s);
    return s;
  };
  
  const createOrder = async () => {
  if (!student || cart.length === 0) {
    throw new Error("Student login and cart required");
  }

  const response = await submitStudentOrder({
    admissionNumber: student.admissionNo,

    type: catalog.mode === "kit" ? "kit" : "individual",

    items: cart.map((item) => ({
      productId: item.productId ?? item.id,
      variantId: item.variantId ?? item.selectedVariantId,
      quantity: Number(item.quantity),
    })),

    paymentMethod: "paytm",
  });

  await refreshCart();

  return unwrap(response?.data ?? response, "order");
};

  const value = {
    student, profile, authLoading, login, logout, loginOpen, setLoginOpen,
    catalog, catalogLoading, catalogError, loadCatalog, refreshCatalog,
    updateProfile, refreshProfile,
    addresses, defaultAddress, addAddress, updateAddress, deleteAddress, setDefaultAddress, refreshAddresses,
    orders, refreshOrders,
    cart, refreshCart, cartCount, cartSubtotal, shippingAmount, gstAmount, cartTotal,
    addToCart, removeFromCart, updateQuantity, updateCartSize,
    currentKit, availableProducts, kitPurchased, completeKitPurchase, createOrder,
  };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used inside StoreProvider");
  return context;
}





// import {
//   createContext,
//   useContext,
//   useEffect,
//   useMemo,
//   useState,
// } from "react";

// import {
//   loginStudent,
//   fetchStudentCatalog,
// } from "../api/storefront";


// const StoreContext = createContext(null);


// /* =========================================================
//    HELPERS
// ========================================================= */

// const readJSON = (key, fallback) => {
//   try {
//     const value = localStorage.getItem(key);

//     return value ? JSON.parse(value) : fallback;
//   } catch {
//     return fallback;
//   }
// };


// const createId = (prefix = "ID") => {
//   return `${prefix}-${Date.now()}-${Math.random()
//     .toString(36)
//     .slice(2, 8)}`;
// };


// const getSizePrice = (product, sizeLabel) => {
//   if (!product) return 0;

//   if (
//     product.hasSize &&
//     Array.isArray(product.sizes) &&
//     product.sizes.length
//   ) {
//     const selected = product.sizes.find(
//       (size) =>
//         String(size.label) === String(sizeLabel)
//     );

//     if (selected?.price !== undefined) {
//       return Number(selected.price);
//     }
//   }

//   return Number(product.price || 0);
// };



// export function StoreProvider({ children }) {

//   const [catalog, setCatalog] = useState({
//   mode: "individual",
//   kit: null,
//   products: [],
// });

// const [catalogLoading, setCatalogLoading] =
//   useState(false);

// const [catalogError, setCatalogError] =
//   useState("");

// const loadCatalog = async (admissionNo) => {
//   setCatalogLoading(true);
//   setCatalogError("");

//   try {
//     const data = await fetchStudentCatalog(admissionNo);

//     setCatalog({
//       mode: data.mode || "individual",
//       kit: data.kit || null,
//       products: data.products || [],
//     });

//     return data;
//   } catch (error) {
//     setCatalogError(error.message);
//     throw error;
//   } finally {
//     setCatalogLoading(false);
//   }
// };


//   const [student, setStudent] = useState(() =>
//     readJSON("student", null)
//   );

//   const [loginOpen, setLoginOpen] = useState(false);


//   /* =======================================================
//      PROFILE

//      Separate profile object is used so student can update
//      email/mobile/name/photo without changing hardcoded
//      admin source data.
//   ======================================================= */

//   const [profile, setProfile] = useState(() => {
//     const savedStudent = readJSON("student", null);

//     if (!savedStudent) return null;

//     const profiles = readJSON(
//       "studentProfiles",
//       {}
//     );

//     return (
//       profiles[savedStudent.admissionNo] || {
//         name: savedStudent.name || "",
//         email: savedStudent.email || "",
//         phone: savedStudent.phone || "",
//         photo: savedStudent.photo || "",
//         admissionNo:
//           savedStudent.admissionNo || "",
//         className:
//           savedStudent.className || "",
//         section:
//           savedStudent.section || "",
//         school:
//           savedStudent.school || "",
//       }
//     );
//   });


//   /* =======================================================
//      CART
//   ======================================================= */

//   const [cart, setCart] = useState(() =>
//     readJSON("cart", [])
//   );


//   /* =======================================================
//      FIRST KIT PURCHASE STATUS
//   ======================================================= */

//   const [kitPurchased, setKitPurchased] =
//     useState(() => {

//       const savedStudent = readJSON(
//         "student",
//         null
//       );

//       if (!savedStudent) return false;

//       const purchasedStudents = readJSON(
//         "purchasedStudents",
//         []
//       );

//       return purchasedStudents.includes(
//         savedStudent.admissionNo
//       );
//     });


//   /* =======================================================
//      ADDRESSES
//   ======================================================= */

//   const [addresses, setAddresses] =
//     useState(() => {

//       const savedStudent = readJSON(
//         "student",
//         null
//       );

//       if (!savedStudent) return [];

//       const allAddresses = readJSON(
//         "studentAddresses",
//         {}
//       );

//       return (
//         allAddresses[
//           savedStudent.admissionNo
//         ] || []
//       );
//     });


//   /* =======================================================
//      ORDERS
//   ======================================================= */

//   const [orders, setOrders] = useState(
//     () => {

//       const savedStudent = readJSON(
//         "student",
//         null
//       );

//       if (!savedStudent) return [];

//       const allOrders = readJSON(
//         "studentOrders",
//         {}
//       );

//       return (
//         allOrders[
//           savedStudent.admissionNo
//         ] || []
//       );
//     }
//   );


//   /* =======================================================
//      SAVE CART
//   ======================================================= */

//   useEffect(() => {
//     localStorage.setItem(
//       "cart",
//       JSON.stringify(cart)
//     );
//   }, [cart]);


//   /* =======================================================
//      SAVE PROFILE
//   ======================================================= */

//   useEffect(() => {

//     if (!student || !profile) return;

//     const profiles = readJSON(
//       "studentProfiles",
//       {}
//     );

//     profiles[student.admissionNo] =
//       profile;

//     localStorage.setItem(
//       "studentProfiles",
//       JSON.stringify(profiles)
//     );

//   }, [profile, student]);


//   /* =======================================================
//      SAVE ADDRESSES
//   ======================================================= */

//   useEffect(() => {

//     if (!student) return;

//     const allAddresses = readJSON(
//       "studentAddresses",
//       {}
//     );

//     allAddresses[
//       student.admissionNo
//     ] = addresses;

//     localStorage.setItem(
//       "studentAddresses",
//       JSON.stringify(allAddresses)
//     );

//   }, [addresses, student]);


//   /* =======================================================
//      SAVE ORDERS
//   ======================================================= */

//   useEffect(() => {

//     if (!student) return;

//     const allOrders = readJSON(
//       "studentOrders",
//       {}
//     );

//     allOrders[
//       student.admissionNo
//     ] = orders;

//     localStorage.setItem(
//       "studentOrders",
//       JSON.stringify(allOrders)
//     );

//   }, [orders, student]);


//   /* =======================================================
//      LOGIN
//   ======================================================= */

//   const login = async (admissionNo) => {
//   try {
//     const apiStudent = await loginStudent(admissionNo);

//     const matchedStudent = {
//       id: apiStudent.id,
//       admissionNo: apiStudent.admissionNumber,
//       name: apiStudent.studentName,
//       className: apiStudent.className,
//       gender: apiStudent.gender,
//       houseColor: apiStudent.houseColor,
//       kitStatus: apiStudent.kitStatus,
//       catalogMode: apiStudent.catalogMode,
//       phone: apiStudent.phone || "",
//       email: apiStudent.email || "",
//       section: apiStudent.section || "",
//       school: apiStudent.school || "",
//     };

//     // Catalog must be fetched successfully before login completes.
//     const catalogData = await loadCatalog(
//       matchedStudent.admissionNo
//     );

//     setStudent(matchedStudent);

//     localStorage.setItem(
//       "student",
//       JSON.stringify(matchedStudent)
//     );

//     setProfile({
//       name: matchedStudent.name,
//       email: matchedStudent.email,
//       phone: matchedStudent.phone,
//       admissionNo: matchedStudent.admissionNo,
//       className: matchedStudent.className,
//       section: matchedStudent.section,
//       school: matchedStudent.school,
//     });

//     const allAddresses =
//       readJSON("studentAddresses", {});

//     setAddresses(
//       allAddresses[matchedStudent.admissionNo] || []
//     );

//     const allOrders =
//       readJSON("studentOrders", {});

//     setOrders(
//       allOrders[matchedStudent.admissionNo] || []
//     );

//     setKitPurchased(
//       catalogData.mode === "individual"
//     );

//     setCart([]);
//     setLoginOpen(false);

//     return { success: true };
//   } catch (error) {
//     return {
//       success: false,
//       message: error.message || "Login failed",
//     };
//   }
// };


//   /* =======================================================
//      LOGOUT
//   ======================================================= */

//   const logout = () => {

//     setStudent(null);
//     setProfile(null);
//     setAddresses([]);
//     setOrders([]);
//     setCart([]);
//     setKitPurchased(false);

//     localStorage.removeItem("student");
//     localStorage.removeItem("cart");

//   };


//   /* =======================================================
//      UPDATE PROFILE
//   ======================================================= */

//   const updateProfile = (data) => {

//     setProfile((current) => ({
//       ...current,
//       ...data,

//       /* these remain tied to admission */
//       admissionNo:
//         current?.admissionNo ||
//         student?.admissionNo,

//       className:
//         current?.className ||
//         student?.className,

//       section:
//         current?.section ||
//         student?.section,

//       school:
//         current?.school ||
//         student?.school,
//     }));

//   };


//   /* =======================================================
//      ADDRESS METHODS
//   ======================================================= */

//   const addAddress = (address) => {

//     const newAddress = {
//       ...address,
//       id: createId("ADDR"),
//     };


//     setAddresses((current) => {

//       let updated = [...current];


//       /*
//        If first address,
//        automatically make it default.
//       */

//       if (updated.length === 0) {
//         newAddress.isDefault = true;
//       }


//       if (newAddress.isDefault) {

//         updated = updated.map(
//           (item) => ({
//             ...item,
//             isDefault: false,
//           })
//         );

//       }


//       return [
//         ...updated,
//         newAddress,
//       ];
//     });


//     return newAddress;
//   };


//   const updateAddress = (
//     addressId,
//     data
//   ) => {

//     setAddresses((current) => {

//       let updated = current.map(
//         (item) =>
//           item.id === addressId
//             ? {
//                 ...item,
//                 ...data,
//               }
//             : item
//       );


//       if (data.isDefault) {

//         updated = updated.map(
//           (item) => ({
//             ...item,
//             isDefault:
//               item.id === addressId,
//           })
//         );

//       }


//       return updated;
//     });

//   };


//   const deleteAddress = (
//     addressId
//   ) => {

//     setAddresses((current) => {

//       const deleting =
//         current.find(
//           (item) =>
//             item.id === addressId
//         );

//       let updated =
//         current.filter(
//           (item) =>
//             item.id !== addressId
//         );


//       /*
//        If default deleted,
//        first remaining becomes default.
//       */

//       if (
//         deleting?.isDefault &&
//         updated.length > 0
//       ) {
//         updated = updated.map(
//           (item, index) => ({
//             ...item,
//             isDefault:
//               index === 0,
//           })
//         );
//       }


//       return updated;
//     });

//   };


//   const setDefaultAddress = (
//     addressId
//   ) => {

//     setAddresses((current) =>
//       current.map((item) => ({
//         ...item,
//         isDefault:
//           item.id === addressId,
//       }))
//     );

//   };


//   const defaultAddress =
//     useMemo(() => {

//       return (
//         addresses.find(
//           (item) =>
//             item.isDefault
//         ) ||
//         addresses[0] ||
//         null
//       );

//     }, [addresses]);


//   /* =======================================================
//      CURRENT KIT
//   ======================================================= */

// const currentKit = useMemo(() => {
//   if (!student || catalog.mode !== "kit" || !catalog.kit) {
//     return null;
//   }

//   const kit = catalog.kit;

//   return {
//     ...kit,
//     image: kit.imageUrl || kit.image || "",
//     className: student.className,
//     gender: student.gender,
//     products: (kit.items || []).map((item) => ({
//       ...item,
//       id: item.productId,
//       image: item.imageUrl || "",
//       price: Number(item.price || 0),
//       hasSize: item.variants?.length > 0,
//       sizes: (item.variants || []).map((v) => ({
//         id: v.id,
//         label: v.option1Value || v.sku,
//         price: Number(v.priceOverride ?? item.price ?? 0),
//         stockQty: v.stockQty,
//       })),
//     })),
//   };
// }, [student, catalog]);



//   /* =======================================================
//      INDIVIDUAL PRODUCTS
//   ======================================================= */

// const availableProducts = useMemo(() => {
//   if (!student) return [];

//   const normalize = (value) =>
//     String(value ?? "").trim().toLowerCase();

//   return individualProducts.filter(
//     (product) =>
//       normalize(product.className) ===
//         normalize(student.className) &&
//       normalize(product.gender) ===
//         normalize(student.gender)
//   );
// }, [student]);

//   // const availableProducts =
//   //   useMemo(() => {

//   //     if (!student) return [];

//   //     return individualProducts.filter(
//   //       (product) =>
//   //         product.className ===
//   //         student.className
//   //     );

//   //   }, [student]);


//   /* =======================================================
//      ADD TO CART
//   ======================================================= */

//   const addToCart = (
//   product,
//   size = null,
//   isKitItem = false,
//   quantity = 1
// ) => {
//   setCart((currentCart) => {
//     /*
//       KIT PRODUCT
//       -----------
//       Kit composition is already fixed.

//       Example:
//       Shirt = 1
//       Pant = 1
//       Tie = 1
//       Socks = 1

//       Customer can change SIZE,
//       but cannot increase/decrease quantity.

//       NORMAL PRODUCT
//       --------------
//       Quantity works normally.
//     */

//     const fixedQuantity = isKitItem
//       ? Number(product.kitQuantity || quantity || 1)
//       : Number(quantity || 1);


//     /*
//       KIT:
//       Keep one cart entry per kit product.

//       NORMAL PRODUCT:
//       Size is part of cart key so different
//       sizes can behave as separate selections.
//     */

//     const cartKey = isKitItem
//       ? `kit-${product.id}`
//       : `${product.id}-${size || "no-size"}`;


//     const existingItem =
//       currentCart.find(
//         (item) =>
//           item.cartKey === cartKey
//       );


//     /* =========================================
//        KIT ITEM ALREADY EXISTS

//        DO NOT increase quantity.

//        Only:
//        - update size
//        - update selected-size price
//        - preserve fixed quantity
//     ========================================= */

//     if (
//       existingItem &&
//       isKitItem
//     ) {
//       return currentCart.map(
//         (item) =>
//           item.cartKey === cartKey
//             ? {
//                 ...item,

//                 ...product,

//                 cartKey,

//                 size,

//                 price: Number(
//                   product.price || 0
//                 ),

//                 quantity:
//                   Number(
//                     item.kitQuantity ||
//                     item.quantity ||
//                     fixedQuantity ||
//                     1
//                   ),

//                 isKitItem: true,

//                 quantityLocked: true,
//               }
//             : item
//       );
//     }


//     /* =========================================
//        NORMAL PRODUCT ALREADY EXISTS

//        Existing normal ecommerce behavior:
//        quantity increases.
//     ========================================= */

//     if (
//       existingItem &&
//       !isKitItem
//     ) {
//       return currentCart.map(
//         (item) =>
//           item.cartKey === cartKey
//             ? {
//                 ...item,

//                 quantity:
//                   Number(item.quantity || 1) +
//                   fixedQuantity,
//               }
//             : item
//       );
//     }


//     /* =========================================
//        NEW ITEM
//     ========================================= */

//     return [
//       ...currentCart,

//       {
//         ...product,

//         cartKey,

//         size,

//         price: Number(
//           product.price || 0
//         ),

//         quantity: fixedQuantity,

//         isKitItem,

//         /*
//           Important flag.

//           true  = quantity cannot change
//           false = normal quantity controls
//         */

//         quantityLocked:
//           isKitItem === true,

//         /*
//           Keep original kit quantity separately.

//           Useful later when backend/admin
//           defines kit composition.
//         */

//         kitQuantity:
//           isKitItem
//             ? fixedQuantity
//             : undefined,
//       },
//     ];
//   });
// };

//   /* =======================================================
//      REMOVE CART ITEM
//   ======================================================= */

//   const removeFromCart = (
//     cartKey
//   ) => {

//     setCart((current) =>
//       current.filter(
//         (item) =>
//           item.cartKey !== cartKey
//       )
//     );

//   };


//   /* =======================================================
//      UPDATE QUANTITY
//   ======================================================= */

// const updateQuantity = (
//   cartKey,
//   quantity
// ) => {
//   setCart((currentCart) =>
//     currentCart.map((item) => {
//       if (
//         item.cartKey !== cartKey
//       ) {
//         return item;
//       }


//       /* =========================================
//          KIT ITEM

//          Quantity cannot be modified.
//       ========================================= */

//       if (
//         item.isKitItem === true ||
//         item.quantityLocked === true
//       ) {
//         return {
//           ...item,

//           quantity: Number(
//             item.kitQuantity ||
//             item.quantity ||
//             1
//           ),
//         };
//       }


//       /* =========================================
//          NORMAL PRODUCT

//          Quantity can change normally.
//       ========================================= */

//       return {
//         ...item,

//         quantity: Math.max(
//           1,
//           Number(quantity || 1)
//         ),
//       };
//     })
//   );
// };


//   /* =======================================================
//      UPDATE CART SIZE
//   ======================================================= */

//  const updateCartSize = (
//   cartKey,
//   newSize
// ) => {
//   setCart((currentCart) =>
//     currentCart.map((item) => {
//       if (
//         item.cartKey !== cartKey
//       ) {
//         return item;
//       }


//       /* =========================================
//          FIND NEW SIZE PRICE

//          Your existing storeData uses:
//          sizes: [
//            { label: "24", price: 700 },
//            { label: "26", price: 720 }
//          ]
//       ========================================= */

//       let updatedPrice =
//         Number(item.price || 0);


//       if (
//         item.hasSize &&
//         Array.isArray(item.sizes)
//       ) {
//         const selectedSize =
//           item.sizes.find(
//             (size) =>
//               String(size.label) ===
//               String(newSize)
//           );


//         if (
//           selectedSize?.price !==
//           undefined
//         ) {
//           updatedPrice = Number(
//             selectedSize.price
//           );
//         }
//       }


//       return {
//         ...item,

//         size: newSize,

//         price: updatedPrice,

//         /*
//           KIT:
//           preserve fixed quantity.

//           NORMAL:
//           preserve selected quantity.
//         */

//         quantity:
//           item.isKitItem ||
//           item.quantityLocked
//             ? Number(
//                 item.kitQuantity ||
//                 item.quantity ||
//                 1
//               )
//             : Number(
//                 item.quantity || 1
//               ),
//       };
//     })
//   );
// };
//   /* =======================================================
//      CART CALCULATIONS
//   ======================================================= */

//   const cartSubtotal =
//     useMemo(() => {

//       return cart.reduce(
//         (total, item) =>
//           total +
//           Number(item.price || 0) *
//             Number(
//               item.quantity || 1
//             ),
//         0
//       );

//     }, [cart]);


//   /*
//     Shipping:
//     ₹1000 and above = FREE
//     Below ₹1000 = ₹5
//   */

//   // const shippingAmount =
//   //   cartSubtotal >= 1000
//   //     ? 0
//   //     : cartSubtotal > 0
//   //     ? 5
//   //     : 0;
//   const shippingAmount = cart.length > 0 ? 200 : 0;


//   /*
//     Product prices already include GST.
//   */

//   const gstAmount =
//     cartSubtotal -
//     cartSubtotal / 1.05;


//   const cartTotal =
//     cartSubtotal +
//     shippingAmount;


//   const cartCount =
//     cart.reduce(
//       (total, item) =>
//         total +
//         Number(
//           item.quantity || 0
//         ),
//       0
//     );


//   /* =======================================================
//      COMPLETE KIT
//   ======================================================= */

//   const completeKitPurchase = () => {

//     if (!student) return;

//     const purchasedStudents =
//       readJSON(
//         "purchasedStudents",
//         []
//       );


//     if (
//       !purchasedStudents.includes(
//         student.admissionNo
//       )
//     ) {

//       purchasedStudents.push(
//         student.admissionNo
//       );

//       localStorage.setItem(
//         "purchasedStudents",
//         JSON.stringify(
//           purchasedStudents
//         )
//       );

//     }


//     setKitPurchased(true);
//   };


//   /* =======================================================
//      CREATE ORDER
//   ======================================================= */

//   const createOrder = ({
//     shippingAddress,
//     paymentMethod = "COD",
//   }) => {

//     if (
//       !student ||
//       cart.length === 0
//     ) {
//       return null;
//     }


//     const newOrder = {

//       id: createId("ORD"),

//       orderNumber:
//         `BL${Date.now()
//           .toString()
//           .slice(-8)}`,

//       createdAt:
//         new Date().toISOString(),

//       status: "Processing",

//       paymentStatus:
//         paymentMethod === "COD"
//           ? "Pending"
//           : "Paid",

//       paymentMethod,

//       student: {
//         name:
//           profile?.name ||
//           student.name,

//         email:
//           profile?.email ||
//           student.email ||
//           "",

//         phone:
//           profile?.phone ||
//           student.phone ||
//           "",

//         admissionNo:
//           student.admissionNo,

//         className:
//           student.className,
//       },

//       shippingAddress,

//       items: cart.map(
//         (item) => ({
//           id: item.id,
//           name: item.name,
//           image: item.image,
//           size: item.size,
//           quantity:
//             item.quantity,
//           price:
//             item.price,
//           total:
//             Number(item.price) *
//             Number(
//               item.quantity
//             ),
//         })
//       ),

//       subtotal:
//         cartSubtotal,

//       shipping:
//         shippingAmount,

//       gstIncluded:
//         gstAmount,

//       total:
//         cartTotal,
//     };


//     setOrders((current) => [
//       newOrder,
//       ...current,
//     ]);


//     const containsKit =
//       cart.some(
//         (item) =>
//           item.isKitItem
//       );


//     if (
//       containsKit &&
//       !kitPurchased
//     ) {
//       completeKitPurchase();
//     }


//     setCart([]);


//     return newOrder;
//   };


//   /* =======================================================
//      VALUE
//   ======================================================= */

//   const value = {

//     student,
//     profile,

//     login,
//     logout,

//     catalog,
// catalogLoading,
// catalogError,
// loadCatalog,

//     loginOpen,
//     setLoginOpen,

//     updateProfile,

//     addresses,
//     defaultAddress,

//     addAddress,
//     updateAddress,
//     deleteAddress,
//     setDefaultAddress,

//     orders,

//     cart,
//     cartCount,

//     cartSubtotal,
//     shippingAmount,
//     gstAmount,
//     cartTotal,

//     addToCart,
//     removeFromCart,
//     updateQuantity,
//     updateCartSize,

//     currentKit,
//     availableProducts,

//     kitPurchased,
//     completeKitPurchase,

//     createOrder,
//   };


//   return (
//     <StoreContext.Provider
//       value={value}
//     >
//       {children}
//     </StoreContext.Provider>
//   );
// }


// /* =========================================================
//    HOOK
// ========================================================= */

// export function useStore() {

//   const context =
//     useContext(StoreContext);

//   if (!context) {
//     throw new Error(
//       "useStore must be used inside StoreProvider"
//     );
//   }

//   return context;
// }


















// import {
//   createContext,
//   useContext,
//   useEffect,
//   useMemo,
//   useState,
// } from "react";

// import {
//   students,
//   kits,
//   individualProducts,
// } from "../data/storeData";


// const StoreContext = createContext(null);


// /* =========================================================
//    HELPERS
// ========================================================= */

// const readJSON = (key, fallback) => {
//   try {
//     const value = localStorage.getItem(key);

//     return value ? JSON.parse(value) : fallback;
//   } catch {
//     return fallback;
//   }
// };


// const createId = (prefix = "ID") => {
//   return `${prefix}-${Date.now()}-${Math.random()
//     .toString(36)
//     .slice(2, 8)}`;
// };


// const getSizePrice = (product, sizeLabel) => {
//   if (!product) return 0;

//   if (
//     product.hasSize &&
//     Array.isArray(product.sizes) &&
//     product.sizes.length
//   ) {
//     const selected = product.sizes.find(
//       (size) =>
//         String(size.label) === String(sizeLabel)
//     );

//     if (selected?.price !== undefined) {
//       return Number(selected.price);
//     }
//   }

//   return Number(product.price || 0);
// };


// /* =========================================================
//    PROVIDER
// ========================================================= */

// export function StoreProvider({ children }) {

//   /* =======================================================
//      STUDENT LOGIN
//   ======================================================= */

//   const [student, setStudent] = useState(() =>
//     readJSON("student", null)
//   );

//   const [loginOpen, setLoginOpen] = useState(false);


//   /* =======================================================
//      PROFILE

//      Separate profile object is used so student can update
//      email/mobile/name/photo without changing hardcoded
//      admin source data.
//   ======================================================= */

//   const [profile, setProfile] = useState(() => {
//     const savedStudent = readJSON("student", null);

//     if (!savedStudent) return null;

//     const profiles = readJSON(
//       "studentProfiles",
//       {}
//     );

//     return (
//       profiles[savedStudent.admissionNo] || {
//         name: savedStudent.name || "",
//         email: savedStudent.email || "",
//         phone: savedStudent.phone || "",
//         photo: savedStudent.photo || "",
//         admissionNo:
//           savedStudent.admissionNo || "",
//         className:
//           savedStudent.className || "",
//         section:
//           savedStudent.section || "",
//         school:
//           savedStudent.school || "",
//       }
//     );
//   });


//   /* =======================================================
//      CART
//   ======================================================= */

//   const [cart, setCart] = useState(() =>
//     readJSON("cart", [])
//   );


//   /* =======================================================
//      FIRST KIT PURCHASE STATUS
//   ======================================================= */

//   const [kitPurchased, setKitPurchased] =
//     useState(() => {

//       const savedStudent = readJSON(
//         "student",
//         null
//       );

//       if (!savedStudent) return false;

//       const purchasedStudents = readJSON(
//         "purchasedStudents",
//         []
//       );

//       return purchasedStudents.includes(
//         savedStudent.admissionNo
//       );
//     });


//   /* =======================================================
//      ADDRESSES
//   ======================================================= */

//   const [addresses, setAddresses] =
//     useState(() => {

//       const savedStudent = readJSON(
//         "student",
//         null
//       );

//       if (!savedStudent) return [];

//       const allAddresses = readJSON(
//         "studentAddresses",
//         {}
//       );

//       return (
//         allAddresses[
//           savedStudent.admissionNo
//         ] || []
//       );
//     });


//   /* =======================================================
//      ORDERS
//   ======================================================= */

//   const [orders, setOrders] = useState(
//     () => {

//       const savedStudent = readJSON(
//         "student",
//         null
//       );

//       if (!savedStudent) return [];

//       const allOrders = readJSON(
//         "studentOrders",
//         {}
//       );

//       return (
//         allOrders[
//           savedStudent.admissionNo
//         ] || []
//       );
//     }
//   );


//   /* =======================================================
//      SAVE CART
//   ======================================================= */

//   useEffect(() => {
//     localStorage.setItem(
//       "cart",
//       JSON.stringify(cart)
//     );
//   }, [cart]);


//   /* =======================================================
//      SAVE PROFILE
//   ======================================================= */

//   useEffect(() => {

//     if (!student || !profile) return;

//     const profiles = readJSON(
//       "studentProfiles",
//       {}
//     );

//     profiles[student.admissionNo] =
//       profile;

//     localStorage.setItem(
//       "studentProfiles",
//       JSON.stringify(profiles)
//     );

//   }, [profile, student]);


//   /* =======================================================
//      SAVE ADDRESSES
//   ======================================================= */

//   useEffect(() => {

//     if (!student) return;

//     const allAddresses = readJSON(
//       "studentAddresses",
//       {}
//     );

//     allAddresses[
//       student.admissionNo
//     ] = addresses;

//     localStorage.setItem(
//       "studentAddresses",
//       JSON.stringify(allAddresses)
//     );

//   }, [addresses, student]);


//   /* =======================================================
//      SAVE ORDERS
//   ======================================================= */

//   useEffect(() => {

//     if (!student) return;

//     const allOrders = readJSON(
//       "studentOrders",
//       {}
//     );

//     allOrders[
//       student.admissionNo
//     ] = orders;

//     localStorage.setItem(
//       "studentOrders",
//       JSON.stringify(allOrders)
//     );

//   }, [orders, student]);


//   /* =======================================================
//      LOGIN
//   ======================================================= */

//   const login = (admissionNo) => {

//     const value =
//       admissionNo.trim().toLowerCase();

//     const matchedStudent =
//       students.find(
//         (item) =>
//           item.admissionNo
//             .toLowerCase() === value
//       );

//     if (!matchedStudent) {
//       return {
//         success: false,
//         message:
//           "Admission number not found.",
//       };
//     }


//     setStudent(matchedStudent);

//     localStorage.setItem(
//       "student",
//       JSON.stringify(matchedStudent)
//     );


//     /* PROFILE */

//     const profiles = readJSON(
//       "studentProfiles",
//       {}
//     );

//     const studentProfile =
//       profiles[
//         matchedStudent.admissionNo
//       ] || {
//         name:
//           matchedStudent.name || "",
//         email:
//           matchedStudent.email || "",
//         phone:
//           matchedStudent.phone || "",
//         photo:
//           matchedStudent.photo || "",
//         admissionNo:
//           matchedStudent.admissionNo,
//         className:
//           matchedStudent.className,
//         section:
//           matchedStudent.section || "",
//         school:
//           matchedStudent.school || "",
//       };

//     setProfile(studentProfile);


//     /* ADDRESSES */

//     const allAddresses = readJSON(
//       "studentAddresses",
//       {}
//     );

//     setAddresses(
//       allAddresses[
//         matchedStudent.admissionNo
//       ] || []
//     );


//     /* ORDERS */

//     const allOrders = readJSON(
//       "studentOrders",
//       {}
//     );

//     setOrders(
//       allOrders[
//         matchedStudent.admissionNo
//       ] || []
//     );


//     /* KIT */

//     const purchasedStudents =
//       readJSON(
//         "purchasedStudents",
//         []
//       );

//     setKitPurchased(
//       purchasedStudents.includes(
//         matchedStudent.admissionNo
//       )
//     );


//     setCart([]);

//     setLoginOpen(false);


//     return {
//       success: true,
//     };
//   };


//   /* =======================================================
//      LOGOUT
//   ======================================================= */

//   const logout = () => {

//     setStudent(null);
//     setProfile(null);
//     setAddresses([]);
//     setOrders([]);
//     setCart([]);
//     setKitPurchased(false);

//     localStorage.removeItem("student");
//     localStorage.removeItem("cart");

//   };


//   /* =======================================================
//      UPDATE PROFILE
//   ======================================================= */

//   const updateProfile = (data) => {

//     setProfile((current) => ({
//       ...current,
//       ...data,

//       /* these remain tied to admission */
//       admissionNo:
//         current?.admissionNo ||
//         student?.admissionNo,

//       className:
//         current?.className ||
//         student?.className,

//       section:
//         current?.section ||
//         student?.section,

//       school:
//         current?.school ||
//         student?.school,
//     }));

//   };


//   /* =======================================================
//      ADDRESS METHODS
//   ======================================================= */

//   const addAddress = (address) => {

//     const newAddress = {
//       ...address,
//       id: createId("ADDR"),
//     };


//     setAddresses((current) => {

//       let updated = [...current];


//       /*
//        If first address,
//        automatically make it default.
//       */

//       if (updated.length === 0) {
//         newAddress.isDefault = true;
//       }


//       if (newAddress.isDefault) {

//         updated = updated.map(
//           (item) => ({
//             ...item,
//             isDefault: false,
//           })
//         );

//       }


//       return [
//         ...updated,
//         newAddress,
//       ];
//     });


//     return newAddress;
//   };


//   const updateAddress = (
//     addressId,
//     data
//   ) => {

//     setAddresses((current) => {

//       let updated = current.map(
//         (item) =>
//           item.id === addressId
//             ? {
//                 ...item,
//                 ...data,
//               }
//             : item
//       );


//       if (data.isDefault) {

//         updated = updated.map(
//           (item) => ({
//             ...item,
//             isDefault:
//               item.id === addressId,
//           })
//         );

//       }


//       return updated;
//     });

//   };


//   const deleteAddress = (
//     addressId
//   ) => {

//     setAddresses((current) => {

//       const deleting =
//         current.find(
//           (item) =>
//             item.id === addressId
//         );

//       let updated =
//         current.filter(
//           (item) =>
//             item.id !== addressId
//         );


//       /*
//        If default deleted,
//        first remaining becomes default.
//       */

//       if (
//         deleting?.isDefault &&
//         updated.length > 0
//       ) {
//         updated = updated.map(
//           (item, index) => ({
//             ...item,
//             isDefault:
//               index === 0,
//           })
//         );
//       }


//       return updated;
//     });

//   };


//   const setDefaultAddress = (
//     addressId
//   ) => {

//     setAddresses((current) =>
//       current.map((item) => ({
//         ...item,
//         isDefault:
//           item.id === addressId,
//       }))
//     );

//   };


//   const defaultAddress =
//     useMemo(() => {

//       return (
//         addresses.find(
//           (item) =>
//             item.isDefault
//         ) ||
//         addresses[0] ||
//         null
//       );

//     }, [addresses]);


//   /* =======================================================
//      CURRENT KIT
//   ======================================================= */

// const currentKit = useMemo(() => {
//   if (!student) return null;

//   const normalize = (value) =>
//     String(value ?? "").trim().toLowerCase();

//   return (
//     kits.find(
//       (kit) =>
//         normalize(kit.className) ===
//           normalize(student.className) &&
//         normalize(kit.gender) ===
//           normalize(student.gender)
//     ) || null
//   );
// }, [student]);

//   // const currentKit =
//   //   useMemo(() => {

//   //     if (!student) return null;

//   //     return (
//   //       kits.find(
//   //         (kit) =>
//   //           kit.className ===
//   //           student.className
//   //       ) || null
//   //     );

//   //   }, [student]);


//   /* =======================================================
//      INDIVIDUAL PRODUCTS
//   ======================================================= */

// const availableProducts = useMemo(() => {
//   if (!student) return [];

//   const normalize = (value) =>
//     String(value ?? "").trim().toLowerCase();

//   return individualProducts.filter(
//     (product) =>
//       normalize(product.className) ===
//         normalize(student.className) &&
//       normalize(product.gender) ===
//         normalize(student.gender)
//   );
// }, [student]);

//   // const availableProducts =
//   //   useMemo(() => {

//   //     if (!student) return [];

//   //     return individualProducts.filter(
//   //       (product) =>
//   //         product.className ===
//   //         student.className
//   //     );

//   //   }, [student]);


//   /* =======================================================
//      ADD TO CART
//   ======================================================= */

//   const addToCart = (
//   product,
//   size = null,
//   isKitItem = false,
//   quantity = 1
// ) => {
//   setCart((currentCart) => {
//     /*
//       KIT PRODUCT
//       -----------
//       Kit composition is already fixed.

//       Example:
//       Shirt = 1
//       Pant = 1
//       Tie = 1
//       Socks = 1

//       Customer can change SIZE,
//       but cannot increase/decrease quantity.

//       NORMAL PRODUCT
//       --------------
//       Quantity works normally.
//     */

//     const fixedQuantity = isKitItem
//       ? Number(product.kitQuantity || quantity || 1)
//       : Number(quantity || 1);


//     /*
//       KIT:
//       Keep one cart entry per kit product.

//       NORMAL PRODUCT:
//       Size is part of cart key so different
//       sizes can behave as separate selections.
//     */

//     const cartKey = isKitItem
//       ? `kit-${product.id}`
//       : `${product.id}-${size || "no-size"}`;


//     const existingItem =
//       currentCart.find(
//         (item) =>
//           item.cartKey === cartKey
//       );


//     /* =========================================
//        KIT ITEM ALREADY EXISTS

//        DO NOT increase quantity.

//        Only:
//        - update size
//        - update selected-size price
//        - preserve fixed quantity
//     ========================================= */

//     if (
//       existingItem &&
//       isKitItem
//     ) {
//       return currentCart.map(
//         (item) =>
//           item.cartKey === cartKey
//             ? {
//                 ...item,

//                 ...product,

//                 cartKey,

//                 size,

//                 price: Number(
//                   product.price || 0
//                 ),

//                 quantity:
//                   Number(
//                     item.kitQuantity ||
//                     item.quantity ||
//                     fixedQuantity ||
//                     1
//                   ),

//                 isKitItem: true,

//                 quantityLocked: true,
//               }
//             : item
//       );
//     }


//     /* =========================================
//        NORMAL PRODUCT ALREADY EXISTS

//        Existing normal ecommerce behavior:
//        quantity increases.
//     ========================================= */

//     if (
//       existingItem &&
//       !isKitItem
//     ) {
//       return currentCart.map(
//         (item) =>
//           item.cartKey === cartKey
//             ? {
//                 ...item,

//                 quantity:
//                   Number(item.quantity || 1) +
//                   fixedQuantity,
//               }
//             : item
//       );
//     }


//     /* =========================================
//        NEW ITEM
//     ========================================= */

//     return [
//       ...currentCart,

//       {
//         ...product,

//         cartKey,

//         size,

//         price: Number(
//           product.price || 0
//         ),

//         quantity: fixedQuantity,

//         isKitItem,

//         /*
//           Important flag.

//           true  = quantity cannot change
//           false = normal quantity controls
//         */

//         quantityLocked:
//           isKitItem === true,

//         /*
//           Keep original kit quantity separately.

//           Useful later when backend/admin
//           defines kit composition.
//         */

//         kitQuantity:
//           isKitItem
//             ? fixedQuantity
//             : undefined,
//       },
//     ];
//   });
// };

//   /* =======================================================
//      REMOVE CART ITEM
//   ======================================================= */

//   const removeFromCart = (
//     cartKey
//   ) => {

//     setCart((current) =>
//       current.filter(
//         (item) =>
//           item.cartKey !== cartKey
//       )
//     );

//   };


//   /* =======================================================
//      UPDATE QUANTITY
//   ======================================================= */

// const updateQuantity = (
//   cartKey,
//   quantity
// ) => {
//   setCart((currentCart) =>
//     currentCart.map((item) => {
//       if (
//         item.cartKey !== cartKey
//       ) {
//         return item;
//       }


//       /* =========================================
//          KIT ITEM

//          Quantity cannot be modified.
//       ========================================= */

//       if (
//         item.isKitItem === true ||
//         item.quantityLocked === true
//       ) {
//         return {
//           ...item,

//           quantity: Number(
//             item.kitQuantity ||
//             item.quantity ||
//             1
//           ),
//         };
//       }


//       /* =========================================
//          NORMAL PRODUCT

//          Quantity can change normally.
//       ========================================= */

//       return {
//         ...item,

//         quantity: Math.max(
//           1,
//           Number(quantity || 1)
//         ),
//       };
//     })
//   );
// };


//   /* =======================================================
//      UPDATE CART SIZE
//   ======================================================= */

//  const updateCartSize = (
//   cartKey,
//   newSize
// ) => {
//   setCart((currentCart) =>
//     currentCart.map((item) => {
//       if (
//         item.cartKey !== cartKey
//       ) {
//         return item;
//       }


//       /* =========================================
//          FIND NEW SIZE PRICE

//          Your existing storeData uses:
//          sizes: [
//            { label: "24", price: 700 },
//            { label: "26", price: 720 }
//          ]
//       ========================================= */

//       let updatedPrice =
//         Number(item.price || 0);


//       if (
//         item.hasSize &&
//         Array.isArray(item.sizes)
//       ) {
//         const selectedSize =
//           item.sizes.find(
//             (size) =>
//               String(size.label) ===
//               String(newSize)
//           );


//         if (
//           selectedSize?.price !==
//           undefined
//         ) {
//           updatedPrice = Number(
//             selectedSize.price
//           );
//         }
//       }


//       return {
//         ...item,

//         size: newSize,

//         price: updatedPrice,

//         /*
//           KIT:
//           preserve fixed quantity.

//           NORMAL:
//           preserve selected quantity.
//         */

//         quantity:
//           item.isKitItem ||
//           item.quantityLocked
//             ? Number(
//                 item.kitQuantity ||
//                 item.quantity ||
//                 1
//               )
//             : Number(
//                 item.quantity || 1
//               ),
//       };
//     })
//   );
// };
//   /* =======================================================
//      CART CALCULATIONS
//   ======================================================= */

//   const cartSubtotal =
//     useMemo(() => {

//       return cart.reduce(
//         (total, item) =>
//           total +
//           Number(item.price || 0) *
//             Number(
//               item.quantity || 1
//             ),
//         0
//       );

//     }, [cart]);


//   /*
//     Shipping:
//     ₹1000 and above = FREE
//     Below ₹1000 = ₹5
//   */

//   // const shippingAmount =
//   //   cartSubtotal >= 1000
//   //     ? 0
//   //     : cartSubtotal > 0
//   //     ? 5
//   //     : 0;
//   const shippingAmount = cart.length > 0 ? 200 : 0;


//   /*
//     Product prices already include GST.
//   */

//   const gstAmount =
//     cartSubtotal -
//     cartSubtotal / 1.05;


//   const cartTotal =
//     cartSubtotal +
//     shippingAmount;


//   const cartCount =
//     cart.reduce(
//       (total, item) =>
//         total +
//         Number(
//           item.quantity || 0
//         ),
//       0
//     );


//   /* =======================================================
//      COMPLETE KIT
//   ======================================================= */

//   const completeKitPurchase = () => {

//     if (!student) return;

//     const purchasedStudents =
//       readJSON(
//         "purchasedStudents",
//         []
//       );


//     if (
//       !purchasedStudents.includes(
//         student.admissionNo
//       )
//     ) {

//       purchasedStudents.push(
//         student.admissionNo
//       );

//       localStorage.setItem(
//         "purchasedStudents",
//         JSON.stringify(
//           purchasedStudents
//         )
//       );

//     }


//     setKitPurchased(true);
//   };


//   /* =======================================================
//      CREATE ORDER
//   ======================================================= */

//   const createOrder = ({
//     shippingAddress,
//     paymentMethod = "COD",
//   }) => {

//     if (
//       !student ||
//       cart.length === 0
//     ) {
//       return null;
//     }


//     const newOrder = {

//       id: createId("ORD"),

//       orderNumber:
//         `BL${Date.now()
//           .toString()
//           .slice(-8)}`,

//       createdAt:
//         new Date().toISOString(),

//       status: "Processing",

//       paymentStatus:
//         paymentMethod === "COD"
//           ? "Pending"
//           : "Paid",

//       paymentMethod,

//       student: {
//         name:
//           profile?.name ||
//           student.name,

//         email:
//           profile?.email ||
//           student.email ||
//           "",

//         phone:
//           profile?.phone ||
//           student.phone ||
//           "",

//         admissionNo:
//           student.admissionNo,

//         className:
//           student.className,
//       },

//       shippingAddress,

//       items: cart.map(
//         (item) => ({
//           id: item.id,
//           name: item.name,
//           image: item.image,
//           size: item.size,
//           quantity:
//             item.quantity,
//           price:
//             item.price,
//           total:
//             Number(item.price) *
//             Number(
//               item.quantity
//             ),
//         })
//       ),

//       subtotal:
//         cartSubtotal,

//       shipping:
//         shippingAmount,

//       gstIncluded:
//         gstAmount,

//       total:
//         cartTotal,
//     };


//     setOrders((current) => [
//       newOrder,
//       ...current,
//     ]);


//     const containsKit =
//       cart.some(
//         (item) =>
//           item.isKitItem
//       );


//     if (
//       containsKit &&
//       !kitPurchased
//     ) {
//       completeKitPurchase();
//     }


//     setCart([]);


//     return newOrder;
//   };


//   /* =======================================================
//      VALUE
//   ======================================================= */

//   const value = {

//     student,
//     profile,

//     login,
//     logout,

//     loginOpen,
//     setLoginOpen,

//     updateProfile,

//     addresses,
//     defaultAddress,

//     addAddress,
//     updateAddress,
//     deleteAddress,
//     setDefaultAddress,

//     orders,

//     cart,
//     cartCount,

//     cartSubtotal,
//     shippingAmount,
//     gstAmount,
//     cartTotal,

//     addToCart,
//     removeFromCart,
//     updateQuantity,
//     updateCartSize,

//     currentKit,
//     availableProducts,

//     kitPurchased,
//     completeKitPurchase,

//     createOrder,
//   };


//   return (
//     <StoreContext.Provider
//       value={value}
//     >
//       {children}
//     </StoreContext.Provider>
//   );
// }


// /* =========================================================
//    HOOK
// ========================================================= */

// export function useStore() {

//   const context =
//     useContext(StoreContext);

//   if (!context) {
//     throw new Error(
//       "useStore must be used inside StoreProvider"
//     );
//   }

//   return context;
// }