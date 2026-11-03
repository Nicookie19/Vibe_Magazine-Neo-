import { supabase } from '../supabaseClient';

export function ratingErrorMessage(error) {
  if (error?.code === '42501') {
    return 'Ratings are currently blocked by the database permissions. Please contact the site administrator.';
  }
  return 'Your rating could not be saved. Please try again, or choose Maybe Later.';
}

// The reader accepts one rating per browser and magazine, not rating edits.
// A plain insert does not require an UPDATE policy or an upsert conflict index.
export async function saveRating(magazineId, userId, rating) {
  if (!magazineId || !userId || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error('Invalid rating');
  }
  const findExisting = () => supabase.from('magazine_ratings')
    .select('rating').eq('magazine_id', magazineId).eq('user_id', userId)
    .limit(1).maybeSingle();

  const existing = await findExisting();
  if (existing.error) throw existing.error;
  if (existing.data) return existing.data.rating;

  const { error } = await supabase.from('magazine_ratings').insert({
    magazine_id: magazineId, user_id: userId, rating,
  });
  if (error) {
    // Another tab may have inserted the same rating after our lookup.
    if (error.code === '23505') {
      const concurrent = await findExisting();
      if (!concurrent.error && concurrent.data) return concurrent.data.rating;
    }
    throw error;
  }

  // Analytics must never turn a successful rating into a failed submission.
  try {
    const result = await supabase.from('magazine_analytics').insert({
      magazine_id: magazineId, event_type: 'rating', metadata: { rating },
    });
    if (result.error) console.warn('Rating saved; analytics unavailable:', result.error);
  } catch (error) {
    console.warn('Rating saved; analytics unavailable:', error);
  }
  return rating;
}
