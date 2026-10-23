'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CitizenRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/citizen/dashboard');
  }, [router]);
  return null;
}
