'use client';
import DayScreen from '@/components/DayScreen';
import { use } from 'react';

export default function DayPage({ params }: { params: Promise<{ destination: string }> }) {
  const { destination } = use(params);
  return <DayScreen destination={destination} />;
}
