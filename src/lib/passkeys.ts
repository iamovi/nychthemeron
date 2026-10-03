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
 * Convert ArrayBuffer to Base64URL string
 */
export const bufferToBase64URL = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
};

/**
 * Convert Base64URL string to Uint8Array
 */
export const base64URLToBuffer = (base64url: string): Uint8Array => {
  let base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

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
 * Fetch all registered passkeys for current user
 */
export const getUserPasskeys = async (): Promise<{ data: UserPasskey[] | null; error: any }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error("User not authenticated") };

    const { data, error } = await supabase
      .from("user_passkeys")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return { data: [], error: null };
    return { data: (data as unknown as UserPasskey[]) || [], error: null };
  } catch (err: any) {
    return { data: null, error: err };
  }
};

/**
 * Register a new Passkey using browser's WebAuthn API
 * (Supports Google Password Manager, Proton Pass, iCloud Keychain, Touch ID, Windows Hello, etc.)
 */
export const registerPasskey = async (
  nickname: string = "My Passkey"
): Promise<{ passkeyId: string | null; error: any }> => {
  if (!isPasskeySupported()) {
    return { passkeyId: null, error: new Error("Passkeys are not supported by your browser.") };
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { passkeyId: null, error: new Error("Must be logged in to register a passkey.") };

    // Generate cryptographic challenge
    const challengeBytes = new Uint8Array(32);
    crypto.getRandomValues(challengeBytes);

    const userIdBytes = new TextEncoder().encode(user.id);

    const creationOptions: PublicKeyCredentialCreationOptions = {
      challenge: challengeBytes,
      rp: {
        name: "Nychthemeron",
        id: window.location.hostname,
      },
      user: {
        id: userIdBytes,
        name: user.email || user.id,
        displayName: user.user_metadata?.display_name || user.email || "Nychthemeron User",
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" },  // ES256 (Passkeys, Google, Apple, WebAuthn standard)
        { alg: -257, type: "public-key" }, // RS256
      ],
      timeout: 60000,
      attestation: "none",
      authenticatorSelection: {
        userVerification: "preferred",
        residentKey: "preferred",
      },
    };

    const credential = (await navigator.credentials.create({
      publicKey: creationOptions,
    })) as PublicKeyCredential | null;

    if (!credential) {
      return { passkeyId: null, error: new Error("Passkey registration cancelled.") };
    }

    const response = credential.response as AuthenticatorAttestationResponse;
    const rawIdBase64 = bufferToBase64URL(credential.rawId);
    const publicKeyBase64 = bufferToBase64URL(response.getPublicKey ? response.getPublicKey()! : response.clientDataJSON);
    const transports = response.getTransports ? response.getTransports() : [];

    const { data, error } = await supabase.rpc("register_user_passkey" as any, {
      p_credential_id: rawIdBase64,
      p_public_key: publicKeyBase64,
      p_nickname: nickname.trim() || "Passkey",
      p_transports: transports,
    });

    if (error) {
      if (error.message?.includes("duplicate key") || error.message?.includes("already exists")) {
        return { passkeyId: null, error: new Error("This passkey is already registered.") };
      }
      return { passkeyId: null, error };
    }

    return { passkeyId: data as string, error: null };
  } catch (err: any) {
    if (err.name === "NotAllowedError") {
      return { passkeyId: null, error: new Error("Passkey registration was cancelled.") };
    }
    return { passkeyId: null, error: err };
  }
};

/**
 * Authenticate and sign in using a registered Passkey.
 * Calls the `passkey-auth` Edge Function which verifies the credential
 * and returns a sign-in token — establishing a real Supabase session
 * without sending any email.
 */
export const authenticateWithPasskey = async (): Promise<{ success: boolean; error: any }> => {
  if (!isPasskeySupported()) {
    return { success: false, error: new Error("Passkeys are not supported by your browser.") };
  }

  try {
    const challengeBytes = new Uint8Array(32);
    crypto.getRandomValues(challengeBytes);

    const requestOptions: PublicKeyCredentialRequestOptions = {
      challenge: challengeBytes,
      rpId: window.location.hostname,
      userVerification: "preferred",
      timeout: 60000,
    };

    const credential = (await navigator.credentials.get({
      publicKey: requestOptions,
    })) as PublicKeyCredential | null;

    if (!credential) {
      return { success: false, error: new Error("Passkey authentication cancelled.") };
    }

    const credentialId = bufferToBase64URL(credential.rawId);

    // Call the Edge Function to verify and get a sign-in token
    const supabaseUrl = (supabase as any).supabaseUrl || 
      (supabase as any).rest?.url?.replace("/rest/v1", "") || 
      import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = (supabase as any).supabaseKey || import.meta.env.VITE_SUPABASE_ANON_KEY;

    const response = await fetch(`${supabaseUrl}/functions/v1/passkey-auth`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseAnonKey,
        "Authorization": `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({ credential_id: credentialId }),
    });

    const result = await response.json();

    if (!response.ok || result.error) {
      return {
        success: false,
        error: new Error(result.error || "Passkey verification failed."),
      };
    }

    // Use the token from the Edge Function to create a real session (no email sent)
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: result.email,
      token: result.token,
      type: "magiclink",
    });

    if (verifyError) {
      return { success: false, error: verifyError };
    }

    return { success: true, error: null };
  } catch (err: any) {
    if (err.name === "NotAllowedError") {
      return { success: false, error: new Error("Passkey authentication was cancelled.") };
    }
    return { success: false, error: err };
  }
};


/**
 * Delete a registered Passkey
 */
export const deletePasskey = async (passkeyId: string): Promise<{ error: any }> => {
  try {
    const { error } = await supabase
      .from("user_passkeys")
      .delete()
      .eq("id", passkeyId);

    return { error };
  } catch (err: any) {
    return { error: err };
  }
};

/**
 * Rename a registered Passkey
 */
export const updatePasskeyNickname = async (
  passkeyId: string,
  newNickname: string
): Promise<{ error: any }> => {
  try {
    const { error } = await supabase
      .from("user_passkeys")

      .update({ device_nickname: newNickname.trim() })
      .eq("id", passkeyId);

    return { error };
  } catch (err: any) {
    return { error: err };
  }
};
