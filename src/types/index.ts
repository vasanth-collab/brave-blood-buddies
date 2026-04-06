export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type UrgencyLevel = 'normal' | 'urgent' | 'critical';

export type UserRole = 'donor' | 'requester';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  bloodGroup: BloodGroup;
  location: string;
  pincode: string;
  role: UserRole;
  isVerified: boolean;
  createdAt: string;
}

export interface DonorProfile extends User {
  role: 'donor';
  isAvailable: boolean;
  lastDonationDate: string | null;
  totalDonations: number;
  totalResponses: number;
  totalRequests: number;
  reliabilityScore: number;
  lastActiveDate: string;
}

export interface BloodRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  bloodGroup: BloodGroup;
  location: string;
  pincode: string;
  urgency: UrgencyLevel;
  unitsNeeded: number;
  hospitalName: string;
  contactPhone: string;
  notes: string;
  status: 'open' | 'fulfilled' | 'cancelled';
  createdAt: string;
}

export const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export function calculateReliabilityScore(donor: DonorProfile): number {
  const donationScore = donor.totalDonations * 10;
  const responseRate = donor.totalRequests > 0
    ? (donor.totalResponses / donor.totalRequests) * 50
    : 25;
  const daysSinceActive = Math.floor(
    (Date.now() - new Date(donor.lastActiveDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  const inactivityPenalty = Math.min(daysSinceActive * 0.5, 30);
  return Math.max(0, Math.round(donationScore + responseRate - inactivityPenalty));
}
