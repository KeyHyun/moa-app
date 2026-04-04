"use client";

interface AmountKeypadProps {
  onPress: (key: string) => void;
}

const keys = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["00", "0", "지우기"],
];

export function AmountKeypad({ onPress }: AmountKeypadProps) {
  return (
    <div className="grid grid-rows-4 gap-px bg-toss-border">
      {keys.map((row, rowIdx) => (
        <div key={rowIdx} className="grid grid-cols-3 gap-px">
          {row.map((key) => (
            <button
              key={key}
              onClick={() => onPress(key)}
              className={`
                h-14 text-lg font-medium transition-colors
                ${key === "지우기" || key === "00"
                  ? "bg-toss-surface text-toss-text-sub text-sm"
                  : "bg-white text-toss-text hover:bg-toss-surface active:bg-toss-border"
                }
              `}
            >
              {key}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
