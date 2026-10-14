
import {
  ArrowLeft,
  PackageSearch,
} from "lucide-react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import { useStore } from "../context/StoreContext";
import ProductCard from "../components/ProductCard";


export default function ClassProducts() {
  const navigate = useNavigate();

  const {
  student,
  availableProducts,
  catalog,
  catalogLoading,
  catalogError,
} = useStore();

// const showIndividualProducts = catalog.mode === "individual";
const showIndividualProducts =
  catalog?.mode === "individual";



  /* =====================================================
     SAFETY

     Individual products should only be available
     after mandatory kit purchase.
  ====================================================== */

  if (!student) {
    return null;
  }

if (catalogLoading) {
  return (
    <main className="min-h-[55vh] bg-[#f7f9fc] px-4 py-10 text-center">
      <p className="font-semibold text-slate-600">
        Loading products...
      </p>
    </main>
  );
}

if (catalogError) {
  return (
    <main className="min-h-[55vh] bg-[#f7f9fc] px-4 py-10 text-center">
      <p className="font-semibold text-red-600">
        {catalogError}
      </p>
    </main>
  );
}
if (!showIndividualProducts) {
    return (
      <main
        className="
          min-h-[55vh]
          bg-[#f7f9fc]

          px-4
          py-8

          sm:px-6
        "
      >

        <div
          className="
            mx-auto
            max-w-[500px]

            rounded-2xl

            border
            border-slate-200

            bg-white

            p-6

            text-center

            shadow-[0_6px_22px_rgba(15,23,42,0.05)]
          "
        >

          <PackageSearch
            size={32}
            className="
              mx-auto
              text-indigo-600
            "
          />


          <h1
            className="
              mt-3

              text-[19px]
              font-extrabold
              text-[#07152D]
            "
          >
            {/* Complete Your Kit First */}
            School Kit Is Currently Available
          </h1>


          <p
            className="
              mt-2

              text-[13px]
              leading-5
              text-slate-500
            "
          >
            {/* Individual products will be available
            after your mandatory school kit purchase. */}
            Individual products will be available when
your school administrator disables the kit.
          </p>


          <Link
            to="/"
            className="
              mt-5

              inline-flex
              h-[40px]
              items-center
              justify-center
              gap-2

              rounded-lg

              bg-indigo-600

              px-5

              text-[12px]
              font-bold
              text-white

              transition

              hover:bg-indigo-700
            "
          >
            <ArrowLeft size={15} />

            Back to Home
          </Link>

        </div>

      </main>
    );
  }


  return (
    <main
      className="
        min-h-[55vh]
        bg-[#f7f9fc]

        px-4
        py-5

        sm:px-6
        sm:py-7

        md:px-8
      "
    >

      <div
        className="
          mx-auto
          max-w-[1250px]
        "
      >

        {/* =================================================
            BACK
        ================================================== */}

        <button
          type="button"
          onClick={() =>
            navigate("/")
          }
          className="
            inline-flex
            items-center
            gap-1.5

            text-[12px]
            font-bold
            text-slate-600

            transition

            hover:text-indigo-600

            sm:text-[13px]
          "
        >
          <ArrowLeft size={16} />

          Back to Home
        </button>


        {/* =================================================
            CENTER CLASS HEADING
        ================================================== */}

        <div
          className="
            mx-auto
            mb-6
            mt-3

            max-w-[650px]

            text-center
          "
        >

          <p
            className="
              text-[10px]
              font-extrabold
              uppercase
              tracking-[0.18em]
              text-indigo-600

              sm:text-[11px]
            "
          >
            Your Class
          </p>


          <h1
            className="
              mt-1

              text-[23px]
              font-extrabold
              tracking-tight
              text-[#07152D]

              sm:text-[27px]
              md:text-[30px]
            "
          >
            {student.className}
          </h1>


          <p
            className="
              mx-auto
              mt-1.5

              max-w-[480px]

              text-[13px]
              leading-5
              text-slate-500

              sm:text-[14px]
            "
          >
            Uniform products available for your class
          </p>


          <div
            className="
              mx-auto
              mt-3

              h-[3px]
              w-10

              rounded-full

              bg-indigo-600
            "
          />

        </div>


        {/* =================================================
            CLASS PRODUCTS

            IMPORTANT:
            availableProducts is already filtered in
            StoreContext using:

            product.className === student.className

            So Class 6 login -> Class 6 products only.
        ================================================== */}

        {availableProducts.length > 0 ? (

          <div
            className="
              grid
              grid-cols-2

              gap-3

              sm:gap-5

              md:grid-cols-3
              lg:grid-cols-4
            "
          >

            {availableProducts.map(
              (product) => (

                <ProductCard
                  key={product.id}
                  product={product}
                />

              )
            )}

          </div>

        ) : (

          <div
            className="
              mx-auto
              max-w-[500px]

              rounded-2xl

              border
              border-slate-200

              bg-white

              p-7

              text-center

              shadow-[0_5px_20px_rgba(15,23,42,0.04)]
            "
          >

            <PackageSearch
              size={32}
              className="
                mx-auto
                text-indigo-600
              "
            />


            <h2
              className="
                mt-3

                text-[18px]
                font-extrabold
                text-[#07152D]
              "
            >
              Products Coming Soon
            </h2>


            <p
              className="
                mt-1.5

                text-[13px]
                leading-5
                text-slate-500
              "
            >
              Individual products are not available
              for {student.className} yet.
            </p>

          </div>

        )}

      </div>

    </main>
  );
}





// import {
//   ArrowLeft,
//   PackageSearch,
// } from "lucide-react";

// import {
//   Link,
//   useNavigate,
// } from "react-router-dom";

// import { useStore } from "../context/StoreContext";
// import ProductCard from "../components/ProductCard";


// export default function ClassProducts() {
//   const navigate = useNavigate();

//   const {
//     student,
//     availableProducts,
//     kitPurchased,
//   } = useStore();


//   /* =====================================================
//      SAFETY

//      Individual products should only be available
//      after mandatory kit purchase.
//   ====================================================== */

//   if (!student) {
//     return null;
//   }


//   if (!kitPurchased) {
//     return (
//       <main
//         className="
//           min-h-[55vh]
//           bg-[#f7f9fc]

//           px-4
//           py-8

//           sm:px-6
//         "
//       >

//         <div
//           className="
//             mx-auto
//             max-w-[500px]

//             rounded-2xl

//             border
//             border-slate-200

//             bg-white

//             p-6

//             text-center

//             shadow-[0_6px_22px_rgba(15,23,42,0.05)]
//           "
//         >

//           <PackageSearch
//             size={32}
//             className="
//               mx-auto
//               text-indigo-600
//             "
//           />


//           <h1
//             className="
//               mt-3

//               text-[19px]
//               font-extrabold
//               text-[#07152D]
//             "
//           >
//             Complete Your Kit First
//           </h1>


//           <p
//             className="
//               mt-2

//               text-[13px]
//               leading-5
//               text-slate-500
//             "
//           >
//             Individual products will be available
//             after your mandatory school kit purchase.
//           </p>


//           <Link
//             to="/"
//             className="
//               mt-5

//               inline-flex
//               h-[40px]
//               items-center
//               justify-center
//               gap-2

//               rounded-lg

//               bg-indigo-600

//               px-5

//               text-[12px]
//               font-bold
//               text-white

//               transition

//               hover:bg-indigo-700
//             "
//           >
//             <ArrowLeft size={15} />

//             Back to Home
//           </Link>

//         </div>

//       </main>
//     );
//   }


//   return (
//     <main
//       className="
//         min-h-[55vh]
//         bg-[#f7f9fc]

//         px-4
//         py-5

//         sm:px-6
//         sm:py-7

//         md:px-8
//       "
//     >

//       <div
//         className="
//           mx-auto
//           max-w-[1250px]
//         "
//       >

//         {/* =================================================
//             BACK
//         ================================================== */}

//         <button
//           type="button"
//           onClick={() =>
//             navigate("/")
//           }
//           className="
//             inline-flex
//             items-center
//             gap-1.5

//             text-[12px]
//             font-bold
//             text-slate-600

//             transition

//             hover:text-indigo-600

//             sm:text-[13px]
//           "
//         >
//           <ArrowLeft size={16} />

//           Back to Home
//         </button>


//         {/* =================================================
//             CENTER CLASS HEADING
//         ================================================== */}

//         <div
//           className="
//             mx-auto
//             mb-6
//             mt-3

//             max-w-[650px]

//             text-center
//           "
//         >

//           <p
//             className="
//               text-[10px]
//               font-extrabold
//               uppercase
//               tracking-[0.18em]
//               text-indigo-600

//               sm:text-[11px]
//             "
//           >
//             Your Class
//           </p>


//           <h1
//             className="
//               mt-1

//               text-[23px]
//               font-extrabold
//               tracking-tight
//               text-[#07152D]

//               sm:text-[27px]
//               md:text-[30px]
//             "
//           >
//             {student.className}
//           </h1>


//           <p
//             className="
//               mx-auto
//               mt-1.5

//               max-w-[480px]

//               text-[13px]
//               leading-5
//               text-slate-500

//               sm:text-[14px]
//             "
//           >
//             Uniform products available for your class
//           </p>


//           <div
//             className="
//               mx-auto
//               mt-3

//               h-[3px]
//               w-10

//               rounded-full

//               bg-indigo-600
//             "
//           />

//         </div>


//         {/* =================================================
//             CLASS PRODUCTS

//             IMPORTANT:
//             availableProducts is already filtered in
//             StoreContext using:

//             product.className === student.className

//             So Class 6 login -> Class 6 products only.
//         ================================================== */}

//         {availableProducts.length > 0 ? (

//           <div
//             className="
//               grid
//               grid-cols-2

//               gap-3

//               sm:gap-5

//               md:grid-cols-3
//               lg:grid-cols-4
//             "
//           >

//             {availableProducts.map(
//               (product) => (

//                 <ProductCard
//                   key={product.id}
//                   product={product}
//                 />

//               )
//             )}

//           </div>

//         ) : (

//           <div
//             className="
//               mx-auto
//               max-w-[500px]

//               rounded-2xl

//               border
//               border-slate-200

//               bg-white

//               p-7

//               text-center

//               shadow-[0_5px_20px_rgba(15,23,42,0.04)]
//             "
//           >

//             <PackageSearch
//               size={32}
//               className="
//                 mx-auto
//                 text-indigo-600
//               "
//             />


//             <h2
//               className="
//                 mt-3

//                 text-[18px]
//                 font-extrabold
//                 text-[#07152D]
//               "
//             >
//               Products Coming Soon
//             </h2>


//             <p
//               className="
//                 mt-1.5

//                 text-[13px]
//                 leading-5
//                 text-slate-500
//               "
//             >
//               Individual products are not available
//               for {student.className} yet.
//             </p>

//           </div>

//         )}

//       </div>

//     </main>
//   );
// }