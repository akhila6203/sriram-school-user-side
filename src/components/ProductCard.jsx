

import {
  Minus,
  Plus,
  ShoppingBag,
  Ruler,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import SizeChartModal from "./SizeChartModal";

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const { addToCart } = useStore();

  const getSizeLabel = (size) => {
    if (typeof size === "object" && size !== null) {
      return size.label;
    }
    return size;
  };

  const firstSize =
    product.hasSize &&
    Array.isArray(product.sizes) &&
    product.sizes.length > 0
      ? getSizeLabel(product.sizes[0])
      : null;

  const [selectedSize, setSelectedSize] = useState(firstSize);
  const [quantity, setQuantity] = useState(1);
  const [showSizeChart, setShowSizeChart] = useState(false);

  useEffect(() => {
    const newSize =
      product.hasSize &&
      Array.isArray(product.sizes) &&
      product.sizes.length > 0
        ? getSizeLabel(product.sizes[0])
        : null;

    setSelectedSize(newSize);
    setQuantity(1);
  }, [product]);

  const selectedPrice = useMemo(() => {
    if (
      product.hasSize &&
      Array.isArray(product.sizes) &&
      product.sizes.length > 0
    ) {
      const sizeData = product.sizes.find(
        (size) =>
          String(getSizeLabel(size)) === String(selectedSize)
      );

      if (typeof sizeData === "object" && sizeData !== null) {
        return Number(sizeData.price ?? product.price ?? 0);
      }
    }

    return Number(product.price || 0);
  }, [product, selectedSize]);

  const handleAddToCart = async () => {
  try {
    await addToCart(
      { ...product, price: selectedPrice },
      selectedSize,
      false,
      quantity
    );

    navigate("/cart");
  } catch (error) {
    console.error("Add to cart failed:", error);
    alert(error.message || "Unable to add product to cart.");
  }
};

  return (
    <>
      <article
        className="
          group flex h-full min-w-0 flex-col overflow-hidden
          rounded-[14px] border border-slate-200 bg-white
          shadow-[0_5px_18px_rgba(15,23,42,0.055)]
          transition-all duration-300
          hover:-translate-y-1 hover:border-indigo-200
          hover:shadow-[0_14px_30px_rgba(15,23,42,0.09)]
          sm:rounded-[16px] lg:rounded-[18px]
        "
      >
        {/* ORIGINAL PRODUCT IMAGE */}
        <div
          className="
            aspect-square overflow-hidden bg-slate-100
            sm:aspect-[1.05/0.9]
            lg:aspect-[1.08/0.82]
          "
        >
          <img
            src={product.image}
            alt={product.name}
            className="
              h-full w-full object-cover object-center
              transition-transform duration-500
              group-hover:scale-[1.035]
            "
          />
        </div>

        {/* ORIGINAL CONTENT */}
        <div className="flex flex-1 flex-col p-2.5 sm:p-3 lg:p-4">
          {/* NAME */}
          <h3
            className="
              line-clamp-1 text-[13px] font-extrabold
              leading-5 text-[#07152D]
              sm:text-[15px] lg:text-[17px]
            "
          >
            {product.name}
          </h3>

          {/* PRICE */}
          <p
            className="
              mt-0.5 text-[15px] font-black leading-none
              text-indigo-600 sm:mt-1 sm:text-[17px]
              lg:text-[18px]
            "
          >
            ₹{selectedPrice.toFixed(0)}
          </p>

          {/* ORIGINAL SIZE AND QUANTITY */}
          <div
            className="
              mt-3 grid grid-cols-[minmax(0,1fr)_auto]
              items-end gap-1.5 sm:gap-2
              lg:mt-4 lg:gap-2.5
            "
          >
            {/* SIZE */}
            <div className="min-w-0">
              <label
                className="
                  mb-1 block text-[9px] font-extrabold
                  uppercase tracking-[0.04em] text-slate-600
                  sm:text-[10px]
                "
              >
                Size
              </label>

              {product.hasSize &&
              Array.isArray(product.sizes) &&
              product.sizes.length > 0 ? (
                <div className="relative">
                  <select
                    value={selectedSize || ""}
                    onChange={(e) =>
                      setSelectedSize(e.target.value)
                    }
                    className="
                      h-[32px] w-full appearance-none
                      rounded-[7px] border border-slate-200
                      bg-[#FAFBFD] pl-2 pr-6
                      text-[10px] font-bold text-[#07152D]
                      outline-none transition
                      hover:border-indigo-300
                      focus:border-indigo-500
                      focus:ring-2 focus:ring-indigo-100
                      sm:h-[34px] sm:pl-2.5 sm:text-[11px]
                      lg:h-[36px] lg:rounded-lg
                      lg:px-3 lg:pr-8
                    "
                  >
                    {product.sizes.map((size, index) => {
                      const label = getSizeLabel(size);

                      return (
                        <option
                          key={`${label}-${index}`}
                          value={label}
                        >
                          {label}
                        </option>
                      );
                    })}
                  </select>

                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    className="
                      pointer-events-none absolute right-1.5
                      top-1/2 h-3.5 w-3.5
                      -translate-y-1/2 text-slate-500
                      sm:right-2 lg:right-2.5
                      lg:h-4 lg:w-4
                    "
                  >
                    <path
                      d="M6 8L10 12L14 8"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              ) : (
                <div
                  className="
                    flex h-[32px] items-center rounded-[7px]
                    border border-slate-200 bg-[#FAFBFD]
                    px-2 text-[9px] font-bold text-slate-600
                    sm:h-[34px] sm:text-[10px]
                    lg:h-[36px] lg:rounded-lg
                    lg:px-3 lg:text-[11px]
                  "
                >
                  Free Size
                </div>
              )}
            </div>

            {/* QUANTITY */}
            <div>
              <label
                className="
                  mb-1 block text-[9px] font-extrabold
                  uppercase tracking-[0.03em] text-slate-600
                  sm:text-[10px]
                "
              >
                Qty
                <span className="hidden lg:inline">
                  uantity
                </span>
              </label>

              <div
                className="
                  flex h-[32px] items-center overflow-hidden
                  rounded-[7px] border border-slate-200
                  bg-[#FAFBFD] sm:h-[34px]
                  lg:h-[36px] lg:rounded-lg
                "
              >
                <button
                  type="button"
                  onClick={() =>
                    setQuantity((current) =>
                      Math.max(1, current - 1)
                    )
                  }
                  disabled={quantity <= 1}
                  className="
                    flex h-full w-6 items-center justify-center
                    text-slate-500 transition
                    hover:bg-indigo-50 hover:text-indigo-600
                    disabled:cursor-not-allowed
                    disabled:opacity-30 sm:w-7 lg:w-8
                  "
                >
                  <Minus size={11} />
                </button>

                <span
                  className="
                    flex h-full min-w-[23px] items-center
                    justify-center border-x border-slate-200
                    px-0.5 text-[10px] font-extrabold
                    text-[#07152D] sm:min-w-[26px]
                    sm:text-[11px] lg:min-w-[30px]
                    lg:text-[12px]
                  "
                >
                  {quantity}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setQuantity((current) => current + 1)
                  }
                  className="
                    flex h-full w-6 items-center justify-center
                    text-slate-500 transition
                    hover:bg-indigo-50 hover:text-indigo-600
                    sm:w-7 lg:w-8
                  "
                >
                  <Plus size={11} />
                </button>
              </div>
            </div>
          </div>

          {/* SAME ORIGINAL BUTTON LAYOUT */}
          <div
            className="
              mt-3 grid grid-cols-1 gap-1.5
              sm:grid-cols-2 sm:gap-2 lg:mt-4
            "
          >
            {/* CHANGED: ADD TO CART -> SIZE CHART */}
            <button
              type="button"
              onClick={() => setShowSizeChart(true)}
              className="
                flex h-[34px] items-center justify-center
                gap-1 rounded-[7px] border border-indigo-500
                bg-white px-1.5 text-[9px] font-extrabold
                text-indigo-600 transition-all
                hover:bg-indigo-50
                sm:h-[36px] sm:text-[10px]
                lg:h-[38px] lg:rounded-lg
                lg:text-[11px]
              "
            >
              <Ruler
                size={12}
                className="hidden sm:block"
              />
              Size Chart
            </button>

            {/* CHANGED: BUY NOW -> ADD TO CART */}
            <button
              type="button"
              onClick={handleAddToCart}
              className="
                flex h-[34px] items-center justify-center
                gap-1 rounded-[7px] bg-indigo-600
                px-1.5 text-[9px] font-extrabold text-white
                shadow-[0_5px_14px_rgba(79,57,246,0.20)]
                transition-all hover:bg-indigo-700
                sm:h-[36px] sm:text-[10px]
                lg:h-[38px] lg:rounded-lg
                lg:text-[11px]
              "
            >
              <ShoppingBag
                size={12}
                className="hidden sm:block"
              />
              Add to Cart
            </button>
          </div>
        </div>
      </article>

      {/* SIZE CHART POPUP */}
      <SizeChartModal
        open={showSizeChart}
        onClose={() => setShowSizeChart(false)}
        image={product.sizeChartImage}
        title={`${product.name} - Size Chart`}
      />
    </>
  );
}





// import {
//   Minus,
//   Plus,
//   ShoppingBag,
//   Ruler,
// } from "lucide-react";

// import {
//   useEffect,
//   useMemo,
//   useState,
// } from "react";

// import { useNavigate } from "react-router-dom";
// import { useStore } from "../context/StoreContext";
// import SizeChartModal from "./SizeChartModal";

// export default function ProductCard({ product }) {
//   const navigate = useNavigate();
//   const { addToCart } = useStore();

//   const getSizeLabel = (size) => {
//     if (typeof size === "object" && size !== null) {
//       return size.label;
//     }
//     return size;
//   };

//   const firstSize =
//     product.hasSize &&
//     Array.isArray(product.sizes) &&
//     product.sizes.length > 0
//       ? getSizeLabel(product.sizes[0])
//       : null;

//   const [selectedSize, setSelectedSize] = useState(firstSize);
//   const [quantity, setQuantity] = useState(1);
//   const [showSizeChart, setShowSizeChart] = useState(false);

//   useEffect(() => {
//     const newSize =
//       product.hasSize &&
//       Array.isArray(product.sizes) &&
//       product.sizes.length > 0
//         ? getSizeLabel(product.sizes[0])
//         : null;

//     setSelectedSize(newSize);
//     setQuantity(1);
//   }, [product]);

//   const selectedPrice = useMemo(() => {
//     if (
//       product.hasSize &&
//       Array.isArray(product.sizes) &&
//       product.sizes.length > 0
//     ) {
//       const sizeData = product.sizes.find(
//         (size) =>
//           String(getSizeLabel(size)) === String(selectedSize)
//       );

//       if (typeof sizeData === "object" && sizeData !== null) {
//         return Number(sizeData.price ?? product.price ?? 0);
//       }
//     }

//     return Number(product.price || 0);
//   }, [product, selectedSize]);

//   const handleAddToCart = () => {
//     const cartProduct = {
//       ...product,
//       price: selectedPrice,
//     };

//     addToCart(
//       cartProduct,
//       selectedSize,
//       false,
//       quantity
//     );

//     navigate("/cart");
//   };

//   return (
//     <>
//       <article
//         className="
//           group flex h-full min-w-0 flex-col overflow-hidden
//           rounded-[14px] border border-slate-200 bg-white
//           shadow-[0_5px_18px_rgba(15,23,42,0.055)]
//           transition-all duration-300
//           hover:-translate-y-1 hover:border-indigo-200
//           hover:shadow-[0_14px_30px_rgba(15,23,42,0.09)]
//           sm:rounded-[16px] lg:rounded-[18px]
//         "
//       >
//         {/* ORIGINAL PRODUCT IMAGE */}
//         <div
//           className="
//             aspect-square overflow-hidden bg-slate-100
//             sm:aspect-[1.05/0.9]
//             lg:aspect-[1.08/0.82]
//           "
//         >
//           <img
//             src={product.image}
//             alt={product.name}
//             className="
//               h-full w-full object-cover object-center
//               transition-transform duration-500
//               group-hover:scale-[1.035]
//             "
//           />
//         </div>

//         {/* ORIGINAL CONTENT */}
//         <div className="flex flex-1 flex-col p-2.5 sm:p-3 lg:p-4">
//           {/* NAME */}
//           <h3
//             className="
//               line-clamp-1 text-[13px] font-extrabold
//               leading-5 text-[#07152D]
//               sm:text-[15px] lg:text-[17px]
//             "
//           >
//             {product.name}
//           </h3>

//           {/* PRICE */}
//           <p
//             className="
//               mt-0.5 text-[15px] font-black leading-none
//               text-indigo-600 sm:mt-1 sm:text-[17px]
//               lg:text-[18px]
//             "
//           >
//             ₹{selectedPrice.toFixed(0)}
//           </p>

//           {/* ORIGINAL SIZE AND QUANTITY */}
//           <div
//             className="
//               mt-3 grid grid-cols-[minmax(0,1fr)_auto]
//               items-end gap-1.5 sm:gap-2
//               lg:mt-4 lg:gap-2.5
//             "
//           >
//             {/* SIZE */}
//             <div className="min-w-0">
//               <label
//                 className="
//                   mb-1 block text-[9px] font-extrabold
//                   uppercase tracking-[0.04em] text-slate-600
//                   sm:text-[10px]
//                 "
//               >
//                 Size
//               </label>

//               {product.hasSize &&
//               Array.isArray(product.sizes) &&
//               product.sizes.length > 0 ? (
//                 <div className="relative">
//                   <select
//                     value={selectedSize || ""}
//                     onChange={(e) =>
//                       setSelectedSize(e.target.value)
//                     }
//                     className="
//                       h-[32px] w-full appearance-none
//                       rounded-[7px] border border-slate-200
//                       bg-[#FAFBFD] pl-2 pr-6
//                       text-[10px] font-bold text-[#07152D]
//                       outline-none transition
//                       hover:border-indigo-300
//                       focus:border-indigo-500
//                       focus:ring-2 focus:ring-indigo-100
//                       sm:h-[34px] sm:pl-2.5 sm:text-[11px]
//                       lg:h-[36px] lg:rounded-lg
//                       lg:px-3 lg:pr-8
//                     "
//                   >
//                     {product.sizes.map((size, index) => {
//                       const label = getSizeLabel(size);

//                       return (
//                         <option
//                           key={`${label}-${index}`}
//                           value={label}
//                         >
//                           {label}
//                         </option>
//                       );
//                     })}
//                   </select>

//                   <svg
//                     viewBox="0 0 20 20"
//                     fill="none"
//                     className="
//                       pointer-events-none absolute right-1.5
//                       top-1/2 h-3.5 w-3.5
//                       -translate-y-1/2 text-slate-500
//                       sm:right-2 lg:right-2.5
//                       lg:h-4 lg:w-4
//                     "
//                   >
//                     <path
//                       d="M6 8L10 12L14 8"
//                       stroke="currentColor"
//                       strokeWidth="1.8"
//                       strokeLinecap="round"
//                       strokeLinejoin="round"
//                     />
//                   </svg>
//                 </div>
//               ) : (
//                 <div
//                   className="
//                     flex h-[32px] items-center rounded-[7px]
//                     border border-slate-200 bg-[#FAFBFD]
//                     px-2 text-[9px] font-bold text-slate-600
//                     sm:h-[34px] sm:text-[10px]
//                     lg:h-[36px] lg:rounded-lg
//                     lg:px-3 lg:text-[11px]
//                   "
//                 >
//                   Free Size
//                 </div>
//               )}
//             </div>

//             {/* QUANTITY */}
//             <div>
//               <label
//                 className="
//                   mb-1 block text-[9px] font-extrabold
//                   uppercase tracking-[0.03em] text-slate-600
//                   sm:text-[10px]
//                 "
//               >
//                 Qty
//                 <span className="hidden lg:inline">
//                   uantity
//                 </span>
//               </label>

//               <div
//                 className="
//                   flex h-[32px] items-center overflow-hidden
//                   rounded-[7px] border border-slate-200
//                   bg-[#FAFBFD] sm:h-[34px]
//                   lg:h-[36px] lg:rounded-lg
//                 "
//               >
//                 <button
//                   type="button"
//                   onClick={() =>
//                     setQuantity((current) =>
//                       Math.max(1, current - 1)
//                     )
//                   }
//                   disabled={quantity <= 1}
//                   className="
//                     flex h-full w-6 items-center justify-center
//                     text-slate-500 transition
//                     hover:bg-indigo-50 hover:text-indigo-600
//                     disabled:cursor-not-allowed
//                     disabled:opacity-30 sm:w-7 lg:w-8
//                   "
//                 >
//                   <Minus size={11} />
//                 </button>

//                 <span
//                   className="
//                     flex h-full min-w-[23px] items-center
//                     justify-center border-x border-slate-200
//                     px-0.5 text-[10px] font-extrabold
//                     text-[#07152D] sm:min-w-[26px]
//                     sm:text-[11px] lg:min-w-[30px]
//                     lg:text-[12px]
//                   "
//                 >
//                   {quantity}
//                 </span>

//                 <button
//                   type="button"
//                   onClick={() =>
//                     setQuantity((current) => current + 1)
//                   }
//                   className="
//                     flex h-full w-6 items-center justify-center
//                     text-slate-500 transition
//                     hover:bg-indigo-50 hover:text-indigo-600
//                     sm:w-7 lg:w-8
//                   "
//                 >
//                   <Plus size={11} />
//                 </button>
//               </div>
//             </div>
//           </div>

//           {/* SAME ORIGINAL BUTTON LAYOUT */}
//           <div
//             className="
//               mt-3 grid grid-cols-1 gap-1.5
//               sm:grid-cols-2 sm:gap-2 lg:mt-4
//             "
//           >
//             {/* CHANGED: ADD TO CART -> SIZE CHART */}
//             <button
//               type="button"
//               onClick={() => setShowSizeChart(true)}
//               className="
//                 flex h-[34px] items-center justify-center
//                 gap-1 rounded-[7px] border border-indigo-500
//                 bg-white px-1.5 text-[9px] font-extrabold
//                 text-indigo-600 transition-all
//                 hover:bg-indigo-50
//                 sm:h-[36px] sm:text-[10px]
//                 lg:h-[38px] lg:rounded-lg
//                 lg:text-[11px]
//               "
//             >
//               <Ruler
//                 size={12}
//                 className="hidden sm:block"
//               />
//               Size Chart
//             </button>

//             {/* CHANGED: BUY NOW -> ADD TO CART */}
//             <button
//               type="button"
//               onClick={handleAddToCart}
//               className="
//                 flex h-[34px] items-center justify-center
//                 gap-1 rounded-[7px] bg-indigo-600
//                 px-1.5 text-[9px] font-extrabold text-white
//                 shadow-[0_5px_14px_rgba(79,57,246,0.20)]
//                 transition-all hover:bg-indigo-700
//                 sm:h-[36px] sm:text-[10px]
//                 lg:h-[38px] lg:rounded-lg
//                 lg:text-[11px]
//               "
//             >
//               <ShoppingBag
//                 size={12}
//                 className="hidden sm:block"
//               />
//               Add to Cart
//             </button>
//           </div>
//         </div>
//       </article>

//       {/* SIZE CHART POPUP */}
//       <SizeChartModal
//         open={showSizeChart}
//         onClose={() => setShowSizeChart(false)}
//         image={product.sizeChartImage}
//         title={`${product.name} - Size Chart`}
//       />
//     </>
//   );
// }




