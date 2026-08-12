// JSON contract returned by the turfifa-server Express API (Turfifa-PRD.md §11).
// The frontend never touches Postgres/Prisma directly — these are API response
// shapes, not database types. Kept in sync with `turfifa-server/prisma/schema.prisma`.

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}

export type UserRole = "player" | "turf_manager" | "admin";
export type MatchStatusState = "idle" | "organizing" | "interested";
export type AttributeCode = "ATT" | "PAS" | "STA" | "SPE" | "TEC" | "DEF";
export type SlotTimeType = "morning" | "afternoon" | "evening" | "night";
export type SurfaceType = "Indoor" | "Artificial Turf" | "Natural Grass";
export type PlayerFormat = "5v5" | "6v6" | "7v7";
export type AccountStatus = "active" | "limited" | "frozen" | "banned";
export type SlotLifecycle = "available" | "held" | "booked";
export type BookingStatus =
  | "held"
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";
export type PaymentStatus =
  | "unpaid"
  | "pending"
  | "paid"
  | "refund_pending"
  | "refunded";
export type RefundStatus = "none" | "requested" | "succeeded" | "failed";
export type RequestDirection = "requested" | "offered";
export type RequestStatus = "pending" | "accepted" | "declined";
export type AdminAlertType =
  | "late_pull_out"
  | "attribute_dispute"
  | "user_report"
  | "refund_failure";
export type AdminAlertStatus = "open" | "reviewing" | "resolved";
export type NotificationType =
  | "booking_confirmed"
  | "booking_cancelled"
  | "refund_update"
  | "match_invite"
  | "endorsement_request";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  accountStatus: AccountStatus;
  emailVerified: boolean;
  avatarUrl?: string;
}

export interface AttributeStat {
  code: AttributeCode;
  value: number; // 40–95 baseline; scales to 100 once endorsementCount >= 10
  endorsementCount: number;
}

export interface PlayerProfile {
  id: string;
  userId: string;
  fullName: string;
  phoneOptional?: string;
  gateways: string[];
  customGatewayText?: string;
  avatarUrl?: string;
  positions: string[]; // 1–3 values
  attributes: AttributeStat[]; // always length 6
  overallRating: number;
  currentStatus: MatchStatusState;
  cooldownExpiryTimestamp: string | null;
  accumulatedStars: number;
  accountStatus: AccountStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FieldVenue {
  id: string;
  managerId: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  location: string;
  surfaceType: SurfaceType;
  supportedFormats: PlayerFormat[];
  amenities: string[];
  imageUrls: string[];
  rating: number;
  openingTime: string; // "HH:MM"
  closingTime: string; // "HH:MM"
  slotDurationMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export interface SlotConfiguration {
  id: string;
  fieldId: string;
  startTimeWindow: string;
  endTimeWindow: string;
  timeType: SlotTimeType;
  baseStandardPrice: number;
  promotionalOfferPrice: number | null;
  lifecycle: SlotLifecycle;
  holdExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookingContract {
  id: string;
  slotId: string;
  scouterId: string;
  playerId: string;
  status: BookingStatus;
  agreedAt: string;
  kickoffTimestamp: string;
  cancelledBy?: string;
  flaggedToAdmin: boolean;
  amount: number; // integer BDT
  currency: "BDT";
  paymentStatus: PaymentStatus;
  sslTranId?: string;
  sslBankTranId?: string;
  refundStatus: RefundStatus;
  refundedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookingMetrics {
  month: string;
  totalBookings: number;
  totalSpent: number;
}

export interface Review {
  id: string;
  authorId: string;
  targetType: "venue" | "player";
  targetVenueId?: string;
  targetPlayerId?: string;
  bookingContractId?: string;
  rating: number; // 1–5
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: string;
  captainId: string;
  fieldId: string;
  slotId: string;
  format: PlayerFormat;
  rosterLimit: number;
  roster: {
    playerId: string;
    joinedAt: string;
    role: "captain" | "member";
  }[];
  pendingRequests: {
    playerId: string;
    direction: RequestDirection;
    status: RequestStatus;
    createdAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminAlert {
  id: string;
  type: AdminAlertType;
  status: AdminAlertStatus;
  subjectUserId: string;
  relatedContractId?: string;
  details: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  resolvedByAdminId?: string | null;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  relatedContractId?: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}
