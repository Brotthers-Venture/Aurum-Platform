/**
 * Message encryption for Communication (server only).
 *
 * Envelope scheme: every workspace (space × client, or a space's internal channels) has its own
 * 256-bit data key, kept in Supabase Vault and referenced by comm_keys.vault_secret_id. Bodies are
 * sealed with AES-256-GCM before they are written; the database only ever holds nonce + ciphertext.
 * The message id and workspace are bound in as associated data, so a ciphertext cannot be moved
 * to another message or workspace and still decrypt.
 */
import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export type Sealed = { nonce: Buffer; ciphertext: Buffer };

function aad(messageId: string, workspace: string) {
  return Buffer.from(`aurum-comm:v1:${workspace}:${messageId}`, "utf8");
}

export function seal(key: Buffer, body: string, messageId: string, workspace: string): Sealed {
  if (key.length !== 32) throw new Error("data key must be 256 bits");
  const nonce = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key, nonce);
  c.setAAD(aad(messageId, workspace));
  const ciphertext = Buffer.concat([c.update(body, "utf8"), c.final(), c.getAuthTag()]);
  return { nonce, ciphertext };
}

export function open(key: Buffer, sealed: Sealed, messageId: string, workspace: string): string {
  const { nonce, ciphertext } = sealed;
  const d = createDecipheriv("aes-256-gcm", key, nonce);
  d.setAAD(aad(messageId, workspace));
  d.setAuthTag(ciphertext.subarray(ciphertext.length - 16));
  return Buffer.concat([d.update(ciphertext.subarray(0, ciphertext.length - 16)), d.final()]).toString("utf8");
}

/** A fresh data key for a new workspace (stored in Vault, never in the app's database tables). */
export const newDataKey = () => randomBytes(32);
