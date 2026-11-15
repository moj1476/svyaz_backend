import { randomUUID } from 'node:crypto';
import { required } from '#config';
import { uuid } from '#contracts/errors';
import { databaseFor } from '#storage/prisma';

export async function initializeIdentity() {
  const id = uuid(required('LOCAL_USER_ID'));
  const login = required('LOCAL_USER_LOGIN').trim();
  if (!login) throw new Error('Укажите непустой LOCAL_USER_LOGIN');

  const db = databaseFor('identity');
  try {
    await db.user.upsert({
      where: { id },
      create: { id, login, displayName: login, status: 'ACTIVE' },
      update: {},
    });
  } finally {
    await db.$disconnect();
  }
}

export async function initializePermissions() {
  const db = databaseFor('workspace');
  try {
    await db.permission.createMany({
      data: [
        { id: randomUUID(), code: 'audit.read', scope: 'AUDIT' },
        { id: randomUUID(), code: 'workspace.members.read', scope: 'WORKSPACE' },
        { id: randomUUID(), code: 'workspace.dashboard.read', scope: 'WORKSPACE' },
      ],
      skipDuplicates: true,
    });
  } finally {
    await db.$disconnect();
  }
}
