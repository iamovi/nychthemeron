import { supabase } from "@/integrations/supabase/client";

export interface UserPasskey {
  id: string;
  user_id: string;
  credential_id: string;
  device_nickname: string;
  transports: string[];
  created_at: string;
  last_used_at: string | null;
}

/**
 * Check if Passkeys / WebAuthn is supported in current browser environment
 */
export const isPasskeySupported = (): boolean => {
  return (
    typeof window !== "undefined" &&
    window.PublicKeyCredential !== undefined &&
    typeof window.PublicKeyCredential === "function"
  );
};

/**
 * Fetch all registered passkeys for current user via Supabase native Auth API
 */
export const getUserPasskeys = async (): Promise<{ data: UserPasskey[] | null; error: any }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error("User not authenticated") };

    // Use Supabase native passkey.list()
    const { data, error } = await supabase.auth.passkey.list();

    if (error) {
      // Fallback to custom table if native list throws
      const { data: customData } = await supabase
        .from("user_passkeys")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (customData) {
        return { data: customData as unknown as UserPasskey[], error: null };
      }
      return { data: [], error: null };
    }

    const mapped: UserPasskey[] = (data || []).map((pk: any) => ({
      id: pk.id,
      user_id: pk.user_id || user.id,
      credential_id: pk.credential_id || pk.id,
      device_nickname: pk.friendly_name || pk.device_nickname || "Passkey",
      transports: pk.transports || [],
      created_at: pk.created_at || new Date().toISOString(),
      last_used_at: pk.last_used_at || null,
    }));

    return { data: mapped, error: null };
  } catch (err: any) {
    return { data: [], error: err };
  }
};

/**
 * Register a new Passkey using Supabase native registerPasskey() API
 */
export const registerPasskey = async (
  nickname: string = "My Passkey"
): Promise<{ passkeyId: string | null; error: any }> => {
  if (!isPasskeySupported()) {
    return { passkeyId: null, error: new Error("Passkeys are not supported by your browser.") };
  }

  try {
    // 1. Native Supabase passkey registration ceremony
    const { data, error } = await supabase.auth.registerPasskey();

    if (error) {
      if (error.name === "NotAllowedError" || error.message?.includes("cancelled")) {
        return { passkeyId: null, error: new Error("Passkey registration was cancelled.") };
      }
      return { passkeyId: null, error };
    }

    // 2. Set friendly nickname if provided
    if (data?.id && nickname && nickname.trim() !== "My Passkey") {
      try {
        await supabase.auth.passkey.update({
          passkeyId: data.id,
          friendlyName: nickname.trim(),
        });
      } catch (err) {
        console.warn("Could not set passkey nickname:", err);
      }
    }

    return { passkeyId: data?.id || "passkey_registered", error: null };
  } catch (err: any) {
    if (err.name === "NotAllowedError") {
      return { passkeyId: null, error: new Error("Passkey registration was cancelled.") };
    }
    return { passkeyId: null, error: err };
  }
};

/**
 * Authenticate and sign in using native Supabase signInWithPasskey() API.
 * Performs full WebAuthn ceremony and establishes a real Supabase session.
 */
export const authenticateWithPasskey = async (): Promise<{ success: boolean; error: any }> => {
  if (!isPasskeySupported()) {
    return { success: false, error: new Error("Passkeys are not supported by your browser.") };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPasskey();

    if (error) {
      if (error.name === "NotAllowedError" || error.message?.includes("cancelled")) {
        return { success: false, error: new Error("Passkey sign-in was cancelled.") };
      }
      return { success: false, error };
    }

    if (data?.session) {
      return { success: true, error: null };
    }

    return { success: true, error: null };
  } catch (err: any) {
    if (err.name === "NotAllowedError") {
      return { success: false, error: new Error("Passkey sign-in was cancelled.") };
    }
    return { success: false, error: err };
  }
};

/**
 * Delete a registered Passkey using Supabase native API
 */
export const deletePasskey = async (passkeyId: string): Promise<{ error: any }> => {
  try {
    const { error } = await supabase.auth.passkey.delete({ passkeyId });
    if (error) {
      // Fallback to custom table
      const { error: customErr } = await supabase.from("user_passkeys").delete().eq("id", passkeyId);
      return { error: customErr };
    }
    return { error: null };
  } catch (err: any) {
    return { error: err };
  }
};

/**
 * Rename a registered Passkey using Supabase native API
 */
export const updatePasskeyNickname = async (
  passkeyId: string,
  newNickname: string
): Promise<{ error: any }> => {
  try {
    const { error } = await supabase.auth.passkey.update({
      passkeyId,
      friendlyName: newNickname.trim(),
    });
    if (error) {
      // Fallback to custom table
      const { error: customErr } = await supabase
        .from("user_passkeys")
        .update({ device_nickname: newNickname.trim() })
        .eq("id", passkeyId);
      return { error: customErr };
    }
    return { error: null };
  } catch (err: any) {
    return { error: err };
  }
};
