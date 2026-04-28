import Image from 'next/image';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="relative h-screen w-full overflow-hidden bg-white">
      <Image
        src="/Stelthion_landing-bg.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />

      <div className="absolute inset-0 z-10">
        <div className="absolute left-1/2 top-[12%] -translate-x-1/2 flex flex-col items-center">
          <Image
            src="/stelthion-brandmark.png"
            alt="Stelthion"
            width={360}
            height={98}
            priority
            className="h-auto w-[200px] sm:w-[260px] md:w-[320px] lg:w-[360px]"
          />
          <p className="mt-4 max-w-[50vw] text-center text-xl font-light leading-[1.15] tracking-tight text-bo-neutral-950 sm:text-2xl md:text-3xl lg:text-4xl">
            The <span className="font-semibold">Pulse</span> of Your{' '}
            <span className="font-semibold">Property</span>
            <sup className="ml-1 align-super text-[0.3em] font-normal">TM</sup>
          </p>
        </div>

        <p className="absolute left-1/2 top-[40%] w-[200px] -translate-x-[calc(50%-5px)] text-center text-sm font-medium uppercase tracking-[0.30em] text-bo-neutral-800 sm:w-[260px] sm:-translate-x-[calc(50%-6px)] sm:text-base sm:tracking-[0.34em] md:w-[320px] md:-translate-x-[calc(50%-7px)] md:text-lg md:tracking-[0.38em] lg:w-[360px] lg:-translate-x-[calc(50%-8px)] lg:text-xl lg:tracking-[0.42em]">
          PropertyOS
          <sup className="ml-0.5 align-super text-[0.45em] tracking-normal">
            TM
          </sup>
        </p>

        <div className="absolute right-6 top-[5%] -translate-y-1/2 sm:right-10">
          <Link
            href="/login"
            className="inline-block rounded-lg bg-gray-900 px-10 py-2.5 text-sm font-medium text-white transition-all hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:ring-offset-2"
          >
            Enter
          </Link>
        </div>
      </div>
    </main>
  );
}
