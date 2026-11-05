export type UserRole = "admin" | "user";

export interface AuthenticatedActor {
  id: string;
  email: string;
  role: UserRole;
}

export type Actor = AuthenticatedActor;
