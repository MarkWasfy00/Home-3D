'use client';

import dynamic from 'next/dynamic';

const HomeViewer = dynamic(() => import('@/components/HomeViewer'), {
  ssr: false,
  loading: () => <div className="loading">Loading the house…</div>,
});

export default function Page() {
  return <HomeViewer />;
}
