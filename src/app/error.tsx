"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-toss-surface flex items-center justify-center px-5">
      <div className="text-center">
        <p className="text-4xl mb-4">😱</p>
        <h2 className="text-lg font-bold text-toss-text mb-2">문제가 발생했어요</h2>
        <p className="text-sm text-toss-text-sub mb-6">{error.message || "알 수 없는 오류"}</p>
        <button
          onClick={reset}
          className="px-6 py-3 rounded-xl bg-toss-blue text-white font-semibold text-sm"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}