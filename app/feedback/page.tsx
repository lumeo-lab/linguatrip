'use client';
import { Suspense } from 'react';
import FeedbackScreen from '@/components/FeedbackScreen';

export default function FeedbackPage() {
  return (
    <Suspense fallback={<div style={{ background: '#0d1117', minHeight: '100vh' }} />}>
      <FeedbackScreen />
    </Suspense>
  );
}
