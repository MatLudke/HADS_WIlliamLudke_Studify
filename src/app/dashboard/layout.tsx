'use client';

// import { PageTransition } from '@/components/dashboard/page-transition';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {children}
    </div>
  );
}
