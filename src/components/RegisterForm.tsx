"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Link from "next/link";
import ProvinceSelect from "./ProvinceSelect";
import { ZAMBIAN_CITIES } from "@/lib/format";

function RegisterFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, country: "Zambia" }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Registration failed");
      setBusy(false);
      return;
    }
    router.push(next);
    router.refresh();
  }

  const inputCls =
    "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
  const labelCls = "block text-sm font-medium text-gray-700";

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelCls}>Full name *</label>
          <input id="name" type="text" required minLength={2} value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="email" className={labelCls}>Email *</label>
          <input id="email" type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} className={inputCls} />
        </div>
      </div>

      <div>
        <label htmlFor="password" className={labelCls}>Password *</label>
        <input id="password" type="password" required minLength={8} value={form.password} onChange={(e) => set("password", e.target.value)} className={inputCls} />
        <p className="mt-1 text-xs text-gray-500">At least 8 characters.</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="mb-3 text-sm font-semibold text-gray-900">Delivery address (Zambia)</p>
        <div className="space-y-4">
          <div>
            <label htmlFor="address1" className={labelCls}>Street address *</label>
            <input id="address1" type="text" required placeholder="House number and street" value={form.address1} onChange={(e) => set("address1", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="address2" className={labelCls}>Apartment, suite, etc. (optional)</label>
            <input id="address2" type="text" value={form.address2} onChange={(e) => set("address2", e.target.value)} className={inputCls} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="city" className={labelCls}>City / Town *</label>
              <input id="city" type="text" required list="zm-cities" value={form.city} onChange={(e) => set("city", e.target.value)} className={inputCls} />
              <datalist id="zm-cities">
                {ZAMBIAN_CITIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div>
              <label htmlFor="state" className={labelCls}>Province *</label>
              <ProvinceSelect value={form.state} onChange={(v) => set("state", v)} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="zip" className={labelCls}>ZIP / Postal code</label>
              <input id="zip" type="text" placeholder="e.g. 10101" value={form.zip} onChange={(e) => set("zip", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label htmlFor="phone" className={labelCls}>Phone number *</label>
              <input id="phone" type="tel" required placeholder="+260 97 000 0000" value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-700 disabled:opacity-50"
      >
        {busy ? "Creating account…" : "Create account"}
      </button>
      <p className="text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-medium text-blue-600 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export default function RegisterForm() {
  return (
    <Suspense>
      <RegisterFormInner />
    </Suspense>
  );
}
