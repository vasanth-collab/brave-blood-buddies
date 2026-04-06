import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Droplets, Send, AlertTriangle, Zap, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BLOOD_GROUPS, type BloodGroup, type UrgencyLevel, type BloodRequest } from '@/types';
import { addRequest } from '@/lib/dataStore';

const urgencyOptions: { value: UrgencyLevel; label: string; desc: string; icon: React.ElementType }[] = [
  { value: 'normal', label: 'Normal', desc: 'Standard request, no immediate danger', icon: Clock },
  { value: 'urgent', label: 'Urgent', desc: 'Surgery or treatment within 24 hours', icon: Zap },
  { value: 'critical', label: 'Critical', desc: 'Life-threatening emergency, immediate need', icon: AlertTriangle },
];

export default function RequestBlood() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState({
    bloodGroup: '' as BloodGroup,
    location: user?.location || '',
    pincode: user?.pincode || '',
    urgency: 'normal' as UrgencyLevel,
    unitsNeeded: '1',
    hospitalName: '',
    contactPhone: user?.phone || '',
    notes: '',
  });

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bloodGroup) {
      toast({ title: 'Error', description: 'Please select a blood group.', variant: 'destructive' });
      return;
    }
    const req: BloodRequest = {
      id: crypto.randomUUID(),
      requesterId: user?.id || 'anonymous',
      requesterName: user?.name || 'Anonymous',
      bloodGroup: form.bloodGroup,
      location: form.location,
      pincode: form.pincode,
      urgency: form.urgency,
      unitsNeeded: parseInt(form.unitsNeeded) || 1,
      hospitalName: form.hospitalName,
      contactPhone: form.contactPhone,
      notes: form.notes,
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    addRequest(req);
    toast({ title: 'Request submitted!', description: 'Your blood request has been posted.' });
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
          <CardDescription>Fill in the details to find matching donors</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Urgency */}
            <div className="space-y-2">
              <Label>Urgency Level</Label>
              <div className="grid grid-cols-3 gap-3">
                {urgencyOptions.map(o => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => set('urgency', o.value)}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${
                      form.urgency === o.value
                        ? o.value === 'critical' ? 'border-critical bg-critical/10'
                          : o.value === 'urgent' ? 'border-warning bg-warning/10'
                          : 'border-success bg-success/10'
                        : 'border-border hover:border-muted-foreground/30'
                    }`}
                  >
                    <o.icon className={`h-5 w-5 mx-auto mb-1 ${
                      o.value === 'critical' ? 'text-critical' : o.value === 'urgent' ? 'text-warning' : 'text-success'
                    }`} />
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

            <Button type="submit" className="w-full gap-2" size="lg">
              <Send className="h-4 w-4" /> Submit Request
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
