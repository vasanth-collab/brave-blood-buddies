// =============================================
// REGISTER PAGE — creates a Supabase auth user + profile
// =============================================

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Droplets, UserPlus, HeartHandshake, Hospital } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BLOOD_GROUPS, type BloodGroup } from '@/types';

type Role = 'donor' | 'requester';

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
    bloodGroup: '' as BloodGroup, location: '', pincode: '',
    role: 'donor' as Role,
  });
  const [submitting, setSubmitting] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bloodGroup) {
      toast({ title: 'Error', description: 'Please select a blood group.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const { error } = await signUp(form);
    setSubmitting(false);
    if (error) {
      toast({ title: 'Registration failed', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Account created!', description: 'Welcome to BloodLink.' });
      navigate('/dashboard');
    }
  };

  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-lg shadow-elevated border-0 animate-fade-in">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-14 w-14 rounded-2xl bg-accent flex items-center justify-center">
              <Droplets className="h-7 w-7 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Join BloodLink</CardTitle>
          <CardDescription>Create your account and start saving lives</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role selection — Donor or Requester */}
            <div className="space-y-2">
              <Label>I want to join as</Label>
              <RadioGroup
                value={form.role}
                onValueChange={(v) => set('role', v as Role)}
                className="grid grid-cols-2 gap-3"
              >
                <label
                  htmlFor="role-donor"
                  className={`flex items-center gap-3 rounded-lg border-2 p-3 cursor-pointer transition-colors ${
                    form.role === 'donor' ? 'border-primary bg-accent' : 'border-border hover:bg-muted'
                  }`}
                >
                  <RadioGroupItem id="role-donor" value="donor" />
                  <HeartHandshake className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium text-sm">Donor</div>
                    <div className="text-xs text-muted-foreground">Donate blood</div>
                  </div>
                </label>
                <label
                  htmlFor="role-requester"
                  className={`flex items-center gap-3 rounded-lg border-2 p-3 cursor-pointer transition-colors ${
                    form.role === 'requester' ? 'border-primary bg-accent' : 'border-border hover:bg-muted'
                  }`}
                >
                  <RadioGroupItem id="role-requester" value="requester" />
                  <Hospital className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium text-sm">Requester</div>
                    <div className="text-xs text-muted-foreground">Request blood</div>
                  </div>
                </label>
              </RadioGroup>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input placeholder="John Doe" value={form.name} onChange={e => set('name', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="you@example.com" value={form.email} onChange={e => set('email', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={e => set('phone', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" placeholder="••••••••" value={form.password} onChange={e => set('password', e.target.value)} required minLength={6} />
              </div>
              <div className="space-y-2">
                <Label>Blood Group</Label>
                <Select value={form.bloodGroup} onValueChange={v => set('bloodGroup', v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {BLOOD_GROUPS.map(g => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>City / Area</Label>
                <Input placeholder="Mumbai" value={form.location} onChange={e => set('location', e.target.value)} required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Pincode</Label>
                <Input placeholder="400001" value={form.pincode} onChange={e => set('pincode', e.target.value)} required />
              </div>
            </div>
            <Button type="submit" className="w-full gap-2 mt-2" disabled={submitting}>
              <UserPlus className="h-4 w-4" /> {submitting ? 'Creating account…' : 'Create Account'}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">Login</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
