CREATE OR REPLACE FUNCTION public.get_trending_chants_7d(p_limit INTEGER DEFAULT 20)
RETURNS SETOF chants AS $$
BEGIN
  RETURN QUERY
  SELECT c.*
  FROM chants c
  LEFT JOIN (
    SELECT chant_id, COUNT(*) AS cnt
    FROM chant_plays
    WHERE started_at > NOW() - INTERVAL '7 days'
    GROUP BY chant_id
  ) p ON p.chant_id = c.id
  ORDER BY COALESCE(p.cnt, 0) DESC, c.play_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_trending_chants_7d(INTEGER) TO authenticated;
