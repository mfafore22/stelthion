/**
 * Server-Side Audit Logging
 *
 * Console logging for security events, authentication, and data access.
 * File logging is opt-in via AUDIT_FILE_LOGGING=true.
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
const FILE_LOGGING_ENABLED = process.env.AUDIT_FILE_LOGGING === 'true';

export async function auditLog(event: Omit<AuditEvent, 'timestamp'>): Promise<void> {
  const logEntry: AuditEvent = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  const consoleMessage = `[AUDIT] ${logEntry.event} | ${logEntry.result} | user:${logEntry.userId || 'anon'} | tenant:${logEntry.tenantId || 'none'} | ${logEntry.message || logEntry.path || ''}`;

  if (event.result === 'denied' || event.result === 'error' || event.event === 'CROSS_TENANT_ACCESS') {
    console.error(consoleMessage, logEntry);
  } else {
    console.log(consoleMessage);
  }

  if (FILE_LOGGING_ENABLED) {
    try {
      await mkdir(LOGS_DIR, { recursive: true });
      await appendFile(AUDIT_LOG_PATH, JSON.stringify(logEntry) + '\n');
    } catch (error) {
      console.error('[AUDIT] Failed to write to audit log file:', error);
    }
  }
}

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

export async function logAuthFailure(userId: string, reason: string, ip?: string): Promise<void> {
  await auditLog({
    event: 'AUTH_FAILURE',
    userId,
    ip,
    result: 'denied',
    message: `Login failed for ${userId}: ${reason}`,
  });
}

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
