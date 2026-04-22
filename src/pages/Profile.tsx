// =============================================
// PROFILE PAGE
// =============================================

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Mail, Phone, MapPin, Droplets, Star, Activity, Calendar, CheckCircle, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Profile() {
  const { profile, donorDetails, refreshProfile, isLoading } = useAuth();
  const { toast } = useToast();

  if (isLoading) return <div className="container mx-auto px-4 py-8">Loading…</div>;
  if (!profile) return <div className="container mx-auto px-4 py-8">Please sign in.</div>;

  const toggleAvailability = async () => {
    if (!donorDetails) return;
    const newVal = !donorDetails.is_available;
    const { error } = await supabase
      .from('donor_details')
      .update({ is_available: newVal, last_active_date: new Date().toISOString() })
      .eq('user_id', donorDetails.user_id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: newVal ? 'Set to available' : 'Set to unavailable' });
      refreshProfile();
    }
  };

  const respPct = donorDetails && donorDetails.total_requests > 0
    ? Math.round((donorDetails.total_responses / donorDetails.total_requests) * 100) + '%'
    : '0%';
  const daysSinceDonation = donorDetails?.last_donation_date
    ? Math.floor((Date.now() - new Date(donorDetails.last_donation_date).getTime()) / 86400000)
    : '—';

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6 animate-fade-in">
      <h1 className="text-3xl font-bold">My Profile</h1>

      <Card className="shadow-elevated border-0 overflow-hidden">
        <div className="h-24 bg-hero-gradient" />
        <CardContent className="p-6 -mt-12">
          <div className="flex items-end gap-4 mb-6">
            <div className="h-20 w-20 rounded-2xl bg-card shadow-card flex items-center justify-center border-4 border-card">
              <span className="text-2xl font-bold text-primary">{profile.blood_group ?? '?'}</span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold flex items-center gap-2">
                {profile.name || profile.email}
                {profile.is_verified && <CheckCircle className="h-5 w-5 text-success" />}
              </h2>
              <p className="text-sm text-muted-foreground">Donor</p>
            </div>
            {donorDetails && (
              <Badge variant={donorDetails.is_available ? 'default' : 'secondary'} className="text-sm">
                {donorDetails.is_available ? 'Available' : 'Unavailable'}
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" /> {profile.email}</div>
            <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" /> {profile.phone || '—'}</div>
            <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /> {profile.location}, {profile.pincode}</div>
            <div className="flex items-center gap-2 text-muted-foreground"><Droplets className="h-4 w-4" /> {profile.blood_group ?? '—'}</div>
          </div>
        </CardContent>
      </Card>

      {donorDetails && (
        <>
          <Card className="shadow-card border-0">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" /> Donor Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { icon: Star, color: 'text-warning', value: donorDetails.reliability_score, label: 'Reliability' },
                  { icon: Droplets, color: 'text-primary', value: donorDetails.total_donations, label: 'Donations' },
                  { icon: Shield, color: 'text-success', value: respPct, label: 'Response' },
                  { icon: Calendar, color: 'text-muted-foreground', value: daysSinceDonation, label: 'Days ago' },
                ].map(stat => (
                  <div key={stat.label} className="text-center p-4 rounded-xl bg-muted/50">
                    <stat.icon className={`h-5 w-5 mx-auto mb-1 ${stat.color}`} />
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-0">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <Label className="font-medium">Availability</Label>
                <p className="text-sm text-muted-foreground">Toggle your donation availability</p>
              </div>
              <Switch checked={donorDetails.is_available} onCheckedChange={toggleAvailability} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
