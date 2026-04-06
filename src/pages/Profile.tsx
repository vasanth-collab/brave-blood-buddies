// =============================================
// PROFILE PAGE - Shows user info and donor stats
// =============================================

import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Mail, Phone, MapPin, Droplets, Star, Activity, Calendar, CheckCircle, Shield } from 'lucide-react';
import type { DonorProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();

  if (!user) return null;

  const isDonor = user.role === 'donor';
  const donor = isDonor ? (user as DonorProfile) : null;

  const toggleAvailability = () => {
    if (!donor) return;
    updateProfile({ isAvailable: !donor.isAvailable, lastActiveDate: new Date().toISOString() });
    toast({ title: donor.isAvailable ? 'Set to unavailable' : 'Set to available' });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6 animate-fade-in">
      <h1 className="text-3xl font-bold">My Profile</h1>

      {/* --- USER INFO CARD --- */}
      <Card className="shadow-elevated border-0 overflow-hidden">
        <div className="h-24 bg-hero-gradient" />
        <CardContent className="p-6 -mt-12">
          <div className="flex items-end gap-4 mb-6">
            <div className="h-20 w-20 rounded-2xl bg-card shadow-card flex items-center justify-center border-4 border-card">
              <span className="text-2xl font-bold text-primary">{user.bloodGroup}</span>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold flex items-center gap-2">
                {user.name}
                {user.isVerified && <CheckCircle className="h-5 w-5 text-success" />}
              </h2>
              <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
            </div>
            {isDonor && (
              <Badge variant={donor!.isAvailable ? 'default' : 'secondary'} className="text-sm">
                {donor!.isAvailable ? 'Available' : 'Unavailable'}
              </Badge>
            )}
          </div>

          {/* Contact details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" /> {user.email}</div>
            <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" /> {user.phone}</div>
            <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /> {user.location}, {user.pincode}</div>
            <div className="flex items-center gap-2 text-muted-foreground"><Droplets className="h-4 w-4" /> Blood Group: {user.bloodGroup}</div>
          </div>
        </CardContent>
      </Card>

      {/* --- DONOR STATS (only shown if user is a donor) --- */}
      {isDonor && donor && (
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
                  { icon: Star, color: 'text-warning', value: donor.reliabilityScore, label: 'Reliability' },
                  { icon: Droplets, color: 'text-primary', value: donor.totalDonations, label: 'Donations' },
                  { icon: Shield, color: 'text-success', value: donor.totalRequests > 0 ? Math.round((donor.totalResponses / donor.totalRequests) * 100) + '%' : '0%', label: 'Response' },
                  { icon: Calendar, color: 'text-muted-foreground', value: donor.lastDonationDate ? Math.floor((Date.now() - new Date(donor.lastDonationDate).getTime()) / 86400000) : '—', label: 'Days ago' },
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

          {/* Availability toggle */}
          <Card className="shadow-card border-0">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <Label className="font-medium">Availability</Label>
                <p className="text-sm text-muted-foreground">Toggle your donation availability</p>
              </div>
              <Switch checked={donor.isAvailable} onCheckedChange={toggleAvailability} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
