import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req: Request) => {
  try {
    const { barcode } = await req.json();

    if (!barcode) {
      return new Response(
        JSON.stringify({ error: "Missing barcode" }),
        { status: 400 }
      );
    }

    const url = `https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`;

    const res = await fetch(url);
    const data = await res.json();

    const item = data?.items?.[0];

    // 👉 ADD THIS (filter logic)
    const title = item?.title?.toLowerCase() ?? "";

    const isWhiskey =
      title.includes("whiskey") ||
      title.includes("whisky") ||
      title.includes("bourbon") ||
      title.includes("scotch") ||
      title.includes("rye");

    return new Response(
      JSON.stringify({
        found: !!item && isWhiskey,
        title: isWhiskey ? item?.title ?? null : null,
        brand: isWhiskey ? item?.brand ?? null : null,
        raw_response: data ?? null,
      }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({
        found: false,
        title: null,
        brand: null,
        raw_response: null,
      }),
      { status: 500 }
    );
  }
});