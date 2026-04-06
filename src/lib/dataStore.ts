import type { BloodRequest, DonorProfile, BloodGroup } from '@/types';
import { calculateReliabilityScore } from '@/types';

const REQUESTS_KEY = 'bloodbank_requests';

export function getRequests(): BloodRequest[] {
  return JSON.parse(localStorage.getItem(REQUESTS_KEY) || '[]');
}

export function addRequest(req: BloodRequest) {
  const requests = getRequests();
  requests.push(req);
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
}

export function updateRequest(id: string, updates: Partial<BloodRequest>) {
  const requests = getRequests().map(r => r.id === id ? { ...r, ...updates } : r);
  localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
}

export function getAllDonors(): DonorProfile[] {
  const users: Record<string, { user: any }> = JSON.parse(localStorage.getItem('bloodbank_users') || '{}');
  return Object.values(users)
    .map(e => e.user)
    .filter((u): u is DonorProfile => u.role === 'donor')
    .map(d => ({ ...d, reliabilityScore: calculateReliabilityScore(d) }));
}

export function searchDonors(filters: {
  bloodGroup?: BloodGroup;
  location?: string;
  availableOnly?: boolean;
}): DonorProfile[] {
  let donors = getAllDonors();
  if (filters.bloodGroup) donors = donors.filter(d => d.bloodGroup === filters.bloodGroup);
  if (filters.location) donors = donors.filter(d =>
    d.location.toLowerCase().includes(filters.location!.toLowerCase()) ||
    d.pincode.includes(filters.location!)
  );
  if (filters.availableOnly) donors = donors.filter(d => d.isAvailable);
  return donors.sort((a, b) => {
    if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
    return b.reliabilityScore - a.reliabilityScore;
  });
}

export function getStats() {
  const donors = getAllDonors();
  const requests = getRequests();
  return {
    totalDonors: donors.length,
    activeDonors: donors.filter(d => d.isAvailable).length,
    totalRequests: requests.length,
    openRequests: requests.filter(r => r.status === 'open').length,
    criticalRequests: requests.filter(r => r.status === 'open' && r.urgency === 'critical').length,
    topDonors: [...donors].sort((a, b) => b.reliabilityScore - a.reliabilityScore).slice(0, 5),
  };
}

// Seed some demo data
export function seedDemoData() {
  if (localStorage.getItem('bloodbank_seeded')) return;
  const users: Record<string, { user: DonorProfile; password: string }> = {};
  const names = ['Arjun Mehta', 'Priya Sharma', 'Rahul Verma', 'Sneha Patel', 'Vikram Singh', 'Anita Roy', 'Karan Gupta', 'Divya Nair'];
  const groups: BloodGroup[] = ['O+', 'A+', 'B+', 'AB+', 'O-', 'A-', 'B-', 'AB-'];
  const locations = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad'];
  const now = new Date();

  names.forEach((name, i) => {
    const email = name.toLowerCase().replace(' ', '.') + '@demo.com';
    const donations = Math.floor(Math.random() * 15) + 1;
    const daysAgo = Math.floor(Math.random() * 90);
    const donor: DonorProfile = {
      id: crypto.randomUUID(), name, email, phone: `98765${43210 + i}`,
      bloodGroup: groups[i], location: locations[i], pincode: `${400000 + i * 11}`,
      role: 'donor', isVerified: i < 5, createdAt: new Date(now.getTime() - 90 * 86400000).toISOString(),
      isAvailable: i !== 3, lastDonationDate: new Date(now.getTime() - daysAgo * 86400000).toISOString(),
      totalDonations: donations, totalResponses: Math.floor(donations * 0.8),
      totalRequests: donations + 2, reliabilityScore: 0,
      lastActiveDate: new Date(now.getTime() - Math.floor(Math.random() * 14) * 86400000).toISOString(),
    };
    donor.reliabilityScore = calculateReliabilityScore(donor);
    users[email] = { user: donor, password: 'demo123' };
  });

  const existingUsers = JSON.parse(localStorage.getItem('bloodbank_users') || '{}');
  localStorage.setItem('bloodbank_users', JSON.stringify({ ...users, ...existingUsers }));

  // Seed requests
  const requests: BloodRequest[] = [
    { id: crypto.randomUUID(), requesterId: 'demo', requesterName: 'Hospital A', bloodGroup: 'O+', location: 'Mumbai', pincode: '400001', urgency: 'critical', unitsNeeded: 3, hospitalName: 'City Hospital', contactPhone: '9876543210', notes: 'Accident case, urgent need', status: 'open', createdAt: new Date().toISOString() },
    { id: crypto.randomUUID(), requesterId: 'demo', requesterName: 'Hospital B', bloodGroup: 'A+', location: 'Delhi', pincode: '110001', urgency: 'urgent', unitsNeeded: 2, hospitalName: 'Max Hospital', contactPhone: '9876543211', notes: 'Surgery scheduled', status: 'open', createdAt: new Date(now.getTime() - 3600000).toISOString() },
    { id: crypto.randomUUID(), requesterId: 'demo', requesterName: 'Patient C', bloodGroup: 'B+', location: 'Bangalore', pincode: '560001', urgency: 'normal', unitsNeeded: 1, hospitalName: 'Apollo Hospital', contactPhone: '9876543212', notes: 'Regular transfusion', status: 'open', createdAt: new Date(now.getTime() - 7200000).toISOString() },
  ];
  const existing = getRequests();
  if (existing.length === 0) localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
  localStorage.setItem('bloodbank_seeded', 'true');
}
