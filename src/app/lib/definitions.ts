import 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: string
      customerId: string
      customerName: string
    }
    twoFactorVerified?: boolean
  }

  interface User {
    id: string
    role: string
    customerId: string
    customerName: string
  }
}

export {}