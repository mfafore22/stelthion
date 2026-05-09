import Image from 'next/image';
import type { ReactNode } from 'react';

const logoClass = [
  'h-auto w-[260px] md:w-[320px] lg:w-[360px]',
].join(' ');

const wordmarkClass = [
  '-mt-1 w-[260px] translate-x-[6px] text-center text-base font-medium',
  'uppercase tracking-[0.34em] text-bo-neutral-800',
  'md:w-[320px] md:translate-x-[7px] md:text-lg md:tracking-[0.38em]',
  'lg:w-[360px] lg:translate-x-[8px] lg:text-xl lg:tracking-[0.42em]',
].join(' ');

export function AuthPromptShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center overflow-hidden pt-[20vh]">
      <Image
        src="/Stelthion_landing-bg.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover object-center"
      />
      <div className="relative z-10 w-full max-w-lg px-4">
        <div className="rounded-2xl border border-gray-100 bg-white px-10 pb-8 pt-8 shadow-[0_2px_20px_rgba(0,0,0,0.06)]">
          <div className="mb-7 flex flex-col items-center">
            <Image src="/logo.png" alt="Stelthion" width={360} height={98} priority className={logoClass} />
            <p className={wordmarkClass}>
              PropertyOS<sup className="ml-0.5 align-super text-[0.45em] tracking-normal">TM</sup>
            </p>
          </div>
          <div className="mb-6 text-center">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
