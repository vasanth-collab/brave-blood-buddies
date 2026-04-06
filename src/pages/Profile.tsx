import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { User, MapPin, Phone, Mail, Droplets, Star, Activity, Calendar, CheckCircle, Shield } from 'lucide-react';
import type { DonorProfile } from '@/types';
import { useToast } from '@/hooks/use-toast';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();

  if (!user) return null;
  const isDonor = user.role === 'donor';
  const donor = isDonor ? (user as DonorProfile) : null;

  const toggleAvailability = () => {
    if (donor) {
      updateProfile({ isAvailable: !donor.isAvailable, lastActiveDate: new Date().toISOString() });
      toast({ title: donor.isAvailable ? 'Set to unavailable' : 'Set to available' });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6 animate-fade-in">
      <h1 className="text-3xl font-bold">My Profile</h1>

      {/* Profile Card */}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" /> {user.email}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" /> {user.phone}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" /> {user.location}, {user.pincode}
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Droplets className="h-4 w-4" /> Blood Group: {user.bloodGroup}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Donor Stats */}
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
                <div className="text-center p-4 rounded-xl bg-muted/50">
                  <Star className="h-5 w-5 mx-auto mb-1 text-warning" />
                  <div className="text-2xl font-bold text-primary">{donor.reliabilityScore}</div>
                  <div className="text-xs text-muted-foreground">Reliability</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-muted/50">
                  <Droplets className="h-5 w-5 mx-auto mb-1 text-primary" />
                  <div className="text-2xl font-bold">{donor.totalDonations}</div>
                  <div className="text-xs text-muted-foreground">Donations</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-muted/50">
                  <Shield className="h-5 w-5 mx-auto mb-1 text-success" />
                  <div className="text-2xl font-bold">
                    {donor.totalRequests > 0 ? Math.round((donor.totalResponses / donor.totalRequests) * 100) : 0}%
                  </div>
                  <div className="text-xs text-muted-foreground">Response</div>
                </div>
                <div className="text-center p-4 rounded-xl bg-muted/50">
                  <Calendar className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <div className="text-2xl font-bold">
                    {donor.lastDonationDate ? Math.floor((Date.now() - new Date(donor.lastDonationDate).getTime()) / 86400000) : '—'}
                  </div>
                  <div className="text-xs text-muted-foreground">Days ago</div>
                </div>
              </div>
            </CardContent>
          </Card>

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
