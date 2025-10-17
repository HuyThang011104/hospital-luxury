export type ManagerRole =
  | "admin"
  | "pharmacist"
  | "facility_manager"
  | "cashier";

export interface Manager {
  user_id: number;
  username: string;
  password: string;
  full_name: string;
  email: string | null;
  phone_number: string | null;
  role: ManagerRole;
  is_active: boolean;
}
