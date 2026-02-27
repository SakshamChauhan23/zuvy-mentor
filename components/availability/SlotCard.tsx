import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTime, formatDuration } from "@/lib/mock/slots";
import type { TimeSlot } from "@/lib/types/slot";

interface SlotCardProps {
  slot: TimeSlot;
  isSelected: boolean;
  onSelect: (slot: TimeSlot) => void;
}

export default function SlotCard({ slot, isSelected, onSelect }: SlotCardProps) {
  const { startTime, endTime, durationMinutes, isBooked } = slot;
  const disabled = isBooked;

  const label = `${formatTime(startTime)} — ${formatTime(endTime)}`;
  const duration = formatDuration(durationMinutes);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && onSelect(slot)}
      aria-pressed={isSelected}
      aria-label={
        disabled
          ? `${label}, ${duration} — already booked`
          : `${label}, ${duration}${isSelected ? ", selected" : ""}`
      }
      className={cn(
        // Base
        "relative flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-all duration-150",
        // Available — default
        !disabled && !isSelected && [
          "border-border bg-card",
          "hover:border-primary/50 hover:bg-primary-light",
          "cursor-pointer",
        ],
        // Available — selected
        !disabled && isSelected && [
          "border-primary bg-primary-light ring-2 ring-primary ring-offset-1",
        ],
        // Booked — disabled
        disabled && [
          "border-border bg-muted opacity-50 cursor-not-allowed",
        ]
      )}
    >
      {/* Left: time + duration */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            isSelected
              ? "bg-primary text-primary-foreground"
              : disabled
              ? "bg-grey-light text-text-muted"
              : "bg-muted text-text-secondary"
          )}
        >
          <Clock className="h-4 w-4" />
        </div>

        <div>
          <p
            className={cn(
              "text-sm font-semibold",
              isSelected
                ? "text-text-accent"
                : disabled
                ? "text-text-muted line-through"
                : "text-text-primary"
            )}
          >
            {formatTime(startTime)}
          </p>
          <p className="text-xs text-text-muted mt-0.5">
            until {formatTime(endTime)}
          </p>
        </div>
      </div>

      {/* Right: duration pill + booked badge */}
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-medium",
            isSelected
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-text-secondary"
          )}
        >
          {duration}
        </span>

        {disabled && (
          <span className="rounded-full bg-grey-light px-2.5 py-0.5 text-xs font-medium text-text-muted">
            Booked
          </span>
        )}
      </div>
    </button>
  );
}
