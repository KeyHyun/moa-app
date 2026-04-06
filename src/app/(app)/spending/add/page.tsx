"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { formatKRW } from "@/lib/formatters";
import { CategoryPicker } from "@/components/spending-form/CategoryPicker";
import { SubCategoryPicker } from "@/components/spending-form/SubCategoryPicker";
import { useSpendingStore } from "@/store/spendingStore";
import { Visibility } from "@/types";
import { clsx } from "clsx";

type SpendingType = "expense" | "income";

interface UserCard {
  id: number;
  user_id: number;
  user_name: string;
  card_name: string;
  card_type: string;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function AddSpendingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");

  const addTransaction = useSpendingStore((s) => s.addTransaction);
  const updateTransaction = useSpendingStore((s) => s.updateTransaction);
  const transactions = useSpendingStore((s) => s.transactions);

  const [amountStr, setAmountStr] = useState("");
  const [category, setCategory] = useState<string>("식비");
  const [subCategory, setSubCategory] = useState<string>("");
  const [type, setType] = useState<SpendingType>("expense");
  const [memo, setMemo] = useState("");
  const [date, setDate] = useState(todayStr());
  const [visibility, setVisibility] = useState<Visibility>("family");
  const [saving, setSaving] = useState(false);

  // 카드 관련
  const [cards, setCards] = useState<UserCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<string>("");

  const isEdit = Boolean(editId);
  const amount = parseInt(amountStr, 10) || 0;

  // 수정 모드일 때 기존 데이터 로드
  useEffect(() => {
    if (editId) {
      const tx = transactions.find((t) => t.id === Number(editId));
      if (tx) {
        setAmountStr(String(tx.amount));
        setCategory(tx.category);
        setSubCategory(tx.sub_category || "");
        setType(tx.type as SpendingType);
        setMemo(tx.memo || "");
        setDate(tx.date);
        setVisibility((tx.visibility as Visibility) || "family");
        setSelectedCard(tx.card_name || "");
      }
    }
  }, [editId, transactions]);

  useEffect(() => {
    fetch("/api/cards").then((r) => r.json()).then((d) => setCards(d.cards || []));
  }, []);

  const handleSave = async () => {
    if (amount === 0 || saving) return;
    setSaving(true);
    try {
      const payload = { type, category, amount, memo, date, visibility, card_name: selectedCard, sub_category: subCategory };
      if (isEdit && editId) {
        await updateTransaction(Number(editId), payload);
      } else {
        await addTransaction(payload);
      }
      router.back();
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <TopBar showBack title={isEdit ? "거래 수정" : type === "expense" ? "지출 추가" : "수입 추가"} />

      {/* Type toggle */}
      {!isEdit && (
        <div className="flex mx-5 mt-3 bg-toss-surface rounded-pill p-1">
          {(["expense", "income"] as SpendingType[]).map((t) => (
            <button
              key={t}
              onClick={() => {
                setType(t);
                setCategory(t === "income" ? "급여" : "식비");
                setSubCategory("");
              }}
              className={clsx(
                "flex-1 py-2 text-sm font-semibold rounded-pill transition-all",
                type === t
                  ? t === "expense" ? "bg-toss-red text-white shadow-sm" : "bg-toss-green text-white shadow-sm"
                  : "text-toss-text-sub"
              )}
            >
              {t === "expense" ? "지출" : "수입"}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-32 space-y-5">
        {/* 금액 */}
        <div>
          <p className="text-xs font-semibold text-toss-text-sub mb-1">금액</p>
          <div className="flex items-baseline gap-2 pb-2 border-b-2 border-toss-border focus-within:border-toss-blue transition-colors">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="0"
              className="flex-1 text-4xl font-bold bg-transparent outline-none placeholder:text-toss-border"
              style={{ color: type === "expense" ? "#F04452" : "#2DB400" }}
            />
            <span className="text-xl font-medium text-toss-text-sub">원</span>
          </div>
          {amount > 0 && (
            <p className="text-xs text-toss-blue mt-1.5 pl-1">{amount.toLocaleString("ko-KR")}원</p>
          )}
        </div>

        {/* 날짜 */}
        <div>
          <p className="text-xs font-semibold text-toss-text-sub mb-2">날짜</p>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            max={todayStr()}
            className="w-full px-4 py-3 rounded-input border border-toss-border text-sm text-toss-text outline-none focus:border-toss-blue transition-colors"
          />
        </div>

        {/* 카테고리 */}
        <div>
          <p className="text-xs font-semibold text-toss-text-sub mb-2">카테고리</p>
          <CategoryPicker
            value={category}
            type={type}
            onChange={(cat) => { setCategory(cat); setSubCategory(""); }}
          />
        </div>

        {/* 세부 카테고리 */}
        <div>
          <p className="text-xs font-semibold text-toss-text-sub mb-2">
            세부 카테고리 <span className="font-normal text-toss-text-ter">(선택)</span>
          </p>
          <SubCategoryPicker
            category={category}
            value={subCategory}
            onChange={setSubCategory}
          />
        </div>

        {/* 사용 카드 (지출일 때만) */}
        {type === "expense" && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-toss-text-sub">사용 카드</p>
              <Link href="/family" className="text-xs text-toss-blue font-semibold">카드 관리 →</Link>
            </div>

            {/* 카드 목록 */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCard("")}
                className={clsx("flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-colors", {
                  "border-toss-blue bg-toss-blue-light text-toss-blue": selectedCard === "",
                  "border-toss-border bg-white text-toss-text-sub": selectedCard !== "",
                })}
              >
                선택 안 함
              </button>
              {cards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => setSelectedCard(card.card_name)}
                  className={clsx("flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium border transition-colors", {
                    "border-toss-blue bg-toss-blue-light text-toss-blue": selectedCard === card.card_name,
                    "border-toss-border bg-white text-toss-text-sub": selectedCard !== card.card_name,
                  })}
                >
                  <span>{card.card_type === "credit" ? "💳" : card.card_type === "debit" ? "🏧" : "💵"}</span>
                  <span>{card.card_name}</span>
                  {card.user_name && (
                    <span className="text-[10px] text-toss-text-ter">({card.user_name})</span>
                  )}
                </button>
              ))}
            </div>

            {selectedCard && (
              <p className="text-xs text-toss-blue mt-2 pl-1">💳 {selectedCard} 사용</p>
            )}
          </div>
        )}

        {/* 메모 */}
        <div>
          <p className="text-xs font-semibold text-toss-text-sub mb-2">메모</p>
          <input
            type="text"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder={`어디서 ${type === "expense" ? "쓰셨나요" : "받으셨나요"}?`}
            className="w-full px-4 py-3 rounded-input border border-toss-border text-sm text-toss-text placeholder:text-toss-text-ter outline-none focus:border-toss-blue transition-colors"
            maxLength={50}
          />
        </div>

        {/* 공개 여부 */}
        <div>
          <p className="text-xs font-semibold text-toss-text-sub mb-2">공개 여부</p>
          <div className="flex gap-2">
            {(["family", "private"] as Visibility[]).map((v) => (
              <button
                key={v}
                onClick={() => setVisibility(v)}
                className={clsx("flex-1 py-2.5 text-sm font-medium rounded-xl transition-colors", {
                  "bg-toss-blue text-white": visibility === v,
                  "bg-toss-surface text-toss-text-sub": visibility !== v,
                })}
              >
                {v === "family" ? "🏠 가족 공유" : "🔒 나만 보기"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 하단 저장 버튼 */}
      <div className="sticky bottom-0 px-5 py-4 bg-white border-t border-toss-border">
        <button
          onClick={handleSave}
          disabled={amount === 0 || saving}
          className={clsx(
            "w-full py-4 rounded-2xl font-semibold text-sm transition-colors",
            amount > 0 && !saving
              ? type === "expense" ? "bg-toss-red text-white" : "bg-toss-green text-white"
              : "bg-toss-border text-toss-text-ter"
          )}
        >
          {saving
            ? "저장 중..."
            : amount > 0
              ? `${formatKRW(amount)} ${isEdit ? "수정 완료" : type === "expense" ? "지출 저장" : "수입 저장"}`
              : "금액을 입력해주세요"}
        </button>
      </div>
    </div>
  );
}

export default function AddSpendingPage() {
  return (
    <Suspense>
      <AddSpendingInner />
    </Suspense>
  );
}
