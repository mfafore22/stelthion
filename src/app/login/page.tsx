import { Suspense } from "react"
import LoginForm from "@/app/ui/login-form";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#fafafa]">
      <div className="w-full max-w-md px-4">
        <Suspense fallback={
          <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 px-10 py-10 animate-pulse">
            <div className="h-8 bg-gray-100 rounded w-32 mx-auto mb-4" />
            <div className="h-4 bg-gray-100 rounded w-48 mx-auto mb-8" />
            <div className="space-y-4">
              <div className="h-10 bg-gray-100 rounded" />
              <div className="h-10 bg-gray-100 rounded" />
              <div className="h-10 bg-gray-100 rounded" />
            </div>
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}