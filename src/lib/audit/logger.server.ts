/**
 * Server-Side Audit Logging
 *
 * Provides audit logging for security events, authentication, and data access.
 * Console logging works in all environments (Node, Edge, serverless).
 * File logging is opt-in and only works in Node.js runtime.
 *
 * ⚠️ IMPORTANT: Only call from server-side code (API routes, server components)
 * DO NOT call from middleware (use console.log/error directly in middleware)
 */

import { appendFile, mkdir } from 'fs/promises';
import { join } from 'path';

export type AuditEventType =
  | 'AUTH_SUCCESS'
  | 'AUTH_FAILURE'
  | 'CROSS_TENANT_ACCESS'
  | 'API_ACCESS'
  | 'DATA_EXPORT'
  | 'CONFIG_CHANGE'
  | 'TENANT_ADDED'
  | 'SESSION_CREATED'
  | 'SESSION_EXPIRED';

export interface AuditEvent {
  timestamp: string;
  event: AuditEventType;
  userId?: string;
  tenantId?: string;
  mallId?: string;
  path?: string;
  ip?: string;
  result: 'success' | 'denied' | 'error';
  message?: string;
  metadata?: Record<string, unknown>;
}

const LOGS_DIR = join(process.cwd(), 'logs');
const AUDIT_LOG_PATH = join(LOGS_DIR, 'audit.log');

// Enable file logging via environment variable
const FILE_LOGGING_ENABLED = process.env.AUDIT_FILE_LOGGING === 'true';

/**
 * Logs an audit event
 *
 * Always logs to console (works in all runtimes).
 * Optionally logs to file if AUDIT_FILE_LOGGING=true and running in Node.js.
 *
 * @param event - Audit event data (timestamp will be added automatically)
 */
export async function auditLog(event: Omit<AuditEvent, 'timestamp'>): Promise<void> {
  const logEntry: AuditEvent = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  // ALWAYS log to console (CloudWatch/Datadog/etc. picks this up)
  const logLevel = event.result === 'denied' || event.result === 'error' || event.event === 'CROSS_TENANT_ACCESS'
    ? 'error'
    : 'info';

  const consoleMessage = `[AUDIT] ${logEntry.event} | ${logEntry.result} | user:${logEntry.userId || 'anon'} | tenant:${logEntry.tenantId || 'none'} | ${logEntry.message || logEntry.path || ''}`;

  if (logLevel === 'error') {
    console.error(consoleMessage, logEntry);
  } else {
    console.log(consoleMessage);
  }

  // Alert on critical security events
  if (event.event === 'CROSS_TENANT_ACCESS' || event.result === 'denied') {
    console.error('🚨 SECURITY ALERT:', JSON.stringify(logEntry, null, 2));
  }

  // Optional: File logging (only in Node.js runtime, opt-in via env var)
  if (FILE_LOGGING_ENABLED && process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      await mkdir(LOGS_DIR, { recursive: true });
      await appendFile(AUDIT_LOG_PATH, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error('[AUDIT] Failed to write to audit log file:', error);
      // Don't throw - file logging failure shouldn't break the app
    }
  }
}

/**
 * Logs successful authentication
 */
export async function logAuthSuccess(userId: string, mallId: string, ip?: string): Promise<void> {
  await auditLog({
    event: 'AUTH_SUCCESS',
    userId,
    tenantId: mallId,
    mallId,
    ip,
    result: 'success',
    message: `User ${userId} logged in successfully`,
  });
}

/**
 * Logs failed authentication attempt
 */
export async function logAuthFailure(userId: string, reason: string, ip?: string): Promise<void> {
  await auditLog({
    event: 'AUTH_FAILURE',
    userId,
    ip,
    result: 'denied',
    message: `Login failed for ${userId}: ${reason}`,
  });
}

/**
 * Logs cross-tenant access attempt (CRITICAL SECURITY EVENT)
 */
export async function logCrossTenantAccess(
  userId: string,
  authorizedMallId: string,
  requestedMallId: string,
  path: string,
  ip?: string
): Promise<void> {
  await auditLog({
    event: 'CROSS_TENANT_ACCESS',
    userId,
    tenantId: authorizedMallId,
    mallId: requestedMallId,
    path,
    ip,
    result: 'denied',
    message: `User ${userId} (authorized for ${authorizedMallId}) attempted to access ${requestedMallId}`,
  });
}

/**
 * Logs API access
 */
export async function logApiAccess(
  userId: string,
  mallId: string,
  path: string,
  result: 'success' | 'error',
  ip?: string
): Promise<void> {
  await auditLog({
    event: 'API_ACCESS',
    userId,
    tenantId: mallId,
    mallId,
    path,
    ip,
    result,
  });
}

/**
 * Logs data export operations
 */
export async function logDataExport(
  userId: string,
  mallId: string,
  exportType: string,
  result: 'success' | 'error',
  ip?: string
): Promise<void> {
  await auditLog({
    event: 'DATA_EXPORT',
    userId,
    tenantId: mallId,
    mallId,
    ip,
    result,
    message: `Exported ${exportType} data`,
    metadata: { exportType },
  });
}
