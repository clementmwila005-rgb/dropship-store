import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6">
      <h2 className="text-2xl font-bold text-gray-900">Page not found</h2>
      <p className="mt-2 text-gray-600">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-700"
      >
        Go home
      </Link>
    </div>
  );
}
