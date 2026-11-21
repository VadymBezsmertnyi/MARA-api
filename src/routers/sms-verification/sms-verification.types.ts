export type SmsVerificationType = "workshop_owner" | "event_owner";

export interface SmsVerificationResponse {
  status: "success" | "error";
  reason?: string;
  type?: string;
}
