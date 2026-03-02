// ============================================================
// Supabase Database Types — aligned with @supabase/supabase-js v2
// ============================================================

export type UserRole = "learner" | "mentor" | "admin";
export type SlotStatus = "available" | "full" | "cancelled";
export type BookingStatus =
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "MISSED"
  | "RESCHEDULE_PENDING";
export type CancelledBy = "student" | "mentor";
export type NotificationType =
  | "SESSION_REMINDER_24H"
  | "SESSION_REMINDER_1H"
  | "BOOKING_CONFIRMED"
  | "BOOKING_CANCELLED"
  | "RESCHEDULE_PROPOSED"
  | "RESCHEDULE_ACCEPTED"
  | "RESCHEDULE_DECLINED"
  | "SESSION_COMPLETED"
  | "FEEDBACK_RECEIVED";
export type MentorStatus = "active" | "inactive" | "suspended";

export interface FeedbackPayload {
  notes: string;
  areasOfImprovement?: string;
}

// ── Database map ─────────────────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          profile_picture: string | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          profile_picture?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          profile_picture?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      mentor_profiles: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          bio: string | null;
          expertise: string[];
          timezone: string;
          buffer_minutes: number;
          is_buffer_enabled: boolean;
          accepts_new_mentees: boolean;
          is_verified: boolean;
          status: MentorStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          bio?: string | null;
          expertise?: string[];
          timezone?: string;
          buffer_minutes?: number;
          is_buffer_enabled?: boolean;
          accepts_new_mentees?: boolean;
          is_verified?: boolean;
          status?: MentorStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string | null;
          bio?: string | null;
          expertise?: string[];
          timezone?: string;
          buffer_minutes?: number;
          is_buffer_enabled?: boolean;
          accepts_new_mentees?: boolean;
          is_verified?: boolean;
          status?: MentorStatus;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mentor_profiles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      mentor_slots: {
        Row: {
          id: string;
          mentor_id: string;
          slot_start: string;
          slot_end: string;
          duration_minutes: number;
          max_capacity: number;
          current_booked_count: number;
          topic: string | null;
          status: SlotStatus;
          is_public: boolean;
          recurrence_rule: string | null;
          recurrence_end_date: string | null;
          recurrence_group_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          mentor_id: string;
          slot_start: string;
          slot_end: string;
          max_capacity?: number;
          topic?: string | null;
          status?: SlotStatus;
          is_public?: boolean;
          recurrence_rule?: string | null;
          recurrence_end_date?: string | null;
          recurrence_group_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          mentor_id?: string;
          slot_start?: string;
          slot_end?: string;
          max_capacity?: number;
          current_booked_count?: number;
          topic?: string | null;
          status?: SlotStatus;
          is_public?: boolean;
          recurrence_rule?: string | null;
          recurrence_end_date?: string | null;
          recurrence_group_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mentor_slots_mentor_id_fkey";
            columns: ["mentor_id"];
            isOneToOne: false;
            referencedRelation: "mentor_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      bookings: {
        Row: {
          id: string;
          slot_id: string;
          student_id: string;
          mentor_id: string;
          status: BookingStatus;
          cancelled_by: CancelledBy | null;
          cancel_reason: string | null;
          reschedule_new_slot_id: string | null;
          reschedule_reason: string | null;
          joined_at: string | null;
          left_at: string | null;
          completed_at: string | null;
          feedback: FeedbackPayload | null;
          rating: number | null;
          feedback_locked: boolean;
          feedback_locked_at: string | null;
          reminder_24h_sent: boolean;
          reminder_1h_sent: boolean;
          meet_link: string | null;
          calendar_event_id: string | null;
          booked_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slot_id: string;
          student_id: string;
          mentor_id: string;
          status?: BookingStatus;
          booked_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: BookingStatus;
          cancelled_by?: CancelledBy | null;
          cancel_reason?: string | null;
          reschedule_new_slot_id?: string | null;
          reschedule_reason?: string | null;
          joined_at?: string | null;
          left_at?: string | null;
          completed_at?: string | null;
          feedback?: FeedbackPayload | null;
          rating?: number | null;
          feedback_locked?: boolean;
          feedback_locked_at?: string | null;
          reminder_24h_sent?: boolean;
          reminder_1h_sent?: boolean;
          meet_link?: string | null;
          calendar_event_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bookings_slot_id_fkey";
            columns: ["slot_id"];
            isOneToOne: false;
            referencedRelation: "mentor_slots";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_mentor_id_fkey";
            columns: ["mentor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: NotificationType;
          title: string;
          message: string;
          reference_id: string | null;
          reference_type: "booking" | "slot" | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: NotificationType;
          title: string;
          message: string;
          reference_id?: string | null;
          reference_type?: "booking" | "slot" | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          is_read?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// ── Convenience row types ─────────────────────────────────────────────────────
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type MentorProfileRow = Database["public"]["Tables"]["mentor_profiles"]["Row"];
export type MentorSlotRow = Database["public"]["Tables"]["mentor_slots"]["Row"];
export type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];
export type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];
