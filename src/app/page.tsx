'use client';

import { useState } from 'react';
import { SearchKiosk } from '@/components/SearchKiosk';
import { AdminPanel } from '@/components/AdminPanel';

export default function Home() {
  const [showAdmin, setShowAdmin] = useState(false);

  return (
    <>
      <SearchKiosk onAdminClick={() => setShowAdmin(true)} />
      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </>
  );
}
