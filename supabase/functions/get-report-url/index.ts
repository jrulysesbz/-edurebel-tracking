// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SB_URL") ?? Deno.env.get("SUPABASE_URL")!;
const ANON_KEY     = Deno.env.get("SB_ANON_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY  = Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_TOKEN  = Deno.env.get("ADMIN_BEARER_TOKEN") ?? "";

function isBypass(h: string | null): boolean {
  return !!h && (h === `Bearer ${SERVICE_KEY}` || (ADMIN_TOKEN && h === `Bearer ${ADMIN_TOKEN}`));
}

type Body = { student_id: string; week_start?: string };

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") return new Response(JSON.stringify({ error: "POST required" }), { status: 405 });

    const auth = req.headers.get("Authorization");
    if (!auth) return new Response(JSON.stringify({ error: "Missing Authorization Bearer token" }), { status: 401 });

    const { student_id, week_start }: Body = await req.json();

    if (isBypass(auth)) {
      // Service/Admin: read latest path directly (no RLS) then sign
      const svc = createClient(SUPABASE_URL, SERVICE_KEY);
      const q = svc
        .from("reports")
        .select("file_path")
        .eq("student_id", student_id)
        .order("week_start", { ascending: false })
        .limit(1)
        .maybeSingle();
      const { data: row, error: qErr } = await q;
      if (qErr) throw qErr;
      if (!row?.file_path) return new Response(JSON.stringify({ ok: false, error: "No report path found" }), { status: 404 });
      const { data: signed, error: sErr } = await svc.storage.from("reports").createSignedUrl(row.file_path, 3600);
      if (sErr) throw sErr;
      return new Response(JSON.stringify({ ok: true, url: signed.signedUrl, path: row.file_path }), {
        headers: { "content-type": "application/json" },
      });
    }

    // Normal path: RLS-aware RPC -> path -> service sign
    const user = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: auth } } });
    const fn = week_start ? "report_path_for_week" : "latest_report_path";
    const args = week_start ? { p_student: student_id, p_week_start: week_start as any } : { p_student: student_id };
    const { data: pathRow, error: pathErr } = await user.rpc(fn, args);
    if (pathErr) throw pathErr;
    if (!pathRow) return new Response(JSON.stringify({ ok: false, error: "No report path or not permitted" }), { status: 403 });

    const svc = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: signed, error: sErr } = await svc.storage.from("reports").createSignedUrl(pathRow as string, 3600);
    if (sErr) throw sErr;

    return new Response(JSON.stringify({ ok: true, url: signed.signedUrl, path: pathRow }), {
      headers: { "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500 });
  }
});
