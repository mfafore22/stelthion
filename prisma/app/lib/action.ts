'use server'
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import prisma from "./prisma";
import bcrypt from 'bcrypt'
import { redirect } from "next/navigation";

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}

export async function signup(
  prevState: string | undefined, 
  formData: FormData
) {
  const companyName = formData.get('companyName') as string
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!companyName || !name || !email || !password) {
    return 'All fields are required.'
  }

  const checkPasswordMatch = (password: string, confirmPassword: string) => {
    if (password !== confirmPassword) {
      return 'Passwords do not match.'
    }
    return null
  }

  const checkPasswordLength = (password: string) => {
    const minLength = 6
    if (password.length < minLength) {
      return 'Password must be at least 6 characters.'
    }
    return null
  }

  // Run validations
  const matchError = checkPasswordMatch(password, confirmPassword)
  if (matchError) return matchError

  const lengthError = checkPasswordLength(password)
  if (lengthError) return lengthError

  // Check if email exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    return 'Email already registered.'
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10)

  // Create customer and user
  try {
    await prisma.customer.create({
      data: {
        name: companyName,
        users: {
          create: {
            email,
            password: hashedPassword,
            name,
            role: 'ADMIN',
          },
        },
        stats: {
          create: {
            totalUnits: 0,
            topCategory: 'N/A',
            foodBeverage: 0,
            fashionRetail: 0,
            currentVisitors: 0,
            dwellTime: 0,
            conversionRate: 0,
          },
        },
      },
    })
  } catch (error) {
    console.error('Signup error:', error)
    return 'Failed to create account.'
  }

  redirect('/login?registered=true')
}


export async function logout() {
  await signOut({ redirectTo: '/login' });
}

