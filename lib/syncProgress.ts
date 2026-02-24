import { supabase } from './supabase';
import type { Player, VocabularyItem, DestinationProgress, ScenarioResult } from './types';

export interface CloudData {
  player: Player;
  isOnboarded: boolean;
  destinationProgress: DestinationProgress[];
  scenarioResults: ScenarioResult[];
  vocabulary: VocabularyItem[];
}

export async function saveProgress(userId: string, data: CloudData): Promise<void> {
  await supabase
    .from('game_progress')
    .upsert(
      { user_id: userId, data, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
}

export async function loadProgress(userId: string): Promise<CloudData | null> {
  const { data, error } = await supabase
    .from('game_progress')
    .select('data')
    .eq('user_id', userId)
    .single();

  if (error || !data) return null;
  return data.data as CloudData;
}
