import DashboardLayout from "@/components/layout/DashboardLayout";

export default function AdminDashboard() {
  return (
    <DashboardLayout
      role="admin"
      pageTitle="Admin Dashboard"
      pageSubtitle="Platform overview and management."
      userName="Admin"
      userTitle="Platform Admin"
    >
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center space-y-2">
          <p className="text-text-muted text-sm">Admin panel coming soon.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
