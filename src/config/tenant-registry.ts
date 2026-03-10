/**
 * Dynamic Tenant Registry
 *
 * Supports adding new isolated tenants via configuration (TENANTS_JSON env var or database)
 * without requiring code changes.
 *
 * USAGE:
 * 1. Set TENANTS_JSON env var with JSON array of tenant configs
 * 2. Or extend loadTenantConfig() to load from database
 * 3. New tenants are automatically recognized by auth and middleware
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
  userId: string; // Login username (e.g., "Realidea", "KoyIdeaparkOy")
  passwordHash: string; // Bcrypt hash of password
  mallId: string; // Primary mall ID this tenant manages
  companyName: string; // Display name of the company
  mallDisplayName: string; // Display name of the primary mall
  isMultiProperty?: boolean; // Whether this tenant manages multiple properties
  properties?: string[]; // List of all mall IDs this tenant can access (for multi-property)
}

/**
 * Loads tenant configuration from TENANTS_JSON env var or database
 *
 * ⚠️ IMPORTANT: This function is Node.js only (uses process.env)
 * Do NOT call from Edge runtime (middleware, Edge API routes)
 */
export function loadTenantConfig(): TenantConfig[] {
  // Guard: Only run in Node.js runtime
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

    // Validate required fields
    if (!Array.isArray(tenants)) {
      throw new Error('TENANTS_JSON must be a JSON array');
    }

    tenants.forEach((tenant, index) => {
      const required = ['userId', 'passwordHash', 'mallId', 'companyName', 'mallDisplayName'];
      const missing = required.filter((field) => !(field in tenant) || !tenant[field as keyof TenantConfig]);

      if (missing.length > 0) {
        throw new Error(`Tenant at index ${index} is missing required fields: ${missing.join(', ')}`);
      }

      // Validate isMultiProperty consistency
      if (tenant.isMultiProperty && (!tenant.properties || tenant.properties.length === 0)) {
        throw new Error(
          `Tenant at index ${index} (${tenant.userId}) has isMultiProperty=true but no properties array`
        );
      }
    });

    if (process.env.NODE_ENV !== 'production') {
      console.log(`✅ Loaded ${tenants.length} tenants from TENANTS_JSON`);
    }

    return tenants;
  }

  // Option 2: TODO - Load from database
  // if (process.env.DATABASE_URL) {
  //   return await db.query('SELECT * FROM tenants');
  // }

  // Fallback: Hardcoded tenants (backwards compatible with existing setup)
  if (process.env.NODE_ENV !== 'production') {
    console.warn('⚠️ Using hardcoded tenant configuration. Set TENANTS_JSON for dynamic tenants.');
  }

  return [
    {
      userId: 'Realidea',
      // Demo password: "demo" (do not use in production)
      passwordHash: process.env.REALIDEA_PASSWORD_HASH || '$2b$10$7BUFfKsOhP2j3qp5kyyyZeZgOnCoGQBCyV95l/SwmMW1djjZCOvpC',
      mallId: 'tripla',
      companyName: 'Realidea',
      mallDisplayName: 'Mall of Tripla',
      isMultiProperty: true,
      properties: [
        'tripla',
        'sello',
        // 'iso-omena', // Removed - owned by Citycon Oyj
        'jumbo',
        'kaari',
        'koskikeskus',
        // 'ideapark', // Removed - owned by Koy Ideapark Oy
        'kamppi',
        'citycenter',
        'itis',
        'columbus',
        'myyrmanni',
        'ainoa',
        'entresse',
        'hansa',
        'aura',
        'apaja',
        'dixi',
      ],
    },
    {
      userId: 'KoyIdeaparkOy',
      passwordHash: process.env.IDEAPARK_PASSWORD_HASH || '$2a$12$demoHashForDevOnlyNotSecure',
      mallId: 'ideapark',
      companyName: 'Koy Ideapark Oy',
      mallDisplayName: 'Ideapark Lempaala',
      isMultiProperty: false,
      properties: ['ideapark'],
    },
    {
      userId: 'CityconOyj',
      passwordHash: process.env.CITYCON_PASSWORD_HASH || '$2a$12$demoHashForDevOnlyNotSecure',
      mallId: 'iso-omena',
      companyName: 'Citycon Oyj',
      mallDisplayName: 'Iso Omena',
      isMultiProperty: false,
      properties: ['iso-omena'],
    },
  ];
}

/**
 * Gets tenant configuration as a Record<userId, TenantConfig>
 * Useful for quick lookups by userId
 *
 * ⚠️ Node.js only (calls loadTenantConfig)
 */
export function getTenantRegistry(): Record<string, TenantConfig> {
  const tenants = loadTenantConfig();
  return Object.fromEntries(tenants.map((t) => [t.userId, t]));
}

/**
 * Gets a single tenant by userId
 *
 * ⚠️ Node.js only
 */
export function getTenantConfig(userId: string): TenantConfig | null {
  const registry = getTenantRegistry();
  return registry[userId] || null;
}

/**
 * Checks if a tenant has access to a specific mall ID
 *
 * ⚠️ Node.js only
 */
export function canAccessMall(userId: string, mallId: string): boolean {
  const tenant = getTenantConfig(userId);
  if (!tenant) return false;

  if (tenant.isMultiProperty && tenant.properties) {
    return tenant.properties.includes(mallId);
  }

  return tenant.mallId === mallId;
}
