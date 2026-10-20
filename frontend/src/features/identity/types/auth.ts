export interface RegistrationRequest {
  name: string;
  username: string;
  email: string;
  phone: string;
  cccd: string;
  facilityCode?: string;
  password: string;
  confirmPassword: string;
}
export interface OtpChallenge {
  email: string;
  expiresAt: string;
  resendAvailableAt: string;
  delivery: "email";
}
export interface RegistrationResult {
  registered: boolean;
  email: string;
}
