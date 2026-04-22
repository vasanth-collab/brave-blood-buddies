// =============================================
// SEARCH DONORS — filter + sort by distance
// =============================================

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Search, MapPin, Phone, CheckCircle, Navigation } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BLOOD_GROUPS, type BloodGroup, type Profile, type DonorDetails, approxCoordsForLocation, haversineKm } from '@/types';

type DonorRow = Profile & { donor_details: DonorDetails | null; distance_km?: number | null };

function getScoreColor(score: number) {
  if (score >= 80) return 'text-success';
  if (score >= 40) return 'text-warning';
  return 'text-muted-foreground';
}

function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

export default function SearchDonors() {
  const { profile } = useAuth();
  const [bloodGroup, setBloodGroup] = useState('all');
  const [location, setLocation] = useState(profile?.pincode || profile?.location || '');
  const [availableOnly, setAvailableOnly] = useState(true);
  const [results, setResults] = useState<DonorRow[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    // Two queries — easier to type than the inner join when no FK is auto-detected.
    const [profilesRes, detailsRes] = await Promise.all([
      (() => {
        let q = supabase.from('profiles').select('*');
        if (bloodGroup !== 'all') q = q.eq('blood_group', bloodGroup as BloodGroup);
        if (location) q = q.or(`location.ilike.%${location}%,pincode.ilike.%${location}%`);
        return q;
      })(),
      supabase.from('donor_details').select('*'),
    ]);
    if (profilesRes.error) { setLoading(false); return; }

    const detailsMap = new Map<string, DonorDetails>();
    (detailsRes.data ?? []).forEach(d => detailsMap.set(d.user_id, d as DonorDetails));

    let rows: DonorRow[] = (profilesRes.data ?? []).map(p => ({
      ...(p as Profile),
      donor_details: detailsMap.get(p.id) ?? null,
    })).filter(r => r.donor_details); // only show donors

    if (availableOnly) rows = rows.filter(r => r.donor_details?.is_available);

    // Compute distance from search location (or user's profile)
    const refCoords = approxCoordsForLocation(location || profile?.location || '', profile?.pincode);
    rows = rows.map(r => {
      let dist: number | null = null;
      if (r.latitude != null && r.longitude != null && refCoords) {
        dist = haversineKm(refCoords, [r.latitude, r.longitude]);
      } else {
        const dc = approxCoordsForLocation(r.location, r.pincode);
        if (refCoords && dc) dist = haversineKm(refCoords, dc);
      }
      return { ...r, distance_km: dist };
    });

    // Sort: available first, nearest first, then by reliability
    rows.sort((a, b) => {
      const aAvail = a.donor_details?.is_available ? 0 : 1;
      const bAvail = b.donor_details?.is_available ? 0 : 1;
      if (aAvail !== bAvail) return aAvail - bAvail;
      const aD = a.distance_km ?? 1e9;
      const bD = b.distance_km ?? 1e9;
      if (aD !== bD) return aD - bD;
      return (b.donor_details?.reliability_score ?? 0) - (a.donor_details?.reliability_score ?? 0);
    });

    setResults(rows);
    setLoading(false);
  };

  useEffect(() => { handleSearch(); /* eslint-disable-next-line */ }, []);

  const refLabel = useMemo(() => location || profile?.location || '', [location, profile]);

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 animate-fade-in">
      <h1 className="text-3xl font-bold">Find Donors</h1>

      <Card className="shadow-card border-0">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label>Blood Group</Label>
              <Select value={bloodGroup} onValueChange={setBloodGroup}>
                <SelectTrigger><SelectValue placeholder="All groups" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  {BLOOD_GROUPS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 space-y-2">
              <Label>Location / Pincode</Label>
              <Input placeholder="City or pincode" value={location} onChange={e => setLocation(e.target.value)} />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={availableOnly} onCheckedChange={setAvailableOnly} />
              <Label className="text-sm">Available only</Label>
            </div>
            <Button onClick={handleSearch} className="gap-2" disabled={loading}>
              <Search className="h-4 w-4" /> {loading ? 'Searching…' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="text-sm text-muted-foreground">
        {results.length} donor(s) found{refLabel ? ` · sorted by distance from ${refLabel}` : ''}
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map(d => {
          const dd = d.donor_details;
          return (
            <Card key={d.id} className={`shadow-card border-0 transition-all hover:shadow-elevated ${!dd?.is_available ? 'opacity-60' : ''}`}>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center font-bold text-lg text-primary">
                      {d.blood_group ?? '?'}
                    </div>
                    <div>
                      <p className="font-semibold flex items-center gap-1.5">
                        {d.name || d.email}
                        {d.is_verified && <CheckCircle className="h-4 w-4 text-success" />}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {d.location}
                        {d.distance_km != null && (
                          <span className="ml-1 inline-flex items-center gap-0.5 text-primary font-medium">
                            <Navigation className="h-3 w-3" /> {d.distance_km} km
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge variant={dd?.is_available ? 'default' : 'secondary'}>
                    {dd?.is_available ? 'Available' : 'Unavailable'}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-muted/50 p-2">
                    <div className={`text-lg font-bold ${getScoreColor(dd?.reliability_score ?? 0)}`}>{dd?.reliability_score ?? 0}</div>
                    <div className="text-[10px] text-muted-foreground">Score</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2">
                    <div className="text-lg font-bold">{dd?.total_donations ?? 0}</div>
                    <div className="text-[10px] text-muted-foreground">Donations</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-2">
                    <div className="text-lg font-bold">
                      {dd?.last_donation_date ? daysSince(dd.last_donation_date) + 'd' : '—'}
                    </div>
                    <div className="text-[10px] text-muted-foreground">Last</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" /> {d.phone || '—'}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {!loading && results.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No donors found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
}
