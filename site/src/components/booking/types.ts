export type Size = "Small" | "Medium" | "Large";
export type SukkahType = "Canvas" | "Modular" | "Construction";
export type SpeedTier = "Patient" | "Regular" | "Express";

export type Answers = {
  has_supplies: boolean;
  size: Size | "";
  sukkah_type: SukkahType | "";
  speed_tier: SpeedTier | "";
  self_delivery: boolean;
  worker_pickup: boolean;
  street: string;
  city: string;
  state: string;
  zip: string;
  county: string;
  accountPath: "guest" | "full" | "";
  first_name: string;
  last_name: string;
  username: string;
  password: string;
  email: string;
  phone: string;
};

export const EMPTY_ANSWERS: Answers = {
  has_supplies: false,
  size: "",
  sukkah_type: "",
  speed_tier: "",
  self_delivery: false,
  worker_pickup: false,
  street: "",
  city: "",
  state: "",
  zip: "",
  county: "",
  accountPath: "",
  first_name: "",
  last_name: "",
  username: "",
  password: "",
  email: "",
  phone: "",
};

// Step keys in the hardcoded, non-reorderable order (UserJourney.md §2.2).
// "delivery" is filtered out at render time when has_supplies is true.
export const STEP_KEYS = [
  "supplies",
  "size",
  "type",
  "speed",
  "delivery",
  "address",
  "account",
] as const;

export type StepKey = (typeof STEP_KEYS)[number];

export function visibleSteps(answers: Answers): StepKey[] {
  return STEP_KEYS.filter((k) => !(k === "delivery" && answers.has_supplies));
}
