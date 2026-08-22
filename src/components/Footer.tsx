export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-gray-50">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-gray-500 sm:flex-row sm:px-6">
        <p>© {new Date().getFullYear()} DropshipStore. All rights reserved.</p>
        <p className="flex items-center gap-1.5">Secure payments · Card &amp; Mobile Money</p>
      </div>
    </footer>
  );
}
