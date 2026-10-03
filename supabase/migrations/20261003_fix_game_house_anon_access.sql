-- Fix Game House anonymous / logged-out access by granting EXECUTE on is_admin() to anon and short-circuiting null auth checks in RLS policies

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- Update game_house SELECT policy
DROP POLICY IF EXISTS "Anyone can view approved, own, or all if admin" ON public.game_house;
CREATE POLICY "Anyone can view approved, own, or all if admin" ON public.game_house FOR SELECT
  USING (
    status = 'approved' 
    OR ((select auth.uid()) IS NOT NULL AND ((select auth.uid()) = submitted_by OR public.is_admin()))
  );

-- Update game_house_likes SELECT policy
DROP POLICY IF EXISTS "Game likes are visible when game is visible" ON public.game_house_likes;
CREATE POLICY "Game likes are visible when game is visible" ON public.game_house_likes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.game_house g
      WHERE g.id = game_id
        AND (
          g.status = 'approved'
          OR ((select auth.uid()) IS NOT NULL AND (g.submitted_by = (select auth.uid()) OR public.is_admin()))
        )
    )
  );

-- Update game_house_comments SELECT policy
DROP POLICY IF EXISTS "Game comments are visible when game is visible" ON public.game_house_comments;
CREATE POLICY "Game comments are visible when game is visible" ON public.game_house_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.game_house g
      WHERE g.id = game_id
        AND (
          g.status = 'approved'
          OR ((select auth.uid()) IS NOT NULL AND (g.submitted_by = (select auth.uid()) OR public.is_admin()))
        )
    )
  );
