"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  BookOpen,
  BarChart2,
  Settings,
  LogOut,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

// ─── Nav config per role ───────────────────────────────────────────────────────

const learnerNav = [
  { label: "Dashboard",     href: "/dashboard",      icon: LayoutDashboard },
  { label: "Find Mentors",  href: "/mentors",         icon: Users },
  { label: "My Sessions",   href: "/sessions",        icon: CalendarDays },
];

const mentorNav = [
  { label: "Dashboard",     href: "/mentor/dashboard",    icon: LayoutDashboard },
  { label: "Availability",  href: "/mentor/availability", icon: CalendarDays },
  { label: "Sessions",      href: "/mentor/sessions",     icon: BookOpen },
  { label: "Performance",   href: "/mentor/performance",  icon: BarChart2 },
];

const adminNav = [
  { label: "Dashboard",     href: "/admin/dashboard",  icon: LayoutDashboard },
  { label: "Users",         href: "/admin/users",      icon: Users },
  { label: "Sessions",      href: "/admin/sessions",   icon: CalendarDays },
  { label: "Analytics",     href: "/admin/analytics",  icon: BarChart2 },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = "learner" | "mentor" | "admin";

interface SidebarProps {
  role: Role;
  userName?: string;
  userTitle?: string;
  userAvatar?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Sidebar({ role, userName = "User", userTitle, userAvatar }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const navItems =
    role === "learner" ? learnerNav :
    role === "mentor"  ? mentorNav  :
    adminNav;

  const roleLabel =
    role === "learner" ? "Learner" :
    role === "mentor"  ? "Mentor"  :
    "Admin";

  const roleColor =
    role === "learner" ? "bg-primary-light text-text-accent" :
    role === "mentor"  ? "bg-secondary-light text-secondary-dark" :
    "bg-accent-light text-accent-foreground";

  return (
    <aside
      className={cn(
        "relative flex flex-col h-screen border-r transition-all duration-300 ease-in-out shrink-0",
        "bg-card border-border",
        collapsed ? "w-[68px]" : "w-[230px]"
      )}
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          "absolute -right-3 top-6 z-10 flex h-6 w-6 items-center justify-center",
          "rounded-full border border-border bg-card shadow-sm",
          "text-text-tertiary hover:text-text-primary hover:border-primary transition-colors"
        )}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed
          ? <ChevronRight className="h-3 w-3" />
          : <ChevronLeft className="h-3 w-3" />
        }
      </button>

      {/* Logo */}
      <div className={cn(
        "flex items-center gap-2.5 px-4 h-16 border-b border-border shrink-0",
        collapsed && "justify-center px-2"
      )}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
          <GraduationCap className="h-4 w-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="text-lg font-semibold tracking-tight text-text-primary">
            Zuvy
          </span>
        )}
      </div>

      {/* Role badge */}
      {!collapsed && (
        <div className="px-4 pt-4 pb-2">
          <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", roleColor)}>
            {roleLabel}
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        <ul className="flex flex-col gap-0.5">
          {navItems.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    collapsed && "justify-center px-2",
                    active
                      ? "bg-primary-light text-text-accent"
                      : "text-text-secondary hover:bg-muted hover:text-text-primary"
                  )}
                  title={collapsed ? label : undefined}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-text-tertiary")} />
                  {!collapsed && <span>{label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom — user + settings + logout */}
      <div className={cn("border-t border-border p-3 space-y-1", collapsed && "px-2")}>
        {/* Settings */}
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            "text-text-secondary hover:bg-muted hover:text-text-primary",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? "Settings" : undefined}
        >
          <Settings className="h-4 w-4 shrink-0 text-text-tertiary" />
          {!collapsed && <span>Settings</span>}
        </Link>

        {/* Logout */}
        <button
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            "text-text-secondary hover:bg-destructive-light hover:text-destructive",
            collapsed && "justify-center px-2"
          )}
          title={collapsed ? "Sign Out" : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>

        {/* User card */}
        {!collapsed && (
          <div className="flex items-center gap-3 rounded-lg bg-muted px-3 py-2.5 mt-2">
            <div className="h-8 w-8 shrink-0 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">
              {userAvatar
                ? <img src={userAvatar} alt={userName} className="h-8 w-8 rounded-full object-cover" />
                : userName.charAt(0).toUpperCase()
              }
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{userName}</p>
              {userTitle && (
                <p className="text-xs text-text-muted truncate">{userTitle}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
