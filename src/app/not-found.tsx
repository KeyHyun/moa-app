import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-toss-surface flex items-center justify-center px-5">
      <div className="text-center">
        <p className="text-4xl mb-4">🤔</p>
        <h2 className="text-lg font-bold text-toss-text mb-2">페이지를 찾을 수 없어요</h2>
        <p className="text-sm text-toss-text-sub mb-6">요청하신 페이지가 존재하지 않습니다.</p>
        <Link
          href="/"
          className="inline-block px-6 py-3 rounded-xl bg-toss-blue text-white font-semibold text-sm"
        >
          홈으로 이동
        </Link>
      </div>
    </div>
  );
}