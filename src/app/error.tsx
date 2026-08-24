"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6">
      <h2 className="text-2xl font-bold text-gray-900">Something went wrong</h2>
      <p className="mt-2 text-gray-600">{error.message}</p>
      {error.digest && (
        <p className="mt-1 text-sm text-gray-400">Error ID: {error.digest}</p>
      )}
      <button
        onClick={() => reset()}
        className="mt-6 rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-700"
      >
        Try again
      </button>
    </div>
  );
}
