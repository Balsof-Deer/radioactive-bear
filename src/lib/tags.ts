import { supabase } from '@/lib/supabase';

export type Tag = {
  id: string;
  slug: string;
  label: string;
  sort_order: number;
};

export async function fetchTags(): Promise<Tag[]> {
  const { data, error } = await supabase.from('tags').select('id,slug,label,sort_order').order('sort_order');
  if (error) {
    throw new Error(error.message);
  }
  return data;
}

function slugify(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export async function createTag(label: string): Promise<void> {
  const trimmed = label.trim();
  if (!trimmed) {
    throw new Error('Give the tag a name.');
  }

  const { error } = await supabase.from('tags').insert({ slug: slugify(trimmed), label: trimmed });
  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteTag(tagId: string): Promise<void> {
  const { error } = await supabase.from('tags').delete().eq('id', tagId);
  if (error) {
    throw new Error(error.message);
  }
}

export async function fetchLocationTagIds(locationId: string): Promise<string[]> {
  const { data, error } = await supabase.from('location_tags').select('tag_id').eq('location_id', locationId);
  if (error) {
    throw new Error(error.message);
  }
  return data.map((row) => row.tag_id as string);
}

export async function setLocationTags(locationId: string, tagIds: string[]): Promise<void> {
  const { error: deleteError } = await supabase.from('location_tags').delete().eq('location_id', locationId);
  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (tagIds.length === 0) return;

  const { error } = await supabase
    .from('location_tags')
    .insert(tagIds.map((tagId) => ({ location_id: locationId, tag_id: tagId })));

  if (error) {
    throw new Error(error.message);
  }
}

export async function fetchLocationTagsForLocations(
  locationIds: string[]
): Promise<Record<string, string[]>> {
  if (locationIds.length === 0) return {};

  const { data, error } = await supabase
    .from('location_tags')
    .select('location_id, tag_id')
    .in('location_id', locationIds);

  if (error) {
    throw new Error(error.message);
  }

  const map: Record<string, string[]> = {};
  for (const row of data) {
    const locationId = row.location_id as string;
    if (!map[locationId]) map[locationId] = [];
    map[locationId].push(row.tag_id as string);
  }
  return map;
}

export async function fetchMyPreferredTagIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('profile_tag_preferences')
    .select('tag_id')
    .eq('profile_id', userId);

  if (error) {
    throw new Error(error.message);
  }
  return data.map((row) => row.tag_id as string);
}

export async function setMyPreferredTagIds(userId: string, tagIds: string[]): Promise<void> {
  const { error: deleteError } = await supabase
    .from('profile_tag_preferences')
    .delete()
    .eq('profile_id', userId);
  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (tagIds.length === 0) return;

  const { error } = await supabase
    .from('profile_tag_preferences')
    .insert(tagIds.map((tagId) => ({ profile_id: userId, tag_id: tagId })));

  if (error) {
    throw new Error(error.message);
  }
}
