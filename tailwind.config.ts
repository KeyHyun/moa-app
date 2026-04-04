import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        toss: {
          blue: "#3182F6",
          "blue-light": "#ECF3FE",
          "blue-dark": "#1B64DA",
          text: "#191F28",
          "text-sub": "#6B7684",
          "text-ter": "#8B95A1",
          surface: "#F2F4F6",
          card: "#FFFFFF",
          border: "#E5E8EB",
          red: "#F04452",
          green: "#2DB400",
          orange: "#FF8C00",
        },
      },
      borderRadius: {
        card: "16px",
        pill: "999px",
        input: "10px",
      },
      boxShadow: {
        card: "0 2px 12px 0 rgba(0,0,0,0.06)",
      },
      fontFamily: {
        sans: [
          "Pretendard Variable",
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "system-ui",
          "Roboto",
          "Helvetica Neue",
          "Segoe UI",
          "Apple SD Gothic Neo",
          "Noto Sans KR",
          "Malgun Gothic",
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
export default config;
