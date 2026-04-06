import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Droplets, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { BLOOD_GROUPS, type BloodGroup, type UserRole } from '@/types';

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
    bloodGroup: '' as BloodGroup, location: '', pincode: '', role: 'donor' as UserRole,
  });
  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.bloodGroup) {
      toast({ title: 'Error', description: 'Please select a blood group.', variant: 'destructive' });
      return;
    }
    if (register(form)) {
      toast({ title: 'Account created!', description: 'Welcome to BloodLink.' });
      navigate('/dashboard');
    } else {
      toast({ title: 'Registration failed', description: 'Email already exists.', variant: 'destructive' });
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
                <Label>Role</Label>
                <Select value={form.role} onValueChange={v => set('role', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="donor">Donor</SelectItem>
                    <SelectItem value="requester">Requester</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>City / Area</Label>
                <Input placeholder="Mumbai" value={form.location} onChange={e => set('location', e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>Pincode</Label>
                <Input placeholder="400001" value={form.pincode} onChange={e => set('pincode', e.target.value)} required />
              </div>
            </div>
            <Button type="submit" className="w-full gap-2 mt-2">
              <UserPlus className="h-4 w-4" /> Create Account
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
