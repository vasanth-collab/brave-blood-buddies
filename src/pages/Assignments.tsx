// =============================================
// MY ASSIGNMENTS — donor's pending/past assignments with response buttons
// =============================================

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Ban, Clock, MapPin, Phone, Building2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { DonorAssignment, BloodRequest, ResponseStatus } from '@/types';

type Row = DonorAssignment & { request: BloodRequest | null };

const urgencyColors: Record<string, string> = {
  critical: 'bg-critical text-critical-foreground',
  urgent: 'bg-warning text-warning-foreground',
  normal: 'bg-success text-success-foreground',
};

export default function Assignments() {
  const { authUser, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const load = async () => {
    if (!authUser) { setRows([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from('donor_assignments')
      .select('*, request:blood_requests(*)')
      .eq('donor_id', authUser.id)
      .order('assigned_at', { ascending: false });
    if (!error) setRows((data ?? []) as Row[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [authUser]);

  useEffect(() => {
    if (!authUser) return;
    const ch = supabase
      .channel(`assignments-${authUser.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'donor_assignments', filter: `donor_id=eq.${authUser.id}` }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser]);

  const respond = async (assignment: Row, status: ResponseStatus) => {
    setSubmittingId(assignment.id);
    const { error } = await supabase
      .from('donor_assignments')
      .update({ response_status: status, responded_at: new Date().toISOString() })
      .eq('id', assignment.id);

    // bump donor stats
    if (!error && authUser) {
      const inc = status === 'accepted' ? 1 : 0;
      await supabase.rpc('noop'); // placeholder if RPC unavailable — manual update below:
      const { data: dd } = await supabase.from('donor_details').select('*').eq('user_id', authUser.id).maybeSingle();
      if (dd) {
        await supabase.from('donor_details').update({
          total_requests: dd.total_requests + 1,
          total_responses: dd.total_responses + inc,
          last_active_date: new Date().toISOString(),
        }).eq('user_id', authUser.id);
      }
    }

    setSubmittingId(null);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Response recorded', description: `You marked this assignment as "${status}".` });
      refreshProfile();
    }
  };

  if (loading) return <div className="container mx-auto px-4 py-8">Loading…</div>;
  if (!authUser) return <div className="container mx-auto px-4 py-8">Please sign in to view your assignments.</div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6 animate-fade-in">
      <h1 className="text-3xl font-bold">My Assignments</h1>
      <p className="text-sm text-muted-foreground">
        When you're selected for a request, accept to confirm or decline so we can promote your alternate.
      </p>

      {rows.length === 0 && (
        <Card className="shadow-card border-0">
          <CardContent className="p-12 text-center text-muted-foreground">
            You haven't been assigned to any blood requests yet.
          </CardContent>
        </Card>
      )}

      {rows.map(a => {
        const r = a.request;
        const isPrimary = a.role === 'primary';
        const expired = new Date(a.response_deadline).getTime() < Date.now() && a.response_status === 'pending';
        return (
          <Card key={a.id} className="shadow-card border-0">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  {isPrimary ? <ShieldCheck className="h-5 w-5 text-primary" /> : <ShieldAlert className="h-5 w-5 text-warning" />}
                  {isPrimary ? 'Primary Donor' : 'Alternate Donor'}
                </CardTitle>
                <div className="flex gap-2">
                  {r && <Badge className={urgencyColors[r.urgency]}>{r.urgency}</Badge>}
                  <StatusBadge status={a.response_status} expired={expired} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {r ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center font-bold text-lg text-primary">
                      {r.blood_group}
                    </div>
                    <div>
                      <p className="font-semibold">{r.units_needed} unit(s) of {r.blood_group}</p>
                      <p className="text-sm text-muted-foreground">{r.requester_name}</p>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2"><Building2 className="h-4 w-4" /> {r.hospital_name}</div>
                    <div className="flex items-center gap-2"><Phone className="h-4 w-4" /> {r.contact_phone}</div>
                    <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {r.location}, {r.pincode}</div>
                    <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> Respond by {new Date(a.response_deadline).toLocaleString()}</div>
                  </div>
                  {r.notes && <p className="text-sm bg-muted/50 rounded p-2">{r.notes}</p>}
                  {a.distance_km != null && (
                    <p className="text-xs text-muted-foreground">Distance: {a.distance_km} km</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Request unavailable</p>
              )}

              {a.response_status === 'pending' && !expired && (
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button onClick={() => respond(a, 'accepted')} disabled={submittingId === a.id} className="gap-2">
                    <CheckCircle2 className="h-4 w-4" /> Accept
                  </Button>
                  <Button onClick={() => respond(a, 'declined')} disabled={submittingId === a.id} variant="outline" className="gap-2">
                    <XCircle className="h-4 w-4" /> Decline
                  </Button>
                  <Button onClick={() => respond(a, 'unable')} disabled={submittingId === a.id} variant="ghost" className="gap-2 text-muted-foreground">
                    <Ban className="h-4 w-4" /> Unable to Donate
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function StatusBadge({ status, expired }: { status: ResponseStatus; expired: boolean }) {
  if (expired) return <Badge variant="outline" className="bg-muted text-muted-foreground">Expired</Badge>;
  const map: Record<ResponseStatus, string> = {
    pending: 'bg-warning/15 text-warning border-warning/30',
    accepted: 'bg-success/15 text-success border-success/30',
    declined: 'bg-destructive/15 text-destructive border-destructive/30',
    unable: 'bg-destructive/15 text-destructive border-destructive/30',
    expired: 'bg-muted text-muted-foreground',
  };
  return <Badge variant="outline" className={map[status]}>{status}</Badge>;
}
