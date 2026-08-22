import { supabase } from "@/lib/supabase";
import NewCategoryForm from "@/components/admin/NewCategoryForm";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const { data: categories } = await supabase
    .from("Category")
    .select("*, products:Product(id)")
    .order("name", { ascending: true });

  return (
    <div>
      <h1 className="text-2xl font-bold">Categories</h1>

      <div className="mt-6 max-w-md rounded-xl border border-gray-200 p-5">
        <NewCategoryForm />
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-gray-200">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Products</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(categories || []).map((c) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                <td className="px-4 py-3 text-gray-600">{c.slug}</td>
                <td className="px-4 py-3 text-gray-600">{(c.products as any[])?.length ?? 0}</td>
              </tr>
            ))}
            {(!categories || categories.length === 0) && (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-gray-500">
                  No categories yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
