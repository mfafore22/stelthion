import Image from 'next/image';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white gap-10">
      <Image
        src="/stelthion-brandmark.png"
        alt="Stelthion"
        width={120}
        height={120}
        priority
      />

      <p className="text-sm font-medium tracking-widest uppercase text-gray-400">
        Property Manager Access
      </p>

      <Link
        href="/mall/login"
        className="px-8 py-3 bg-gray-950 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors"
      >
        Login
      </Link>
    </div>
  );
}
