"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ProvinceSelect from "./ProvinceSelect";
import { ZAMBIAN_CITIES } from "@/lib/format";

export default function CheckoutForm({
  defaultEmail,
  defaultName,
  defaults,
}: {
  defaultEmail: string;
  defaultName: string;
  defaults: {
    address1: string;
    address2: string;
    city: string;
    state: string;
    zip: string;
    phone: string;
    agentName: string;
    agentPhone: string;
    agentAddress: string;
    agentCity: string;
    agentProvince: string;
    agentZip: string;
  };
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    email: defaultEmail,
    name: defaultName,
    ...defaults,
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [method, setMethod] = useState<"card" | "mobile_money">("card");
  const [shipToHome, setShipToHome] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState("");

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");

    let res: Response;
    try {
      res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, country: "Zambia", paymentMethod: method, shipToHome, whatsappNumber }),
      });
    } catch {
      setError("Couldn't reach the server. Please try again.");
      setBusy(false);
      return;
    }
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error || "Could not start checkout");
      setBusy(false);
      return;
    }

    if (data.mode === "offline") {
      router.push(`/checkout/success?order=${data.orderId}`);
      return;
    }

    if (data.mode === "lipila" && data.url) {
      // Card: redirect the customer to Lipila's hosted checkout page.
      window.location.href = data.url;
      return;
    }

    if (data.mode === "lipila" && data.method === "mobile_money") {
      // Mobile money: Lipila prompts the customer on their phone; wait for it.
      router.push(`/checkout/return?order=${data.orderId}&method=mobile_money`);
      return;
    }

    setError("Unexpected checkout response");
    setBusy(false);
  }

  const inputCls =
    "mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";
  const labelCls = "block text-sm font-medium text-gray-700";

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className={labelCls}>Email</label>
          <input id="email" type="email" required value={form.email} onChange={(e) => set("email", e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="name" className={labelCls}>Full name</label>
          <input id="name" type="text" required value={form.name} onChange={(e) => set("name", e.target.value)} className={inputCls} />
        </div>
      </div>

      <div>
        <label htmlFor="address1" className={labelCls}>Street address</label>
        <input id="address1" type="text" required placeholder="House number and street" value={form.address1} onChange={(e) => set("address1", e.target.value)} className={inputCls} />
      </div>

      <div>
        <label htmlFor="address2" className={labelCls}>Apartment, suite, etc. (optional)</label>
        <input id="address2" type="text" value={form.address2} onChange={(e) => set("address2", e.target.value)} className={inputCls} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="city" className={labelCls}>City / Town</label>
          <input id="city" type="text" required list="zm-cities" value={form.city} onChange={(e) => set("city", e.target.value)} className={inputCls} />
          <datalist id="zm-cities">
            {ZAMBIAN_CITIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div>
          <label htmlFor="state" className={labelCls}>Province</label>
          <ProvinceSelect value={form.state} onChange={(v) => set("state", v)} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="zip" className={labelCls}>ZIP / Postal code</label>
          <input id="zip" type="text" placeholder="e.g. 10101" value={form.zip} onChange={(e) => set("zip", e.target.value)} className={inputCls} />
        </div>
        <div>
          <label htmlFor="phone" className={labelCls}>Phone number</label>
          <input id="phone" type="tel" required placeholder="+260 97 000 0000" value={form.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={shipToHome}
            onChange={(e) => setShipToHome(e.target.checked)}
            className="mt-1 h-4 w-4 accent-blue-600"
          />
          <span>
            <span className="block text-sm font-semibold text-gray-900">I don&apos;t have a shipping agent</span>
            <span className="block text-xs text-gray-500">
              Your order will be shipped directly to your home address in Zambia. The shipping fee will be sent to you
              via <span className="font-semibold text-gray-700">WhatsApp and email</span>.
            </span>
          </span>
        </label>
        {shipToHome && (
          <div className="mt-4">
            <label htmlFor="whatsappNumber" className={labelCls}>WhatsApp number *</label>
            <input
              id="whatsappNumber"
              type="tel"
              required
              placeholder="e.g. +260 97 000 0000"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              className={inputCls}
            />
            <p className="mt-1 text-xs text-gray-500">
              We&apos;ll send your shipping fee and delivery details to this WhatsApp number and to your email
              ({form.email}).
            </p>
          </div>
        )}
      </div>

      <div className={`rounded-xl border border-gray-200 bg-gray-50 p-5 ${shipToHome ? "opacity-60" : ""}`}>
        <h2 className="text-base font-semibold text-gray-900">
          {shipToHome ? "Shipping agent (China) — not needed" : "Shipping agent (China)"}
        </h2>
        <p className="mt-1 text-xs text-gray-500">
          {shipToHome
            ? "Skip this section — your order goes straight to the address above."
            : "Your freight forwarder in China who receives your order from the supplier and sends it on to Zambia. If you save these in your profile you won&apos;t need to type them again."}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="agentName" className={labelCls}>Agent name {!shipToHome && "*"}</label>
            <input id="agentName" type="text" required={!shipToHome} disabled={shipToHome} placeholder="e.g. Wang Li" value={form.agentName} onChange={(e) => set("agentName", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="agentPhone" className={labelCls}>Agent phone {!shipToHome && "*"}</label>
            <input id="agentPhone" type="tel" required={!shipToHome} disabled={shipToHome} placeholder="e.g. +86 138 0000 0000" value={form.agentPhone} onChange={(e) => set("agentPhone", e.target.value)} className={inputCls} />
          </div>
        </div>
        <div className="mt-4">
          <label htmlFor="agentAddress" className={labelCls}>Agent address in China {!shipToHome && "*"}</label>
          <textarea id="agentAddress" rows={2} required={!shipToHome} disabled={shipToHome} placeholder="e.g. Room 302, No. 18 Huqiu Road, Yiwu City, Zhejiang Province" value={form.agentAddress} onChange={(e) => set("agentAddress", e.target.value)} className={inputCls} />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="agentCity" className={labelCls}>City</label>
            <input id="agentCity" type="text" disabled={shipToHome} value={form.agentCity} onChange={(e) => set("agentCity", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="agentProvince" className={labelCls}>Province</label>
            <input id="agentProvince" type="text" disabled={shipToHome} value={form.agentProvince} onChange={(e) => set("agentProvince", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label htmlFor="agentZip" className={labelCls}>Postal code</label>
            <input id="agentZip" type="text" disabled={shipToHome} value={form.agentZip} onChange={(e) => set("agentZip", e.target.value)} className={inputCls} />
          </div>
        </div>
      </div>

      <div className="rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
        Shipping country: <span className="font-semibold text-gray-900">Zambia</span> · All prices in Zambian Kwacha (K)
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-gray-700">Payment method</legend>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <label
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${
              method === "card" ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white"
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value="card"
              checked={method === "card"}
              onChange={() => setMethod("card")}
              className="mt-1 h-4 w-4 accent-blue-600"
            />
            <span>
              <span className="block text-sm font-semibold text-gray-900">Card</span>
              <span className="block text-xs text-gray-500">Visa, Mastercard, American Express</span>
            </span>
          </label>
          <label
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${
              method === "mobile_money" ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white"
            }`}
          >
            <input
              type="radio"
              name="paymentMethod"
              value="mobile_money"
              checked={method === "mobile_money"}
              onChange={() => setMethod("mobile_money")}
              className="mt-1 h-4 w-4 accent-blue-600"
            />
            <span>
              <span className="block text-sm font-semibold text-gray-900">Mobile Money</span>
              <span className="block text-xs text-gray-500">
                Airtel Money, MTN Money, Zamtel Kwacha — approve with a PIN on your phone
              </span>
            </span>
          </label>
        </div>
        {method === "mobile_money" && (
          <p className="mt-2 text-xs text-gray-500">
            The payment prompt is sent to <span className="font-semibold">{form.phone || "your phone number"}</span>.
          </p>
        )}
      </fieldset>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
      >
        {busy ? "Processing…" : method === "mobile_money" ? "Pay with Mobile Money" : "Pay with Card"}
      </button>
      <p className="text-center text-xs text-gray-500">
        Secure payments. Your payment details are encrypted and protected.
      </p>
    </form>
  );
}
