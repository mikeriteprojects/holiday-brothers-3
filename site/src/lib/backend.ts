// Typed client for the Holiday Brothers Apps Script Web App. Action names and
// param/response shapes mirror backend/HolidayBrothersBackend.gs exactly —
// GET_ACTIONS via ?action=..., POST_ACTIONS via a JSON body's `action` field.

const APPS_SCRIPT_URL = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL;

export type BackendOk<T extends object = object> = { ok: true } & T;
export type BackendFail = { ok: false; error: string };
export type BackendResult<T extends object = object> = BackendOk<T> | BackendFail;

function requireUrl(): string {
  if (!APPS_SCRIPT_URL) {
    throw new Error(
      "NEXT_PUBLIC_APPS_SCRIPT_URL is not set — add it to site/.env.local (see .env.local.example)."
    );
  }
  return APPS_SCRIPT_URL;
}

export async function get<T extends object = object>(
  action: string,
  params: Record<string, string | undefined> = {}
): Promise<BackendResult<T>> {
  const url = new URL(requireUrl());
  url.searchParams.set("action", action);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, value);
  }
  const res = await fetch(url.toString(), { cache: "no-store" });
  return (await res.json()) as BackendResult<T>;
}

export async function post<T extends object = object>(
  action: string,
  body: Record<string, unknown> = {}
): Promise<BackendResult<T>> {
  const res = await fetch(requireUrl(), {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action, ...body }),
  });
  return (await res.json()) as BackendResult<T>;
}

// ---- Typed wrappers for the actions the site actually calls ----

export type ContentRow = { block_id: string; value: string };
export function getContent() {
  return get<{ rows: ContentRow[] }>("content");
}

export type QuestionRow = {
  question_id: string;
  label: string;
  type: string;
  options_csv: string | null;
  order: number;
  required: string;
  active: string;
  conditional_rule: string | null;
};
export function getQuestions() {
  return get<{ rows: QuestionRow[] }>("questions");
}

export type PricingRow = {
  formula_component: string;
  sukkah_type_or_tier: string;
  value: string;
  is_placeholder?: string;
};
export function getPricing() {
  return get<{ rows: PricingRow[] }>("pricing");
}

export type BookingRow = {
  booking_code: string;
  account_id: string;
  has_supplies: string | boolean;
  size: string;
  sukkah_type: string;
  speed_tier: string;
  self_delivery_discount: string | boolean;
  worker_pickup_discount: string | boolean;
  address: string;
  price_base: number;
  price_size_mod: number;
  price_speed_mod: number;
  price_type_mod: number;
  price_total: number;
  status: string;
  created_at: string;
  updated_at: string;
};
export function getBookingStatus(code: string, phone?: string) {
  return get<{ booking: BookingRow; job?: Record<string, unknown> }>("booking_status", {
    code,
    phone,
  });
}

export function submitBooking(answers: Record<string, unknown>) {
  return post<{ booking_code: string; account_id: string; price: Record<string, number> }>(
    "submitBooking",
    { answers }
  );
}

export function submitCrewApplication(answers: Record<string, unknown>) {
  return post<{ account_id: string; age: number; requires_parental_consent: boolean }>(
    "submitCrewApplication",
    { answers }
  );
}

export function submitVendorApplication(answers: Record<string, unknown>) {
  return post<{ account_id: string; vendor_id: string }>("submitVendorApplication", { answers });
}

export type IdentifyMethod = "password" | "email_code";
export function workerIdentify(identifier: string) {
  return post<{ method: IdentifyMethod; has_password: boolean; account_id: string; roles: string }>(
    "workerIdentify",
    { identifier }
  );
}

export function workerVerifyCode(accountId: string, code: string) {
  return post<{ account_id: string; token: string }>("workerVerifyCode", {
    account_id: accountId,
    code,
  });
}

export function workerLoginPassword(accountId: string, password: string) {
  return post<{ account_id: string; token: string; roles: string }>("workerLoginPassword", {
    account_id: accountId,
    password,
  });
}

export function workerSetPassword(accountId: string, password: string) {
  return post<{ account_id: string; token: string }>("workerSetPassword", {
    account_id: accountId,
    password,
  });
}

export function requestPasswordReset(identifier: string) {
  return post<{ account_id: string }>("requestPasswordReset", { identifier });
}

export function adminLogin(username: string, password: string) {
  return post<{ account_id: string; token: string; permissions: Record<string, boolean> }>(
    "adminLogin",
    { username, password }
  );
}

export function getWorkerDashboard(accountId: string) {
  return get<{
    worker: Record<string, unknown>;
    balances: Record<string, number>;
    current_jobs: Record<string, unknown>[];
    past_jobs: Record<string, unknown>[];
    rewards: Record<string, unknown>[];
    redemptions: Record<string, unknown>[];
  }>("worker_dashboard", { worker_id: accountId });
}

export function getOpenJobs(accountId?: string) {
  return get<{ rows: Record<string, unknown>[] }>("worker_open_jobs", { account_id: accountId });
}
