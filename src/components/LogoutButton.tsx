"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={logout}
      disabled={busy}
      className={
        className ??
        "text-sm text-gray-600 hover:text-gray-900 hover:underline underline-offset-4 disabled:opacity-50"
      }
    >
      Log out
    </button>
  );
}
