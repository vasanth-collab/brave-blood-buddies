// =============================================
// DASHBOARD — stats, your active requests + assignments
// =============================================

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Droplets, AlertTriangle, Activity, Star, ArrowRight, Inbox } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { BloodRequest, DonorAssignment, Profile, DonorDetails } from '@/types';

const urgencyColors: Record<string, string> = {
  critical: 'bg-critical text-critical-foreground',
  urgent: 'bg-warning text-warning-foreground',
  normal: 'bg-success text-success-foreground',
};

const statusColors: Record<string, string> = {
  open: 'bg-warning/15 text-warning border-warning/30',
  confirmed: 'bg-success/15 text-success border-success/30',
  fulfilled: 'bg-muted text-muted-foreground',
  cancelled: 'bg-muted text-muted-foreground',
};

type RequestRow = BloodRequest & {
  donor_assignments: (DonorAssignment & {
    donor: Pick<Profile, 'id' | 'name' | 'phone' | 'location'> | null;
  })[];
};

export default function Dashboard() {
  const { authUser } = useAuth();
  const [stats, setStats] = useState({
    totalDonors: 0, activeDonors: 0, openRequests: 0, criticalRequests: 0,
  });
  const [topDonors, setTopDonors] = useState<(Profile & { donor_details: DonorDetails | null })[]>([]);
  const [openRequests, setOpenRequests] = useState<BloodRequest[]>([]);
  const [myRequests, setMyRequests] = useState<RequestRow[]>([]);
  const [pendingAssignments, setPendingAssignments] = useState<number>(0);

  const load = async () => {
    const [donorsRes, openReqRes, allReqRes, topRes, myReqRes, pendingRes] = await Promise.all([
      supabase.from('donor_details').select('user_id, is_available'),
      supabase.from('blood_requests').select('*').eq('status', 'open').order('urgency', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('blood_requests').select('id, urgency, status'),
      supabase.from('profiles').select('*, donor_details!inner(*)').limit(20),
      authUser ? supabase.from('blood_requests')
        .select('*, donor_assignments(*, donor:profiles!donor_assignments_donor_id_fkey(id, name, phone, location))')
        .eq('requester_id', authUser.id)
        .order('created_at', { ascending: false })
        .limit(10) : Promise.resolve({ data: [], error: null }),
      authUser ? supabase.from('donor_assignments')
        .select('id', { count: 'exact', head: true })
        .eq('donor_id', authUser.id)
        .eq('response_status', 'pending') : Promise.resolve({ count: 0 }),
    ]);

    const donors = donorsRes.data ?? [];
    const allReq = allReqRes.data ?? [];
    setStats({
      totalDonors: donors.length,
      activeDonors: donors.filter(d => d.is_available).length,
      openRequests: allReq.filter(r => r.status === 'open').length,
      criticalRequests: allReq.filter(r => r.status === 'open' && r.urgency === 'critical').length,
    });
    setOpenRequests((openReqRes.data ?? []) as BloodRequest[]);
    setMyRequests((myReqRes.data ?? []) as RequestRow[]);
    const sortedDonors = ((topRes.data ?? []) as any[])
      .filter(p => p.donor_details)
      .sort((a, b) => (b.donor_details.reliability_score ?? 0) - (a.donor_details.reliability_score ?? 0))
      .slice(0, 5);
    setTopDonors(sortedDonors);
    setPendingAssignments(pendingRes.count ?? 0);
  };

  useEffect(() => { load(); }, [authUser]);

  // Realtime: refresh when requests/assignments change
  useEffect(() => {
    const ch = supabase
      .channel('dashboard-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blood_requests' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donor_assignments' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser]);

  const statCards = [
    { label: 'Total Donors', value: stats.totalDonors, icon: Users, color: 'text-primary' },
    { label: 'Active Donors', value: stats.activeDonors, icon: Activity, color: 'text-success' },
    { label: 'Open Requests', value: stats.openRequests, icon: Droplets, color: 'text-warning' },
    { label: 'Critical', value: stats.criticalRequests, icon: AlertTriangle, color: 'text-critical' },
  ];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        {pendingAssignments > 0 && (
          <Link to="/assignments">
            <Button variant="default" className="gap-2">
              <Inbox className="h-4 w-4" /> {pendingAssignments} pending assignment{pendingAssignments > 1 ? 's' : ''}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(s => (
          <Card key={s.label} className="shadow-card border-0">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div className="text-3xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* My requests with their Primary/Alternate donors */}
      {authUser && myRequests.length > 0 && (
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="text-lg">My Requests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {myRequests.map(r => {
              const primary = r.donor_assignments.find(a => a.role === 'primary');
              const alternate = r.donor_assignments.find(a => a.role === 'alternate');
              return (
                <div key={r.id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center font-bold text-sm text-primary">
                        {r.blood_group}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{r.hospital_name}</p>
                        <p className="text-xs text-muted-foreground">{r.location} · {r.units_needed} unit(s)</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={urgencyColors[r.urgency]}>{r.urgency}</Badge>
                      <Badge variant="outline" className={statusColors[r.status]}>{r.status}</Badge>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2 text-xs">
                    <DonorSlot label="Primary Donor" assignment={primary} />
                    <DonorSlot label="Alternate Donor" assignment={alternate} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Droplets className="h-5 w-5 text-primary" /> Active Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {openRequests.length === 0 ? (
              <p className="text-muted-foreground text-sm">No active requests</p>
            ) : openRequests.slice(0, 5).map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center font-bold text-sm text-primary">
                    {r.blood_group}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{r.hospital_name}</p>
                    <p className="text-xs text-muted-foreground">{r.location} · {r.units_needed} unit(s)</p>
                  </div>
                </div>
                <Badge className={urgencyColors[r.urgency]}>{r.urgency}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Star className="h-5 w-5 text-warning" /> Top Donors
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topDonors.length === 0 ? (
              <p className="text-muted-foreground text-sm">No donors yet</p>
            ) : topDonors.map((d, i) => (
              <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center font-bold text-sm text-primary">
                    #{i + 1}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{d.name || d.email}</p>
                    <p className="text-xs text-muted-foreground">{d.blood_group ?? '?'} · {d.location} · {d.donor_details?.total_donations ?? 0} donations</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary">{d.donor_details?.reliability_score ?? 0}</div>
                  <div className="text-[10px] text-muted-foreground">score</div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DonorSlot({
  label,
  assignment,
}: {
  label: string;
  assignment: (DonorAssignment & { donor: Pick<Profile, 'id' | 'name' | 'phone' | 'location'> | null }) | undefined;
}) {
  const isPrimary = label.startsWith('Primary');
  if (!assignment) {
    return (
      <div className="rounded-md border border-dashed p-2">
        <p className="font-semibold text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-muted-foreground mt-1">Searching…</p>
      </div>
    );
  }
  const statusBadge: Record<string, string> = {
    pending: 'bg-warning/15 text-warning',
    accepted: 'bg-success/15 text-success',
    declined: 'bg-destructive/15 text-destructive',
    unable: 'bg-destructive/15 text-destructive',
    expired: 'bg-muted text-muted-foreground',
  };
  return (
    <div className={`rounded-md border p-2 ${isPrimary ? 'border-primary/40' : 'border-border'}`}>
      <div className="flex items-center justify-between">
        <p className="font-semibold text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusBadge[assignment.response_status]}`}>
          {assignment.response_status}
        </span>
      </div>
      <p className="font-medium mt-1">{assignment.donor?.name ?? 'Unknown'}</p>
      <p className="text-muted-foreground">{assignment.donor?.phone ?? ''} · {assignment.distance_km != null ? `${assignment.distance_km} km` : '—'}</p>
    </div>
  );
}
