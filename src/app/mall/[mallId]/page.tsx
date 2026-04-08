'use client';

import { useParams } from 'next/navigation';
import { MallTopBar } from '@/components/mall/shell/MallTopBar';
import { MallLeftNav } from '@/components/mall/shell/MallLeftNav';
import { PropertyDetail } from '@/components/mall/PropertyDetail';

export default function MallDetailPage() {
  const { mallId } = useParams<{ mallId: string }>();

  return (
    <>
      {/* Fixed shell — positioned absolutely, not in flow */}
      <MallLeftNav />
      <MallTopBar />

      {/* Main content — offset by fixed shell dimensions (nav: 80px left, topbar: 80px top) */}
      <main className="ml-[80px] h-screen overflow-auto pt-[80px] bg-[#F8F6F3]">
        <div className="p-8 max-w-[1600px] mx-auto">
          <PropertyDetail mallId={mallId} />
        </div>
      </main>
    </>
  );
}
