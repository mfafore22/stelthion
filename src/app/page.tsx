import Image from 'next/image'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Navigation */}
      <nav className="flex justify-between items-center p-6">
        <div></div>
        <Link
          href="/login"
          className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
        >
          Login
        </Link>
      </nav>

      {/* Logo centered */}
      <div className="flex-1 flex items-center justify-center">
        <Image
          src="/stelthion-brandmark.png"
          alt="Stelthion"
          width={160}
          height={160}
          priority
        />
      </div>
    </div>
  )
}