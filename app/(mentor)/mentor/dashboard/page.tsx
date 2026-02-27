import DashboardLayout from "@/components/layout/DashboardLayout";

export default function MentorDashboard() {
  return (
    <DashboardLayout
      role="mentor"
      pageTitle="Mentor Dashboard"
      pageSubtitle="Manage your sessions and availability."
      userName="Alex Johnson"
      userTitle="Senior Engineer"
    >
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center space-y-2">
          <p className="text-text-muted text-sm">Mentor dashboard coming soon.</p>
          <p className="text-text-tertiary text-xs">Availability management is up next.</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
