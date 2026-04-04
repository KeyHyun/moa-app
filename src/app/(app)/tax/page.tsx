"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { formatKRW } from "@/lib/formatters";
import { clsx } from "clsx";

interface SalaryForm {
  annual_salary: string;
  credit_card_spending: string;
  debit_card_spending: string;
  cash_spending: string;
  transit_spending: string;
  traditional_market_spending: string;
}

interface SalaryData {
  id: number;
  user_id: number;
  user_name: string;
  year: number;
  annual_salary: number;
  credit_card_spending: number;
  debit_card_spending: number;
  cash_spending: number;
  transit_spending: number;
  traditional_market_spending: number;
}

interface TaxResult {
  totalSpending: number;
  minSpending: number;
  excessSpending: number;
  creditDeduction: number;
  debitCashDeduction: number;
  transitDeduction: number;
  traditionalMarketDeduction: number;
  totalDeduction: number;
  maxDeduction: number;
  finalDeduction: number;
  taxSaving: number;
  recommendation: string;
}

function calcTax(data: SalaryData): TaxResult {
  const salary = data.annual_salary;
  const minSpending = salary * 0.25; // 연봉 25% 초과분부터 공제
  const totalSpending =
    data.credit_card_spending +
    data.debit_card_spending +
    data.cash_spending +
    data.transit_spending +
    data.traditional_market_spending;

  if (totalSpending <= minSpending) {
    return {
      totalSpending, minSpending, excessSpending: 0,
      creditDeduction: 0, debitCashDeduction: 0, transitDeduction: 0,
      traditionalMarketDeduction: 0, totalDeduction: 0, maxDeduction: 0,
      finalDeduction: 0, taxSaving: 0,
      recommendation: "아직 최저 사용 금액(연봉의 25%)에 도달하지 못했어요. 더 사용해야 공제가 시작됩니다.",
    };
  }

  const excessSpending = totalSpending - minSpending;

  // 공제율: 신용카드 15%, 체크카드/현금 30%, 대중교통 40%, 전통시장 40%
  const creditDeduction = data.credit_card_spending * 0.15;
  const debitCashDeduction = (data.debit_card_spending + data.cash_spending) * 0.30;
  const transitDeduction = data.transit_spending * 0.40;
  const traditionalMarketDeduction = data.traditional_market_spending * 0.40;
  const totalDeduction = creditDeduction + debitCashDeduction + transitDeduction + traditionalMarketDeduction;

  // 공제 한도: 연봉에 따라 다름
  let maxDeduction = 3000000;
  if (salary <= 70000000) maxDeduction = 3000000;
  else if (salary <= 120000000) maxDeduction = 2500000;
  else maxDeduction = 2000000;

  // 추가 한도 (대중교통, 전통시장 각 100만원 추가)
  const bonusMax = maxDeduction + 1000000 + 1000000;
  const finalDeduction = Math.min(totalDeduction, bonusMax);

  // 소득세 절감액 (실효세율 약 16.5% 가정)
  const taxSaving = finalDeduction * 0.165;

  // 추천 메시지
  let recommendation = "";
  const needMore = minSpending - totalSpending;

  if (totalSpending <= minSpending) {
    recommendation = `최저 기준금액까지 ${formatKRW(needMore)} 더 사용해야 공제가 시작됩니다.`;
  } else {
    // 같은 지출에서 체크카드 vs 신용카드 비교
    const currentSaving = taxSaving;
    const ifAllDebit = Math.min(totalSpending * 0.30, bonusMax) * 0.165;

    if (data.credit_card_spending > data.debit_card_spending + data.cash_spending) {
      const diff = ifAllDebit - currentSaving;
      recommendation = diff > 0
        ? `체크카드/현금 사용 비중을 늘리면 약 ${formatKRW(diff)} 추가 절세 가능해요. 현재 신용카드 비중이 높아요.`
        : "현재 카드 사용 구성이 적절해요.";
    } else {
      recommendation = `현재 체크카드/현금 위주 사용으로 공제율이 높아요. 연봉 25% 이상의 초과분은 체크카드/현금을 우선 사용하세요.`;
    }
  }

  return {
    totalSpending, minSpending, excessSpending,
    creditDeduction, debitCashDeduction, transitDeduction, traditionalMarketDeduction,
    totalDeduction, maxDeduction: bonusMax, finalDeduction, taxSaving, recommendation,
  };
}

const emptyForm = (): SalaryForm => ({
  annual_salary: "", credit_card_spending: "", debit_card_spending: "",
  cash_spending: "", transit_spending: "", traditional_market_spending: "",
});

export default function TaxPage() {
  const [year] = useState(new Date().getFullYear());
  const [myInfo, setMyInfo] = useState<SalaryData | null>(null);
  const [familyList, setFamilyList] = useState<SalaryData[]>([]);
  const [form, setForm] = useState<SalaryForm>(emptyForm());
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/salary?year=${year}`);
      if (res.ok) {
        const data = await res.json();
        setMyInfo(data.myInfo);
        setFamilyList(data.familyInfoList || []);
        if (data.myInfo) {
          setForm({
            annual_salary: String(data.myInfo.annual_salary || ""),
            credit_card_spending: String(data.myInfo.credit_card_spending || ""),
            debit_card_spending: String(data.myInfo.debit_card_spending || ""),
            cash_spending: String(data.myInfo.cash_spending || ""),
            transit_spending: String(data.myInfo.transit_spending || ""),
            traditional_market_spending: String(data.myInfo.traditional_market_spending || ""),
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [year]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/salary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year,
          annual_salary: parseInt(form.annual_salary || "0"),
          credit_card_spending: parseInt(form.credit_card_spending || "0"),
          debit_card_spending: parseInt(form.debit_card_spending || "0"),
          cash_spending: parseInt(form.cash_spending || "0"),
          transit_spending: parseInt(form.transit_spending || "0"),
          traditional_market_spending: parseInt(form.traditional_market_spending || "0"),
        }),
      });
      await fetchData();
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  const allMembers = familyList.length > 0 ? familyList : myInfo ? [{ ...myInfo }] : [];

  const numInput = (key: keyof SalaryForm, label: string, placeholder: string) => (
    <div>
      <p className="text-xs font-semibold text-toss-text-sub mb-2">{label}</p>
      <input
        type="text"
        inputMode="numeric"
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value.replace(/[^0-9]/g, "") }))}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl border border-toss-border text-sm outline-none focus:border-toss-blue"
      />
      {form[key] && (
        <p className="text-xs text-toss-blue mt-1 pl-1">{formatKRW(parseInt(form[key]))}</p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-toss-surface pb-24">
      <TopBar
        showBack
        title="세금/카드 분석"
        rightAction={
          <button onClick={() => setShowForm(!showForm)} className="text-sm font-semibold text-toss-blue">
            {showForm ? "닫기" : "내 정보 입력"}
          </button>
        }
      />

      {/* 입력 폼 */}
      {showForm && (
        <div className="mx-4 mt-3 mb-3 bg-white rounded-2xl shadow-sm px-5 py-5 space-y-4">
          <h2 className="text-sm font-bold text-toss-text">{year}년 지출 정보</h2>
          {numInput("annual_salary", "연봉 (세전)", "예: 50000000")}
          {numInput("credit_card_spending", "신용카드 사용액", "예: 10000000")}
          {numInput("debit_card_spending", "체크카드 사용액", "예: 5000000")}
          {numInput("cash_spending", "현금 사용액", "예: 2000000")}
          {numInput("transit_spending", "대중교통 사용액", "예: 1000000")}
          {numInput("traditional_market_spending", "전통시장 사용액", "예: 500000")}
          <button onClick={handleSave} disabled={saving}
            className="w-full py-3.5 bg-toss-blue disabled:bg-toss-border text-white font-semibold rounded-xl">
            {saving ? "저장 중..." : "저장하기"}
          </button>
        </div>
      )}

      {loading ? (
        <div className="px-4 mt-3 space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-40 bg-white rounded-2xl animate-pulse" />)}
        </div>
      ) : allMembers.length === 0 ? (
        <div className="flex flex-col items-center py-24 gap-3">
          <span className="text-5xl">💰</span>
          <p className="text-base font-semibold text-toss-text">지출 정보를 입력해주세요</p>
          <p className="text-sm text-toss-text-ter">연봉과 카드 사용 내역을 입력하면 절세 방법을 알려드려요</p>
          <button onClick={() => setShowForm(true)}
            className="mt-2 px-6 py-2.5 bg-toss-blue text-white text-sm font-semibold rounded-pill">
            정보 입력하기
          </button>
        </div>
      ) : (
        <div className="px-4 mt-3 space-y-4">
          {allMembers.map((member) => {
            const result = calcTax(member);
            return (
              <div key={member.user_id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-toss-border">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-toss-text">{member.user_name}</p>
                    <p className="text-xs text-toss-text-ter">{year}년</p>
                  </div>
                  <div className="flex gap-4 mt-2">
                    <div>
                      <p className="text-xs text-toss-text-ter">연봉</p>
                      <p className="text-sm font-semibold">{formatKRW(member.annual_salary)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-toss-text-ter">총 지출</p>
                      <p className="text-sm font-semibold">{formatKRW(result.totalSpending)}</p>
                    </div>
                  </div>
                </div>

                {/* 공제 현황 */}
                <div className="px-5 py-4 border-b border-toss-border">
                  <p className="text-xs font-semibold text-toss-text-sub mb-3">공제 현황</p>
                  <div className="space-y-2">
                    {[
                      { label: "신용카드 (15%)", amount: result.creditDeduction, color: "text-toss-text" },
                      { label: "체크카드/현금 (30%)", amount: result.debitCashDeduction, color: "text-toss-blue" },
                      { label: "대중교통 (40%)", amount: result.transitDeduction, color: "text-green-600" },
                      { label: "전통시장 (40%)", amount: result.traditionalMarketDeduction, color: "text-orange-500" },
                    ].map((row) => (
                      <div key={row.label} className="flex justify-between">
                        <p className="text-xs text-toss-text-sub">{row.label}</p>
                        <p className={clsx("text-xs font-semibold", row.color)}>{formatKRW(row.amount)}</p>
                      </div>
                    ))}
                    <div className="flex justify-between pt-2 border-t border-toss-border">
                      <p className="text-xs font-bold text-toss-text">최종 공제액</p>
                      <p className="text-xs font-bold text-toss-blue">{formatKRW(result.finalDeduction)}</p>
                    </div>
                    <div className="flex justify-between">
                      <p className="text-xs text-toss-text-sub">예상 절세액 (세율 16.5%)</p>
                      <p className="text-xs font-bold text-green-600">{formatKRW(result.taxSaving)}</p>
                    </div>
                  </div>
                </div>

                {/* 추천 */}
                <div className="px-5 py-4 bg-toss-surface">
                  <p className="text-xs font-semibold text-toss-text-sub mb-1.5">💡 절세 추천</p>
                  <p className="text-xs text-toss-text leading-relaxed">{result.recommendation}</p>
                </div>
              </div>
            );
          })}

          {/* 카드 선택 가이드 */}
          <div className="bg-white rounded-2xl shadow-sm px-5 py-4">
            <p className="text-sm font-bold text-toss-text mb-3">카드 공제율 비교</p>
            <div className="space-y-2">
              {[
                { label: "신용카드", rate: "15%", tip: "한도 채운 후 사용", color: "bg-gray-100 text-gray-600" },
                { label: "체크카드/현금", rate: "30%", tip: "연봉 25% 초과분부터 우선", color: "bg-toss-blue-light text-toss-blue" },
                { label: "대중교통", rate: "40%", tip: "최대 100만원 추가 한도", color: "bg-green-50 text-green-600" },
                { label: "전통시장", rate: "40%", tip: "최대 100만원 추가 한도", color: "bg-orange-50 text-orange-500" },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-3">
                  <span className={clsx("text-xs font-bold px-2 py-1 rounded-lg w-14 text-center", row.color)}>{row.rate}</span>
                  <div>
                    <p className="text-xs font-semibold text-toss-text">{row.label}</p>
                    <p className="text-xs text-toss-text-ter">{row.tip}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
