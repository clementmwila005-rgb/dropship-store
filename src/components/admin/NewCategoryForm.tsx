"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewCategoryForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "Could not create category");
      setBusy(false);
      return;
    }
    setName("");
    setBusy(false);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex items-end gap-3">
      <div className="flex-1">
        <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700">
          Category name
        </label>
        <input
          id="categoryName"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Electronics"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
      >
        Add
      </button>
    </form>
  );
}
