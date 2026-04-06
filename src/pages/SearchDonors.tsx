// =============================================
// SEARCH DONORS - Find donors by blood group, location, availability
// =============================================

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Search, MapPin, Phone, CheckCircle } from 'lucide-react';
import { searchDonors } from '@/lib/dataStore';
import { BLOOD_GROUPS, type BloodGroup, type DonorProfile } from '@/types';

// Helper: color based on reliability score
function getScoreColor(score: number) {
  if (score >= 80) return 'text-success';
  if (score >= 40) return 'text-warning';
  return 'text-muted-foreground';
}

// Helper: days since a date
function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

export default function SearchDonors() {
  const [bloodGroup, setBloodGroup] = useState('all');
  const [location, setLocation] = useState('');
  const [availableOnly, setAvailableOnly] = useState(true);
  const [results, setResults] = useState<DonorProfile[]>([]);

  // Search on first load
  useEffect(() => { handleSearch(); }, []);

  const handleSearch = () => {
    setResults(searchDonors({
      bloodGroup: bloodGroup !== 'all' ? bloodGroup as BloodGroup : undefined,
      location: location || undefined,
      availableOnly,
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6 animate-fade-in">
      <h1 className="text-3xl font-bold">Find Donors</h1>

      {/* --- FILTERS --- */}
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
            <Button onClick={handleSearch} className="gap-2">
              <Search className="h-4 w-4" /> Search
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* --- RESULTS --- */}
      <div className="text-sm text-muted-foreground">{results.length} donor(s) found</div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.map(d => (
          <Card key={d.id} className={`shadow-card border-0 transition-all hover:shadow-elevated ${!d.isAvailable ? 'opacity-60' : ''}`}>
            <CardContent className="p-5 space-y-4">
              {/* Name + badge */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center font-bold text-lg text-primary">
                    {d.bloodGroup}
                  </div>
                  <div>
                    <p className="font-semibold flex items-center gap-1.5">
                      {d.name}
                      {d.isVerified && <CheckCircle className="h-4 w-4 text-success" />}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {d.location}
                    </div>
                  </div>
                </div>
                <Badge variant={d.isAvailable ? 'default' : 'secondary'}>
                  {d.isAvailable ? 'Available' : 'Unavailable'}
                </Badge>
              </div>

              {/* Score / Donations / Last donation */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-muted/50 p-2">
                  <div className={`text-lg font-bold ${getScoreColor(d.reliabilityScore)}`}>{d.reliabilityScore}</div>
                  <div className="text-[10px] text-muted-foreground">Score</div>
                </div>
                <div className="rounded-lg bg-muted/50 p-2">
                  <div className="text-lg font-bold">{d.totalDonations}</div>
                  <div className="text-[10px] text-muted-foreground">Donations</div>
                </div>
                <div className="rounded-lg bg-muted/50 p-2">
                  <div className="text-lg font-bold">
                    {d.lastDonationDate ? daysSince(d.lastDonationDate) + 'd' : '—'}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Last</div>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5" /> {d.phone}
              </div>
            </CardContent>
          </Card>
        ))}
        {results.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No donors found matching your criteria.
          </div>
        )}
      </div>
    </div>
  );
}
