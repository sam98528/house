import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

export const metadata: Metadata = {
  title: "청약하우스 - LH 분양임대 공고 맞춤형 뷰어",
  description:
    "한국토지주택공사(LH) 분양/임대 공고를 내 조건에 맞게 필터링하여 간편하게 확인하세요.",
  keywords: ["청약", "분양", "임대", "LH", "공공주택", "청약홈"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${notoSansKr.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-noto-sans-kr)]">
        {children}
      </body>
    </html>
  );
}
