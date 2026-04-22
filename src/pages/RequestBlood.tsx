// =============================================
// REQUEST BLOOD — creates request + triggers donor assignment
// =============================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Droplets, Send, AlertTriangle, Zap, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BLOOD_GROUPS, type BloodGroup, type UrgencyLevel, approxCoordsForLocation } from '@/types';

const urgencyOptions = [
  { value: 'normal' as UrgencyLevel, label: 'Normal', desc: 'No immediate danger', icon: Clock, color: 'text-success', border: 'border-success bg-success/10' },
  { value: 'urgent' as UrgencyLevel, label: 'Urgent', desc: 'Within 24 hours', icon: Zap, color: 'text-warning', border: 'border-warning bg-warning/10' },
  { value: 'critical' as UrgencyLevel, label: 'Critical', desc: 'Life-threatening', icon: AlertTriangle, color: 'text-critical', border: 'border-critical bg-critical/10' },
];

export default function RequestBlood() {
  const { authUser, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    bloodGroup: '' as BloodGroup,
    location: profile?.location || '',
    pincode: profile?.pincode || '',
    urgency: 'normal' as UrgencyLevel,
    unitsNeeded: '1',
    hospitalName: '',
    contactPhone: profile?.phone || '',
    notes: '',
  });

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser || !profile) {
      toast({ title: 'Please sign in', variant: 'destructive' });
      return;
    }
    if (!form.bloodGroup) {
      toast({ title: 'Error', description: 'Please select a blood group.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const coords = approxCoordsForLocation(form.location, form.pincode);

    const { data: req, error } = await supabase.from('blood_requests').insert({
      requester_id: authUser.id,
      requester_name: profile.name || profile.email,
      blood_group: form.bloodGroup,
      location: form.location,
      pincode: form.pincode,
      latitude: coords?.[0] ?? null,
      longitude: coords?.[1] ?? null,
      urgency: form.urgency,
      units_needed: parseInt(form.unitsNeeded) || 1,
      hospital_name: form.hospitalName,
      contact_phone: form.contactPhone,
      notes: form.notes,
    }).select().single();

    if (error || !req) {
      setSubmitting(false);
      toast({ title: 'Error', description: error?.message ?? 'Failed to create request', variant: 'destructive' });
      return;
    }

    // Trigger smart matching (assigns Primary + Alternate, sends notifications)
    const { error: assignErr } = await supabase.functions.invoke('assign-donors', {
      body: { request_id: req.id },
    });
    setSubmitting(false);

    if (assignErr) {
      toast({ title: 'Request submitted', description: 'No matching donors found yet — we\'ll keep searching.' });
    } else {
      toast({ title: 'Request submitted!', description: 'Primary and alternate donors have been notified.' });
    }
    navigate('/dashboard');
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl animate-fade-in">
      <Card className="shadow-elevated border-0">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-14 w-14 rounded-2xl bg-accent flex items-center justify-center">
              <Droplets className="h-7 w-7 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Request Blood</CardTitle>
          <CardDescription>We'll auto-assign a Primary + Alternate donor and notify them</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>Urgency Level</Label>
              <div className="grid grid-cols-3 gap-3">
                {urgencyOptions.map(o => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => set('urgency', o.value)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      form.urgency === o.value ? o.border : 'border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <o.icon className={`h-5 w-5 mx-auto mb-1 ${o.color}`} />
                    <div className="font-medium text-sm">{o.label}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{o.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Blood Group Needed</Label>
                <Select value={form.bloodGroup} onValueChange={v => set('bloodGroup', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {BLOOD_GROUPS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Units Needed</Label>
                <Input type="number" min="1" max="10" value={form.unitsNeeded} onChange={e => set('unitsNeeded', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Hospital Name</Label>
                <Input placeholder="City Hospital" value={form.hospitalName} onChange={e => set('hospitalName', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Contact Phone</Label>
                <Input type="tel" placeholder="+91 98765 43210" value={form.contactPhone} onChange={e => set('contactPhone', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input placeholder="City" value={form.location} onChange={e => set('location', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Pincode</Label>
                <Input placeholder="400001" value={form.pincode} onChange={e => set('pincode', e.target.value)} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <Textarea placeholder="Any additional information..." value={form.notes} onChange={e => set('notes', e.target.value)} rows={3} />
            </div>

            <Button type="submit" className="w-full gap-2" size="lg" disabled={submitting}>
              <Send className="h-4 w-4" /> {submitting ? 'Submitting…' : 'Submit Request'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
