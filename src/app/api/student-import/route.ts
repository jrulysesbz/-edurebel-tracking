// src/app/api/student-import/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseServer';
import type { Database } from '@/lib/supabase.types';

type StudentInsert = Database['public']['Tables']['students']['Insert'];

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.redirect(
        new URL('/students?import=missing_file', req.url)
      );
    }

    const text = await file.text();

    // Simple CSV parsing:
    // - First row = headers
    // - Comma-separated
    // - No commas inside fields
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      return NextResponse.redirect(
        new URL('/students?import=empty', req.url)
      );
    }

    const headers = lines[0].split(',').map((h) => h.trim());
    const rows: StudentInsert[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',');
      const record: any = {};

      headers.forEach((header, idx) => {
        const raw = cols[idx]?.trim() ?? '';
        if (!raw) return;

        switch (header) {
          case 'id':
            record.id = raw;
            break;
          case 'first_name':
            record.first_name = raw;
            break;
          case 'last_name':
            record.last_name = raw;
            break;
          case 'code':
            record.code = raw;
            break;
          case 'class_id':
            record.class_id = raw;
            break;
          case 'photo_url':
            record.photo_url = raw;
            break;
          // Add extra columns here if needed
          default:
            break;
        }
      });

      // Skip completely empty records
      if (
        !record.first_name &&
        !record.last_name &&
        !record.code &&
        !record.id
      ) {
        continue;
      }

      rows.push(record as StudentInsert);
    }

    if (rows.length === 0) {
      return NextResponse.redirect(
        new URL('/students?import=no_valid_rows', req.url)
      );
    }

    const supabaseAny = supabase as any;

    // Upsert – if id is present, update; otherwise insert.
    const { error } = await supabaseAny
      .from('students')
      .upsert(rows);

    if (error) {
      console.error('Error importing students from CSV', error);
      return NextResponse.redirect(
        new URL('/students?import=error', req.url)
      );
    }

    const redirectUrl = new URL('/students', req.url);
    redirectUrl.searchParams.set('import', 'success');
    redirectUrl.searchParams.set('count', String(rows.length));

    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error('Unexpected error in student CSV import', err);
    return NextResponse.redirect(
      new URL('/students?import=unexpected', req.url)
    );
  }
}

