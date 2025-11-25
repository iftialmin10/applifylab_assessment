"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("Feed error:", error);
  }, [error]);

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "100vh" }}
    >
      <div className="text-center">
        <h2>Something went wrong!</h2>
        <p>{error.message}</p>
        <div className="mt-3">
          <button onClick={reset} className="btn btn-primary me-2">
            Try again
          </button>
          <button
            onClick={() => router.push("/login")}
            className="btn btn-secondary"
          >
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );
}
