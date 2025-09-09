'use client';
import dynamic from 'next/dynamic';

// Dynamically import AdsDisplay with no SSR to avoid hydration issues
const AdsDisplay = dynamic(() => import('./AdsDisplay'), {
  ssr: false,
  loading: () => null
});

// This is a client component wrapper that handles the dynamic import
export default function AdsDisplayWrapper({ position = 'top', limit }) {
  return <AdsDisplay position={position} limit={limit} />;
}
