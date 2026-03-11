'use client';

import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <meta name="theme-color" content="#ffffff" />
        <title>나랑 싸울래? | AI 연애재판소</title>
        <meta name="description" content="AI 판사가 커플/친구 간 갈등을 공정하게 판결합니다" />
        <meta property="og:title" content="나랑 싸울래? | AI 연애재판소" />
        <meta property="og:description" content="AI 판사가 커플/친구 간 갈등을 공정하게 판결합니다" />
        <meta property="og:type" content="website" />
      </head>
      <body>
        <main className="min-h-screen safe-top safe-bottom">
          {children}
        </main>
      </body>
    </html>
  );
}
