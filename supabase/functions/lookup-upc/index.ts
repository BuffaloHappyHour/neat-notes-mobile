// @ts-ignore Deno
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const JSON_HEADERS = { "Content-Type": "application/json" };

serve(async (req: Request) => {
  try {
    const { barcode } = await req.json();

    if (!barcode) {
      return new Response(
        JSON.stringify({ error: "Missing barcode" }),
        { status: 400, headers: JSON_HEADERS }
      );
    }

    // ── Step 1: query our own whiskey_barcodes table ──────────────
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (supabaseUrl && serviceRoleKey) {
      // Compute the same three variants the SQL uses:
      //   wb.barcode = $1
      //   wb.barcode = lpad($1, 12, '0')
      //   wb.barcode = ltrim($1, '0')
      const exact = String(barcode);
      const padded = exact.padStart(12, "0");
      const trimmed = exact.replace(/^0+/, "") || exact;
      const variants = [...new Set([exact, padded, trimmed])];
      const inList = variants.join(",");

      const dbUrl =
        `${supabaseUrl}/rest/v1/whiskey_barcodes` +
        `?select=barcode,confidence,whiskeys(id,display_name,whiskey_type,distillery,proof,region)` +
        `&barcode=in.(${inList})` +
        `&order=confidence.desc.nullslast` +
        `&limit=1`;

      const dbRes = await fetch(dbUrl, {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
      });

      if (dbRes.ok) {
        const rows = await dbRes.json();
        const row = rows?.[0];
        if (row?.whiskeys) {
          const w = row.whiskeys;
          return new Response(
            JSON.stringify({
              found: true,
              source: "database",
              whiskey_id: w.id,
              display_name: w.display_name,
              whiskey_type: w.whiskey_type,
              distillery: w.distillery,
              proof: w.proof,
              region: w.region,
              barcode: row.barcode,
              confidence: row.confidence,
            }),
            { headers: JSON_HEADERS }
          );
        }
      }
    }

    // ── Step 2: fall back to upcitemdb ────────────────────────────
    const url = `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`;
    const res = await fetch(url);
    const data = await res.json();

    const item = data?.items?.[0];
    const title = item?.title?.toLowerCase() ?? "";

    const isWhiskey =
      title.includes("whiskey") ||
      title.includes("whisky") ||
      title.includes("bourbon") ||
      title.includes("scotch") ||
      title.includes("rye");

    if (item && isWhiskey) {
      return new Response(
        JSON.stringify({
          found: true,
          source: "upcitemdb",
          title: item?.title ?? null,
          brand: item?.brand ?? null,
        }),
        { headers: JSON_HEADERS }
      );
    }

    return new Response(
      JSON.stringify({ found: false }),
      { headers: JSON_HEADERS }
    );

  } catch (_err) {
    return new Response(
      JSON.stringify({ found: false }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
