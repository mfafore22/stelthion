/**
 * Dynamic Tenant Registry
 *
 * Supports adding new isolated tenants via configuration (TENANTS_JSON env var or database)
 * without requiring code changes.
 *
 * Example TENANTS_JSON format:
 * [
 *   {
 *     "userId": "NewCompany",
 *     "passwordHash": "$2a$12$...",
 *     "mallId": "new-mall",
 *     "companyName": "New Company Ltd",
 *     "mallDisplayName": "New Mall",
 *     "isMultiProperty": false,
 *     "properties": ["new-mall"]
 *   }
 * ]
 */

export interface TenantConfig {
  userId: string;
  passwordHash: string;
  mallId: string;
  companyName: string;
  mallDisplayName: string;
  email?: string;
  isMultiProperty?: boolean;
  properties?: string[];
}

export function loadTenantConfig(): TenantConfig[] {
  if (typeof process === 'undefined' || process.env.NEXT_RUNTIME === 'edge') {
    throw new Error('loadTenantConfig() can only be called in Node.js runtime');
  }

  // Option 1: Load from TENANTS_JSON env var
  if (process.env.TENANTS_JSON) {
    let tenants: TenantConfig[];

    try {
      tenants = JSON.parse(process.env.TENANTS_JSON);
    } catch (error) {
      throw new Error(`TENANTS_JSON is not valid JSON: ${error instanceof Error ? error.message : 'unknown error'}`);
    }

    if (!Array.isArray(tenants)) {
      throw new Error('TENANTS_JSON must be a JSON array');
    }

    tenants.forEach((tenant, index) => {
      const required = ['userId', 'passwordHash', 'mallId', 'companyName', 'mallDisplayName'];
      const missing = required.filter((field) => !(field in tenant) || !tenant[field as keyof TenantConfig]);

      if (missing.length > 0) {
        throw new Error(`Tenant at index ${index} is missing required fields: ${missing.join(', ')}`);
      }
    });

    return tenants;
  }

  // Fallback: Hardcoded tenants
  return [
    {
      userId: 'KoyIdeaparkAb',
      passwordHash: process.env.IDEAPARK_PASSWORD_HASH || '$2a$12$demoHashForDevOnlyNotSecure',
      mallId: 'ideapark',
      companyName: 'Koy Ideapark Ab',
      mallDisplayName: 'Ideapark Lempäälä',
      email: process.env.IDEAPARK_EMAIL,
      isMultiProperty: false,
      properties: ['ideapark'],
    },
  ];
}

export function getTenantRegistry(): Record<string, TenantConfig> {
  const tenants = loadTenantConfig();
  return Object.fromEntries(tenants.map((t) => [t.userId, t]));
}

export function getTenantConfig(userId: string): TenantConfig | null {
  const registry = getTenantRegistry();
  return registry[userId] || null;
}

export function canAccessMall(userId: string, mallId: string): boolean {
  const tenant = getTenantConfig(userId);
  if (!tenant) return false;

  if (tenant.isMultiProperty && tenant.properties) {
    return tenant.properties.includes(mallId);
  }

  return tenant.mallId === mallId;
}
