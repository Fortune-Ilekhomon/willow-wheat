import bcrypt from "bcryptjs";

// 12 rounds is a deliberate choice: high enough to be a meaningful barrier
// against offline cracking if the DB is ever exfiltrated, low enough that
// login does not feel slow on modest hosting. Revisit if hosting hardware
// changes significantly.
const SALT_ROUNDS = 12;

export async function hashPassword(plainTextPassword: string): Promise<string> {
  return bcrypt.hash(plainTextPassword, SALT_ROUNDS);
}

export async function verifyPassword(
  plainTextPassword: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(plainTextPassword, passwordHash);
}
