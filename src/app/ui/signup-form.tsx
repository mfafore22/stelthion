'use client'

import { useActionState } from 'react'
import { signup } from '@/app/lib/action'
import { Button } from './button'
import Link from 'next/link'

export default function SignupForm() {
  const [errorMessage, formAction, isPending] = useActionState(signup, undefined)

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="companyName" className="block text-sm font-medium mb-1">
          Company Name
        </label>
        <input
          type="text"
          name="companyName"
          id="companyName"
          required
          className="border p-2 rounded w-full"
          disabled={isPending}
        />
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Your Name
        </label>
        <input
          type="text"
          name="name"
          id="name"
          required
          className="border p-2 rounded w-full"
          disabled={isPending}
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <input
          type="email"
          name="email"
          id="email"
          required
          className="border p-2 rounded w-full"
          disabled={isPending}
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Password
        </label>
        <input
          type="password"
          name="password"
          id="password"
          required
          minLength={6}
          className="border p-2 rounded w-full"
          disabled={isPending}
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
          Confirm Password
        </label>
        <input
          type="password"
          name="confirmPassword"
          id="confirmPassword"
          required
          minLength={6}
          className="border p-2 rounded w-full"
          disabled={isPending}
        />
      </div>

      {errorMessage && (
        <div className="text-red-500 text-sm">
          {errorMessage}
        </div>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Creating account...' : 'Sign Up'}
      </Button>

      <p className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-600 hover:underline">
          Login
        </Link>
      </p>
    </form>
  )
}