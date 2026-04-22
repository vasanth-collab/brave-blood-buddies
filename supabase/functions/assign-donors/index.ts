// =============================================
// ASSIGN-DONORS — given a request_id, picks Primary + Alternate
//
// Filters:
//   - same blood group
//   - is_available = true
//   - eligible: last_donation_date null OR > 90 days ago
//   - within current_radius_km (expands to 10/20/50/200 if too few)
//   - not already assigned to this request
//
// Ranks by: distance ASC, reliability_score DESC
// Sends in-app notifications to both selected donors.
// Increments donor_details.total_requests for both.
// =============================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function haversineKm(a: [number, number], b: [number, number]) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 10) / 10;
}

const CITY_COORDS: Record<string, [number, number]> = {
  mumbai: [19.076, 72.8777], delhi: [28.6139, 77.209], bangalore: [12.9716, 77.5946],
  bengaluru: [12.9716, 77.5946], chennai: [13.0827, 80.2707], hyderabad: [17.385, 78.4867],
  pune: [18.5204, 73.8567], kolkata: [22.5726, 88.3639], ahmedabad: [23.0225, 72.5714],
  jaipur: [26.9124, 75.7873], lucknow: [26.8467, 80.9462], surat: [21.1702, 72.8311],
};

function approxCoords(location: string, pincode?: string | null): [number, number] | null {
  if (location && CITY_COORDS[location.trim().toLowerCase()]) return CITY_COORDS[location.trim().toLowerCase()];
  if (pincode && /^\d{6}$/.test(pincode)) {
    const n = parseInt(pincode, 10);
    return [8 + ((n % 9000) / 9000) * 28, 68 + (((n * 7) % 11000) / 11000) * 29];
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { request_id, expand_radius } = await req.json();
    if (!request_id) {
      return new Response(JSON.stringify({ error: "request_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Load request
    const { data: request, error: reqErr } = await supabase
      .from("blood_requests").select("*").eq("id", request_id).maybeSingle();
    if (reqErr || !request) {
      return new Response(JSON.stringify({ error: "Request not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (request.status === "fulfilled" || request.status === "cancelled") {
      return new Response(JSON.stringify({ skipped: true, reason: request.status }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Existing assignments — we may need to refill empty slots
    const { data: existing } = await supabase
      .from("donor_assignments").select("*").eq("request_id", request_id);
    const occupied = new Set((existing ?? []).map((a) => a.donor_id));
    const hasPrimary = (existing ?? []).some((a) => a.role === "primary" && !["declined", "unable", "expired"].includes(a.response_status));
    const hasAlternate = (existing ?? []).some((a) => a.role === "alternate" && !["declined", "unable", "expired"].includes(a.response_status));
    if (hasPrimary && hasAlternate) {
      return new Response(JSON.stringify({ skipped: true, reason: "already filled" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Eligibility cutoff: last donation > 90 days ago
    const cutoff = new Date(Date.now() - 90 * 86400000).toISOString();

    // Candidate donors (same blood group, available, eligible, not requester, not already assigned)
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, location, pincode, latitude, longitude, blood_group")
      .eq("blood_group", request.blood_group)
      .neq("id", request.requester_id);

    const ids = (profiles ?? []).map((p) => p.id);
    if (ids.length === 0) {
      return new Response(JSON.stringify({ assigned: 0, reason: "no donors with this blood group" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: details } = await supabase
      .from("donor_details").select("*").in("user_id", ids);
    const detMap = new Map((details ?? []).map((d) => [d.user_id, d]));

    const reqCoords: [number, number] | null =
      request.latitude != null && request.longitude != null
        ? [request.latitude, request.longitude]
        : approxCoords(request.location, request.pincode);

    let candidates = (profiles ?? [])
      .map((p) => {
        const d = detMap.get(p.id);
        if (!d || !d.is_available) return null;
        if (occupied.has(p.id)) return null;
        if (d.last_donation_date && d.last_donation_date > cutoff) return null;
        let dist: number | null = null;
        if (p.latitude != null && p.longitude != null && reqCoords) {
          dist = haversineKm(reqCoords, [p.latitude, p.longitude]);
        } else {
          const pc = approxCoords(p.location, p.pincode);
          if (reqCoords && pc) dist = haversineKm(reqCoords, pc);
        }
        return { profile: p, details: d, distance_km: dist };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);

    // Apply distance radius. Expand if too few.
    const radiusSchedule = [request.current_radius_km, 10, 20, 50, 200, 999999];
    let chosen: typeof candidates = [];
    let usedRadius = request.current_radius_km;
    for (const r of radiusSchedule) {
      const inRange = candidates.filter((c) => c.distance_km == null || c.distance_km <= r);
      if (inRange.length >= 2 || r === 999999) {
        chosen = inRange;
        usedRadius = r;
        break;
      }
    }

    // Rank: nearest first, then highest reliability
    chosen.sort((a, b) => {
      const ad = a.distance_km ?? 1e9;
      const bd = b.distance_km ?? 1e9;
      if (ad !== bd) return ad - bd;
      return (b.details.reliability_score ?? 0) - (a.details.reliability_score ?? 0);
    });

    if (chosen.length === 0) {
      // Mark new radius so cron knows current state
      if (usedRadius !== request.current_radius_km) {
        await supabase.from("blood_requests").update({ current_radius_km: usedRadius }).eq("id", request_id);
      }
      return new Response(JSON.stringify({ assigned: 0, radius_km: usedRadius }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const inserts: any[] = [];
    if (!hasPrimary && chosen[0]) {
      inserts.push({
        request_id,
        donor_id: chosen[0].profile.id,
        role: "primary",
        distance_km: chosen[0].distance_km,
      });
    }
    if (!hasAlternate && chosen[hasPrimary ? 0 : 1]) {
      const idx = hasPrimary ? 0 : 1;
      const alt = chosen[idx];
      if (alt) {
        inserts.push({
          request_id,
          donor_id: alt.profile.id,
          role: "alternate",
          distance_km: alt.distance_km,
        });
      }
    }

    if (inserts.length === 0) {
      return new Response(JSON.stringify({ assigned: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: created, error: insErr } = await supabase
      .from("donor_assignments").insert(inserts).select();
    if (insErr) throw insErr;

    // Update radius if expanded
    if (usedRadius !== request.current_radius_km) {
      await supabase.from("blood_requests").update({ current_radius_km: usedRadius }).eq("id", request_id);
    }

    // Notifications + total_requests bump
    const notifs = (created ?? []).map((a) => ({
      user_id: a.donor_id,
      title: a.role === "primary" ? "🩸 You're the Primary Donor" : "🩸 You're the Backup Donor",
      message:
        a.role === "primary"
          ? `Urgent ${request.urgency.toUpperCase()} request: ${request.units_needed} unit(s) of ${request.blood_group} at ${request.hospital_name}, ${request.location}. Please accept within 30 minutes.`
          : `You're the alternate for a ${request.blood_group} request at ${request.hospital_name}, ${request.location}. We'll only need you if the primary can't donate.`,
      type: a.role === "primary" ? "primary_assignment" : "alternate_assignment",
      link: "/assignments",
    }));
    if (notifs.length) await supabase.from("notifications").insert(notifs);

    // Increment total_requests
    for (const a of created ?? []) {
      const dd = detMap.get(a.donor_id);
      if (dd) {
        await supabase.from("donor_details").update({ total_requests: (dd.total_requests ?? 0) + 1 }).eq("user_id", a.donor_id);
      }
    }

    return new Response(JSON.stringify({ assigned: created?.length ?? 0, radius_km: usedRadius }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("assign-donors error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
