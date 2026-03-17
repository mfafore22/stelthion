/**
 * Mall Property Authentication Configuration
 * Manages secure login for different property management companies
 */

import * as bcrypt from 'bcryptjs';
import { getTenantRegistry, getTenantConfig as getRegistryTenantConfig, type TenantConfig } from './tenant-registry';

export interface MallPropertyAuth {
  userId: string; // Property manager company name (e.g., "KoyIdeaparkOy")
  passwordHash: string; // Hashed password (bcrypt)
  mallId: string; // Authorized mall property ID
  companyName: string; // Display name of the company
  mallDisplayName: string; // Display name of the mall
  email?: string; // Registered email address for 2FA OTP delivery
  isMultiProperty?: boolean; // Whether tenant manages multiple properties
  properties?: string[]; // List of all property IDs this tenant can access
}

// ⚠️⚠️⚠️ DEMO MODE CONFIGURATION ⚠️⚠️⚠️
// When DEMO_MODE=true, the system accepts 'demo' as password for ALL users
// This allows easy customer demonstrations without entering real passwords
//
// ⚠️ WARNING: NEVER deploy to production with DEMO_MODE=true
// ⚠️ See docs/PRODUCTION_DEPLOYMENT.md for deployment checklist
const DEMO_MODE = process.env.DEMO_MODE === 'true';
const DEMO_PASSWORD = 'demo';

/**
 * Hash a password using bcrypt (for production use)
 * @param password - Plain text password
 * @returns Promise<string> - Bcrypt hashed password
 */
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Mall property authentication registry
 * Now dynamically loaded from tenant-registry.ts
 *
 * This allows adding new tenants via TENANTS_JSON env var without code changes.
 *
 * ⚠️ PRODUCTION DEPLOYMENT:
 * - Set DEMO_MODE=false
 * - Set tenant password hashes via TENANTS_JSON or individual env vars
 * - Generate password hashes with: node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('your-password', 12).then(console.log);"
 */

/**
 * Gets MALL_PROPERTIES from the tenant registry
 * Converts TenantConfig to MallPropertyAuth format
 */
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

/**
 * Dynamic mall properties registry
 * Loads from tenant-registry.ts on each access
 */
export const MALL_PROPERTIES = getMallProperties();

/**
 * Validates property manager credentials
 * Returns the mall property auth if valid, null otherwise
 *
 * DEMO MODE: When DEMO_MODE=true, accepts 'demo' as password for any user
 * PRODUCTION: Uses bcrypt to securely verify passwords
 */
export async function validatePropertyManager(
  userId: string,
  password: string
): Promise<MallPropertyAuth | null> {
  // Re-load on each call to avoid module-load-time env timing issues
  const properties = getMallProperties();
  const property = properties[userId];
  if (!property) {
    return null;
  }

  // ⚠️ DEMO MODE: Accept 'demo' as password for customer demonstrations
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

/**
 * Gets mall property auth by userId
 */
export function getPropertyAuth(userId: string): MallPropertyAuth | null {
  return MALL_PROPERTIES[userId] || null;
}

/**
 * Checks if a property manager has access to a specific mall
 */
export function canAccessMallProperty(userId: string, mallId: string): boolean {
  const property = MALL_PROPERTIES[userId];
  if (!property) {
    return false;
  }

  return property.mallId === mallId;
}

/**
 * Gets the authorized mall ID for a property manager
 */
export function getAuthorizedMallId(userId: string): string | null {
  const property = MALL_PROPERTIES[userId];
  return property?.mallId || null;
}

/**
 * Lists all available property managers (for admin purposes)
 */
export function getAllPropertyManagers(): string[] {
  return Object.keys(MALL_PROPERTIES);
}
