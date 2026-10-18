export type Role = "CUSTOMER" | "STAFF" | "FMANAGER" | "OPS_MGR" | "ADMIN";
export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  role: Role;
  facilityCode?: string;
  facility?: string;
}
export interface Envelope<T> {
  success: boolean;
  data: T;
  message?: string;
  token?: string;
  code?: string;
  count?: number;
}
export type Row = Record<string, unknown>;
export interface Session {
  user: User;
  token: string;
}
