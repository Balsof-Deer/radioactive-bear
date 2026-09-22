-- Phase 4: server-side radius search for the map screen. Review this
-- file before running it. Paste it into the Supabase dashboard's SQL
-- Editor and run it, after 0001 and 0002.

-- Not security definer: runs as the calling user, so the normal
-- locations RLS policy (0002) still decides which rows are visible.
-- Uses the geo/GiST index from 0002 for an efficient distance query
-- instead of filtering in application code.
create or replace function public.locations_within_radius(
  center_lat double precision,
  center_lng double precision,
  radius_meters double precision
)
returns setof public.locations_with_status
language sql
stable
as $$
  select l.*, public.location_status(l) as status
  from public.locations l
  where extensions.ST_DWithin(
    l.geo,
    extensions.ST_SetSRID(extensions.ST_MakePoint(center_lng, center_lat), 4326)::extensions.geography,
    radius_meters
  )
  order by extensions.ST_Distance(
    l.geo,
    extensions.ST_SetSRID(extensions.ST_MakePoint(center_lng, center_lat), 4326)::extensions.geography
  );
$$;

revoke all on function public.locations_within_radius(double precision, double precision, double precision) from public;
grant execute on function public.locations_within_radius(double precision, double precision, double precision) to authenticated;
