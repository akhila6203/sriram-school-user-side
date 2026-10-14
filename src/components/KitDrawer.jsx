

import {
  Check,
  ChevronDown,
  ShoppingBag,
  X,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import { useStore } from "../context/StoreContext";


export default function KitDrawer({
  open,
  onClose,
}) {
  const navigate = useNavigate();

  const {
  cart,
  currentKit,
  student,
  addToCart,
  kitPurchased,
} = useStore();


  /* =====================================================
     SELECTED SIZES
  ====================================================== */

  const [
    selectedSizes,
    setSelectedSizes,
  ] = useState({});


  /* =====================================================
     MESSAGE
  ====================================================== */

  const [
    message,
    setMessage,
  ] = useState("");


  /* =====================================================
     ADDING
  ====================================================== */

  const [
    adding,
    setAdding,
  ] = useState(false);


  /* =====================================================
     KIT ALREADY IN CART
  ====================================================== */

  const kitAlreadyInCart =
    useMemo(() => {

      return cart.some(
        (item) =>
          item.isKitItem === true
      );

    }, [cart]);


  /* =====================================================
     DEFAULT SIZE
  ====================================================== */

  useEffect(() => {

    if (!open) {
      return;
    }

    setMessage("");


    const defaults = {};


    currentKit?.products?.forEach(
      (product) => {

        if (
          product.hasSize &&
          Array.isArray(
            product.sizes
          ) &&
          product.sizes.length > 0
        ) {

          const firstSize =
            product.sizes[0];


          defaults[product.id] =
            typeof firstSize ===
            "object"
              ? firstSize.label
              : firstSize;

        }

      }
    );


    setSelectedSizes(defaults);

  }, [
    open,
    currentKit,
  ]);


  /* =====================================================
     ESCAPE CLOSE
  ====================================================== */

  useEffect(() => {

    if (!open) {
      return;
    }


    const handleEscape = (
      event
    ) => {

      if (
        event.key === "Escape"
      ) {
        onClose?.();
      }

    };


    window.addEventListener(
      "keydown",
      handleEscape
    );


    return () => {

      window.removeEventListener(
        "keydown",
        handleEscape
      );

    };

  }, [
    open,
    onClose,
  ]);


  /* =====================================================
     BODY SCROLL LOCK
  ====================================================== */

  useEffect(() => {

    if (!open) {
      return;
    }


    const previousOverflow =
      document.body.style.overflow;


    document.body.style.overflow =
      "hidden";


    return () => {

      document.body.style.overflow =
        previousOverflow;

    };

  }, [open]);


  /* =====================================================
     SIZE LABEL
  ====================================================== */

  const getSizeLabel = (
    size
  ) => {

    if (
      typeof size === "object"
    ) {
      return size.label;
    }

    return size;

  };


  /* =====================================================
     PRODUCT PRICE
  ====================================================== */

  const getProductPrice = (
    product
  ) => {

    if (!product) {
      return 0;
    }


    if (
      !product.hasSize ||
      !Array.isArray(
        product.sizes
      ) ||
      product.sizes.length === 0
    ) {

      return Number(
        product.price || 0
      );

    }


    const selectedSize =
      selectedSizes[
        product.id
      ];


    const sizeData =
      product.sizes.find(
        (size) =>
          String(
            getSizeLabel(size)
          ) ===
          String(selectedSize)
      );


    if (
      typeof sizeData ===
        "object" &&
      sizeData?.price !==
        undefined
    ) {

      return Number(
        sizeData.price
      );

    }


    return Number(
      product.price || 0
    );

  };


  /* =====================================================
     COMPLETE KIT TOTAL

     Selected size price is used.
  ====================================================== */

  const completeKitTotal =
    useMemo(() => {

      if (!currentKit) {
        return 0;
      }


      return (
        currentKit.products || []
      ).reduce(
        (
          total,
          product
        ) => {

          const quantity =
            Number(
              product.kitQuantity ||
                1
            );


          return (
            total +
            getProductPrice(
              product
            ) *
              quantity
          );

        },
        0
      );

    }, [
      currentKit,
      selectedSizes,
    ]);


  /* =====================================================
     CHANGE SIZE
  ====================================================== */

  const handleSizeChange = (
    productId,
    size
  ) => {

    setSelectedSizes(
      (current) => ({
        ...current,

        [productId]:
          size,
      })
    );


    setMessage("");

  };


  /* =====================================================
     OPEN CART
  ====================================================== */

  const openExistingCart = () => {

    onClose?.();

    navigate("/cart");

  };


  /* =====================================================
     ADD KIT
  ====================================================== */

  // const handleAddKitToCart =
  //   () => {
    const handleAddKitToCart = async () => {

      if (
        !currentKit ||
        adding
      ) {
        return;
      }


      /* =========================================
         ALREADY PURCHASED
      ========================================== */

      // if (kitPurchased) {

      //   setMessage(
      //     "Your mandatory kit has already been purchased."
      //   );

      //   return;

      // }


      /* =========================================
         ALREADY ADDED TO CART
      ========================================== */

      if (kitAlreadyInCart) {

        setMessage(
          "Kit already added to cart."
        );


        setTimeout(() => {

          openExistingCart();

        }, 700);


        return;

      }


      /* =========================================
         VALIDATE SIZE
      ========================================== */

      const missingSizeProduct =
        currentKit.products?.find(
          (product) =>
            product.hasSize &&
            Array.isArray(
              product.sizes
            ) &&
            product.sizes.length >
              0 &&
            !selectedSizes[
              product.id
            ]
        );


      if (missingSizeProduct) {

        setMessage(
          `Please select a size for ${missingSizeProduct.name}.`
        );

        return;

      }


      setAdding(true);

      setMessage("");


      try {

        for (const product of currentKit.products) {

  const selectedSize = product.hasSize
    ? selectedSizes[product.id]
    : null;

  const selectedPrice = getProductPrice(product);

  const fixedQuantity = Number(
    product.kitQuantity || 1
  );

  const cartProduct = {
    ...product,
    price: selectedPrice,
    kitQuantity: fixedQuantity,
  };

  await addToCart(
    cartProduct,
    selectedSize,
    true,
    fixedQuantity
  );
}


        setMessage(
          "Kit added to cart."
        );


        setTimeout(() => {

          onClose?.();

          navigate("/cart");

        }, 350);

        } catch (error) {
  console.error("Kit add to cart error:", error);

  setMessage(
    error?.message ||
    "Unable to add kit to cart. Please try again."
  );
} finally {
  setAdding(false);
}
      // } finally {

      //   setAdding(false);

      // }

    };


  /* =====================================================
     CLOSED
  ====================================================== */

  if (!open) {
    return null;
  }


  /* =====================================================
     NO KIT
  ====================================================== */

  if (!currentKit) {

    return (
      <>

        <button
          type="button"
          aria-label="Close kit"
          onClick={onClose}
          className="
            fixed
            inset-0
            z-[90]

            bg-slate-950/35

            backdrop-blur-[2px]
          "
        />


        <aside
          className="
            fixed
            bottom-0
            right-0
            top-0
            z-[100]

            flex
            w-full
            max-w-[520px]
            flex-col

            bg-white

            shadow-[-18px_0_50px_rgba(15,23,42,0.18)]
          "
        >

          <div
            className="
              flex
              items-center
              justify-between

              border-b
              border-slate-100

              px-4
              py-3

              sm:px-5
            "
          >

            <h2
              className="
                text-lg
                font-extrabold
                text-slate-950
              "
            >
              Select Kit
            </h2>


            <button
              type="button"
              onClick={onClose}
              className="
                flex
                h-9
                w-9
                items-center
                justify-center

                rounded-full

                bg-slate-100

                text-slate-600
              "
            >
              <X size={19} />
            </button>

          </div>


          <div
            className="
              flex
              flex-1
              items-center
              justify-center

              p-6

              text-center
            "
          >

            <div>

              <ShoppingBag
                size={36}
                className="
                  mx-auto
                  text-slate-300
                "
              />


              <p
                className="
                  mt-3

                  text-sm
                  font-semibold
                  text-slate-500
                "
              >
                No kit is available
                for your class.
              </p>

            </div>

          </div>

        </aside>

      </>
    );

  }


  /* =====================================================
     PRODUCTS
  ====================================================== */

  const products =
    currentKit.products || [];


  return (
    <>

      {/* =================================================
          OVERLAY
      ================================================== */}

      <button
        type="button"
        aria-label="Close kit drawer"
        onClick={onClose}
        className="
          fixed
          inset-0
          z-[90]

          bg-slate-950/35

          backdrop-blur-[2px]
        "
      />


      {/* =================================================
          DRAWER
      ================================================== */}

      <aside
        className="
          fixed
          bottom-0
          right-0
          top-0
          z-[100]

          flex
          w-full
          max-w-[540px]
          flex-col

          bg-white

          shadow-[-18px_0_55px_rgba(15,23,42,0.20)]

          animate-[slideIn_.25s_ease-out]
        "
      >

        {/* =================================================
            HEADER
        ================================================== */}

        <div
          className="
            flex
            shrink-0
            items-center
            justify-between
            gap-4
bg-[#EEF2FF]
            border-b
            border-slate-100

            px-4
            py-3

            sm:px-5
            sm:py-4
          "
        >

          <div className="min-w-0">

            <p
              className="
                text-[10px]
                font-bold
                uppercase
                tracking-[0.16em]
                text-indigo-600
              "
            >
              Mandatory School Kit
            </p>


            <h2
              className="
                mt-1
                truncate

                text-lg
                font-extrabold
                text-slate-950

                sm:text-xl
              "
            >
             Class {student?.className ||
              currentKit?.className ||
              "Your Class"}  Complete School Kit
              {/* {currentKit.name ||
                "Select Your Kit"}  Complete School Kit */}


            </h2>

          </div>


          <button
            type="button"
            onClick={onClose}
            aria-label="Close kit drawer"
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center

              rounded-full

              bg-slate-100

              text-slate-600

              transition

              hover:bg-slate-200
              hover:text-slate-950
            "
          >
            <X size={19} />
          </button>

        </div>


        {/* =================================================
            KIT ALREADY PURCHASED
        ================================================== */}

        {kitPurchased ? (

          <div
            className="
              flex
              flex-1
              items-center
              justify-center

              overflow-y-auto

              p-5
            "
          >

            <div
              className="
                w-full
                max-w-[380px]

                text-center
              "
            >

              <div
                className="
                  mx-auto

                  flex
                  h-16
                  w-16
                  items-center
                  justify-center

                  rounded-full

                  bg-emerald-50
                  text-emerald-600
                "
              >
                <Check size={28} />
              </div>


              <h3
                className="
                  mt-5

                  text-xl
                  font-extrabold
                  text-slate-950
                "
              >
                Kit already purchased
              </h3>


              <p
                className="
                  mt-2

                  text-sm
                  leading-6
                  text-slate-500
                "
              >
                Your mandatory school
                kit has already been
                purchased. You can now
                shop individual products.
              </p>


              <button
                type="button"
                onClick={onClose}
                className="
                  mt-6
                  h-11

                  rounded-xl

                  bg-indigo-600

                  px-6

                  text-sm
                  font-bold
                  text-white

                  transition

                  hover:bg-indigo-700
                "
              >
                Continue Shopping
              </button>

            </div>

          </div>

        ) : (

          <>

            {/* =================================================
                SCROLLABLE PRODUCTS
            ================================================== */}

            <div
              className="
                flex-1
                overflow-y-auto

                px-3
                py-3

                sm:px-5
                sm:py-4
              "
            >

              {/* =============================================
                  ALREADY IN CART
              ============================================== */}

              {kitAlreadyInCart && (

                <div
                  className="
                    mb-3

                    rounded-xl

                    border
                    border-indigo-100

                    bg-indigo-50

                    px-3
                    py-2.5
                  "
                >

                  <div
                    className="
                      flex
                      items-start
                      gap-2
                    "
                  >

                    <Check
                      size={17}
                      className="
                        mt-0.5
                        shrink-0
                        text-indigo-600
                      "
                    />


                    <div>

                      <p
                        className="
                          text-sm
                          font-bold
                          text-indigo-950
                        "
                      >
                        Kit already added
                        to cart
                      </p>


                      <p
                        className="
                          mt-0.5

                          text-xs
                          leading-5
                          text-indigo-700
                        "
                      >
                        You can change
                        product sizes from
                        your cart.
                      </p>

                    </div>

                  </div>

                </div>

              )}


              {/* =============================================
                  PRODUCT CARDS
              ============================================== */}

              <div className="space-y-3">

                {products.map(
                  (product) => {

                    const selectedSize =
                      selectedSizes[
                        product.id
                      ];


                    const productPrice =
                      getProductPrice(
                        product
                      );


                    return (

                      <article
                        key={product.id}
                        className="
                          rounded-2xl

                          border
                          border-slate-200

                          bg-white

                          p-3

                          transition

                          hover:border-indigo-200

                          sm:p-4
                        "
                      >

                        <div
                          className="
                            flex
                            gap-3

                            sm:gap-4
                          "
                        >

                          {/* IMAGE */}

                          <div
                            className="
                              h-[88px]
                              w-[76px]
                              shrink-0

                              overflow-hidden

                              rounded-xl

                              bg-slate-100

                              sm:h-[105px]
                              sm:w-[95px]
                            "
                          >

                            <img
                              src={
                                product.image
                              }
                              alt={
                                product.name
                              }
                              className="
                                h-full
                                w-full
                                object-cover
                              "
                            />

                          </div>


                          {/* DETAILS */}

                          <div
                            className="
                              min-w-0
                              flex-1
                            "
                          >

                            <div
                              className="
                                flex
                                items-start
                                justify-between
                                gap-2
                              "
                            >

                              <h3
                                className="
                                  text-sm
                                  font-extrabold
                                  leading-5
                                  text-slate-950

                                  sm:text-[15px]
                                "
                              >
                                {product.name}
                              </h3>


                              {!product.hasSize && (

                                <p
                                  className="
                                    shrink-0

                                    text-sm
                                    font-extrabold
                                    text-slate-950
                                  "
                                >
                                  ₹
                                  {productPrice.toFixed(
                                    0
                                  )}
                                </p>

                              )}

                            </div>


                            {/* =================================
                                SIZE PRODUCTS
                            ================================== */}

                            {product.hasSize &&
                              Array.isArray(
                                product.sizes
                              ) &&
                              product.sizes
                                .length >
                                0 ? (

                              <div className="mt-3">

                                <p
                                  className="
                                    mb-2

                                    text-[9px]
                                    font-bold
                                    uppercase
                                    tracking-[0.08em]
                                    text-slate-400
                                  "
                                >
                                  Select Size
                                </p>


                                {/* =============================
                                    HORIZONTAL SIZE BUTTONS
                                ============================== */}

                                <div
                                  className="
                                    flex
                                    flex-wrap
                                    gap-2
                                  "
                                >

                                  {product.sizes.map(
                                    (
                                      size
                                    ) => {

                                      const label =
                                        getSizeLabel(
                                          size
                                        );


                                      const isSelected =
                                        String(
                                          selectedSize
                                        ) ===
                                        String(
                                          label
                                        );


                                      return (

                                        <button
                                          key={
                                            label
                                          }
                                          type="button"
                                          onClick={() =>
                                            handleSizeChange(
                                              product.id,
                                              label
                                            )
                                          }
                                          className={`
                                            flex
                                            h-8
                                            min-w-[36px]
                                            items-center
                                            justify-center

                                            rounded-lg

                                            border

                                            px-2

                                            text-[11px]
                                            font-bold

                                            transition-all

                                            sm:h-9
                                            sm:min-w-[38px]
                                            sm:text-xs

                                            ${
                                              isSelected
                                                ? `
                                                  border-indigo-500
                                                  bg-indigo-50
                                                  text-indigo-600

                                                  ring-1
                                                  ring-indigo-100
                                                `
                                                : `
                                                  border-slate-200
                                                  bg-white
                                                  text-slate-600

                                                  hover:border-indigo-300
                                                  hover:text-indigo-600
                                                `
                                            }
                                          `}
                                        >
                                          {label}
                                        </button>

                                      );

                                    }
                                  )}

                                </div>

                              </div>

                            ) : (

                              /* ===============================
                                  NO SIZE REQUIRED
                              ================================ */

                              <div
                                className="
                                  mt-3

                                  inline-flex
                                  items-center
                                  gap-1.5

                                  rounded-full

                                  bg-emerald-50

                                  px-2.5
                                  py-1.5

                                  text-[10px]
                                  font-bold
                                  text-emerald-600
                                "
                              >

                                <Check
                                  size={13}
                                />

                                No size required

                              </div>

                            )}

                          </div>

                        </div>

                      </article>

                    );

                  }
                )}

              </div>


              {/* =============================================
                  MESSAGE

                  Keep inside scrolling area.
                  Bottom bar stays compact.
              ============================================== */}

              {message && (

                <div
                  className={`
                    mt-3

                    rounded-xl

                    border

                    px-3
                    py-2.5

                    text-xs
                    font-semibold

                    ${
                      message
                        .toLowerCase()
                        .includes(
                          "please"
                        )
                        ? `
                          border-red-100
                          bg-red-50
                          text-red-600
                        `
                        : `
                          border-indigo-100
                          bg-indigo-50
                          text-indigo-700
                        `
                    }
                  `}
                >
                  {message}
                </div>

              )}

            </div>


            {/* =================================================
                NEW COMPACT BOTTOM BAR

                DESKTOP/TABLET:
                TOTAL LEFT
                BUTTON RIGHT

                MOBILE:
                STILL SAME ROW
                compact responsive layout
            ================================================== */}

            <div
              className="
                shrink-0

                border-t
                border-slate-200

               bg-[#EEF2FF]
                px-3
                py-3

                sm:px-5
                sm:py-3.5
              "
            >

              <div
                className="
                  flex
                  items-center
                  justify-between
                  gap-3
                "
              >

                {/* ===========================================
                    LEFT - TOTAL
                ============================================ */}

                <div
                  className="
                    min-w-0
                    shrink
                  "
                >

                  <p
                    className="
                      text-[9px]
                      font-medium
                      leading-4
                      text-slate-500

                      sm:text-[10px]
                    "
                  >
                    Complete Kit Total
                  </p>


                  <div
                    className="
                      mt-0.5

                      flex
                      flex-wrap
                      items-end
                      gap-x-2
                    "
                  >

                    <p
                      className="
                        text-[20px]
                        font-extrabold
                        leading-none
                        text-slate-950

                        sm:text-[23px]
                      "
                    >
                      ₹
                      {completeKitTotal.toFixed(
                        0
                      )}
                    </p>


                    <span
                      className="
                        text-[9px]
                        font-medium
                        text-slate-400

                        sm:text-[10px]
                      "
                    >
                      {products.length}{" "}
                      {products.length === 1
                        ? "item"
                        : "items"}
                    </span>

                  </div>

                </div>


                {/* ===========================================
                    RIGHT - BUTTON
                ============================================ */}

                <div
                  className="
                    shrink-0
                  "
                >

                  {kitAlreadyInCart ? (

                    <button
                      type="button"
                      onClick={
                        openExistingCart
                      }
                      className="
                        flex
                        h-[42px]
                        min-w-[130px]
                        items-center
                        justify-center
                        gap-2

                        rounded-xl

                        bg-indigo-600

                        px-4

                        text-[12px]
                        font-extrabold
                        text-white

                        shadow-md
                        shadow-indigo-600/15

                        transition

                        hover:bg-indigo-700

                        active:scale-[0.99]

                        sm:h-[46px]
                        sm:min-w-[155px]
                        sm:px-5
                        sm:text-sm
                      "
                    >

                      <ShoppingBag
                        size={16}
                      />

                      View Cart

                    </button>

                  ) : (

                    <button
                      type="button"
                      disabled={adding}
                      onClick={
                        handleAddKitToCart
                      }
                      className="
                        flex
                        h-[42px]
                        min-w-[145px]
                        items-center
                        justify-center
                        gap-1.5

                        rounded-xl

                        bg-indigo-600

                        px-3

                        text-[11px]
                        font-extrabold
                        text-white

                        shadow-md
                        shadow-indigo-600/15

                        transition

                        hover:bg-indigo-700

                        disabled:cursor-not-allowed
                        disabled:opacity-60

                        active:scale-[0.99]

                        sm:h-[46px]
                        sm:min-w-[175px]
                        sm:gap-2
                        sm:px-5
                        sm:text-sm
                      "
                    >

                      <ShoppingBag
                        size={16}
                      />

                      {adding
                        ? "Adding..."
                        : "Add Kit to Cart"}

                    </button>

                  )}

                </div>

              </div>

            </div>

          </>

        )}

      </aside>


      {/* =================================================
          DRAWER ANIMATION
      ================================================== */}

      <style>
        {`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(35px);
            }

            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}
      </style>

    </>
  );
}




// // src/components/KitDrawer.jsx

// import {
//   Check,
//   PackageCheck,
//   ShoppingBag,
//   X,
// } from "lucide-react";

// import {
//   useEffect,
//   useMemo,
//   useState,
// } from "react";

// import { useNavigate } from "react-router-dom";
// import { useStore } from "../context/StoreContext";


// export default function KitDrawer({
//   open,
//   onClose,
// }) {
//   const navigate = useNavigate();

//   const {
//     cart,
//     currentKit,
//     addToCart,
//     kitPurchased,
//   } = useStore();


//   /* =====================================================
//      SELECTED SIZES
//   ====================================================== */

//   const [
//     selectedSizes,
//     setSelectedSizes,
//   ] = useState({});


//   const [
//     message,
//     setMessage,
//   ] = useState("");


//   const [
//     adding,
//     setAdding,
//   ] = useState(false);


//   /* =====================================================
//      KIT ALREADY IN CART
//   ====================================================== */

//   const kitAlreadyInCart =
//     useMemo(() => {
//       return cart.some(
//         (item) =>
//           item.isKitItem === true
//       );
//     }, [cart]);


//   /* =====================================================
//      RESET WHEN OPEN
//   ====================================================== */

//   useEffect(() => {
//     if (!open) {
//       return;
//     }

//     setMessage("");

//     /*
//       IMPORTANT:

//       Do not auto-select first size.

//       User should select size manually
//       like your second image.
//     */

//     setSelectedSizes({});

//   }, [
//     open,
//     currentKit,
//   ]);


//   /* =====================================================
//      ESC CLOSE
//   ====================================================== */

//   useEffect(() => {
//     if (!open) {
//       return;
//     }


//     const handleEscape = (
//       event
//     ) => {
//       if (
//         event.key === "Escape"
//       ) {
//         onClose?.();
//       }
//     };


//     window.addEventListener(
//       "keydown",
//       handleEscape
//     );


//     return () => {
//       window.removeEventListener(
//         "keydown",
//         handleEscape
//       );
//     };

//   }, [
//     open,
//     onClose,
//   ]);


//   /* =====================================================
//      BODY SCROLL
//   ====================================================== */

//   useEffect(() => {
//     if (!open) {
//       return;
//     }


//     const oldOverflow =
//       document.body.style.overflow;


//     document.body.style.overflow =
//       "hidden";


//     return () => {
//       document.body.style.overflow =
//         oldOverflow;
//     };

//   }, [open]);


//   /* =====================================================
//      SIZE LABEL
//   ====================================================== */

//   const getSizeLabel = (
//     size
//   ) => {
//     if (
//       typeof size === "object"
//     ) {
//       return size.label;
//     }

//     return size;
//   };


//   /* =====================================================
//      GET PRODUCT PRICE
//   ====================================================== */

//   const getProductPrice = (
//     product
//   ) => {

//     if (!product) {
//       return 0;
//     }


//     /* =========================================
//        NO SIZE PRODUCT
//     ========================================== */

//     if (
//       !product.hasSize ||
//       !Array.isArray(product.sizes) ||
//       product.sizes.length === 0
//     ) {
//       return Number(
//         product.price || 0
//       );
//     }


//     /* =========================================
//        SIZE PRODUCT

//        No size selected = null

//        So top right will show:
//        "Select size"
//     ========================================== */

//     const selectedSize =
//       selectedSizes[
//         product.id
//       ];


//     if (!selectedSize) {
//       return null;
//     }


//     const sizeData =
//       product.sizes.find(
//         (size) =>
//           String(
//             getSizeLabel(size)
//           ) ===
//           String(selectedSize)
//       );


//     if (
//       typeof sizeData === "object" &&
//       sizeData?.price !== undefined
//     ) {
//       return Number(
//         sizeData.price
//       );
//     }


//     return Number(
//       product.price || 0
//     );
//   };


//   /* =====================================================
//      SELECT SIZE
//   ====================================================== */

//   const handleSizeSelect = (
//     productId,
//     size
//   ) => {

//     if (kitAlreadyInCart) {
//       return;
//     }


//     setSelectedSizes(
//       (current) => ({
//         ...current,

//         [productId]:
//           size,
//       })
//     );


//     setMessage("");
//   };


//   /* =====================================================
//      REQUIRED SIZES SELECTED
//   ====================================================== */

//   const allRequiredSizesSelected =
//     useMemo(() => {

//       if (!currentKit) {
//         return false;
//       }


//       return currentKit.products.every(
//         (product) => {

//           if (
//             !product.hasSize ||
//             !Array.isArray(
//               product.sizes
//             ) ||
//             product.sizes.length === 0
//           ) {
//             return true;
//           }


//           return Boolean(
//             selectedSizes[
//               product.id
//             ]
//           );
//         }
//       );

//     }, [
//       currentKit,
//       selectedSizes,
//     ]);


//   /* =====================================================
//      COMPLETE KIT TOTAL
//   ====================================================== */

//   const kitTotal =
//     useMemo(() => {

//       if (!currentKit) {
//         return 0;
//       }


//       return currentKit.products.reduce(
//         (
//           total,
//           product
//         ) => {

//           const price =
//             getProductPrice(
//               product
//             );


//           return (
//             total +
//             Number(price || 0)
//           );
//         },
//         0
//       );

//     }, [
//       currentKit,
//       selectedSizes,
//     ]);


//   /* =====================================================
//      VIEW EXISTING CART
//   ====================================================== */

//   const openExistingCart = () => {

//     onClose?.();

//     navigate("/cart");
//   };


//   /* =====================================================
//      ADD KIT
//   ====================================================== */

//   const handleAddKitToCart = () => {

//     if (
//       !currentKit ||
//       adding
//     ) {
//       return;
//     }


//     /* =========================================
//        ALREADY PURCHASED
//     ========================================== */

//     if (kitPurchased) {

//       setMessage(
//         "Your mandatory kit has already been purchased."
//       );

//       return;
//     }


//     /* =========================================
//        ALREADY IN CART

//        DO NOT ADD AGAIN
//     ========================================== */

//     if (kitAlreadyInCart) {

//       openExistingCart();

//       return;
//     }


//     /* =========================================
//        VALIDATE SIZE
//     ========================================== */

//     const missingSizeProduct =
//       currentKit.products.find(
//         (product) =>
//           product.hasSize &&
//           Array.isArray(
//             product.sizes
//           ) &&
//           product.sizes.length >
//             0 &&
//           !selectedSizes[
//             product.id
//           ]
//       );


//     if (missingSizeProduct) {

//       setMessage(
//         `Please select a size for ${missingSizeProduct.name}.`
//       );

//       return;
//     }


//     setAdding(true);

//     setMessage("");


//     try {

//       currentKit.products.forEach(
//         (product) => {

//           const selectedSize =
//             product.hasSize
//               ? selectedSizes[
//                   product.id
//                 ]
//               : null;


//           const selectedPrice =
//             getProductPrice(
//               product
//             );


//           const fixedQuantity =
//             Number(
//               product.kitQuantity ||
//                 1
//             );


//           const cartProduct = {
//             ...product,

//             price:
//               selectedPrice,

//             kitQuantity:
//               fixedQuantity,
//           };


//           addToCart(
//             cartProduct,
//             selectedSize,
//             true,
//             fixedQuantity
//           );

//         }
//       );


//       setMessage(
//         "Kit added to cart."
//       );


//       setTimeout(() => {

//         onClose?.();

//         navigate("/cart");

//       }, 300);

//     } finally {

//       setAdding(false);

//     }
//   };


//   /* =====================================================
//      CLOSED
//   ====================================================== */

//   if (!open) {
//     return null;
//   }


//   /* =====================================================
//      NO KIT
//   ====================================================== */

//   if (!currentKit) {
//     return (
//       <>
//         <button
//           type="button"
//           aria-label="Close kit"
//           onClick={onClose}
//           className="
//             fixed
//             inset-0
//             z-[90]

//             bg-slate-950/35

//             backdrop-blur-[2px]
//           "
//         />


//         <aside
//           className="
//             fixed
//             bottom-0
//             right-0
//             top-0
//             z-[100]

//             flex
//             w-full
//             max-w-[650px]
//             flex-col

//             bg-white

//             shadow-[-18px_0_50px_rgba(15,23,42,0.18)]
//           "
//         >

//           <div
//             className="
//               flex
//               items-center
//               justify-between

//               border-b
//               border-slate-200

//               px-6
//               py-5
//             "
//           >

//             <h2
//               className="
//                 text-xl
//                 font-extrabold
//                 text-slate-950
//               "
//             >
//               Select Kit
//             </h2>


//             <button
//               type="button"
//               onClick={onClose}
//               className="
//                 flex
//                 h-10
//                 w-10
//                 items-center
//                 justify-center

//                 rounded-full

//                 bg-slate-100

//                 text-slate-600
//               "
//             >
//               <X size={20} />
//             </button>

//           </div>


//           <div
//             className="
//               flex
//               flex-1
//               items-center
//               justify-center

//               p-6

//               text-center
//             "
//           >
//             <div>

//               <ShoppingBag
//                 size={38}
//                 className="
//                   mx-auto
//                   text-slate-300
//                 "
//               />


//               <p
//                 className="
//                   mt-3

//                   text-sm
//                   font-semibold
//                   text-slate-500
//                 "
//               >
//                 No kit is available
//                 for your class.
//               </p>

//             </div>
//           </div>

//         </aside>
//       </>
//     );
//   }


//   const products =
//     currentKit.products || [];


//   return (
//     <>
//       {/* =================================================
//           BACKDROP
//       ================================================== */}

//       <button
//         type="button"
//         aria-label="Close kit drawer"
//         onClick={onClose}
//         className="
//           fixed
//           inset-0
//           z-[90]

//           bg-slate-950/40

//           backdrop-blur-[2px]
//         "
//       />


//       {/* =================================================
//           DRAWER
//       ================================================== */}

//       <aside
//         className="
//           fixed
//           bottom-0
//           right-0
//           top-0
//           z-[100]

//           flex
//           w-full
//           max-w-[650px]
//           flex-col

//           bg-white

//           shadow-[-18px_0_55px_rgba(15,23,42,0.20)]

//           animate-[slideIn_.25s_ease-out]
//         "
//       >

//         {/* =================================================
//             HEADER
//         ================================================== */}

//         <div
//           className="
//             flex
//             shrink-0
//             items-center
//             justify-between

//             border-b
//             border-slate-200

//             px-5
//             py-5

//             sm:px-6
//           "
//         >

//           <div
//             className="
//               flex
//               min-w-0
//               items-center
//               gap-3
//             "
//           >

//             <div
//               className="
//                 flex
//                 h-11
//                 w-11
//                 shrink-0
//                 items-center
//                 justify-center

//                 rounded-xl

//                 bg-indigo-50

//                 text-indigo-600
//               "
//             >
//               <PackageCheck
//                 size={21}
//               />
//             </div>


//             <div className="min-w-0">

//               <p
//                 className="
//                   text-[10px]
//                   font-extrabold
//                   uppercase
//                   tracking-[0.18em]
//                   text-indigo-600
//                 "
//               >
//                 {currentKit.className ||
//                   "School Kit"}
//               </p>


//               <h2
//                 className="
//                   mt-0.5

//                   text-xl
//                   font-extrabold
//                   text-slate-950
//                 "
//               >
//                 Your School Kit
//               </h2>

//             </div>

//           </div>


//           <button
//             type="button"
//             onClick={onClose}
//             aria-label="Close"
//             className="
//               flex
//               h-10
//               w-10
//               shrink-0
//               items-center
//               justify-center

//               rounded-full

//               bg-slate-100

//               text-slate-600

//               transition

//               hover:bg-slate-200
//               hover:text-slate-950
//             "
//           >
//             <X size={20} />
//           </button>

//         </div>


//         {/* =================================================
//             PURCHASED
//         ================================================== */}

//         {kitPurchased ? (

//           <div
//             className="
//               flex
//               flex-1
//               items-center
//               justify-center

//               p-6
//             "
//           >

//             <div
//               className="
//                 w-full
//                 max-w-[400px]

//                 text-center
//               "
//             >

//               <div
//                 className="
//                   mx-auto

//                   flex
//                   h-16
//                   w-16
//                   items-center
//                   justify-center

//                   rounded-full

//                   bg-emerald-50

//                   text-emerald-600
//                 "
//               >
//                 <Check size={28} />
//               </div>


//               <h3
//                 className="
//                   mt-5

//                   text-xl
//                   font-extrabold
//                   text-slate-950
//                 "
//               >
//                 Kit already purchased
//               </h3>


//               <p
//                 className="
//                   mt-2

//                   text-sm
//                   leading-6
//                   text-slate-500
//                 "
//               >
//                 Your mandatory school kit
//                 has already been purchased.
//               </p>


//               <button
//                 type="button"
//                 onClick={onClose}
//                 className="
//                   mt-6
//                   h-11

//                   rounded-xl

//                   bg-indigo-600

//                   px-6

//                   text-sm
//                   font-bold
//                   text-white

//                   hover:bg-indigo-700
//                 "
//               >
//                 Continue Shopping
//               </button>

//             </div>

//           </div>

//         ) : (

//           <>
//             {/* =================================================
//                 PRODUCTS
//             ================================================== */}

//             <div
//               className="
//                 flex-1
//                 overflow-y-auto

//                 px-4
//                 py-5

//                 sm:px-6
//               "
//             >

//               {/* ALREADY CART */}

//               {kitAlreadyInCart && (

//                 <div
//                   className="
//                     mb-4

//                     rounded-xl

//                     border
//                     border-indigo-100

//                     bg-indigo-50

//                     px-4
//                     py-3
//                   "
//                 >

//                   <div
//                     className="
//                       flex
//                       items-center
//                       gap-2
//                     "
//                   >

//                     <Check
//                       size={17}
//                       className="
//                         shrink-0
//                         text-indigo-600
//                       "
//                     />


//                     <div>

//                       <p
//                         className="
//                           text-sm
//                           font-bold
//                           text-indigo-950
//                         "
//                       >
//                         Kit already added to cart
//                       </p>


//                       <p
//                         className="
//                           mt-0.5

//                           text-xs
//                           text-indigo-700
//                         "
//                       >
//                         View your existing kit in the cart.
//                       </p>

//                     </div>

//                   </div>

//                 </div>

//               )}


//               <div
//                 className="
//                   space-y-4
//                 "
//               >

//                 {products.map(
//                   (product) => {

//                     const selectedSize =
//                       selectedSizes[
//                         product.id
//                       ];


//                     const productPrice =
//                       getProductPrice(
//                         product
//                       );


//                     return (
//                       <article
//                         key={product.id}
//                         className="
//                           rounded-2xl

//                           border
//                           border-slate-200

//                           bg-white

//                           p-4
//                         "
//                       >

//                         <div
//                           className="
//                             flex
//                             gap-4
//                           "
//                         >

//                           {/* IMAGE */}

//                           <div
//                             className="
//                               h-[110px]
//                               w-[100px]
//                               shrink-0

//                               overflow-hidden

//                               rounded-xl

//                               bg-slate-100
//                             "
//                           >

//                             <img
//                               src={
//                                 product.image
//                               }
//                               alt={
//                                 product.name
//                               }
//                               className="
//                                 h-full
//                                 w-full
//                                 object-cover
//                               "
//                             />

//                           </div>


//                           {/* CONTENT */}

//                           <div
//                             className="
//                               min-w-0
//                               flex-1
//                             "
//                           >

//                             {/* NAME + PRICE */}

//                             <div
//                               className="
//                                 flex
//                                 items-start
//                                 justify-between
//                                 gap-3
//                               "
//                             >

//                               <h3
//                                 className="
//                                   text-[15px]
//                                   font-extrabold
//                                   text-slate-950
//                                 "
//                               >
//                                 {product.name}
//                               </h3>


//                               {productPrice !==
//                               null ? (

//                                 <p
//                                   className="
//                                     shrink-0

//                                     text-[15px]
//                                     font-extrabold
//                                     text-slate-950
//                                   "
//                                 >
//                                   ₹
//                                   {productPrice}
//                                 </p>

//                               ) : (

//                                 <p
//                                   className="
//                                     shrink-0

//                                     text-[11px]
//                                     font-bold
//                                     text-slate-400
//                                   "
//                                 >
//                                   Select size
//                                 </p>

//                               )}

//                             </div>


//                             {/* =================================
//                                 HORIZONTAL SIZE BUTTONS
//                             ================================== */}

//                             {product.hasSize &&
//                             Array.isArray(
//                               product.sizes
//                             ) &&
//                             product.sizes.length >
//                               0 ? (

//                               <div className="mt-4">

//                                 <p
//                                   className="
//                                     mb-2

//                                     text-[9px]
//                                     font-extrabold
//                                     uppercase
//                                     tracking-[0.08em]
//                                     text-slate-400
//                                   "
//                                 >
//                                   Select Size
//                                 </p>


//                                 <div
//                                   className="
//                                     flex
//                                     flex-wrap
//                                     gap-2
//                                   "
//                                 >

//                                   {product.sizes.map(
//                                     (size) => {

//                                       const label =
//                                         getSizeLabel(
//                                           size
//                                         );


//                                       const isSelected =
//                                         String(
//                                           selectedSize
//                                         ) ===
//                                         String(
//                                           label
//                                         );


//                                       return (
//                                         <button
//                                           key={
//                                             label
//                                           }
//                                           type="button"

//                                           disabled={
//                                             kitAlreadyInCart
//                                           }

//                                           onClick={() =>
//                                             handleSizeSelect(
//                                               product.id,
//                                               label
//                                             )
//                                           }

//                                           className={`
//                                             flex
//                                             h-9
//                                             min-w-[40px]
//                                             items-center
//                                             justify-center

//                                             rounded-lg

//                                             border

//                                             px-3

//                                             text-xs
//                                             font-bold

//                                             transition-all
//                                             duration-200

//                                             ${
//                                               isSelected
//                                                 ? `
//                                                   border-indigo-600
//                                                   bg-indigo-600
//                                                   text-white

//                                                   shadow-sm
//                                                   shadow-indigo-600/20
//                                                 `
//                                                 : `
//                                                   border-slate-200
//                                                   bg-white
//                                                   text-slate-600

//                                                   hover:border-indigo-300
//                                                   hover:bg-indigo-50
//                                                   hover:text-indigo-600
//                                                 `
//                                             }

//                                             disabled:cursor-not-allowed
//                                           `}
//                                         >
//                                           {label}
//                                         </button>
//                                       );
//                                     }
//                                   )}

//                                 </div>

//                               </div>

//                             ) : (

//                               /* =============================
//                                   NO SIZE REQUIRED
//                               ============================== */

//                               <div
//                                 className="
//                                   mt-4

//                                   inline-flex
//                                   items-center
//                                   gap-1.5

//                                   rounded-full

//                                   bg-emerald-50

//                                   px-3
//                                   py-1.5

//                                   text-[10px]
//                                   font-bold
//                                   text-emerald-600
//                                 "
//                               >
//                                 <Check
//                                   size={13}
//                                 />

//                                 No size required
//                               </div>

//                             )}

//                           </div>

//                         </div>

//                       </article>
//                     );
//                   }
//                 )}

//               </div>


//               {/* ERROR */}

//               {message && (

//                 <div
//                   className={`
//                     mt-4

//                     rounded-xl

//                     border

//                     px-4
//                     py-3

//                     text-sm
//                     font-semibold

//                     ${
//                       message
//                         .toLowerCase()
//                         .includes(
//                           "please"
//                         )
//                         ? `
//                           border-red-100
//                           bg-red-50
//                           text-red-600
//                         `
//                         : `
//                           border-indigo-100
//                           bg-indigo-50
//                           text-indigo-700
//                         `
//                     }
//                   `}
//                 >
//                   {message}
//                 </div>

//               )}

//             </div>


//             {/* =================================================
//                 BOTTOM
//             ================================================== */}

//             <div
//               className="
//                 shrink-0

//                 border-t
//                 border-slate-200

//                 bg-white

//                 px-5
//                 py-5

//                 sm:px-6
//               "
//             >

//               {/* =============================================
//                   TOTAL
//               ============================================== */}

//               {!kitAlreadyInCart && (

//                 <>
//                   <div
//                     className="
//                       mb-4

//                       flex
//                       items-end
//                       justify-between
//                       gap-4
//                     "
//                   >

//                     <div>

//                       <p
//                         className="
//                           text-[11px]
//                           font-medium
//                           text-slate-500
//                         "
//                       >
//                         Complete Kit Total
//                       </p>


//                       <p
//                         className="
//                           mt-1

//                           text-[26px]
//                           font-extrabold
//                           tracking-tight
//                           text-slate-950
//                         "
//                       >
//                         ₹{kitTotal}
//                       </p>

//                     </div>


//                     <p
//                       className="
//                         text-xs
//                         text-slate-400
//                       "
//                     >
//                       {products.length} items
//                     </p>

//                   </div>


//                   {!allRequiredSizesSelected && (

//                     <p
//                       className="
//                         mb-3

//                         text-center

//                         text-[10px]
//                         font-semibold
//                         text-amber-600
//                       "
//                     >
//                       Please select a size for all required products.
//                     </p>

//                   )}

//                 </>

//               )}


//               {/* =============================================
//                   ALREADY ADDED = VIEW CART
//               ============================================== */}

//               {kitAlreadyInCart ? (

//                 <button
//                   type="button"
//                   onClick={
//                     openExistingCart
//                   }
//                   className="
//                     flex
//                     h-[52px]
//                     w-full
//                     items-center
//                     justify-center
//                     gap-2

//                     rounded-xl

//                     bg-indigo-600

//                     px-5

//                     text-sm
//                     font-extrabold
//                     text-white

//                     shadow-lg
//                     shadow-indigo-600/20

//                     transition

//                     hover:bg-indigo-700

//                     active:scale-[0.99]
//                   "
//                 >
//                   <ShoppingBag
//                     size={18}
//                   />

//                   View Cart
//                 </button>

//               ) : (

//                 /* =============================================
//                     FIRST TIME = ADD KIT
//                 ============================================== */

//                 <button
//                   type="button"

//                   disabled={
//                     adding ||
//                     !allRequiredSizesSelected
//                   }

//                   onClick={
//                     handleAddKitToCart
//                   }

//                   className={`
//                     flex
//                     h-[52px]
//                     w-full
//                     items-center
//                     justify-center
//                     gap-2

//                     rounded-xl

//                     px-5

//                     text-sm
//                     font-extrabold

//                     transition-all
//                     duration-300

//                     ${
//                       allRequiredSizesSelected &&
//                       !adding
//                         ? `
//                           bg-indigo-600
//                           text-white

//                           shadow-lg
//                           shadow-indigo-600/20

//                           hover:bg-indigo-700

//                           active:scale-[0.99]
//                         `
//                         : `
//                           cursor-not-allowed

//                           bg-slate-100
//                           text-slate-400
//                         `
//                     }
//                   `}
//                 >
//                   <ShoppingBag
//                     size={18}
//                   />

//                   {adding
//                     ? "Adding Kit..."
//                     : "Add Kit to Cart"}
//                 </button>

//               )}

//             </div>

//           </>
//         )}

//       </aside>
//     </>
//   );
// }