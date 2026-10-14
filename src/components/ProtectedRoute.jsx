
import { Navigate, useLocation } from "react-router-dom";
import { useStore } from "../context/StoreContext";

export default function ProtectedRoute({ children }) {
  const { student, authLoading } = useStore();
  const location = useLocation();

  // Wait for backend session verification.
  if (authLoading) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
      </div>
    );
  }

  // Redirect only when session is confirmed missing.
  if (!student) {
    return (
      <Navigate
        to="/"
        replace
        state={{ from: location }}
      />
    );
  }

  return children;
}



// import { Navigate } from "react-router-dom";
// import { useEffect } from "react";
// import { useStore } from "../context/StoreContext";
// export default function ProtectedRoute({ children }) {
//   const { student, setLoginOpen } = useStore();
//   useEffect(() => {
//     if (!student) setLoginOpen(true);
//   }, [student, setLoginOpen]);
//   return student ? children : <Navigate to="/" replace />;
// }
