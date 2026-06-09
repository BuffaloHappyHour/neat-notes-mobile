// @ts-ignore Deno
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const JSON_HEADERS = { "Content-Type": "application/json" };

// Verify Svix webhook signature used by Resend.
// Secret format: "whsec_<base64>" — strip prefix, decode to raw bytes for HMAC-SHA256.
async function verifySignature(
  rawBody: string,
  svixId: string,
  svixTimestamp: string,
  svixSignature: string,
  secret: string
): Promise<boolean> {
  try {
    const b64 = secret.startsWith("whsec_") ? secret.slice(6) : secret;
    const keyBytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`;
    const key = await crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sigBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(signedContent));
    const computed = btoa(String.fromCharCode(...new Uint8Array(sigBytes)));
    // svix-signature may contain multiple space-separated "v1,<sig>" tokens
    return svixSignature.split(" ").some((token) => {
      const [version, sig] = token.split(",");
      return version === "v1" && sig === computed;
    });
  } catch {
    return false;
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: JSON_HEADERS,
    });
  }

  // @ts-ignore Deno
  const webhookSecret = Deno.env.get("RESEND_WEBHOOK_SECRET") ?? "";
  const svixId = req.headers.get("svix-id") ?? "";
  const svixTimestamp = req.headers.get("svix-timestamp") ?? "";
  const svixSignature = req.headers.get("svix-signature") ?? "";

  const rawBody = await req.text();

  const valid = await verifySignature(rawBody, svixId, svixTimestamp, svixSignature, webhookSecret);
  if (!valid) {
    console.error("resend-webhook: invalid signature");
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

  try {
    // @ts-ignore Deno
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    // @ts-ignore Deno
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    type ResendPayload = {
      type: string;
      data: {
        email_id?: string;
        to?: string[];
        click?: { link?: string };
      };
    };

    const payload = JSON.parse(rawBody) as ResendPayload;
    const eventType = payload.type ?? "unknown";
    const resendEmailId = payload.data?.email_id ?? "";
    const recipient = (payload.data?.to ?? [])[0] ?? null;
    const clickedUrl = payload.data?.click?.link ?? null;

    console.log(`resend-webhook: received event_type=${eventType} email_id=${resendEmailId}`);

    const row = {
      resend_email_id: resendEmailId,
      event_type: eventType,
      recipient,
      clicked_url: clickedUrl,
    };

    const res = await fetch(`${supabaseUrl}/rest/v1/email_events`, {
      method: "POST",
      headers: {
        apikey: serviceRoleKey ?? "",
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(row),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`resend-webhook: db insert failed: ${errText}`);
      return new Response(JSON.stringify({ error: "DB insert failed" }), {
        status: 500,
        headers: JSON_HEADERS,
      });
    }

    return new Response(JSON.stringify({ received: true, event_type: eventType }), {
      status: 200,
      headers: JSON_HEADERS,
    });
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err);
    console.error(`resend-webhook: unhandled error: ${errMessage}`);
    return new Response(JSON.stringify({ error: errMessage }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }
});
