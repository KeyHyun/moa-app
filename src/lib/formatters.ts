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
