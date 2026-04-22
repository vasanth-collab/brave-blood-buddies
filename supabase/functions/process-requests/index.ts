// =============================================
// PROCESS-REQUESTS — runs on cron (every minute)
//
// 1. Marks expired pending assignments as 'expired' (the trigger then promotes alternate -> primary)
// 2. For any open requests missing primary or alternate, calls assign-donors to refill
// 3. Notifies requester when status flips to 'confirmed'
// =============================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const summary = { expired: 0, refilled: 0, notified: 0 };

  try {
    // 1. Expire stale pending assignments
    const nowIso = new Date().toISOString();
    const { data: stale } = await supabase
      .from("donor_assignments")
      .select("id")
      .eq("response_status", "pending")
      .lt("response_deadline", nowIso);

    if (stale && stale.length) {
      const ids = stale.map((s) => s.id);
      const { error } = await supabase
        .from("donor_assignments")
        .update({ response_status: "expired", responded_at: nowIso })
        .in("id", ids);
      if (!error) summary.expired = ids.length;
    }

    // 2. Refill missing slots on open requests
    const { data: openReqs } = await supabase
      .from("blood_requests")
      .select("id, requester_id, hospital_name, blood_group, donor_assignments(role, response_status)")
      .in("status", ["open"]);

    for (const r of openReqs ?? []) {
      const assignments = (r as any).donor_assignments ?? [];
      const hasActivePrimary = assignments.some((a: any) => a.role === "primary" && !["declined", "unable", "expired"].includes(a.response_status));
      const hasActiveAlternate = assignments.some((a: any) => a.role === "alternate" && !["declined", "unable", "expired"].includes(a.response_status));
      if (!hasActivePrimary || !hasActiveAlternate) {
        // Call assign-donors to refill
        const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/assign-donors`;
        await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({ request_id: r.id }),
        });
        summary.refilled++;
      }
    }

    // 3. Notify requesters of newly confirmed requests (last 5 min)
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data: confirmed } = await supabase
      .from("blood_requests")
      .select("id, requester_id, hospital_name, blood_group")
      .eq("status", "confirmed")
      .gt("updated_at", fiveMinAgo);

    for (const r of confirmed ?? []) {
      // Only notify once — check if we already notified
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", r.requester_id)
        .eq("type", "request_confirmed")
        .ilike("message", `%${r.id}%`)
        .limit(1);
      if (existing && existing.length) continue;
      await supabase.from("notifications").insert({
        user_id: r.requester_id,
        title: "✅ Request Confirmed",
        message: `Both donors accepted for your ${r.blood_group} request at ${r.hospital_name}. (#${r.id.slice(0, 8)})`,
        type: "request_confirmed",
        link: "/dashboard",
      });
      summary.notified++;
    }

    return new Response(JSON.stringify({ ok: true, ...summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("process-requests error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
