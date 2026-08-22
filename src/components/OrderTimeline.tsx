import { orderStatusLabel } from "@/lib/format";

const STEPS = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED"] as const;

export default function OrderTimeline({ status }: { status: string }) {
  if (status === "CANCELLED") {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
        This order was cancelled.
      </div>
    );
  }

  const currentIndex = STEPS.indexOf(status as (typeof STEPS)[number]);
  const reached = currentIndex >= 0 ? currentIndex : 0;

  return (
    <ol className="flex items-center">
      {STEPS.map((step, i) => (
        <li key={step} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                i <= reached ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
              }`}
            >
              {i + 1}
            </div>
            <span className={`mt-1.5 text-center text-xs font-medium ${i <= reached ? "text-gray-900" : "text-gray-400"}`}>
              {orderStatusLabel(step)}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`mx-2 mb-5 h-0.5 flex-1 ${i < reached ? "bg-blue-600" : "bg-gray-200"}`} />
          )}
        </li>
      ))}
    </ol>
  );
}
