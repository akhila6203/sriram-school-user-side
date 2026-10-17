// src/components/Footer.jsx

import {
  Mail,
  MapPin,
  Phone,
} from "lucide-react";

import { Link } from "react-router-dom";
import { useStore } from "../context/StoreContext";

import brassLeafLogo from "../assets/images/brassleaf-logo2.png";

// export default function Footer() {
//   return (

export default function Footer() {
  const { student, setLoginOpen } = useStore();

  const handleProtectedLink = (event) => {
    if (!student) {
      event.preventDefault();
      setLoginOpen(true);
    }
  };

  return (

    <footer className="bg-slate-950 text-slate-300">
      {/* =========================================
          MAIN FOOTER
      ========================================== */}
      <div
        className="
          mx-auto
          grid
          max-w-[1400px]
          grid-cols-1
          gap-9
          px-6
          py-10

          sm:grid-cols-2
          sm:gap-x-10
          sm:gap-y-10
          sm:px-8
          sm:py-11

          lg:grid-cols-[1.35fr_0.8fr_0.95fr_1.15fr]
          lg:gap-14
          lg:px-10
          lg:py-12

          xl:grid-cols-[1.45fr_0.75fr_0.9fr_1.15fr]
          xl:gap-16
        "
      >
        {/* =====================================
            ABOUT / STORE
            More width given to this section
        ====================================== */}
        <div className="lg:pr-5">
          <div className="mb-5 flex items-center gap-3">
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

          <p
            className="
              max-w-[400px]
              text-[15px]
              leading-[1.8]
              text-slate-400

              sm:text-[15px]

              lg:max-w-[400px]
              lg:leading-[1.75]
            "
          >
            We at BrassLeaf work with one core
            mission – That is to provide the best
            in class quality at affordable price
            and world class service. We duly
            understand the importance of uniforms
            and assure you 100% quality for all
            the products that we deal in. Our
            team of experts always work hard and
            cater to provide you best in class
            service.
          </p>
        </div>

        {/* =====================================
            QUICK LINKS
        ====================================== */}
        <div>
          <h3
            className="
              mb-5
              text-[18px]
              font-bold
              text-white
            "
          >
            Quick Links
          </h3>

          <div className="flex flex-col items-start gap-3.5">
            <Link
              to="/"
              className="
                text-[15px]
                font-medium
                text-slate-300
                transition-all
                duration-200

                hover:translate-x-1
                hover:text-indigo-400
              "
            >
              Home
            </Link>

            <Link
              // to="/cart"
              onClick={handleProtectedLink}
              className="
                text-[15px]
                font-medium
                text-slate-300
                transition-all
                duration-200

                hover:translate-x-1
                hover:text-indigo-400
              "
            >
              Cart
            </Link>

            <Link
              to="/profile"
              onClick={handleProtectedLink}
              className="
                text-[15px]
                font-medium
                text-slate-300
                transition-all
                duration-200

                hover:translate-x-1
                hover:text-indigo-400
              "
            >
              Profile
            </Link>
          </div>
        </div>

        {/* =====================================
            INFORMATION
        ====================================== */}
        <div>
          <h3
            className="
              mb-5
              text-[18px]
              font-bold
              text-white
            "
          >
            Information
          </h3>

          <div className="flex flex-col items-start gap-3.5">
            <Link
              to="/privacy-policy"
              className="
                text-[15px]
                font-medium
                text-slate-300
                transition-all
                duration-200

                hover:translate-x-1
                hover:text-indigo-400
              "
            >
              Privacy Policy
            </Link>

            <Link
              to="/return-policy"
              className="
                text-[15px]
                font-medium
                text-slate-300
                transition-all
                duration-200

                hover:translate-x-1
                hover:text-indigo-400
              "
            >
              Return Policy
            </Link>

            <Link
              to="/refund-policy"
              className="
                text-[15px]
                font-medium
                text-slate-300
                transition-all
                duration-200

                hover:translate-x-1
                hover:text-indigo-400
              "
            >
              Refund Policy
            </Link>

            <Link
              to="/shipping-policy"
              className="
                text-[15px]
                font-medium
                text-slate-300
                transition-all
                duration-200

                hover:translate-x-1
                hover:text-indigo-400
              "
            >
              Shipping Policy
            </Link>

            <Link
              to="/cancellation-policy"
              className="
                text-[15px]
                font-medium
                text-slate-300
                transition-all
                duration-200

                hover:translate-x-1
                hover:text-indigo-400
              "
            >
              Cancellation Policy
            </Link>
          </div>
        </div>

        {/* =====================================
            CONTACT INFO
        ====================================== */}
        <div>
          <h3
            className="
              mb-5
              text-[18px]
              font-bold
              text-white
            "
          >
            Contact Info
          </h3>

          <div className="space-y-4">
            {/* PHONE */}
            <a
              href="tel:+919876543210"
              className="
                group
                flex
                items-center
                gap-3
                text-[15px]
                font-medium
                text-slate-300
                transition

                hover:text-white
              "
            >
              <span
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  bg-indigo-950
                  text-indigo-400
                  transition

                  group-hover:bg-indigo-600
                  group-hover:text-white
                "
              >
                <Phone
                  size={18}
                  strokeWidth={2}
                />
              </span>

              <span>
                +91 6302-099299
              </span>
            </a>

            {/* EMAIL */}
            <a
              href="mailto:support@scholarstore.com"
              className="
                group
                flex
                items-center
                gap-3
                text-[15px]
                font-medium
                text-slate-300
                transition

                hover:text-white
              "
            >
              <span
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  bg-indigo-950
                  text-indigo-400
                  transition

                  group-hover:bg-indigo-600
                  group-hover:text-white
                "
              >
                <Mail
                  size={18}
                  strokeWidth={2}
                />
              </span>

              <span className="break-all">
                support@school.com
              </span>
            </a>

            {/* ADDRESS */}
            <div
              className="
                flex
                items-center
                gap-3
                text-[15px]
                font-medium
                text-slate-300
              "
            >
              <span
                className="
                  flex
                  h-9
                  w-9
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  bg-indigo-950
                  text-indigo-400
                "
              >
                <MapPin
                  size={18}
                  strokeWidth={2}
                />
              </span>

              <span>
                6-3-666/B, Pillar No. #1118 Erramanjil Road, Panjagutta, Hyderabad – 500082, Opp Nims Hospital
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================
          COPYRIGHT
      ========================================== */}
      <div className="border-t border-slate-800">
        <div
          className="
            mx-auto
            max-w-[1400px]
            px-5
            py-5
            text-center
            text-[13px]
            text-slate-500

            sm:text-[14px]
          "
        >
          © 2026{" "}
          <span className="font-semibold text-slate-300">
            BrassLeaf
          </span>
          . All rights reserved.
        </div>
      </div>
    </footer>
  );
}