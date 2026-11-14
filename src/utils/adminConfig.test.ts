import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ADMIN_EMAILS,
  isAdminEmail,
  isOwnerAdminEmail,
  normalizeAdminEmail,
  validateNewAdminEmail,
} from './adminConfig.ts';

test('normalizeAdminEmail trims whitespace and lowercases cleanly', () => {
  assert.equal(normalizeAdminEmail('  User.Name@Gmail.COM '), 'user.name@gmail.com');
  assert.equal(normalizeAdminEmail(null), '');
  assert.equal(normalizeAdminEmail(undefined), '');
});

test('isOwnerAdminEmail identifies bootstrapped owner case-insensitively', () => {
  assert.equal(isOwnerAdminEmail(ADMIN_EMAILS[0]), true);
  assert.equal(isOwnerAdminEmail('  WISSEMZERROUGUI7@GMAIL.COM  '), true);
  assert.equal(isOwnerAdminEmail('partner@gmail.com'), false);
});

test('isAdminEmail accepts owner and dynamic team admin emails', () => {
  assert.equal(isAdminEmail('wissemzerrougui7@gmail.com'), true);
  assert.equal(isAdminEmail('partner@gmail.com', []), false);
  assert.equal(isAdminEmail('Partner@Gmail.com', ['partner@gmail.com']), true);
});

test('validateNewAdminEmail rejects invalid, owner, and duplicate emails while normalizing valid ones', () => {
  assert.equal(validateNewAdminEmail('').ok, false);
  assert.equal(validateNewAdminEmail('not-an-email').ok, false);
  assert.equal(validateNewAdminEmail('WissemZerrougui7@gmail.com').ok, false);
  assert.equal(
    validateNewAdminEmail('co.admin@gmail.com', ['co.admin@gmail.com']).ok,
    false
  );

  const valid = validateNewAdminEmail('  Sara.Craft@Gmail.com  ', ['other@gmail.com']);
  assert.deepEqual(valid, { ok: true, email: 'sara.craft@gmail.com' });
});
