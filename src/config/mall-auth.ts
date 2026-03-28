/**
 * Mall Property Authentication Configuration
 * Manages secure login for property management companies
 */

import bcrypt from 'bcrypt';
import { getTenantRegistry, type TenantConfig } from './tenant-registry';

export interface MallPropertyAuth {
  userId: string;
  passwordHash: string;
  mallId: string;
  companyName: string;
  mallDisplayName: string;
  email?: string;
  isMultiProperty?: boolean;
  properties?: string[];
}

// When DEMO_MODE=true, accepts 'demo' as password for all users
const DEMO_MODE = process.env.DEMO_MODE === 'true';
const DEMO_PASSWORD = 'demo';

function getMallProperties(): Record<string, MallPropertyAuth> {
  const registry = getTenantRegistry();
  const mallProperties: Record<string, MallPropertyAuth> = {};

  Object.entries(registry).forEach(([userId, tenant]) => {
    mallProperties[userId] = {
      userId: tenant.userId,
      passwordHash: tenant.passwordHash,
      mallId: tenant.mallId,
      companyName: tenant.companyName,
      mallDisplayName: tenant.mallDisplayName,
      email: tenant.email,
      isMultiProperty: tenant.isMultiProperty,
      properties: tenant.properties,
    };
  });

  return mallProperties;
}

export const MALL_PROPERTIES = getMallProperties();

export async function validatePropertyManager(
  userId: string,
  password: string
): Promise<MallPropertyAuth | null> {
  const properties = getMallProperties();
  const property = properties[userId];
  if (!property) {
    return null;
  }

  // DEMO MODE: Accept 'demo' as password for demonstrations
  if (DEMO_MODE && password === DEMO_PASSWORD) {
    return property;
  }

  // PRODUCTION: Use bcrypt to verify password
  const isValid = await bcrypt.compare(password, property.passwordHash);
  if (!isValid) {
    return null;
  }

  return property;
}

export function getPropertyAuth(userId: string): MallPropertyAuth | null {
  return MALL_PROPERTIES[userId] || null;
}

export function canAccessMallProperty(userId: string, mallId: string): boolean {
  const property = MALL_PROPERTIES[userId];
  if (!property) {
    return false;
  }
  return property.mallId === mallId;
}

export function getAuthorizedMallId(userId: string): string | null {
  const property = MALL_PROPERTIES[userId];
  return property?.mallId || null;
}
