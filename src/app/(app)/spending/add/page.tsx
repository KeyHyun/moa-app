"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { formatKRW } from "@/lib/formatters";
import { CategoryPicker } from "@/components/spending-form/CategoryPicker";
import { useSpendingStore } from "@/store/spendingStore";
import { SpendingCategory, Visibility } from "@/types";
import { clsx } from "clsx";

type SpendingType = "expense" | "income";

interface UserCard {
  id: number;
  user_id: number;
  user_name: string;
  card_name: string;
  card_type: string;
}

const CARD_TYPE_OPTIONS = [
  { value: "credit", label: "신용카드" },
  { value: "debit",  label: "체크카드" },
  { value: "cash",   label: "현금" },
];

export default function AddSpendingPage() {
  const router = useRouter();
  const addTransaction = useSpendingStore((s) => s.addTransaction);

  const [amountStr, setAmountStr] = useState("");
  const [category, setCategory] = useState<SpendingCategory>("식비");
  const [type, setType] = useState<SpendingType>("expense");
  const [memo, setMemo] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("family");
  const [saving, setSaving] = useState(false);

  // 카드 관련
  const [cards, setCards] = useState<UserCard[]>([]);
  const [selectedCard, setSelectedCard] = useState<string>("");
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCardName, setNewCardName] = useState("");
  const [newCardType, setNewCardType] = useState("credit");
  const [addingCard, setAddingCard] = useState(false);

  const amount = parseInt(amountStr, 10) || 0;

  useEffect(() => {
    fetch("/api/cards").then((r) => r.json()).then((d) => setCards(d.cards || []));
  }, []);

  const handleAddCard = async () => {
    if (!newCardName.trim()) return;
    setAddingCard(true);
    try {
      const res = await fetch("/api/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ card_name: newCardName.trim(), card_type: newCardType }),
      });
      const data = await res.json();
      if (res.ok) {
        const newCard: UserCard = { id: data.id, user_id: 0, user_name: "", card_name: newCardName.trim(), card_type: newCardType };
        setCards((prev) => [...prev, newCard]);
        setSelectedCard(newCardName.trim());
        setNewCardName("");
        setShowAddCard(false);
      }
    } finally {
      setAddingCard(false);
    }
  };

  const handleSave = async () => {
    if (amount === 0 || saving) return;
    setSaving(true);
    try {
      const d = new Date();
      const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      await addTransaction({ type, category, amount, memo, date: today, visibility, card_name: selectedCard });
      router.back();
    } catch {
      setSaving(false);
    }
  };

  const cardTypeLabel = (t: string) => CARD_TYPE_OPTIONS.find((o) => o.value === t)?.label ?? t;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <TopBar showBack title={type === "expense" ? "지출 추가" : "수입 추가"} />

      {/* Type toggle */}
      <div className="flex mx-5 mt-3 bg-toss-surface rounded-pill p-1">
        {(["expense", "income"] as SpendingType[]).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
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

      <div className="flex-1 overflow-y-auto px-5 pt-6 pb-4 space-y-5">
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

        {/* 카테고리 */}
        <div>
          <p className="text-xs font-semibold text-toss-text-sub mb-2">카테고리</p>
          <CategoryPicker value={category} onChange={setCategory} />
        </div>

        {/* 사용 카드 (지출일 때만) */}
        {type === "expense" && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-toss-text-sub">사용 카드</p>
              <button
                onClick={() => setShowAddCard((v) => !v)}
                className="text-xs text-toss-blue font-semibold"
              >
                {showAddCard ? "취소" : "+ 카드 등록"}
              </button>
            </div>

            {/* 카드 등록 폼 */}
            {showAddCard && (
              <div className="mb-3 p-3 bg-toss-surface rounded-xl space-y-2">
                <input
                  type="text"
                  value={newCardName}
                  onChange={(e) => setNewCardName(e.target.value)}
                  placeholder="카드명 (예: 현대카드M, 카카오뱅크 체크)"
                  className="w-full px-3 py-2.5 rounded-lg border border-toss-border text-sm outline-none focus:border-toss-blue bg-white"
                />
                <div className="flex gap-2">
                  {CARD_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setNewCardType(opt.value)}
                      className={clsx("flex-1 py-2 text-xs font-semibold rounded-lg transition-colors", {
                        "bg-toss-blue text-white": newCardType === opt.value,
                        "bg-white text-toss-text-sub border border-toss-border": newCardType !== opt.value,
                      })}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleAddCard}
                  disabled={addingCard || !newCardName.trim()}
                  className="w-full py-2.5 bg-toss-blue disabled:bg-toss-border text-white text-sm font-semibold rounded-lg"
                >
                  {addingCard ? "등록 중..." : "등록하기"}
                </button>
              </div>
            )}

            {/* 카드 목록 */}
            <div className="flex flex-wrap gap-2">
              {/* 선택 안 함 */}
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
              <p className="text-xs text-toss-blue mt-2 pl-1">
                💳 {selectedCard} 사용
              </p>
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
          {saving ? "저장 중..." : amount > 0 ? `${formatKRW(amount)} ${type === "expense" ? "지출" : "수입"} 저장` : "금액을 입력해주세요"}
        </button>
      </div>
    </div>
  );
}
