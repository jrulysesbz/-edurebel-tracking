import { test, expect } from '@playwright/test';

const SCHOOL_ID_ENV = process.env.SCHOOL_ID ?? '';

test.describe('API smoke', () => {
  test('health responds ok', async ({ request, baseURL }) => {
    const r = await request.get(`${baseURL}/api/health`);
    expect(r.status()).toBe(200);
    const j = await r.json();
    expect(j.ok).toBe(true);
    expect(typeof j.ts).toBe('number');
  });

  test('idempotent: POST /api/rooms creates or returns existing "General"', async ({ request, baseURL }) => {
    let schoolId = SCHOOL_ID_ENV;
    if (!schoolId) {
      const s = await request.get(`${baseURL}/api/schools`);
      expect(s.ok()).toBeTruthy();
      const js = await s.json();
      expect(Array.isArray(js.data)).toBe(true);
      expect(js.data.length).toBeGreaterThan(0);
      schoolId = js.data[0].id;
    }

    const payload = { name: 'General', school_id: schoolId };

    const p1 = await request.post(`${baseURL}/api/rooms`, { data: payload });
    expect(p1.ok()).toBeTruthy();
    const j1 = await p1.json();
    expect(j1.data?.id).toBeTruthy();
    const firstId = j1.data.id;

    const p2 = await request.post(`${baseURL}/api/rooms`, { data: payload });
    expect(p2.ok()).toBeTruthy();
    const j2 = await p2.json();
    expect(j2.data?.id).toBe(firstId);

    const g = await request.get(`${baseURL}/api/rooms?school_id=${schoolId}&name=General`);
    expect(g.ok()).toBeTruthy();
    const jg = await g.json();
    const rows: Array<any> = jg.data || [];
    expect(rows.length).toBe(1);
    expect(rows[0].id).toBe(firstId);
  });
});
