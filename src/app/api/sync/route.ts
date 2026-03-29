import { NextResponse } from "next/server";

// Vercel Cron으로 매일 실행
// vercel.json: { "crons": [{ "path": "/api/sync", "schedule": "0 9 * * *" }] }
export async function GET(request: Request) {
  // Cron 인증 확인
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // TODO: 공공데이터 API → Supabase 동기화 구현
    // 1. fetchLHAnnouncements() 호출
    // 2. 기존 데이터와 비교
    // 3. 새로운/변경된 공고 upsert
    // 4. 알림 설정된 사용자에게 notification

    return NextResponse.json({
      success: true,
      message: "동기화 완료",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("동기화 실패:", error);
    return NextResponse.json(
      { error: "동기화 중 오류 발생" },
      { status: 500 }
    );
  }
}
