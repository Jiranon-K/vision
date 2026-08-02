import { test as setup, expect } from '@playwright/test';
import {
  API_URL,
  CREATOR,
  SEEDED_DRAFT_POST,
  SEEDED_PUBLISHED_POST,
  STORAGE_STATE,
} from './config';

// Seeding goes through the API rather than straight into Mongo: it keeps the
// tests off the database schema, and it exercises the same path a Creator uses.
setup('seed creator and posts, save storage state', async ({ request }) => {
  const register = await request.post(`${API_URL}/api/auth/register`, {
    data: {
      email: CREATOR.email,
      password: CREATOR.password,
      name: CREATOR.name,
    },
  });
  expect(register.status(), await register.text()).toBe(201);

  for (const post of [SEEDED_PUBLISHED_POST, SEEDED_DRAFT_POST]) {
    const created = await request.post(`${API_URL}/api/posts`, { data: post });
    expect(created.status(), await created.text()).toBe(201);
  }

  await request.storageState({ path: STORAGE_STATE });
});
