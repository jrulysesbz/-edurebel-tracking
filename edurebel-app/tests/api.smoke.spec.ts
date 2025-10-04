import { test, expect } from '@playwright/test';

const SCHOOL_ID_ENV = process.env.SCHOOL_ID ?? '';

test.beforeAll(() => {
  if (!process.env.ADMIN_BEARER_TOKEN) {
    throw new Error('ADMIN_BEARER_TOKEN missing. Export it from .env.local before running tests.');
  }
});

test('health responds ok', async ({ request, baseURL }) => {
  const r = await request.get(`${baseURL}/api/health`);
  if (!r.ok()) throw new Error(`GET /api/health -> ${r.status()} ${await r.text()}`);
  const j = await r.json();
  expect(j.ok).toBe(true);
  expect(typeof j.ts).toBe('number');
});

test('idempotent rooms', async ({ request, baseURL }) => {
  let schoolId = SCHOOL_ID_ENV;
  if (!schoolId) {
    const s = await request.get(`${baseURL}/api/schools`);
    if (!s.ok()) throw new Error(`GET /api/schools -> ${s.status()} ${await s.text()}`);
    const js = await s.json();
    expect(Array.isArray(js.data)).toBe(true);
    expect(js.data.length).toBeGreaterThan(0);
    schoolId = js.data[0].id;
  }

  const payload = { name: 'General', school_id: schoolId };

  const p1 = await request.post(`${baseURL}/api/rooms`, { data: payload });
  if (!p1.ok()) throw new Error(`POST /api/rooms -> ${p1.status()} ${await p1.text()}`);
  const j1 = await p1.json();
  expect(j1.data?.id).toBeTruthy();
  const firstId = j1.data.id;

  const p2 = await request.post(`${baseURL}/api/rooms`, { data: payload });
  if (!p2.ok()) throw new Error(`POST /api/rooms (2) -> ${p2.status()} ${await p2.text()}`);
  const j2 = await p2.json();
  expect(j2.data?.id).toBe(firstId);

  const g = await request.get(`${baseURL}/api/rooms?school_id=${schoolId}&name=General`);
  if (!g.ok()) throw new Error(`GET /api/rooms?school_id=… -> ${g.status()} ${await g.text()}`);
  const jg = await g.json();
  const rows: Array<any> = jg.data || [];
  expect(rows.length).toBe(1);
  expect(rows[0].id).toBe(firstId);
});
