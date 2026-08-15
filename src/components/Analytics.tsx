'use client';

import { useEffect } from 'react';
import { initAnalytics } from '@/lib/analytics';

/** Arranca el seguimiento de oyentes (presence + events) al cargar la web. */
export default function Analytics() {
  useEffect(() => {
    initAnalytics();
  }, []);
  return null;
}
