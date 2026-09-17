import { UserRole } from '@erp/db';

export interface JwtPayload {
  sub: string;
  tenantId: string;
  role: UserRole;
  email: string;
}

export interface AuthenticatedUser {
  userId: string;
  tenantId: string;
  role: UserRole;
  email: string;
}
