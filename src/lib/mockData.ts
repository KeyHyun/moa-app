import { AssetItem, SpendingItem, TrendPoint, User } from "@/types";
import { isSameDay } from "./formatters";

export const MOCK_USERS: (User & { password: string })[] = [
  {
    id: "1",
    username: "test",
    password: "test1234",
    name: "홍길동",
    email: "test@example.com",
    phone: "010-1234-5678",
    createdAt: "2025-01-01T00:00:00Z",
  },
];

export const MOCK_ASSETS: AssetItem[] = [
  {
    id: "a1",
    type: "cash",
    label: "현금",
    amount: 3200000,
    deltaAmount: 150000,
    deltaPercent: 4.9,
    institution: "토스뱅크",
  },
  {
    id: "a2",
    type: "savings",
    label: "예금",
    amount: 28500000,
    deltaAmount: 500000,
    deltaPercent: 1.8,
    institution: "국민은행",
  },
  {
    id: "a3",
    type: "installment",
    label: "적금",
    amount: 12000000,
    deltaAmount: 300000,
    deltaPercent: 2.6,
    institution: "카카오뱅크",
  },
  {
    id: "a4",
    type: "investment",
    label: "주식·펀드",
    amount: 18420000,
    deltaAmount: -520000,
    deltaPercent: -2.7,
    institution: "토스증권",
  },
  {
    id: "a5",
    type: "realEstate",
    label: "부동산",
    amount: 450000000,
    deltaAmount: 5000000,
    deltaPercent: 1.1,
    institution: "직접 입력",
  },
];

function daysAgo(n: number, h = 12, m = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
}

export const MOCK_SPENDING: SpendingItem[] = [
  // 오늘
  {
    id: "s1",
    category: "식비",
    description: "스타벅스",
    amount: 6500,
    type: "expense",
    datetime: daysAgo(0, 8, 30),
    memo: "아이스 아메리카노",
  },
  {
    id: "s2",
    category: "교통",
    description: "지하철",
    amount: 1400,
    type: "expense",
    datetime: daysAgo(0, 9, 10),
  },
  {
    id: "s3",
    category: "식비",
    description: "점심 식사",
    amount: 12000,
    type: "expense",
    datetime: daysAgo(0, 12, 30),
    memo: "회사 근처 국밥집",
  },
  {
    id: "s4",
    category: "쇼핑",
    description: "쿠팡",
    amount: 35800,
    type: "expense",
    datetime: daysAgo(0, 14, 0),
  },
  {
    id: "s5",
    category: "교통",
    description: "카카오택시",
    amount: 8600,
    type: "expense",
    datetime: daysAgo(0, 18, 45),
  },
  // 어제
  {
    id: "s6",
    category: "식비",
    description: "GS25",
    amount: 4200,
    type: "expense",
    datetime: daysAgo(1, 10, 0),
  },
  {
    id: "s7",
    category: "문화",
    description: "넷플릭스",
    amount: 17000,
    type: "expense",
    datetime: daysAgo(1, 11, 0),
  },
  {
    id: "s8",
    category: "식비",
    description: "저녁 배달",
    amount: 22000,
    type: "expense",
    datetime: daysAgo(1, 19, 30),
    memo: "치킨 배달",
  },
  {
    id: "s9",
    category: "의료",
    description: "병원비",
    amount: 15000,
    type: "expense",
    datetime: daysAgo(1, 15, 0),
  },
  // 2일 전
  {
    id: "s10",
    category: "공과금",
    description: "전기요금",
    amount: 45600,
    type: "expense",
    datetime: daysAgo(2, 9, 0),
  },
  {
    id: "s11",
    category: "교육",
    description: "인프런 강의",
    amount: 33000,
    type: "expense",
    datetime: daysAgo(2, 13, 0),
  },
  {
    id: "s12",
    category: "식비",
    description: "마트 장보기",
    amount: 78500,
    type: "expense",
    datetime: daysAgo(2, 16, 0),
    memo: "이마트",
  },
  // 3일 전
  {
    id: "s13",
    category: "교통",
    description: "주유",
    amount: 65000,
    type: "expense",
    datetime: daysAgo(3, 11, 0),
  },
  {
    id: "s14",
    category: "쇼핑",
    description: "무신사",
    amount: 89000,
    type: "expense",
    datetime: daysAgo(3, 14, 0),
  },
  {
    id: "s15",
    category: "식비",
    description: "카페",
    amount: 13500,
    type: "expense",
    datetime: daysAgo(3, 15, 0),
  },
  // 5일 전
  {
    id: "s16",
    category: "기타",
    description: "월급",
    amount: 3500000,
    type: "income",
    datetime: daysAgo(5, 9, 0),
    memo: "3월 급여",
  },
  {
    id: "s17",
    category: "공과금",
    description: "통신비",
    amount: 55000,
    type: "expense",
    datetime: daysAgo(5, 10, 0),
  },
  {
    id: "s18",
    category: "식비",
    description: "회식",
    amount: 35000,
    type: "expense",
    datetime: daysAgo(5, 19, 0),
    memo: "팀 회식",
  },
  {
    id: "s19",
    category: "의료",
    description: "약국",
    amount: 8500,
    type: "expense",
    datetime: daysAgo(6, 14, 0),
  },
  {
    id: "s20",
    category: "쇼핑",
    description: "다이소",
    amount: 12000,
    type: "expense",
    datetime: daysAgo(7, 16, 0),
  },
];

function generateTrend(): TrendPoint[] {
  const points: TrendPoint[] = [];
  let base = 509000000;
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const change = (Math.random() - 0.4) * 2000000;
    base += change;
    points.push({
      date: d.toISOString().slice(0, 10),
      total: Math.round(base),
    });
  }
  return points;
}

export const MOCK_TREND: TrendPoint[] = generateTrend();

export const fetchMockAssets = (): Promise<AssetItem[]> =>
  new Promise((resolve) => setTimeout(() => resolve(MOCK_ASSETS), 600));

export const fetchMockSpending = (date: Date): Promise<SpendingItem[]> =>
  new Promise((resolve) =>
    setTimeout(
      () =>
        resolve(
          MOCK_SPENDING.filter((s) => isSameDay(new Date(s.datetime), date))
        ),
      400
    )
  );

export const fetchMockTrend = (): Promise<TrendPoint[]> =>
  new Promise((resolve) => setTimeout(() => resolve(MOCK_TREND), 500));
