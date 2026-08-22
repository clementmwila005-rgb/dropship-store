import Link from "next/link";
import { supabase } from "@/lib/supabase";
import LogoutButton from "./LogoutButton";

export default async function Header() {
  const { getSession } = await import("@/lib/auth");
  const session = await getSession();

  let cartCount: number | null = null;
  if (session) {
    const { data } = await supabase
      .from("CartItem")
      .select("quantity")
      .eq("userId", session.id);
    cartCount = (data || []).reduce((sum, item) => sum + item.quantity, 0);
  }

  const { data: categories } = await supabase
    .from("Category")
    .select("*")
    .order("name", { ascending: true });

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Dropship<span className="text-blue-600">Store</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-gray-700 md:flex">
          <Link href="/products" className="hover:text-gray-900">
            All products
          </Link>
          <Link href="/account/orders" className="hover:text-gray-900">
            Track orders
          </Link>
          {(categories || []).map((c) => (
            <Link key={c.id} href={`/products?category=${c.slug}`} className="hover:text-gray-900">
              {c.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/account/orders"
            className="text-sm font-medium text-gray-700 hover:text-gray-900 md:hidden"
          >
            Track orders
          </Link>
          <Link href="/cart" className="relative text-sm font-medium text-gray-700 hover:text-gray-900">
            Cart
            {cartCount && cartCount > 0 ? (
              <span className="absolute -top-2 -right-3 rounded-full bg-blue-600 px-1.5 text-xs font-semibold text-white">
                {cartCount}
              </span>
            ) : null}
          </Link>

          {session ? (
            <div className="flex items-center gap-4">
              <Link href={session.role === "admin" ? "/admin" : "/account/profile"} className="text-sm font-medium text-gray-700 hover:text-gray-900">
                {session.name.split(" ")[0]}
              </Link>
              <LogoutButton />
            </div>
          ) : (
            <Link href="/login" className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
