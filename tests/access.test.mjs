import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canManageClientCredentials,
  isPrimaryAdministrator,
} from '../lib/access.ts';

test('primary administrator identity is normalized and recognized', () => {
  assert.equal(isPrimaryAdministrator(' ADMIN@CRISDALCOMPANY.COM '), true);
});

test('primary administrator can manage clients even before role backfill', () => {
  assert.equal(
    canManageClientCredentials({
      email: 'admin@crisdalcompany.com',
      globalRole: 'COACH',
      status: 'ACTIVE',
    }),
    true,
  );
});

test('only active administrators can manage client credentials', () => {
  assert.equal(
    canManageClientCredentials({
      email: 'coach@example.com',
      globalRole: 'COACH',
      status: 'ACTIVE',
    }),
    false,
  );
  assert.equal(
    canManageClientCredentials({
      email: 'admin@example.com',
      globalRole: 'ADMIN',
      status: 'PAUSED',
    }),
    false,
  );
  assert.equal(
    canManageClientCredentials({
      email: 'admin@example.com',
      globalRole: 'SUPER_ADMIN',
      status: 'ACTIVE',
    }),
    true,
  );
});
