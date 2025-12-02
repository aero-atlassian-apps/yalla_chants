-- Materialized views for fast trending

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_trending_24h AS
SELECT chant_id, COUNT(*) AS cnt
FROM chant_plays
WHERE started_at > NOW() - INTERVAL '24 hours'
GROUP BY chant_id;

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_trending_7d AS
SELECT chant_id, COUNT(*) AS cnt
FROM chant_plays
WHERE started_at > NOW() - INTERVAL '7 days'
GROUP BY chant_id;

CREATE INDEX IF NOT EXISTS idx_mv_trending_24h_cnt ON mv_trending_24h(cnt DESC);
CREATE INDEX IF NOT EXISTS idx_mv_trending_7d_cnt ON mv_trending_7d(cnt DESC);

CREATE OR REPLACE FUNCTION public.get_trending_mv_7d(p_limit INTEGER DEFAULT 20)
RETURNS SETOF chants AS $$
BEGIN
  RETURN QUERY
  SELECT c.*
  FROM mv_trending_7d mv
  JOIN chants c ON c.id = mv.chant_id
  ORDER BY mv.cnt DESC, c.play_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_trending_mv_7d(INTEGER) TO authenticated;
