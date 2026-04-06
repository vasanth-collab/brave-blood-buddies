// =============================================
// TYPES - Defines the shape of all data in the app
// =============================================

// All possible blood groups
export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

// How urgent a blood request is
export type UrgencyLevel = 'normal' | 'urgent' | 'critical';

// A user is either a donor or a requester
export type UserRole = 'donor' | 'requester';

// Basic user info (shared by all users)
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

// Donor has extra fields on top of User
export interface DonorProfile extends User {
  role: 'donor';
  isAvailable: boolean;
  lastDonationDate: string | null;
  totalDonations: number;
  totalResponses: number;   // how many requests they responded to
  totalRequests: number;    // how many requests they received
  reliabilityScore: number; // calculated score (higher = more reliable)
  lastActiveDate: string;
}

// A blood request posted by someone who needs blood
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

// List of all blood groups (used in dropdowns)
export const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

/**
 * Calculate a donor's reliability score based on:
 * - Number of donations (more = better)
 * - Response rate (how often they respond to requests)
 * - Recent activity (inactive donors lose points)
 */
export function calculateReliabilityScore(donor: DonorProfile): number {
  const donationScore = donor.totalDonations * 10;

  const responseRate = donor.totalRequests > 0
    ? (donor.totalResponses / donor.totalRequests) * 50
    : 25; // default score if no requests yet

  const daysSinceActive = Math.floor(
    (Date.now() - new Date(donor.lastActiveDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  const inactivityPenalty = Math.min(daysSinceActive * 0.5, 30);

  return Math.max(0, Math.round(donationScore + responseRate - inactivityPenalty));
}
