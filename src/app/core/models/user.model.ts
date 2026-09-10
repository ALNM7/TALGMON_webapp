export type UserRole = 'ENGINEER' | 'ADMIN';

export interface AppUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  phone_number: string;
}
