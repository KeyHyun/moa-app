export function formatKRW(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 100000000) {
    const eok = Math.floor(abs / 100000000);
    const man = Math.floor((abs % 100000000) / 10000);
    const sign = amount < 0 ? "-" : "";
    if (man === 0) return `${sign}${eok.toLocaleString()}억원`;
    return `${sign}${eok.toLocaleString()}억 ${man.toLocaleString()}만원`;
  }
  if (abs >= 10000) {
    const man = Math.floor(abs / 10000);
    const rest = abs % 10000;
    const sign = amount < 0 ? "-" : "";
    if (rest === 0) return `${sign}${man.toLocaleString()}만원`;
    return `${sign}${abs.toLocaleString()}원`;
  }
  const sign = amount < 0 ? "-" : "";
  return `${sign}${abs.toLocaleString()}원`;
}

export const CURRENCY_SYMBOLS: Record<string, string> = {
  KRW: "원",
  USD: "달러",
  EUR: "유로",
  JPY: "엔",
  CNY: "위안",
  GBP: "파운드",
  THB: "바트",
  VND: "동",
  PHP: "페소",
  TWD: "대만달러",
  SGD: "싱가포르달러",
  MYR: "링깃",
  IDR: "루피아",
  AUD: "호주달러",
  CAD: "캐나다달러",
};

export const CURRENCY_OPTIONS = [
  { code: "KRW", label: "한국 원 (₩)" },
  { code: "USD", label: "미국 달러 ($)" },
  { code: "EUR", label: "유로 (€)" },
  { code: "JPY", label: "일본 엔 (¥)" },
  { code: "CNY", label: "중국 위안 (¥)" },
  { code: "GBP", label: "영국 파운드 (£)" },
  { code: "THB", label: "태국 바트 (฿)" },
  { code: "VND", label: "베트남 동 (₫)" },
  { code: "PHP", label: "필리핀 페소 (₱)" },
  { code: "TWD", label: "대만 달러 (NT$)" },
  { code: "SGD", label: "싱가포르 달러 (S$)" },
  { code: "MYR", label: "말레이시아 링깃 (RM)" },
  { code: "IDR", label: "인도네시아 루피아 (Rp)" },
  { code: "AUD", label: "호주 달러 (A$)" },
  { code: "CAD", label: "캐나다 달러 (C$)" },
];

export function formatCurrency(amount: number, currency: string = "KRW"): string {
  if (currency === "KRW") return formatKRW(amount);
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  return `${sign}${abs.toLocaleString()}${symbol}`;
}

export function formatKRWShort(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  if (abs >= 100000000) {
    const eok = (abs / 100000000).toFixed(1);
    return `${sign}${eok}억`;
  }
  if (abs >= 10000) {
    const man = Math.floor(abs / 10000);
    return `${sign}${man.toLocaleString()}만`;
  }
  return `${sign}${abs.toLocaleString()}`;
}

export function formatDelta(amount: number, percent: number): string {
  const sign = amount >= 0 ? "+" : "";
  return `${sign}${formatKRW(amount)} (${sign}${percent.toFixed(1)}%)`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${days[date.getDay()]})`;
}

export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const h = date.getHours();
  const m = date.getMinutes().toString().padStart(2, "0");
  const ampm = h < 12 ? "오전" : "오후";
  const hour = h % 12 || 12;
  return `${ampm} ${hour}:${m}`;
}

export function isToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

// "YYYY-MM-DD" 문자열을 로컬 시간 기준으로 파싱 (new Date("YYYY-MM-DD")는 UTC로 처리되므로 사용 금지)
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
