export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
}

export type AssetType =
  | "cash"
  | "savings"
  | "installment"
  | "investment"
  | "realEstate"
  | "loan"
  | "mortgage"
  | "creditLoan";

export type Visibility = "family" | "private";

export interface AssetItem {
  id: string;
  type: AssetType;
  label: string;
  amount: number;
  deltaAmount: number;
  deltaPercent: number;
  institution: string;
  visibility?: Visibility;
  user_id?: number;
  user_name?: string;
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
  visibility?: Visibility;
}

export interface RegisterPayload {
  username: string;
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface PropertyWishlist {
  id: number;
  user_id: number;
  family_id: number | null;
  name: string;
  address: string;
  price: number | null;
  property_type: string;
  area: number | null;
  floor: string;
  naver_url: string;
  notes: string;
  visibility: Visibility;
  created_at: string;
}

export interface MonthlyBudget {
  id: number;
  user_id: number;
  year: number;
  month: number;
  budget_amount: number;
}

export interface SalaryInfo {
  id: number;
  user_id: number;
  year: number;
  annual_salary: number;
  credit_card_spending: number;
  debit_card_spending: number;
  cash_spending: number;
  transit_spending: number;
  traditional_market_spending: number;
}

// ── 여행가계부 ──
export interface Trip {
  id: number;
  name: string;
  destination: string;
  start_date: string;
  end_date: string;
  description: string;
  currency: string;
  invite_code: string;
  owner_id: number;
  created_at: string;
}

export interface TripMember {
  id: number;
  trip_id: number;
  user_id: number | null;
  guest_name: string;
  name: string;
  role: "owner" | "member";
  is_guest: boolean;
  joined_at: string;
}

export interface TripExpense {
  id: number;
  trip_id: number;
  paid_by_member_id: number;
  paid_by_name: string;
  amount: number;
  description: string;
  category: string;
  date: string;
  split_type: "equal" | "custom";
  created_at: string;
  splits: TripExpenseSplit[];
}

export interface TripExpenseSplit {
  member_id: number;
  user_name: string;
  share_amount: number;
}

export interface SettlementEntry {
  from_member_id: number;
  from_member_name: string;
  to_member_id: number;
  to_member_name: string;
  amount: number;
}

export interface SettlementSummary {
  totalExpense: number;
  members: {
    memberId: number;
    name: string;
    paid: number;
    share: number;
    balance: number;
  }[];
}
