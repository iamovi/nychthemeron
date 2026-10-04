-- =============================================================================
-- Migration: Fix Game Notification RPC Permissions
-- Re-grants EXECUTE on notify_admins_new_game and notify_user_game_status
-- to 'authenticated' users so game submissions, approvals, and rejections
-- create notifications and fire Web Push notifications.
-- =============================================================================

REVOKE EXECUTE ON FUNCTION public.notify_admins_new_game(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.notify_admins_new_game(uuid) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.notify_user_game_status(uuid, uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.notify_user_game_status(uuid, uuid, text) TO authenticated;
