import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "모아 - 가족 자산 관리",
  description: "가족이 함께 모으고, 함께 관리하는 자산 서비스",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
