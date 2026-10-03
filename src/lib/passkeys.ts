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
 * Auto-detect user's device, OS, or authenticator app name
 * for friendly display and brand icon resolution.
 */
export const autoDetectDeviceNickname = (): string => {
  if (typeof window === "undefined") return "Biometric Passkey";

  const ua = navigator.userAgent;
  const uaLower = ua.toLowerCase();
  const platform = ((navigator as any).userAgentData?.platform || (navigator as any).platform || "").toLowerCase();

  // Check for password manager browser extension hints
  if (uaLower.includes("protonpass") || uaLower.includes("proton")) return "Proton Pass";
  if (uaLower.includes("bitwarden")) return "Bitwarden";
  if (uaLower.includes("1password") || uaLower.includes("onepassword")) return "1Password";
  if (uaLower.includes("lastpass")) return "LastPass";
  if (uaLower.includes("dashlane")) return "Dashlane";
  if (uaLower.includes("nordpass")) return "NordPass";
  if (uaLower.includes("keepass")) return "KeePass";
  if (uaLower.includes("authy")) return "Authy";
  if (uaLower.includes("yubikey") || uaLower.includes("yubico")) return "YubiKey";

  const isApple = platform.includes("mac") || platform.includes("iphone") || platform.includes("ipad") || platform.includes("darwin");
  const isWindows = platform.includes("win");
  const isAndroid = platform.includes("android");

  if (isApple) {
    if (uaLower.includes("chrome")) return "Apple Touch ID (Chrome)";
    return "Apple Touch ID / iCloud Keychain";
  }

  if (isWindows) {
    if (uaLower.includes("edg")) return "Windows Hello (Edge)";
    return "Windows Hello / Google Password Manager";
  }

  if (isAndroid) {
    return "Android Biometrics / Google Password Manager";
  }

  if (uaLower.includes("firefox")) return "Firefox Passkey";
  if (uaLower.includes("chrome")) return "Google Password Manager";

  return "Biometric Passkey";
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

    const mapped: UserPasskey[] = (data || []).map((pk: any) => {
      let name = pk.friendly_name || pk.device_nickname;
      if (!name || name === "Passkey" || name === "My Passkey") {
        name = autoDetectDeviceNickname();
      }
      return {
        id: pk.id,
        user_id: pk.user_id || user.id,
        credential_id: pk.credential_id || pk.id,
        device_nickname: name,
        transports: pk.transports || [],
        created_at: pk.created_at || new Date().toISOString(),
        last_used_at: pk.last_used_at || null,
      };
    });

    return { data: mapped, error: null };
  } catch (err: any) {
    return { data: [], error: err };
  }
};

/**
 * Register a new Passkey using Supabase native registerPasskey() API
 */
export const registerPasskey = async (
  nickname?: string
): Promise<{ passkeyId: string | null; error: any }> => {
  if (!isPasskeySupported()) {
    return { passkeyId: null, error: new Error("Passkeys are not supported by your browser.") };
  }

  const detectedName = nickname && nickname.trim() !== "Passkey" && nickname.trim() !== "My Passkey"
    ? nickname.trim()
    : autoDetectDeviceNickname();

  try {
    // 1. Native Supabase passkey registration ceremony
    const { data, error } = await supabase.auth.registerPasskey();

    if (error) {
      if (error.name === "NotAllowedError" || error.message?.includes("cancelled")) {
        return { passkeyId: null, error: new Error("Passkey registration was cancelled.") };
      }
      return { passkeyId: null, error };
    }

    // 2. Set auto-detected friendly nickname on the passkey
    if (data?.id) {
      try {
        await supabase.auth.passkey.update({
          passkeyId: data.id,
          friendlyName: detectedName,
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
