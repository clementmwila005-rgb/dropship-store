"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ProvinceSelect from "./ProvinceSelect";
import { ZAMBIAN_CITIES } from "@/lib/format";

export default function ProfileForm({
  initial,
}: {
  initial: {
    email: string;
    name: string;
    phone: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    zip: string;
    agentName: string;
    agentPhone: string;
    agentAddress: string;
    agentCity: string;
    agentProvince: string;
    agentZip: string;
  };
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/account/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not save profile");
        setBusy(false);
        return;
      }
      router.refresh();
      setError("Saved");
    } catch {
      setError("Couldn't reach the server. Please try again.");
      setBusy(false);
    }
  }

  const inputCls =
    "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
  const labelCls = "block text-sm font-medium text-gray-700";

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <label className={labelCls}>Email</label>
        <input type="email" value={form.email} disabled className={`${inputCls} bg-gray-100 text-gray-500`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Full name</label>
          <input type="text" required value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Phone number</label>
          <input type="tel" required placeholder="+260 97 000 0000" value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Street address</label>
        <input type="text" required placeholder="House number and street" value={form.address1} onChange={(e) => set("address1", e.target.value)} className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Apartment, suite, etc. (optional)</label>
        <input type="text" value={form.address2} onChange={(e) => set("address2", e.target.value)} className={inputCls} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>City / Town</label>
          <input type="text" required list="zm-cities" value={form.city} onChange={(e) => set("city", e.target.value)} className={inputCls} />
          <datalist id="zm-cities">
            {ZAMBIAN_CITIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div>
          <label className={labelCls}>Province</label>
          <ProvinceSelect value={form.state} onChange={(v) => set("state", v)} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>ZIP / Postal code</label>
          <input type="text" placeholder="e.g. 10101" value={form.zip} onChange={(e) => set("zip", e.target.value)} className={inputCls} />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-base font-semibold text-gray-900">Shipping agent (China)</h2>
        <p className="mt-1 text-xs text-gray-500">
          Your freight forwarder in China who receives your order from the supplier and sends it on to Zambia. These
          details are used on every checkout until you change them.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Agent name *</label>
            <input type="text" required placeholder="e.g. Wang Li" value={form.agentName} onChange={(e) => set("agentName", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Agent phone *</label>
            <input type="tel" required placeholder="e.g. +86 138 0000 0000" value={form.agentPhone} onChange={(e) => set("agentPhone", e.target.value)} className={inputCls} />
          </div>
        </div>
        <div className="mt-4">
          <label className={labelCls}>Agent address in China *</label>
          <textarea rows={2} required placeholder="e.g. Room 302, No. 18 Huqiu Road, Yiwu City, Zhejiang Province" value={form.agentAddress} onChange={(e) => set("agentAddress", e.target.value)} className={inputCls} />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className={labelCls}>City</label>
            <input type="text" value={form.agentCity} onChange={(e) => set("agentCity", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Province</label>
            <input type="text" value={form.agentProvince} onChange={(e) => set("agentProvince", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Postal code</label>
            <input type="text" value={form.agentZip} onChange={(e) => set("agentZip", e.target.value)} className={inputCls} />
          </div>
        </div>
      </div>

      {error && (
        <p className={`text-sm ${error === "Saved" ? "text-green-600" : "text-red-600"}`}>
          {error === "Saved" ? "Profile saved." : error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
