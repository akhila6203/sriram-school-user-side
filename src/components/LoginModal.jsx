
import { useEffect, useState } from "react";
import {
  X,
  GraduationCap,
  ArrowRight,
} from "lucide-react";

import { useStore } from "../context/StoreContext";

export default function LoginModal() {
  const {
  loginOpen,
  setLoginOpen,
  login,
  student,
  authLoading,
} = useStore();

  const [admissionNo, setAdmissionNo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Prevent background scrolling while login modal is open
 const showLogin = !authLoading && !student && loginOpen;

useEffect(() => {
  document.body.style.overflow = showLogin
    ? "hidden"
    : "";

  return () => {
    document.body.style.overflow = "";
  };
}, [showLogin]);

  // Clear previous errors when modal opens
  useEffect(() => {
    if (loginOpen) {
      setError("");
    }
  }, [loginOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setError("");

    const admissionNumber = admissionNo.trim();

    if (!admissionNumber) {
      setError("Please enter your admission number.");
      return;
    }

    setLoading(true);

    try {
      // Calls backend through StoreContext login()
      const result = await login(admissionNumber);

      if (!result?.success) {
        setError(
          result?.message ||
            "Login failed. Please try again."
        );
        return;
      }

      // StoreContext handles student data and modal close
      setAdmissionNo("");
      setError("");
      setLoginOpen(false);
    } catch (err) {
      setError(
        err?.message ||
          "Unable to login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!showLogin) {
  return null;
}

  return (
    <>
      {/* BACKGROUND OVERLAY */}
      <div
        onClick={() => {
          if (!loading) {
            setLoginOpen(false);
          }
        }}
        className={`
          fixed inset-0 z-[100]
          bg-slate-950/45
          backdrop-blur-[3px]
          transition-all duration-300
          ${
            loginOpen
              ? "visible opacity-100"
              : "invisible opacity-0 pointer-events-none"
          }
        `}
      />

      {/* RIGHT SIDE LOGIN PANEL */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Student Login"
        className={`
          fixed right-0 top-0 z-[110]
          h-screen w-full
          sm:w-[440px] lg:w-[470px]
          bg-white
          shadow-[-20px_0_60px_rgba(15,23,42,0.18)]
          transition-transform duration-500
          ease-[cubic-bezier(0.22,1,0.36,1)]
          ${
            loginOpen
              ? "translate-x-0"
              : "translate-x-full"
          }
        `}
      >
        {/* TOP HEADER */}
        <div
          className="
            relative overflow-hidden
            bg-gradient-to-br
            from-indigo-700 via-indigo-600 to-violet-600
            px-7 pb-10 pt-8
            text-white sm:px-9
          "
        >
          <div
            className="
              absolute -bottom-24 -left-20
              h-52 w-52 rounded-full bg-white/5
            "
          />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="
                  flex h-11 w-11
                  items-center justify-center
                  rounded-xl bg-white/15 backdrop-blur-md
                "
              >
                <GraduationCap size={23} />
              </div>

              <div>
                <h3 className="text-lg font-bold">
                  Scholar Store
                </h3>

                <p className="text-xs text-indigo-100">
                  Student Portal
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setLoginOpen(false)}
              disabled={loading}
              aria-label="Close login"
              className="
                flex h-10 w-10
                items-center justify-center
                rounded-full
                border border-white/20
                bg-white/10 text-white
                transition
                hover:rotate-90 hover:bg-white/20
                disabled:cursor-not-allowed
                disabled:opacity-50
              "
            >
              <X size={19} />
            </button>
          </div>

          <div className="relative mt-10">
            <p className="mb-2 text-sm font-semibold text-indigo-100">
              Welcome back
            </p>

            <h2 className="text-3xl font-bold tracking-tight">
              Student Login
            </h2>

            <p className="mt-3 max-w-sm text-sm leading-6 text-indigo-100">
              Enter your admission number to access your
              class-specific school kit and products.
            </p>
          </div>
        </div>

        {/* FORM AREA */}
        <div
          className="
            flex h-[calc(100vh-260px)]
            flex-col overflow-y-auto
            px-7 py-8 sm:px-9
          "
        >
          <form
            onSubmit={handleSubmit}
            className="flex-1"
          >
            <div>
              <label
                htmlFor="admissionNumber"
                className="
                  mb-2.5 block
                  text-lg font-bold text-slate-800
                "
              >
                Admission Number
              </label>

              <div className="relative">
                <GraduationCap
                  size={19}
                  className="
                    absolute left-4 top-1/2
                    -translate-y-1/2
                    text-slate-400
                  "
                />

                <input
                  id="admissionNumber"
                  type="text"
                  value={admissionNo}
                  onChange={(e) => {
                    setAdmissionNo(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter admission number"
                  autoComplete="off"
                  disabled={loading}
                  required
                  className="
                    h-[56px] w-full
                    rounded-xl border border-slate-200
                    bg-slate-50 pl-12 pr-4
                    text-[15px] font-medium
                    text-slate-900 outline-none
                    transition-all duration-200
                    placeholder:text-slate-400
                    hover:border-slate-300
                    focus:border-indigo-500
                    focus:bg-white
                    focus:ring-4 focus:ring-indigo-100
                    disabled:opacity-60
                  "
                />
              </div>

              {/* BACKEND ERROR MESSAGE */}
              {error && (
                <div
                  role="alert"
                  className="
                    mt-3 rounded-lg
                    bg-red-50 px-4 py-3
                    text-sm font-medium text-red-600
                  "
                >
                  {error}
                </div>
              )}
            </div>

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="
                group mt-7 flex h-[56px] w-full
                items-center justify-center gap-2
                rounded-xl bg-indigo-600 px-6
                font-bold text-white
                shadow-lg shadow-indigo-600/20
                transition-all duration-300
                hover:-translate-y-0.5
                hover:bg-indigo-700
                hover:shadow-xl
                hover:shadow-indigo-600/25
                disabled:cursor-not-allowed
                disabled:opacity-60
                disabled:hover:translate-y-0
              "
            >
              {loading ? (
                <>
                  <span
                    className="
                      h-5 w-5 animate-spin
                      rounded-full
                      border-2 border-white/30
                      border-t-white
                    "
                  />
                  Logging in...
                </>
              ) : (
                <>
                  Login to Your Account

                  <ArrowRight
                    size={19}
                    className="
                      transition-transform duration-300
                      group-hover:translate-x-1
                    "
                  />
                </>
              )}
            </button>
          </form>

          {/* BOTTOM SUPPORT CONTENT */}
          <div
            className="
              mt-8 border-t border-slate-100
              pt-5 text-center
            "
          >
            <p className="text-xs leading-5 text-slate-400">
              Having trouble accessing your account?
            </p>

            <p className="mt-1 text-sm font-semibold text-indigo-600">
              Contact your school administrator
            </p>
          </div>
        </div>
      </div>
    </>
  );
}




// import { useEffect, useState } from "react";
// import {
//   X,
//   GraduationCap,
//   ArrowRight,
//   ShieldCheck,
// } from "lucide-react";

// import { useStore } from "../context/StoreContext";

// export default function LoginModal() {
//   const {
//     loginOpen,
//     setLoginOpen,
//     login,
//   } = useStore();

//   const [admissionNo, setAdmissionNo] = useState("");
//   const [error, setError] = useState("");

//   // Prevent background scrolling while popup is open
//   useEffect(() => {
//     if (loginOpen) {
//       document.body.style.overflow = "hidden";
//     } else {
//       document.body.style.overflow = "";
//     }

//     return () => {
//       document.body.style.overflow = "";
//     };
//   }, [loginOpen]);

// const [loading, setLoading] = useState(false);

// const handleSubmit = async (e) => {
//   e.preventDefault();

//   setError("");

//   if (!admissionNo.trim()) {
//     setError("Please enter your admission number.");
//     return;
//   }

//   setLoading(true);

//   try {
//     const result = await login(admissionNo);

//     if (!result.success) {
//       setError(result.message);
//       return;
//     }

//     setAdmissionNo("");
//   } catch (error) {
//     setError(error.message || "Login failed");
//   } finally {
//     setLoading(false);
//   }
// };

//   return (
//     <>
//       {/* =========================
//           BACKGROUND OVERLAY
//       ========================== */}
//       <div
//         onClick={() => setLoginOpen(false)}
//         className={`
//           fixed inset-0 z-[100]
//           bg-slate-950/45
//           backdrop-blur-[3px]
//           transition-all duration-300
//           ${
//             loginOpen
//               ? "visible opacity-100"
//               : "invisible opacity-0 pointer-events-none"
//           }
//         `}
//       />

//       {/* =========================
//           RIGHT SIDE LOGIN PANEL
//       ========================== */}
//       <div
//         className={`
//           fixed
//           right-0
//           top-0
//           z-[110]

//           h-screen
//           w-full
//           sm:w-[440px]
//           lg:w-[470px]

//           bg-white
//           shadow-[-20px_0_60px_rgba(15,23,42,0.18)]

//           transition-transform
//           duration-500
//           ease-[cubic-bezier(0.22,1,0.36,1)]

//           ${
//             loginOpen
//               ? "translate-x-0"
//               : "translate-x-full"
//           }
//         `}
//       >
//         {/* =========================
//             TOP DECORATIVE AREA
//         ========================== */}
//         <div className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 px-7 pb-10 pt-8 text-white sm:px-9">

//           {/* Decoration */}
//           {/* <div className="absolute -right-16 -top-20 h-52 w-52 rounded-full bg-white/10" /> */}

//           <div className="absolute -bottom-24 -left-20 h-52 w-52 rounded-full bg-white/5" />

//           {/* Close */}
//           <div className="relative flex items-center justify-between">

//             <div className="flex items-center gap-3">
//               <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md">
//                 <GraduationCap size={23} />
//               </div>

//               <div>
//                 <h3 className="text-lg font-bold">
//                   Scholar Store
//                 </h3>

//                 <p className="text-xs text-indigo-100">
//                   Student Portal
//                 </p>
//               </div>
//             </div>

//             <button
//               type="button"
//               onClick={() => setLoginOpen(false)}
//               className="
//                 flex h-10 w-10
//                 items-center justify-center
//                 rounded-full
//                 border border-white/20
//                 bg-white/10
//                 text-white
//                 transition
//                 hover:rotate-90
//                 hover:bg-white/20
//               "
//             >
//               <X size={19} />
//             </button>

//           </div>

//           <div className="relative mt-10">

//             <p className="mb-2 text-sm font-semibold text-indigo-100">
//               Welcome back
//             </p>

//             <h2 className="text-3xl font-bold tracking-tight">
//               Student Login
//             </h2>

//             <p className="mt-3 max-w-sm text-sm leading-6 text-indigo-100">
//               Enter your admission number to access your
//               class-specific school kit and products.
//             </p>

//           </div>
//         </div>

//         {/* =========================
//             FORM AREA
//         ========================== */}
//         <div className="flex h-[calc(100vh-260px)] flex-col overflow-y-auto px-7 py-8 sm:px-9">

//           <form
//             onSubmit={handleSubmit}
//             className="flex-1"
//           >
//             <div>
//               <label className="mb-2.5 block text-lg font-bold text-slate-800">
//                 Admission Number
//               </label>

//               <div className="relative">

//                 <GraduationCap
//                   size={19}
//                   className="
//                     absolute
//                     left-4
//                     top-1/2
//                     -translate-y-1/2
//                     text-slate-400
//                   "
//                 />

//                 <input
//                   type="text"
//                   value={admissionNo}
//                   onChange={(e) => {
//                     setAdmissionNo(e.target.value);
//                     setError("");
//                   }}
//                   placeholder="Enter admission number"
//                   autoComplete="off"
//                   className="
//                     h-[56px]
//                     w-full
//                     rounded-xl
//                     border
//                     border-slate-200
//                     bg-slate-50
//                     pl-12
//                     pr-4
//                     text-[15px]
//                     font-medium
//                     text-slate-900
//                     outline-none
//                     transition-all
//                     duration-200

//                     placeholder:text-slate-400

//                     hover:border-slate-300

//                     focus:border-indigo-500
//                     focus:bg-white
//                     focus:ring-4
//                     focus:ring-indigo-100
//                   "
//                 />

//               </div>

//               {error && (
//                 <div className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
//                   {error}
//                 </div>
//               )}
//             </div>

//             {/* LOGIN BUTTON */}
//             <button
//               type="submit"
//               className="
//                 group
//                 mt-7
//                 flex
//                 h-[56px]
//                 w-full
//                 items-center
//                 justify-center
//                 gap-2
//                 rounded-xl
//                 bg-indigo-600
//                 px-6
//                 font-bold
//                 text-white
//                 shadow-lg
//                 shadow-indigo-600/20
//                 transition-all
//                 duration-300

//                 hover:-translate-y-0.5
//                 hover:bg-indigo-700
//                 hover:shadow-xl
//                 hover:shadow-indigo-600/25
//               "
//             >
//               Login to Your Account

//               <ArrowRight
//                 size={19}
//                 className="
//                   transition-transform
//                   duration-300
//                   group-hover:translate-x-1
//                 "
//               />
//             </button>

//             {/* DEMO */}
//             <div className="mt-7 border-t border-slate-100 pt-6">

//               <p className="text-center text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
//                 Demo Admission Numbers
//               </p>

//               <div className="mt-4 grid grid-cols-3 gap-2">

//                 {["ADM1001", "ADM1002", "ADM1003"].map(
//                   (number) => (
//                     <button
//                       type="button"
//                       key={number}
//                       onClick={() => {
//                         setAdmissionNo(number);
//                         setError("");
//                       }}
//                       className="
//                         rounded-lg
//                         border
//                         border-slate-200
//                         bg-white
//                         px-2
//                         py-2.5
//                         text-xs
//                         font-bold
//                         text-slate-600
//                         transition

//                         hover:border-indigo-300
//                         hover:bg-indigo-50
//                         hover:text-indigo-600
//                       "
//                     >
//                       {number}
//                     </button>
//                   )
//                 )}

//               </div>

//             </div>

//           </form>

//           {/* BOTTOM */}
//           <div className="mt-8 border-t border-slate-100 pt-5 text-center">

//             <p className="text-xs leading-5 text-slate-400">
//               Having trouble accessing your account?
//             </p>

//             <p className="mt-1 text-sm font-semibold text-indigo-600">
//               Contact your school administrator
//             </p>

//           </div>

//         </div>
//       </div>
//     </>
//   );
// }