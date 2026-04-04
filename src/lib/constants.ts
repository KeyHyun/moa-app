import { SpendingCategory } from "@/types";

export const CATEGORY_CONFIG: Record<
  SpendingCategory,
  { icon: string; color: string; bg: string }
> = {
  식비: { icon: "🍽️", color: "#F04452", bg: "#FFF0F0" },
  교통: { icon: "🚌", color: "#3182F6", bg: "#ECF3FE" },
  쇼핑: { icon: "🛍️", color: "#FF8C00", bg: "#FFF8E6" },
  문화: { icon: "🎬", color: "#2DB400", bg: "#F0FFF4" },
  공과금: { icon: "💡", color: "#8B5CF6", bg: "#F5F0FF" },
  의료: { icon: "🏥", color: "#EC4899", bg: "#FFF0F8" },
  교육: { icon: "📚", color: "#0EA5E9", bg: "#F0FAFF" },
  기타: { icon: "💰", color: "#6B7684", bg: "#F2F4F6" },
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
  "식비",
  "교통",
  "쇼핑",
  "문화",
  "공과금",
  "의료",
  "교육",
  "기타",
];
