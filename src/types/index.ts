export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

export type AssetType = "cash" | "savings" | "installment" | "investment" | "realEstate";

export interface AssetItem {
  id: string;
  type: AssetType;
  label: string;
  amount: number;
  deltaAmount: number;
  deltaPercent: number;
  institution: string;
}

export interface TrendPoint {
  date: string;
  total: number;
}

export type SpendingCategory =
  | "식비"
  | "교통"
  | "쇼핑"
  | "문화"
  | "공과금"
  | "의료"
  | "교육"
  | "기타";

export type SpendingType = "expense" | "income";

export interface SpendingItem {
  id: string;
  category: SpendingCategory;
  description: string;
  amount: number;
  type: SpendingType;
  datetime: string;
  memo?: string;
}

export interface RegisterPayload {
  username: string;
  name: string;
  email: string;
  phone: string;
  password: string;
}
