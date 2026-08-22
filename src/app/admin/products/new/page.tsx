import { supabase } from "@/lib/supabase";
import ProductForm from "@/components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const { data: categories } = await supabase
    .from("Category")
    .select("*")
    .order("name", { ascending: true });

  return (
    <div>
      <h1 className="text-2xl font-bold">New product</h1>
      <p className="mt-1 text-sm text-gray-500">
        List a product you found on a Chinese supplier site. Price is what customers pay, cost is what you pay the supplier.
      </p>
      <div className="mt-6 rounded-xl border border-gray-200 p-6">
        <ProductForm categories={categories || []} />
      </div>
    </div>
  );
}
