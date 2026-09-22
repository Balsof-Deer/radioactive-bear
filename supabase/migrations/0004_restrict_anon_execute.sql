-- Fixes a real gap found while testing Phase 4: `revoke all ... from
-- public` (used in 0001 and 0003) does not actually block the `anon`
-- role on Supabase. Supabase grants EXECUTE on new public-schema
-- functions directly to `anon` and `authenticated` via default
-- privileges, which a PUBLIC-only revoke doesn't touch. Confirmed by
-- calling redeem_admin_invite with the anon key (no login) and getting
-- "Invalid invite code" back instead of a permission error — meaning an
-- unauthenticated caller could reach the function and burn a real
-- invite code's single use without ever logging in.
--
-- Impact was limited (auth.uid() is null for anon, so it could not
-- actually grant itself admin) but it could invalidate a legitimate
-- admin invite anonymously, which was never the intent. Revoking from
-- `anon` explicitly closes that.
revoke all on function public.redeem_admin_invite(text) from anon;
revoke all on function public.locations_within_radius(double precision, double precision, double precision) from anon;
