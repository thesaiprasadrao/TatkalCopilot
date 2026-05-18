import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

const algorithm = "aes-256-gcm";
const saltLength = 16;
const ivLength = 12;
const tagLength = 16;
const keyLength = 32;

export type VaultPayload = Record<string, unknown>;

export function encryptVaultPayload(payload: VaultPayload, secret: string) {
  const salt = randomBytes(saltLength);
  const iv = randomBytes(ivLength);
  const key = scryptSync(secret, salt, keyLength);
  const cipher = createCipheriv(algorithm, key, iv);
  const plaintext = Buffer.from(JSON.stringify(payload), "utf8");
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([salt, iv, tag, encrypted]).toString("base64");
}

export function decryptVaultPayload<T extends VaultPayload>(encryptedPayload: string, secret: string) {
  const packed = Buffer.from(encryptedPayload, "base64");
  const salt = packed.subarray(0, saltLength);
  const iv = packed.subarray(saltLength, saltLength + ivLength);
  const tag = packed.subarray(saltLength + ivLength, saltLength + ivLength + tagLength);
  const encrypted = packed.subarray(saltLength + ivLength + tagLength);
  const key = scryptSync(secret, salt, keyLength);
  const decipher = createDecipheriv(algorithm, key, iv);

  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return JSON.parse(decrypted.toString("utf8")) as T;
}
