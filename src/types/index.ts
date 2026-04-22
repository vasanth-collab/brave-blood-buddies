// =============================================
// TYPES — shapes of data used across the app
// (Backed by Supabase tables — see src/integrations/supabase/types.ts)
// =============================================

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type UrgencyLevel = 'normal' | 'urgent' | 'critical';
export type AppRole = 'admin' | 'donor' | 'requester';
export type RequestStatus = 'open' | 'confirmed' | 'fulfilled' | 'cancelled';
export type DonorRole = 'primary' | 'alternate';
export type ResponseStatus = 'pending' | 'accepted' | 'declined' | 'unable' | 'expired';

export const BLOOD_GROUPS: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// User profile (from `profiles` table)
export interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string;
  blood_group: BloodGroup | null;
  location: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

// Donor extra info (from `donor_details` table)
export interface DonorDetails {
  user_id: string;
  is_available: boolean;
  last_donation_date: string | null;
  total_donations: number;
  total_responses: number;
  total_requests: number;
  reliability_score: number;
  last_active_date: string;
}

// Donor for listings (Profile + DonorDetails + optional distance)
export interface DonorListItem extends Profile {
  donor_details: DonorDetails | null;
  distance_km?: number | null;
}

// Blood request
export interface BloodRequest {
  id: string;
  requester_id: string;
  requester_name: string;
  blood_group: BloodGroup;
  location: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  urgency: UrgencyLevel;
  units_needed: number;
  hospital_name: string;
  contact_phone: string;
  notes: string;
  status: RequestStatus;
  current_radius_km: number;
  created_at: string;
}

// Donor assignment (Primary or Alternate slot for a request)
export interface DonorAssignment {
  id: string;
  request_id: string;
  donor_id: string;
  role: DonorRole;
  response_status: ResponseStatus;
  distance_km: number | null;
  assigned_at: string;
  responded_at: string | null;
  response_deadline: string;
}

// In-app notification
export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

// Approximate lat/lng lookup for common Indian cities (used as fallback when
// the user hasn't set precise coordinates).
const CITY_COORDS: Record<string, [number, number]> = {
  mumbai: [19.076, 72.8777],
  delhi: [28.6139, 77.209],
  bangalore: [12.9716, 77.5946],
  bengaluru: [12.9716, 77.5946],
  chennai: [13.0827, 80.2707],
  hyderabad: [17.385, 78.4867],
  pune: [18.5204, 73.8567],
  kolkata: [22.5726, 88.3639],
  ahmedabad: [23.0225, 72.5714],
  jaipur: [26.9124, 75.7873],
  lucknow: [26.8467, 80.9462],
  surat: [21.1702, 72.8311],
};

export function approxCoordsForLocation(location: string, pincode?: string): [number, number] | null {
  if (!location) return null;
  const key = location.trim().toLowerCase();
  if (CITY_COORDS[key]) return CITY_COORDS[key];
  // Very rough pincode-based fallback: India pincodes 100000-855999
  if (pincode && /^\d{6}$/.test(pincode)) {
    const n = parseInt(pincode, 10);
    // Map pincode to a synthetic lat/lng so we can still rank by proximity
    const lat = 8 + ((n % 9000) / 9000) * 28;     // 8°N – 36°N
    const lng = 68 + (((n * 7) % 11000) / 11000) * 29; // 68°E – 97°E
    return [lat, lng];
  }
  return null;
}

// Haversine distance in km between two lat/lng points
export function haversineKm(a: [number, number], b: [number, number]): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 10) / 10;
}
