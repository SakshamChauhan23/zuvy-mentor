import { GraduationCap } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Left — branding panel */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[560px] flex-col justify-between bg-primary p-12 shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">Zuvy</span>
        </div>

        {/* Hero text */}
        <div className="space-y-4">
          <h2 className="text-4xl font-bold text-white leading-tight">
            Mentorship that moves you forward.
          </h2>
          <p className="text-white/70 text-lg leading-relaxed">
            Connect with expert mentors, book sessions that fit your schedule, and track your growth — all in one place.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: "500+", label: "Active Mentors" },
            { value: "10k+", label: "Sessions Booked" },
            { value: "4.9★", label: "Avg. Rating" },
          ].map(({ value, label }) => (
            <div key={label} className="rounded-xl bg-white/10 p-4">
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-sm text-white/60 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right — form area */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
        {children}
      </div>
    </div>
  );
}
