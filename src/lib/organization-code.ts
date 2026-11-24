import { randomInt } from "node:crypto";

// Tanpa huruf/angka yang mirip (0/O, 1/I/L) agar mudah dibacakan.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateOrganizationCode(length = 8) {
  return Array.from(
    { length },
    () => ALPHABET[randomInt(ALPHABET.length)],
  ).join("");
}
