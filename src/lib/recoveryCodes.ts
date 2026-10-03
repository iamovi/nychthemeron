import { supabase } from "@/integrations/supabase/client";

/**
 * Hash a plain recovery code using Web Crypto SHA-256
 */
export const hashRecoveryCode = async (code: string): Promise<string> => {
  const normalized = code.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

/**
 * Generate 8 random single-use recovery codes
 * Format: 8 characters split by hyphen, e.g. "A3X7-9K2P"
 */
export const generatePlainRecoveryCodes = (count: number = 8): string[] => {
  const charset = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // Exclude ambiguous chars 0,1,O,I
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    const randomBytes = new Uint8Array(8);
    crypto.getRandomValues(randomBytes);
    let raw = "";
    for (let j = 0; j < 8; j++) {
      raw += charset[randomBytes[j] % charset.length];
    }
    const formatted = `${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
    codes.push(formatted);
  }

  return codes;
};

export interface RecoveryCodeStatus {
  total: number;
  unused: number;
  used: number;
  lastGeneratedAt: string | null;
}

/**
 * Fetch status of current user's recovery codes
 */
export const getRecoveryCodeStatus = async (): Promise<{ data: RecoveryCodeStatus | null; error: any }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { data: null, error: new Error("User not authenticated") };

    const { data, error } = await supabase
      .from("user_recovery_codes" as any)
      .select("id, used_at, created_at")
      .eq("user_id", user.id);

    if (error) {
      // Table might not exist yet or user has no codes
      return { data: { total: 0, unused: 0, used: 0, lastGeneratedAt: null }, error: null };
    }

    const rows = (data as any[]) || [];
    const total = rows.length;
    const unused = rows.filter((r) => !r.used_at).length;
    const used = total - unused;
    const lastGeneratedAt = rows[0]?.created_at || null;

    return {
      data: { total, unused, used, lastGeneratedAt },
      error: null,
    };
  } catch (err: any) {
    return { data: null, error: err };
  }
};

/**
 * Generate and save a new set of recovery codes for current user
 */
export const createAndSaveUserRecoveryCodes = async (): Promise<{ codes: string[] | null; error: any }> => {
  try {
    const plainCodes = generatePlainRecoveryCodes(8);
    const hashes = await Promise.all(plainCodes.map((c) => hashRecoveryCode(c)));

    const { data, error } = await supabase.rpc("save_user_recovery_codes" as any, {
      p_code_hashes: hashes,
    });

    if (error) return { codes: null, error };
    return { codes: plainCodes, error: null };
  } catch (err: any) {
    return { codes: null, error: err };
  }
};

/**
 * Consume a recovery code during active MFA challenge (logged-in user)
 */
export const consumeRecoveryCodeForMfa = async (plainCode: string): Promise<{ success: boolean; error: any }> => {
  try {
    const codeHash = await hashRecoveryCode(plainCode);
    const { data, error } = await supabase.rpc("consume_recovery_code" as any, {
      p_code_hash: codeHash,
    });

    if (error) return { success: false, error };
    return { success: !!data, error: null };
  } catch (err: any) {
    return { success: false, error: err };
  }
};

/**
 * Emergency Account Recovery by Email + Recovery Code + New Password
 */
export const recoverAccountWithCode = async (
  email: string,
  plainCode: string,
  newPassword: string
): Promise<{ success: boolean; error: any }> => {
  try {
    const codeHash = await hashRecoveryCode(plainCode);
    const { data, error } = await supabase.rpc("recover_account_with_code" as any, {
      p_email: email.trim().toLowerCase(),
      p_code_hash: codeHash,
      p_new_password: newPassword,
    });

    if (error) return { success: false, error };
    return { success: !!data, error: null };
  } catch (err: any) {
    return { success: false, error: err };
  }
};
