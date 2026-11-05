/** Shared types across server and client. Must not import server-only modules. */

export interface RevalidateStatus {
  /** Frontend base URL used by backend, or null if unset. */
  frontendUrl: string | null;
  /** Boolean flag indicating presence of secret without revealing token value. */
  hasSecret: boolean;
}

export type RevalidateCheckState =
  | "ok"
  | "not_configured"
  | "unauthorized"
  | "frontend_missing_secret"
  | "wrong_address"
  | "unreachable"
  | "error";

export interface RevalidateCheck {
  state: RevalidateCheckState;
  /** Human-readable status message with remediation steps. */
  message: string;
}
