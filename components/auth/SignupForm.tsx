"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff, Loader2, GraduationCap, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

type Role = "learner" | "mentor";

const roles: { value: Role; label: string; description: string; icon: React.ElementType }[] = [
  {
    value: "learner",
    label: "Learner",
    description: "Find mentors and book sessions to grow your skills.",
    icon: GraduationCap,
  },
  {
    value: "mentor",
    label: "Mentor",
    description: "Share your expertise and guide learners in their journey.",
    icon: Briefcase,
  },
];

export default function SignupForm() {
  const [selectedRole, setSelectedRole] = useState<Role>("learner");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // API integration will go here
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
  };

  return (
    <div className="w-full max-w-[420px]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Create your account</h1>
        <p className="mt-1.5 text-sm text-text-secondary">
          Join Zuvy and start your mentorship journey.
        </p>
      </div>

      {/* Role selector */}
      <div className="mb-6">
        <p className="mb-2.5 text-sm font-medium text-text-primary">I want to join as a…</p>
        <div className="grid grid-cols-2 gap-3">
          {roles.map(({ value, label, description, icon: Icon }) => {
            const active = selectedRole === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setSelectedRole(value)}
                className={cn(
                  "flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all",
                  active
                    ? "border-primary bg-primary-light"
                    : "border-border bg-card hover:border-grey hover:bg-muted"
                )}
              >
                <div className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg",
                  active ? "bg-primary text-primary-foreground" : "bg-muted text-text-tertiary"
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className={cn("text-sm font-semibold", active ? "text-text-accent" : "text-text-primary")}>
                    {label}
                  </p>
                  <p className="text-xs text-text-muted leading-snug mt-0.5">{description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label htmlFor="firstName" className="block text-sm font-medium text-text-primary">
              First name
            </label>
            <input
              id="firstName"
              type="text"
              autoComplete="given-name"
              required
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              placeholder="Jane"
              className={cn(
                "w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-text-primary",
                "placeholder:text-text-muted",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
              )}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="lastName" className="block text-sm font-medium text-text-primary">
              Last name
            </label>
            <input
              id="lastName"
              type="text"
              autoComplete="family-name"
              required
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              placeholder="Doe"
              className={cn(
                "w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-text-primary",
                "placeholder:text-text-muted",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
              )}
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-medium text-text-primary">
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
            className={cn(
              "w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-sm text-text-primary",
              "placeholder:text-text-muted",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
            )}
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-sm font-medium text-text-primary">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Min. 8 characters"
              className={cn(
                "w-full rounded-lg border border-border bg-card px-3.5 py-2.5 pr-10 text-sm text-text-primary",
                "placeholder:text-text-muted",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow"
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {/* Password strength hint */}
          {form.password && (
            <div className="flex gap-1 mt-1.5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    form.password.length < 6
                      ? i === 1 ? "bg-destructive" : "bg-grey-light"
                      : form.password.length < 10
                      ? i <= 2 ? "bg-warning" : "bg-grey-light"
                      : "bg-success"
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Terms */}
        <p className="text-xs text-text-muted leading-relaxed">
          By creating an account you agree to our{" "}
          <Link href="/terms" className="text-text-interactive hover:underline">Terms of Service</Link>
          {" "}and{" "}
          <Link href="/privacy" className="text-text-interactive hover:underline">Privacy Policy</Link>.
        </p>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className={cn(
            "w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5",
            "bg-primary text-primary-foreground text-sm font-semibold",
            "hover:bg-primary-dark transition-colors",
            "disabled:opacity-60 disabled:cursor-not-allowed"
          )}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Creating account…" : `Create ${selectedRole === "learner" ? "Learner" : "Mentor"} Account`}
        </button>
      </form>

      {/* Sign in link */}
      <p className="mt-6 text-center text-sm text-text-secondary">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-text-interactive hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
