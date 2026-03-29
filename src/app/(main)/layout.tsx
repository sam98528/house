import { BottomNav } from "@/components/layout/bottom-nav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-full min-h-dvh">
      <main className="flex-1 flex flex-col">{children}</main>
      <BottomNav />
    </div>
  );
}
