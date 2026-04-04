"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.replace("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-6 py-12 max-w-sm mx-auto w-full">
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-toss-blue mb-4">
            <span className="text-3xl">🏠</span>
          </div>
          <h1 className="text-2xl font-bold text-toss-text">모아</h1>
          <p className="text-sm text-toss-text-sub mt-1">가족이 함께 모으는 자산 관리</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            label="이메일"
            type="email"
            placeholder="이메일을 입력하세요"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          <Input
            label="비밀번호"
            type="password"
            placeholder="비밀번호를 입력하세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            error={error}
          />

          <div className="pt-2">
            <Button type="submit" fullWidth size="lg" disabled={loading}>
              {loading ? "로그인 중..." : "로그인"}
            </Button>
          </div>
        </form>

        {/* Test account hint */}
        <div className="mt-4 p-3 bg-toss-blue-light rounded-card">
          <p className="text-xs text-toss-blue font-medium text-center">
            테스트 계정: test@moaapp.com / test1234
          </p>
        </div>

        {/* Links */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <p className="text-sm text-toss-text-sub">계정이 없으신가요?</p>
          <Link href="/register" className="text-sm font-semibold text-toss-blue">
            회원가입
          </Link>
        </div>
      </div>
    </div>
  );
}
