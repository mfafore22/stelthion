import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import Link from 'next/link'

export default async function Home() {
  const session = await auth()
  
  if (session) {
    redirect('/dashboard')
  }
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Stelthion</h1>
        <p className="text-gray-600 mb-8">Welcome to your dashboard</p>
        
        <div className="flex gap-4">
          <Link 
            href="/login"
            className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
          >
            Login
          </Link>
          <Link 
            href="/signup"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  )
}
