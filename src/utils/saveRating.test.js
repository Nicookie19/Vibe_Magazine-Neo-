import { beforeEach, describe, expect, it, vi } from 'vitest';
import { supabase } from '../supabaseClient';
import { saveRating, ratingErrorMessage } from './saveRating';

describe('reader rating persistence', () => {
  let lookup, insert, analytics;
  beforeEach(() => {
    vi.clearAllMocks();
    lookup = vi.fn().mockResolvedValue({ data: null, error: null });
    insert = vi.fn().mockResolvedValue({ error: null });
    analytics = vi.fn().mockResolvedValue({ error: null });
    const ratings = {
      select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(), maybeSingle: lookup, insert,
    };
    supabase.from.mockImplementation(table =>
      table === 'magazine_ratings' ? ratings : { insert: analytics });
  });
  it('inserts a first rating without requiring upsert or UPDATE permissions', async () => {
    await expect(saveRating('mag', 'user_browser', 5)).resolves.toBe(5);
    expect(insert).toHaveBeenCalledWith({ magazine_id: 'mag', user_id: 'user_browser', rating: 5 });
    expect(analytics).toHaveBeenCalledOnce();
  });
  it('preserves an existing rating without duplicating it or analytics', async () => {
    lookup.mockResolvedValue({ data: { rating: 4 }, error: null });
    await expect(saveRating('mag', 'user_browser', 5)).resolves.toBe(4);
    expect(insert).not.toHaveBeenCalled();
    expect(analytics).not.toHaveBeenCalled();
  });
  it('does not insert when the existing-rating lookup fails', async () => {
    lookup.mockResolvedValue({ error: { code: '42501' } });
    await expect(saveRating('mag', 'user_browser', 5)).rejects.toEqual({ code: '42501' });
    expect(insert).not.toHaveBeenCalled();
  });
  it('reports denied writes instead of claiming success', async () => {
    insert.mockResolvedValue({ error: { code: '42501' } });
    await expect(saveRating('mag', 'user_browser', 5)).rejects.toEqual({ code: '42501' });
    expect(analytics).not.toHaveBeenCalled();
    expect(ratingErrorMessage({ code: '42501' })).toContain('database permissions');
  });
  it('handles a concurrent insert without overwriting the first rating', async () => {
    insert.mockResolvedValue({ error: { code: '23505' } });
    lookup.mockResolvedValueOnce({ data: null }).mockResolvedValueOnce({ data: { rating: 3 } });
    await expect(saveRating('mag', 'user_browser', 5)).resolves.toBe(3);
    expect(analytics).not.toHaveBeenCalled();
  });
  it.each([false, true])('keeps the saved rating when analytics fails (throws=%s)', async (throws) => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    if (throws) analytics.mockRejectedValue(new Error('offline'));
    else analytics.mockResolvedValue({ error: { message: 'denied' } });
    await expect(saveRating('mag', 'user_browser', 5)).resolves.toBe(5);
    vi.restoreAllMocks();
  });
  it.each([0, 6, 2.5, null])('rejects invalid rating %s before accessing storage', async rating => {
    await expect(saveRating('mag', 'user_browser', rating)).rejects.toThrow('Invalid rating');
    expect(supabase.from).not.toHaveBeenCalled();
  });
});
