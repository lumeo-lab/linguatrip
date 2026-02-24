'use client';
import ScenarioScreen from '@/components/ScenarioScreen';
import { use } from 'react';

export default function ScenarioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ScenarioScreen scenarioId={id} />;
}
