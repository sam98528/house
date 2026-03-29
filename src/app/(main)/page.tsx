import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// 임시 데이터 - 추후 Supabase에서 가져올 예정
const mockAnnouncements = [
  {
    id: "1",
    title: "서울 강서구 마곡지구 A-1블록 국민임대주택",
    regionSido: "서울특별시",
    regionSigungu: "강서구",
    supplyType: "임대" as const,
    supplyMethod: "일반공급" as const,
    unitCount: 320,
    applyStartDate: "2026-04-01",
    applyEndDate: "2026-04-15",
    status: "접수예정" as const,
  },
  {
    id: "2",
    title: "경기도 화성시 동탄2 A-95블록 행복주택",
    regionSido: "경기도",
    regionSigungu: "화성시",
    supplyType: "임대" as const,
    supplyMethod: "특별공급" as const,
    unitCount: 150,
    applyStartDate: "2026-03-25",
    applyEndDate: "2026-04-05",
    status: "접수중" as const,
  },
  {
    id: "3",
    title: "인천 미추홀구 주안역 공공분양",
    regionSido: "인천광역시",
    regionSigungu: "미추홀구",
    supplyType: "분양" as const,
    supplyMethod: "일반공급" as const,
    unitCount: 480,
    applyStartDate: "2026-03-20",
    applyEndDate: "2026-03-28",
    status: "마감" as const,
  },
];

const statusColor: Record<string, string> = {
  접수예정: "bg-yellow-100 text-yellow-800",
  접수중: "bg-green-100 text-green-800",
  마감: "bg-gray-100 text-gray-600",
  당첨발표: "bg-blue-100 text-blue-800",
};

export default function HomePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">청약하우스</h1>
        <p className="text-gray-500 text-sm mt-1">
          LH 분양임대 공고를 한눈에
        </p>
      </header>

      {/* 필터 영역 - 추후 구현 */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <Badge variant="secondary" className="whitespace-nowrap cursor-pointer">
          전체 지역
        </Badge>
        <Badge variant="outline" className="whitespace-nowrap cursor-pointer">
          분양
        </Badge>
        <Badge variant="outline" className="whitespace-nowrap cursor-pointer">
          임대
        </Badge>
        <Badge variant="outline" className="whitespace-nowrap cursor-pointer">
          접수중
        </Badge>
      </div>

      {/* 공고 목록 */}
      <div className="space-y-3">
        {mockAnnouncements.map((item) => (
          <Card key={item.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base leading-tight">
                  {item.title}
                </CardTitle>
                <Badge
                  className={cn(
                    "shrink-0 text-xs",
                    statusColor[item.status]
                  )}
                >
                  {item.status}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                {item.regionSido} {item.regionSigungu}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>
                  {item.supplyType} · {item.supplyMethod}
                </span>
                <span>{item.unitCount}세대</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {item.applyStartDate} ~ {item.applyEndDate}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
