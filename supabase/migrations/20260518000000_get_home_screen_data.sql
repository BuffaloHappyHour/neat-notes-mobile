-- RPC: get_home_screen_data
-- Returns all data needed for the home screen in a single round-trip.
-- Security: SECURITY DEFINER; validates caller matches p_user_id via auth.uid().

CREATE OR REPLACE FUNCTION get_home_screen_data(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_first_name       text;
  v_tasting_count    integer := 0;
  v_avg_rating       numeric;
  v_distillery_count integer := 0;
  v_top_affinities   text[]  := '{}';
  v_tastings_clarity jsonb   := '[]';
  v_recommendations  jsonb   := '[]';
BEGIN
  -- Reject if caller is not the requested user
  IF auth.uid() IS DISTINCT FROM p_user_id THEN
    RETURN jsonb_build_object(
      'first_name',           null,
      'tasting_count',        0,
      'avg_rating',           null,
      'distillery_count',     0,
      'top_affinities',       '[]'::jsonb,
      'tastings_for_clarity', '[]'::jsonb,
      'recommendations',      '[]'::jsonb
    );
  END IF;

  -- 1. Profile: first name
  SELECT first_name
  INTO   v_first_name
  FROM   profiles
  WHERE  id = p_user_id;

  -- 2. Aggregate tasting stats (tasting count, avg rating, distinct distilleries)
  SELECT
    COALESCE(COUNT(t.id), 0),
    CASE WHEN COUNT(t.rating) > 0
         THEN ROUND(AVG(t.rating)::numeric, 1)
         ELSE NULL
    END,
    COALESCE(COUNT(DISTINCT NULLIF(TRIM(w.distillery), '')), 0)
  INTO v_tasting_count, v_avg_rating, v_distillery_count
  FROM tastings t
  LEFT JOIN whiskeys w ON w.id = t.whiskey_id
  WHERE t.user_id = p_user_id;

  -- 3. Top affinities: top-5 L2/L3 flavor node labels, positive or neutral sentiment
  SELECT COALESCE(ARRAY(
    SELECT   fn.label
    FROM     tasting_flavor_selections_v2 tfs
    JOIN     flavor_nodes_v2 fn ON fn.id = tfs.flavor_node_id
    JOIN     tastings t          ON t.id  = tfs.tasting_id
    WHERE    t.user_id    = p_user_id
      AND    fn.level    >= 2
      AND    fn.is_active = true
      AND    (tfs.sentiment IS NULL OR tfs.sentiment <> 'negative')
    GROUP BY fn.id, fn.label
    ORDER BY COUNT(*) DESC
    LIMIT    5
  ), '{}')
  INTO v_top_affinities;

  -- 4. Raw tasting rows for client-side computePalateClarity (last 200 rated tastings)
  WITH user_refined AS (
    -- tasting ids that have at least one L2+ flavor selection
    SELECT DISTINCT tfs.tasting_id
    FROM   tasting_flavor_selections_v2 tfs
    JOIN   flavor_nodes_v2 fn ON fn.id = tfs.flavor_node_id
    JOIN   tastings t          ON t.id  = tfs.tasting_id
    WHERE  t.user_id  = p_user_id
      AND  fn.level  >= 2
  ),
  recent AS (
    SELECT t.id, t.rating, t.created_at, w.whiskey_type, w.proof
    FROM   tastings t
    LEFT   JOIN whiskeys w ON w.id = t.whiskey_id
    WHERE  t.user_id    = p_user_id
      AND  t.rating IS NOT NULL
    ORDER  BY t.created_at DESC
    LIMIT  200
  )
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'rating',           r.rating,
      'created_at',       r.created_at,
      'category',         r.whiskey_type,
      'has_refined_notes', (ur.tasting_id IS NOT NULL),
      'proof',            r.proof
    )
  ), '[]'::jsonb)
  INTO v_tastings_clarity
  FROM   recent r
  LEFT   JOIN user_refined ur ON ur.tasting_id = r.id;

  -- 5. Recommendations: top-3 whiskeys matching user affinities not yet logged
  IF array_length(v_top_affinities, 1) IS NOT NULL THEN
    SELECT COALESCE(jsonb_agg(rec ORDER BY match_count DESC), '[]'::jsonb)
    INTO   v_recommendations
    FROM (
      SELECT
        jsonb_build_object(
          'whiskey_id',   w.id,
          'display_name', w.display_name,
          'whiskey_type', w.whiskey_type,
          'proof',        w.proof
        ) AS rec,
        COUNT(*) AS match_count
      FROM   tasting_flavor_selections_v2 tfs
      JOIN   flavor_nodes_v2 fn ON fn.id = tfs.flavor_node_id
      JOIN   tastings t          ON t.id  = tfs.tasting_id
      JOIN   whiskeys w          ON w.id  = t.whiskey_id
      WHERE  fn.label    = ANY(v_top_affinities)
        AND  fn.level   >= 2
        AND  fn.is_active = true
        AND  w.is_active IS NOT FALSE
        AND  t.user_id  <> p_user_id
        AND  w.id NOT IN (
               SELECT DISTINCT whiskey_id
               FROM   tastings
               WHERE  user_id    = p_user_id
                 AND  whiskey_id IS NOT NULL
             )
      GROUP  BY w.id, w.display_name, w.whiskey_type, w.proof
      ORDER  BY match_count DESC
      LIMIT  3
    ) ranked;
  END IF;

  RETURN jsonb_build_object(
    'first_name',           v_first_name,
    'tasting_count',        v_tasting_count,
    'avg_rating',           v_avg_rating,
    'distillery_count',     v_distillery_count,
    'top_affinities',       to_jsonb(v_top_affinities),
    'tastings_for_clarity', v_tastings_clarity,
    'recommendations',      v_recommendations
  );
END;
$$;

REVOKE ALL    ON FUNCTION get_home_screen_data(uuid) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION get_home_screen_data(uuid) TO   authenticated;
