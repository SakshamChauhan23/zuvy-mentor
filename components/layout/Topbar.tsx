"use client";

import { Bell, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopbarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export default function Topbar({ title, subtitle, actions }: TopbarProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-6">
      {/* Page title */}
      <div>
        <h1 className="text-lg font-semibold text-text-primary leading-tight">{title}</h1>
        {subtitle && (
          <p className="text-xs text-text-muted mt-0.5">{subtitle}</p>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <button className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg border border-border",
          "text-text-tertiary hover:bg-muted hover:text-text-primary transition-colors"
        )}>
          <Search className="h-4 w-4" />
        </button>

        {/* Notifications */}
        <button className={cn(
          "relative flex h-9 w-9 items-center justify-center rounded-lg border border-border",
          "text-text-tertiary hover:bg-muted hover:text-text-primary transition-colors"
        )}>
          <Bell className="h-4 w-4" />
          {/* Notification dot */}
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-secondary" />
        </button>

        {/* Custom actions (e.g. "Add Slot" button) */}
        {actions}
      </div>
    </header>
  );
}
