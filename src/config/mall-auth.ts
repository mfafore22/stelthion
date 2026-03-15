/**
 * Mall Property Authentication Configuration
 * Uses Prisma database for authentication
 */

import * as bcrypt from 'bcryptjs';
import prisma from '@/app/lib/prisma';

export interface MallPropertyAuth {
  userId: string;
  passwordHash?: string;
  mallId: string;
  companyName: string;
  mallDisplayName: string;
  email?: string;
  isMultiProperty?: boolean;
  properties?: string[];
}

/**
 * Validates property manager credentials against database
 */
export async function validatePropertyManager(
  email: string,
  password: string
): Promise<MallPropertyAuth | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { customer: true },
    });

    if (!user) {
      return null;
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return null;
    }

    return {
      userId: user.id,
      mallId: user.customerId,
      companyName: user.customer.name,
      mallDisplayName: user.customer.name,
      email: user.email,
      isMultiProperty: false,
      properties: [user.customerId],
    };
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

/**
 * Gets mall property auth by userId
 */
export async function getPropertyAuth(userId: string): Promise<MallPropertyAuth | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { customer: true },
    });

    if (!user) {
      return null;
    }

    return {
      userId: user.id,
      mallId: user.customerId,
      companyName: user.customer.name,
      mallDisplayName: user.customer.name,
      email: user.email,
      isMultiProperty: false,
      properties: [user.customerId],
    };
  } catch (error) {
    console.error('Get property auth error:', error);
    return null;
  }
}

/**
 * Checks if a property manager has access to a specific mall
 */
export async function canAccessMallProperty(userId: string, mallId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    return user?.customerId === mallId;
  } catch (error) {
    return false;
  }
}

/**
 * Gets the authorized mall ID for a property manager
 */
export async function getAuthorizedMallId(userId: string): Promise<string | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    return user?.customerId || null;
  } catch (error) {
    return null;
  }
}