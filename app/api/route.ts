import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { photo_id, anon_fingerprint } = await req.json();

    if (!photo_id || !anon_fingerprint) {
      return NextResponse.json(
        { ok: false, error: "Missing photo_id or anon_fingerprint" },
        { status: 400 }
      );
    }

    const { error: likeErr } = await supabase
      .from("likes")
      .insert({ photo_id, anon_fingerprint });

    if (likeErr) {
      if (likeErr.code === "23505") {
        return NextResponse.json({ ok: true, incremented: false });
      }
      return NextResponse.json({ ok: false, error: likeErr.message }, { status: 500 });
    }

    const { data: row, error: readErr } = await supabase
      .from("photos")
      .select("like_count")
      .eq("id", photo_id)
      .single();

    if (readErr) return NextResponse.json({ ok: false, error: readErr.message }, { status: 500 });

    const current = row?.like_count ?? 0;

    const { error: updErr } = await supabase
      .from("photos")
      .update({ like_count: current + 1 })
      .eq("id", photo_id);

    if (updErr) return NextResponse.json({ ok: false, error: updErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, incremented: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
