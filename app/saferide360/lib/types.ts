export interface Organization {
  id: string; name: string; orgType: string; createdAt: string;
  trialEndsAt: string; subscriptionActiveUntil?: string; planRateInrPerPassenger: number;
}
export interface Billing {
  organization: Organization; passengerCount: number; monthlyCost: number; isActive: boolean; inTrial: boolean;
}
export interface Driver {
  id: string; organizationId: string; name: string; phone: string;
  vehicleNumber: string; vehicleType: string; createdAt: string;
}
export interface Stop { id: string; organizationId: string; name: string; lat: number; lng: number; sequence: number; }
export interface Passenger {
  id: string; organizationId: string; name: string;
  guardianName: string; guardianPhone: string;
  pickupStopId?: string; dropStopId?: string;
  schoolName?: string;
}
export interface GeocodeResult { label: string; lat: number; lng: number; }
export type TripDirection = "pickup" | "drop";
export type TripStatus = "scheduled" | "active" | "completed";
export interface Trip {
  id: string; organizationId: string; driverId: string; name: string; direction: TripDirection;
  scheduledStartTime: string; scheduledEndTime: string; status: TripStatus;
  actualStartAt?: string; actualEndAt?: string;
  liveLat?: number; liveLng?: number; liveUpdatedAt?: string;
  templateId?: string;
}
export interface TripTemplate {
  id: string; organizationId: string; name: string; passengerIds: string[]; createdAt: string;
}
export type TripPassengerStatus = "pending" | "picked" | "absent";
export interface TripPassenger {
  id: string; tripId: string; passengerId: string; status: TripPassengerStatus; pickedAt?: string;
  passengerName?: string;
}
export interface GuardianNotification {
  id: string; guardianPhone: string; tripId?: string; passengerId?: string;
  type: string; text: string; read: boolean; createdAt: string;
}
export interface GuardianTodayEntry {
  tripPassengerId: string; passengerId: string; passengerName: string; status: TripPassengerStatus; pickedAt?: string;
  tripId: string; tripName: string; tripStatus: TripStatus; direction: TripDirection;
  liveLat?: number; liveLng?: number; liveUpdatedAt?: string;
  driverName: string; driverPhone: string; vehicleNumber: string; vehicleType: string;
}
