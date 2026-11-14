/**
 * Bootstrapped primary owner admin emails allowed to sign in to /admin
 * and manage dynamic co-admins stored in `/admins/{lowercaseEmail}`.
 * Keep synced with `isOwnerAdmin()` inside `/firestore.rules`.
 */
export const ADMIN_EMAILS: readonly string[] = [
  'wissemzerrougui7@gmail.com',
];

export const ADMINS_COLLECTION = 'admins';

export interface AdminMemberRecord {
  email: string;
  name: string;
  addedBy: string;
  createdAtText: string;
  createdAtMs: number;
}

const ADMIN_EMAIL_REGEX = /^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/;

export function normalizeAdminEmail(email: string | null | undefined): string {
  return String(email ?? '').trim().toLowerCase();
}

export function isOwnerAdminEmail(email: string | null | undefined): boolean {
  const normalized = normalizeAdminEmail(email);
  if (!normalized) return false;
  return ADMIN_EMAILS.some((allowed) => allowed.toLowerCase() === normalized);
}

export function isAdminEmail(
  email: string | null | undefined,
  dynamicAdminEmails: readonly string[] = []
): boolean {
  const normalized = normalizeAdminEmail(email);
  if (!normalized) return false;
  if (isOwnerAdminEmail(normalized)) return true;
  return dynamicAdminEmails.some(
    (allowed) => normalizeAdminEmail(allowed) === normalized
  );
}

export function validateNewAdminEmail(
  rawEmail: string,
  existingEmails: readonly string[] = []
): { ok: true; email: string } | { ok: false; error: string } {
  const normalized = normalizeAdminEmail(rawEmail);
  if (!normalized) {
    return {
      ok: false,
      error: 'اكتبي بريد Google الإلكتروني (Gmail) من فضلك.',
    };
  }
  if (normalized.length < 5 || normalized.length > 120 || !ADMIN_EMAIL_REGEX.test(normalized)) {
    return {
      ok: false,
      error: 'صيغة البريد الإلكتروني غير صحيحة (مثال: name@gmail.com).',
    };
  }
  if (isOwnerAdminEmail(normalized)) {
    return {
      ok: false,
      error: 'هذا الحساب هو المشرفة الرئيسية ومضاف بالفعل بشكل دائم.',
    };
  }
  if (existingEmails.some((e) => normalizeAdminEmail(e) === normalized)) {
    return {
      ok: false,
      error: 'هذا البريد الإلكتروني مضاف بالفعل في فريق الإدارة.',
    };
  }
  return { ok: true, email: normalized };
}
