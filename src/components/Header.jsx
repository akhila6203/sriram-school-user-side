import {
  ShoppingBag,
  User,
  LogOut,
} from "lucide-react";

import { Link } from "react-router-dom";
import { useStore } from "../context/StoreContext";
import brassLeafLogo from "../assets/images/brassleaf-logo.jpeg";


export default function Header() {
  const {
    student,
    logout,
    cartCount,
    setLoginOpen,
  } = useStore();


  return (
    <header
      className="
        sticky
        top-0
        z-50
        w-full

        border-b
        border-slate-100

        bg-white/95
        backdrop-blur-xl
      "
    >
      <div
        className="
          mx-auto

          flex
          h-[68px]
          max-w-[1400px]
          items-center
          justify-between

          px-3

          sm:h-[74px]
          sm:px-5

          md:px-6

          lg:h-[82px]
          lg:px-10
        "
      >

        {/* =========================================
            LEFT - LOGO
        ========================================== */}

<div className="flex shrink-0 items-center">
  <div
    className="
      flex
      h-[56px]
      w-[125px]
      items-center
      justify-start
      overflow-hidden

      sm:h-[62px]
      sm:w-[145px]

      lg:h-[70px]
      lg:w-[165px]
    "
  >
    <img
      src={brassLeafLogo}
      alt="Brassleaf"
      className="
        h-full
        w-full
        object-contain
        object-left
      "
    />
  </div>
</div>


        {/* =========================================
            TABLET / DESKTOP RIGHT SIDE

            Student Name
            Admission Number
            Class

            REMOVED FROM HEADER
        ========================================== */}

        <div
          className="
            hidden
            items-center

            gap-2

            md:flex

            lg:gap-3
          "
        >

          {/* =====================================
              CART
          ====================================== */}

          <Link
            to="/cart"
            className="
              relative

              flex
              h-11
              items-center
              justify-center
              gap-2

              rounded-xl

              border
              border-slate-200

              bg-white

              px-4

              text-sm
              font-semibold
              text-slate-700

              transition-all
              duration-300

              hover:border-indigo-200
              hover:bg-indigo-50
              hover:text-indigo-600
            "
          >
            <ShoppingBag size={19} />

            <span>
              Cart
            </span>


            {/* CART COUNT */}

            {cartCount > 0 && (
              <span
                className="
                  absolute
                  -right-2
                  -top-2

                  flex
                  h-6
                  min-w-6
                  items-center
                  justify-center

                  rounded-full

                  bg-indigo-600

                  px-1

                  text-xs
                  font-bold
                  text-white

                  ring-2
                  ring-white
                "
              >
                {cartCount}
              </span>
            )}

          </Link>


          {/* =====================================
              BEFORE LOGIN
          ====================================== */}

          {!student && (
            <button
              type="button"
              onClick={() => setLoginOpen(true)}
              className="
                flex
                h-11
                items-center
                justify-center
                gap-2

                rounded-xl

                bg-indigo-600

                px-5

                text-sm
                font-semibold
                text-white

                shadow-sm
                shadow-indigo-600/15

                transition-all
                duration-300

                hover:-translate-y-0.5
                hover:bg-indigo-700

                active:scale-[0.98]
              "
            >
              <User size={18} />

              <span>
                Login
              </span>
            </button>
          )}


          {/* =====================================
              AFTER LOGIN

              ONLY:
              Profile
              Logout

              NO STUDENT DETAILS HERE
          ====================================== */}

          {student && (
            <>

              {/* PROFILE */}

              <Link
                to="/profile"
                className="
                  flex
                  h-11
                  items-center
                  justify-center
                  gap-2

                  rounded-xl

                  bg-slate-900

                  px-4

                  text-sm
                  font-semibold
                  text-white

                  transition-all
                  duration-300

                  hover:-translate-y-0.5
                  hover:bg-indigo-600

                  active:scale-[0.98]
                "
              >
                <User size={18} />

                <span>
                  Profile
                </span>
              </Link>


              {/* LOGOUT */}

              <button
                type="button"
                onClick={logout}
                title="Logout"
                aria-label="Logout"
                className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center

                  rounded-xl

                  border
                  border-slate-200

                  bg-white

                  text-slate-600

                  transition-all
                  duration-300

                  hover:border-red-200
                  hover:bg-red-50
                  hover:text-red-500

                  active:scale-95
                "
              >
                <LogOut size={18} />
              </button>

            </>
          )}

        </div>


        {/* =========================================
            MOBILE RIGHT SIDE

            NO HAMBURGER
            NO STUDENT NAME
            NO ADMISSION NUMBER
            NO CLASS

            LEFT  = LOGO
            RIGHT = PROFILE + CART
        ========================================== */}

        <div
          className="
            flex
            shrink-0
            items-center

            gap-1.5

            sm:gap-2

            md:hidden
          "
        >

          {/* =====================================
              PROFILE / LOGIN
          ====================================== */}

          {!student ? (

            /* BEFORE LOGIN */

            <button
              type="button"
              onClick={() => setLoginOpen(true)}
              aria-label="Student Login"
              title="Login"
              className="
                flex
                h-9
                w-9
                items-center
                justify-center

                rounded-full

                bg-indigo-50

                text-indigo-600

                transition-all
                duration-200

                hover:bg-indigo-100

                active:scale-95

                min-[380px]:h-10
                min-[380px]:w-10
              "
            >
              <User size={18} />
            </button>

          ) : (

            /* AFTER LOGIN */

            <Link
              to="/profile"
              aria-label="Student Profile"
              title="Profile"
              className="
                flex
                h-9
                w-9
                items-center
                justify-center

                rounded-full

                bg-indigo-50

                text-indigo-600

                transition-all
                duration-200

                hover:bg-indigo-100

                active:scale-95

                min-[380px]:h-10
                min-[380px]:w-10
              "
            >
              <User size={18} />
            </Link>

          )}


          {/* =====================================
              MOBILE CART
          ====================================== */}

          <Link
            to="/cart"
            aria-label="Shopping Cart"
            title="Cart"
            className="
              relative

              flex
              h-9
              w-9
              items-center
              justify-center

              rounded-full

              bg-slate-100

              text-slate-800

              transition-all
              duration-200

              hover:bg-slate-200

              active:scale-95

              min-[380px]:h-10
              min-[380px]:w-10
            "
          >
            <ShoppingBag size={18} />


            {/* CART COUNT */}

            {cartCount > 0 && (
              <span
                className="
                  absolute
                  -right-1
                  -top-1

                  flex
                  h-[18px]
                  min-w-[18px]
                  items-center
                  justify-center

                  rounded-full

                  bg-indigo-600

                  px-1

                  text-[9px]
                  font-extrabold
                  text-white

                  ring-2
                  ring-white
                "
              >
                {cartCount}
              </span>
            )}

          </Link>

          
{/* =====================================
    MOBILE LOGOUT
    Visible only after student login
====================================== */}

{student && (
  <button
    type="button"
    onClick={logout}
    title="Logout"
    aria-label="Logout"
    className="
      flex
      h-9
      w-9
      shrink-0
      items-center
      justify-center
      rounded-full
      border
      border-red-100
      bg-red-50
      text-red-600
      transition-all
      duration-200
      hover:bg-red-100
      active:scale-95
      min-[380px]:h-10
      min-[380px]:w-10
    "
  >
    <LogOut size={18} />
  </button>
)}


        </div>

      </div>
    </header>
  );
}