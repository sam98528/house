import { createClient } from "@supabase/supabase-js";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Suspense } from "react";
import { AnnouncementFilters } from "@/components/announcement/filters";

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
};

export const revalidate = 3600;

interface PageProps {
  searchParams: Promise<{
    region?: string;
    status?: string;
    type?: string;
    subtype?: string;
    q?: string;
  }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;

  let query = supabase
    .from("announcements")
    .select("*")
    .order("pan_nt_st_dt", { ascending: false })
    .limit(100);

  if (params.region) {
    query = query.ilike("cnp_cd_nm", `%${params.region}%`);
  }
  if (params.status) {
    query = query.eq("pan_ss", params.status);
  }
  if (params.type) {
    query = query.eq("upp_ais_tp_nm", params.type);
  }
  if (params.subtype) {
    query = query.eq("ais_tp_cd_nm", params.subtype);
  }
  if (params.q) {
    query = query.ilike("pan_nm", `%${params.q}%`);
  }

  const { data: announcements, count } = await query;
  const items = announcements ?? [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-20 md:pb-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">청약하우스</h1>
        <p className="text-gray-500 text-sm mt-1">
          LH 분양임대 공고를 한눈에
        </p>
      </header>

      <Suspense fallback={<div className="h-20" />}>
        <AnnouncementFilters />
      </Suspense>

      {/* 결과 카운트 */}
      <div className="text-xs text-gray-400 mt-3 mb-2">
        {items.length}건의 공고
      </div>

      {items.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-2">조건에 맞는 공고가 없습니다</p>
          <p className="text-sm">필터를 변경해보세요</p>
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
