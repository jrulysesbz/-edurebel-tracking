import { test, expect } from '@playwright/test';

test('messages: POST + GET flow', async ({ request, baseURL }) => {
  const b = baseURL || 'http://localhost:3000';

  // discover school & room
  const schools = await request.get(`${b}/api/schools`);
  expect(schools.ok()).toBeTruthy();
  const sjs = await schools.json();
  const schoolId = sjs?.data?.[0]?.id as string;
  expect(schoolId).toBeTruthy();

  // ensure "General" room exists (idempotent by server/db)
  const ensure = await request.post(`${b}/api/rooms`, {
    data: { name: 'General', school_id: schoolId },
  });
  expect(ensure.ok()).toBeTruthy();
  const ej = await ensure.json();
  const roomId = ej?.data?.id as string;
  expect(roomId).toBeTruthy();

  // post one message
  const content = `hello-${Date.now()}`;
  const postMsg = await request.post(`${b}/api/rooms/${roomId}/messages`, {
    data: { content },
  });
  expect(postMsg.ok()).toBeTruthy();

  // list messages: should include the content we just posted
  const list = await request.get(`${b}/api/rooms/${roomId}/messages?limit=20`);
  expect(list.ok()).toBeTruthy();
  const lj = await list.json();
  const msgs: Array<{content:string}> = lj?.data ?? [];
  expect(Array.isArray(msgs)).toBe(true);
  const found = msgs.some(m => (m?.content || '').includes(content));
  expect(found).toBe(true);
});
