"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
        <h2>Something went wrong</h2>
        <p style={{ color: "#666" }}>{error.message}</p>
        {error.digest && (
          <p style={{ color: "#999", fontSize: "0.875rem" }}>
            Error ID: {error.digest}
          </p>
        )}
        <button
          onClick={() => reset()}
          style={{
            marginTop: "1rem",
            padding: "0.5rem 1rem",
            background: "#000",
            color: "#fff",
            border: "none",
            borderRadius: "0.5rem",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
