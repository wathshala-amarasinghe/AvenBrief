import { NextResponse } from "next/server";
import { getPublicSupabase } from "@/lib/supabase-public";

const headers = {
  "Cache-Control": "no-store",
};

export async function GET() {
  try {
    const supabase = getPublicSupabase();

    const { data, error } = await supabase
      .from("articles")
      .select("id, title, slug, summary, category, published_at")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(20);

    if (error) throw error;

    return NextResponse.json(
      { articles: data ?? [] },
      { headers },
    );
  } catch (error) {
    console.error("Could not load published articles:", error);

    return NextResponse.json(
      { error: "Could not load articles." },
      { status: 500, headers },
    );
  }
}