"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "100vh" }}
    >
      <div className="text-center">
        <h2>Something went wrong!</h2>
        <p>{error.message}</p>
        <button onClick={reset} className="btn btn-primary">
          Try again
        </button>
      </div>
    </div>
  );
}
