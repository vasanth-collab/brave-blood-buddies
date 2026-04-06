import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Droplets, AlertTriangle, Activity, Star, Clock } from 'lucide-react';
import { getStats, getRequests } from '@/lib/dataStore';
import type { BloodRequest, DonorProfile } from '@/types';

const urgencyColors: Record<string, string> = {
  critical: 'bg-critical text-critical-foreground',
  urgent: 'bg-warning text-warning-foreground',
  normal: 'bg-success text-success-foreground',
};

export default function Dashboard() {
  const [stats, setStats] = useState({ totalDonors: 0, activeDonors: 0, totalRequests: 0, openRequests: 0, criticalRequests: 0, topDonors: [] as DonorProfile[] });
  const [requests, setRequests] = useState<BloodRequest[]>([]);

  useEffect(() => {
    setStats(getStats());
    const allReqs = getRequests().filter(r => r.status === 'open');
    const urgencyOrder = { critical: 0, urgent: 1, normal: 2 };
    allReqs.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);
    setRequests(allReqs);
  }, []);

  const statCards = [
    { label: 'Total Donors', value: stats.totalDonors, icon: Users, color: 'text-primary' },
    { label: 'Active Donors', value: stats.activeDonors, icon: Activity, color: 'text-success' },
    { label: 'Open Requests', value: stats.openRequests, icon: Droplets, color: 'text-warning' },
    { label: 'Critical', value: stats.criticalRequests, icon: AlertTriangle, color: 'text-critical' },
  ];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-fade-in">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Stats Grid */}
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

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Active Requests */}
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Droplets className="h-5 w-5 text-primary" /> Active Requests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {requests.length === 0 ? (
              <p className="text-muted-foreground text-sm">No active requests</p>
            ) : requests.slice(0, 5).map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center font-bold text-sm text-primary">
                    {r.bloodGroup}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{r.hospitalName}</p>
                    <p className="text-xs text-muted-foreground">{r.location} · {r.unitsNeeded} unit(s)</p>
                  </div>
                </div>
                <Badge className={urgencyColors[r.urgency]}>{r.urgency}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Top Donors */}
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Star className="h-5 w-5 text-warning" /> Top Donors
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.topDonors.length === 0 ? (
              <p className="text-muted-foreground text-sm">No donors yet</p>
            ) : stats.topDonors.map((d, i) => (
              <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center font-bold text-sm text-primary">
                    #{i + 1}
                  </div>
                  <div>
                    <p className="font-medium text-sm flex items-center gap-1.5">
                      {d.name}
                      {d.isVerified && <Badge variant="outline" className="text-[10px] py-0 px-1 border-success text-success">✓</Badge>}
                    </p>
                    <p className="text-xs text-muted-foreground">{d.bloodGroup} · {d.location} · {d.totalDonations} donations</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-primary">{d.reliabilityScore}</div>
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
