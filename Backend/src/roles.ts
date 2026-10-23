export type Role =
  | "admin"
  | "doctor"
  | "nurse"
  | "receptionist"
  | "lab"
  | "pharmacist"
  | "accountant";

// Admin passes every check, so an empty list means "admin only".
export const CLINICAL: Role[] = ["doctor", "nurse"];
export const FRONT_DESK: Role[] = ["receptionist", "nurse", "doctor"];
export const BILLING: Role[] = ["receptionist", "accountant"];
