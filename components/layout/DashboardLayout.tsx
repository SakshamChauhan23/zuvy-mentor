import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

type Role = "learner" | "mentor" | "admin";

interface DashboardLayoutProps {
  role: Role;
  pageTitle: string;
  pageSubtitle?: string;
  topbarActions?: React.ReactNode;
  userName?: string;
  userTitle?: string;
  children: React.ReactNode;
}

export default function DashboardLayout({
  role,
  pageTitle,
  pageSubtitle,
  topbarActions,
  userName,
  userTitle,
  children,
}: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar role={role} userName={userName} userTitle={userTitle} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title={pageTitle} subtitle={pageSubtitle} actions={topbarActions} />

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
