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
import { formatDate, formatWon } from "@/lib/api/myhome-v2";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const statusColor: Record<string, string> = {
  일반공고: "bg-blue-100 text-blue-800",
  정정공고: "bg-orange-100 text-orange-800",
};

export const revalidate = 3600;

interface PageProps {
  searchParams: Promise<{
    region?: string;
    status?: string;
    type?: string;
    q?: string;
  }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;

  let query = supabase
    .from("announcements")
    .select("*")
    .order("rcrit_pblanc_de", { ascending: false })
    .limit(100);

  if (params.region) query = query.eq("brtc_nm", params.region);
  if (params.status) query = query.eq("sttus_nm", params.status);
  if (params.type) query = query.eq("source", params.type);
  if (params.q) query = query.ilike("pblanc_nm", `%${params.q}%`);

  const { data: announcements } = await query;
  const items = announcements ?? [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-20 md:pb-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold">청약하우스</h1>
        <p className="text-gray-500 text-sm mt-1">
          공공주택 모집공고를 한눈에
        </p>
      </header>

      <Suspense fallback={<div className="h-20" />}>
        <AnnouncementFilters />
      </Suspense>

      <div className="text-xs text-gray-400 mt-3 mb-2">
        {items.length}건의 공고
      </div>

      {items.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-2">조건에 맞는 공고가 없습니다</p>
          <p className="text-sm">필터를 변경해보세요</p>
        </div>
      )}

      <div className="space-y-3">
        {items.map((item) => (
          <a
            key={item.id}
            href={item.mobile_url || item.pc_url || item.detail_url || "#"}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Card className="cursor-pointer hover:shadow-md transition-shadow mb-3">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base leading-tight">
                    {item.source === "sale" ? "🏠" : "🏢"}{" "}
                    {item.pblanc_nm}
                  </CardTitle>
                  <Badge
                    className={`shrink-0 text-xs ${statusColor[item.sttus_nm] || "bg-gray-100 text-gray-600"}`}
                  >
                    {item.sttus_nm}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  📍 {item.full_adres || `${item.brtc_nm} ${item.signgu_nm}`}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span>{item.hsmp_nm}</span>
                  {item.suply_ty_nm && (
                    <>
                      <span>·</span>
                      <span>{item.suply_ty_nm}</span>
                    </>
                  )}
                  {item.house_ty_nm && (
                    <>
                      <span>·</span>
                      <span>{item.house_ty_nm}</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                  {item.sum_suply_co && <span>{item.sum_suply_co}호 공급</span>}
                  {item.rent_gtn > 0 && <span>보증금 {formatWon(item.rent_gtn)}</span>}
                  {item.mt_rntchrg > 0 && <span>월 {formatWon(item.mt_rntchrg)}</span>}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  모집 {formatDate(item.begin_de)} ~ {formatDate(item.end_de)}
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
      </div>
    </div>
  );
}
