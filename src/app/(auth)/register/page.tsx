"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { TopBar } from "@/components/layout/TopBar";

export default function RegisterPage() {
  const router = useRouter();
  const register = useAuthStore((s) => s.register);

  const [form, setForm] = useState({ name: "", email: "", password: "", passwordConfirm: "" });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [loading, setLoading] = useState(false);

  const setField = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const validate = () => {
    const e: Partial<typeof form> = {};
    if (!form.name) e.name = "이름을 입력해주세요.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "올바른 이메일 형식을 입력해주세요.";
    if (form.password.length < 6) e.password = "비밀번호는 6자 이상이어야 합니다.";
    if (form.password !== form.passwordConfirm) e.passwordConfirm = "비밀번호가 일치하지 않습니다.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      router.replace("/dashboard");
    } catch (err: unknown) {
      setErrors({ email: err instanceof Error ? err.message : "회원가입에 실패했습니다." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <TopBar showBack title="회원가입" />

      <div className="px-6 py-4 max-w-sm mx-auto">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-toss-text">모아에 오신 것을 환영해요</h2>
          <p className="text-sm text-toss-text-sub mt-1">가족과 함께 자산을 모아보세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="이름"
            placeholder="홍길동"
            value={form.name}
            onChange={setField("name")}
            error={errors.name}
          />
          <Input
            label="이메일"
            type="email"
            placeholder="example@email.com"
            value={form.email}
            onChange={setField("email")}
            error={errors.email}
            autoComplete="email"
          />
          <Input
            label="비밀번호"
            type="password"
            placeholder="6자 이상"
            value={form.password}
            onChange={setField("password")}
            error={errors.password}
            autoComplete="new-password"
          />
          <Input
            label="비밀번호 확인"
            type="password"
            placeholder="비밀번호를 다시 입력하세요"
            value={form.passwordConfirm}
            onChange={setField("passwordConfirm")}
            error={errors.passwordConfirm}
            autoComplete="new-password"
          />

          <div className="pt-2">
            <Button type="submit" fullWidth size="lg" disabled={loading}>
              {loading ? "가입 중..." : "가입하기"}
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-toss-text-ter">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="text-toss-blue font-medium">로그인</Link>
        </p>
      </div>
    </div>
  );
}
