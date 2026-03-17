import { Suspense } from "react"
import LoginForm from "@/app/ui/login-form";

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white px-4">

      {/* Branded logo animation */}
      <div className="w-full max-w-3xl h-72 mb-2">
        <iframe
          src="/stelthion-animation/index.html"
          className="w-full h-full border-0"
          title="Stelthion"
          style={{ background: "white", overflow: "hidden" }}
        />
      </div>

      {/* Tagline */}
      <p
        className="mb-8 text-sm font-medium tracking-widest uppercase text-gray-500"
        style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
      >
        Property Manager Access
      </p>

      {/* Login form */}
      <div className="w-full max-w-md">
        <Suspense fallback={<div>Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>

    </div>
  )
}
