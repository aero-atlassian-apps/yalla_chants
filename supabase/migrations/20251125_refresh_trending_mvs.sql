-- Refresh materialized trending views

CREATE OR REPLACE FUNCTION public.refresh_trending_materialized()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW mv_trending_24h;
  REFRESH MATERIALIZED VIEW mv_trending_7d;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.refresh_trending_materialized() TO authenticated;
