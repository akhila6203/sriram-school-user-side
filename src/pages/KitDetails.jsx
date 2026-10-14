import { useState } from "react";
import { Check, ArrowRight, PackageCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../context/StoreContext";
export default function KitDetails() {
  const { currentKit, student, addToCart } = useStore();
  const nav = useNavigate();
  const [sizes, setSizes] = useState({});
  const [error, setError] = useState("");
  if (!student || !currentKit) return null;
  const total = currentKit.products.reduce((t, p) => t + p.price, 0);
  const add = () => {
    const m = currentKit.products.find((p) => p.hasSize && !sizes[p.id]);
    if (m) return setError(`Please select a size for ${m.name}.`);
    currentKit.products.forEach((p) =>
      addToCart(p, p.hasSize ? sizes[p.id] : null, true),
    );
    nav("/cart");
  };
  return (
    <main className="min-h-screen bg-slate-50 py-12">
      <div className="mx-auto max-w-[1300px] px-6 lg:px-10">
        <p className="font-bold text-indigo-600">{student.className}</p>
        <h1 className="mt-2 text-3xl font-bold md:text-4xl">
          {currentKit.name}
        </h1>
        <div className="mt-8 grid gap-8 lg:grid-cols-[42%_58%]">
          <div className="overflow-hidden rounded-3xl bg-white">
            <img
              src={currentKit.image}
              className="h-full min-h-[500px] w-full object-cover"
            />
          </div>
          <div className="rounded-3xl bg-white p-6 shadow-sm md:p-9">
            <div className="mb-7 flex items-center gap-3">
              <PackageCheck className="text-indigo-600" />
              <div>
                <h2 className="text-xl font-bold">Select your sizes</h2>
                <p className="text-sm text-slate-500">
                  Complete all required selections.
                </p>
              </div>
            </div>
            <div className="space-y-5">
              {currentKit.products.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl border p-4 sm:flex sm:items-center sm:gap-5"
                >
                  <img
                    src={p.image}
                    className="h-24 w-24 rounded-xl object-cover"
                  />
                  <div className="mt-4 flex-1 sm:mt-0">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-bold">{p.name}</h3>
                        <p className="mt-1 font-bold text-indigo-600">
                          ₹{p.price}
                        </p>
                      </div>
                      {!p.hasSize && <Check className="text-emerald-500" />}
                    </div>
                    {p.hasSize && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {p.sizes.map((s) => (
                          <button
                            key={s}
                            onClick={() => {
                              setSizes((v) => ({ ...v, [p.id]: s }));
                              setError("");
                            }}
                            className={`min-w-11 rounded-lg border px-3 py-2 text-sm font-bold ${sizes[p.id] === s ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200"}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {error && (
              <div className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {error}
              </div>
            )}
            <div className="mt-8 flex items-center justify-between border-t pt-6">
              <div>
                <p className="text-sm text-slate-500">Kit Total</p>
                <p className="text-3xl font-bold">₹{total}</p>
              </div>
              <button
                onClick={add}
                className="flex items-center gap-2 rounded-xl bg-indigo-600 px-7 py-4 font-bold text-white"
              >
                Add Complete Kit <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
