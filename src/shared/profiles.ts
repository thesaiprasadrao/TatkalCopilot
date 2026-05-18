export type TrainClass = "SL" | "3A" | "2A" | "1A" | "CC" | "EC";
export type Quota = "TATKAL" | "PREMIUM_TATKAL" | "GENERAL";
export type Gender = "M" | "F" | "T";
export type BerthPreference = "LOWER" | "MIDDLE" | "UPPER" | "SIDE_LOWER" | "SIDE_UPPER" | "ANY";
export type PaymentMethod = "UPI" | "IRCTC_WALLET" | "CARD";

export type JourneyProfile = {
  id: string;
  name: string;
  sourceStation: string;
  destinationStation: string;
  travelDate: string;
  trainNumber: string;
  quota: Quota;
  trainClass: TrainClass;
  paymentMethod: PaymentMethod;
};

export type PassengerProfile = {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  berthPreference: BerthPreference;
  idCardLastFour?: string;
};

export type BookingProfile = {
  journey: JourneyProfile;
  passengers: PassengerProfile[];
};
