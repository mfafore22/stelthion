import { Suspense } from "react"
import LoginForm from "@/app/ui/login-form";
export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold mb-4">Login</h1>
        <p>Please Login!</p>
      </div>
      <Suspense fallback={<div>Loading...</div>}>
         <LoginForm />
      </Suspense>
    </div>
  )
}