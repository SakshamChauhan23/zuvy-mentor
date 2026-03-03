export type AppErrorCode =
  | "UNAUTHORIZED"
  | "SLOT_NOT_FOUND"
  | "SLOT_FULL"
  | "SLOT_EXPIRED"
  | "SLOT_UPDATE_FAILED"
  | "BOOKING_FAILED"
  | "ALREADY_BOOKED"
  | "INVALID_TRANSITION"
  | "CALENDAR_TEMPORARY_FAILURE"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  code: AppErrorCode;
  status: number;

  constructor(code: AppErrorCode, message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}