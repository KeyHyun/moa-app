import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  const imgPath = path.join(process.cwd(), "public", "icon-512.png");
  const imgData = fs.readFileSync(imgPath);
  const base64 = imgData.toString("base64");

  return new ImageResponse(
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`data:image/png;base64,${base64}`}
      width={32}
      height={32}
      alt="icon"
    />,
    { ...size }
  );
}
