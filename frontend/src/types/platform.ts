export interface PlatformUser {
  id: number;
  email: string;
  full_name: string | null;
  user_type: 'platform_admin';
  is_active: boolean;
  is_superuser: boolean;
}
