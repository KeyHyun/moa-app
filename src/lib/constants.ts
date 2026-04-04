import { SpendingCategory } from "@/types";

export const CATEGORY_CONFIG: Record<string, { icon: string; color: string; bg: string }> = {
  // 지출
  식비:   { icon: "🍽️", color: "#F04452", bg: "#FFF0F0" },
  교통:   { icon: "🚌", color: "#3182F6", bg: "#ECF3FE" },
  쇼핑:   { icon: "🛍️", color: "#FF8C00", bg: "#FFF8E6" },
  문화:   { icon: "🎬", color: "#2DB400", bg: "#F0FFF4" },
  공과금: { icon: "💡", color: "#8B5CF6", bg: "#F5F0FF" },
  의료:   { icon: "🏥", color: "#EC4899", bg: "#FFF0F8" },
  교육:   { icon: "📚", color: "#0EA5E9", bg: "#F0FAFF" },
  기타:   { icon: "💰", color: "#6B7684", bg: "#F2F4F6" },
  // 수입
  급여:     { icon: "💰", color: "#2DB400", bg: "#F0FFF4" },
  부업:     { icon: "💼", color: "#3182F6", bg: "#ECF3FE" },
  용돈:     { icon: "🎁", color: "#FF8C00", bg: "#FFF8E6" },
  투자수익: { icon: "📈", color: "#8B5CF6", bg: "#F5F0FF" },
  기타수입: { icon: "💵", color: "#6B7684", bg: "#F2F4F6" },
};

export const ASSET_TYPE_CONFIG = {
  cash: { icon: "💵", label: "현금", isLiability: false },
  savings: { icon: "🏦", label: "예금", isLiability: false },
  installment: { icon: "💳", label: "적금", isLiability: false },
  investment: { icon: "📈", label: "주식·펀드", isLiability: false },
  realEstate: { icon: "🏠", label: "부동산", isLiability: false },
  loan: { icon: "📋", label: "일반 대출", isLiability: true },
  mortgage: { icon: "🏠", label: "주택담보대출", isLiability: true },
  creditLoan: { icon: "💸", label: "신용대출", isLiability: true },
};

export const SPENDING_CATEGORIES: SpendingCategory[] = [
  "식비", "교통", "쇼핑", "문화", "공과금", "의료", "교육", "기타",
];

export const INCOME_CATEGORIES = ["급여", "부업", "용돈", "투자수익", "기타수입"] as const;
export type IncomeCategory = typeof INCOME_CATEGORIES[number];

export const SUB_CATEGORY_PRESETS: Record<string, string[]> = {
  식비:  ["카페", "편의점", "마트", "배달음식", "외식", "회식", "패스트푸드"],
  교통:  ["지하철/버스", "택시", "주유", "주차", "KTX/기차", "비행기"],
  쇼핑:  ["의류", "가전/전자", "생활용품", "온라인쇼핑", "화장품", "잡화"],
  문화:  ["영화", "공연/전시", "여행", "스포츠", "게임", "구독서비스"],
  공과금: ["전기요금", "가스요금", "수도요금", "통신비", "인터넷"],
  의료:  ["병원", "약국", "치과", "한의원", "건강검진"],
  교육:  ["학원", "도서", "온라인강의", "학용품", "유치원/보육"],
  기타:      ["경조사", "보험", "반려동물", "미용", "세금"],
  급여:      ["월급", "성과급", "상여금", "퇴직금"],
  부업:      ["프리랜서", "아르바이트", "판매수익", "강의"],
  투자수익:  ["주식배당", "펀드수익", "이자수익", "부동산수익"],
  기타수입:  ["환급금", "보험수령", "경조사수입", "선물"],
};
