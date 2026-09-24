import { supabase } from '@/lib/supabase';

export async function updateDisplayName(userId: string, displayName: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ display_name: displayName || null })
    .eq('id', userId);

  if (error) {
    throw new Error(error.message);
  }
}
