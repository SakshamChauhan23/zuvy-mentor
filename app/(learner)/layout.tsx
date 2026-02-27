import DashboardLayout from "@/components/layout/DashboardLayout";

// Page title is passed per-page; layout only wraps with sidebar + shell.
// Each child page controls its own title via DashboardLayout props.
export default function LearnerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
