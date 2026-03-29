import { createClient } from "@supabase/supabase-js";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const statusColor: Record<string, string> = {
  공고중: "bg-blue-100 text-blue-800",
  접수중: "bg-green-100 text-green-800",
  접수마감: "bg-gray-100 text-gray-600",
  상담요청: "bg-yellow-100 text-yellow-800",
  정정공고중: "bg-orange-100 text-orange-800",
};

const typeEmoji: Record<string, string> = {
  분양주택: "🏠",
  임대주택: "🏢",
  "공공분양(신혼희망)": "💒",
  토지: "🌍",
  상가: "🏪",
  주거복지: "🏘️",
};

export const revalidate = 3600; // 1시간마다 재생성

export default async function HomePage() {
  const { data: announcements, error } = await supabase
    .from("announcements")
    .select("*")
    .order("pan_nt_st_dt", { ascending: false })
    .limit(50);

  const items = announcements ?? [];
  const hasData = items.length > 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">청약하우스</h1>
        <p className="text-gray-500 text-sm mt-1">
          LH 분양임대 공고를 한눈에
        </p>
      </header>

      {/* 필터 칩 */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <Badge variant="secondary" className="whitespace-nowrap cursor-pointer">
          전체
        </Badge>
        <Badge variant="outline" className="whitespace-nowrap cursor-pointer">
          🏠 분양주택
        </Badge>
        <Badge variant="outline" className="whitespace-nowrap cursor-pointer">
          🏢 임대주택
        </Badge>
        <Badge variant="outline" className="whitespace-nowrap cursor-pointer">
          💒 신혼희망타운
        </Badge>
        <Badge variant="outline" className="whitespace-nowrap cursor-pointer">
          접수중
        </Badge>
      </div>

      {!hasData && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-2">공고 데이터가 없습니다</p>
          <p className="text-sm">
            <Link href="/api/sync" className="text-blue-500 underline">
              /api/sync
            </Link>
            를 호출하여 데이터를 동기화하세요
          </p>
        </div>
      )}

      {/* 공고 목록 */}
      <div className="space-y-3">
        {items.map((item) => (
          <a
            key={item.id}
            href={item.dtl_url_mob || item.dtl_url || "#"}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Card className="cursor-pointer hover:shadow-md transition-shadow mb-3">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-tight">
                    {typeEmoji[item.upp_ais_tp_nm] || "📋"}{" "}
                    {item.pan_nm}
                  </CardTitle>
                  <Badge
                    className={`shrink-0 text-xs ${statusColor[item.pan_ss] || "bg-gray-100 text-gray-600"}`}
                  >
                    {item.pan_ss}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  {item.cnp_cd_nm}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span>{item.upp_ais_tp_nm}</span>
                  {item.ais_tp_cd_nm && (
                    <>
                      <span>·</span>
                      <span>{item.ais_tp_cd_nm}</span>
                    </>
                  )}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {item.pan_nt_st_dt} ~ {item.clsg_dt}
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}
