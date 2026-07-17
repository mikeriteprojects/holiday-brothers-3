/**
 * Holiday Brothers — Consolidated Backend
 * Single Apps Script file, bound to the HolidayBrothersSchema.xlsx tabs
 * (imported into this project's Google Sheet). Action-dispatch pattern:
 * every request carries `action` (GET query param or POST JSON body field)
 * and is routed through GET_ACTIONS / POST_ACTIONS below.
 *
 * Owner is a hardcoded constant, never a Sheets row, per design doc §1/§5.
 */

// ===================================================================
// CONFIG
// ===================================================================

const OWNER_ACCOUNT_ID = 'ACC-0001'; // Menachem's account — change requires a code edit, by design.
const SESSION_TOKEN_TTL_HOURS = 24 * 30;

const SHEETS = {
  ACCOUNTS: 'Accounts',
  PERMISSION_FLAGS: 'Permission_Flags',
  ROLES: 'Roles_Permissions',
  BOOKINGS: 'Bookings',
  JOBS: 'Jobs',
  VENDORS: 'Vendors',
  VENDOR_REFERRALS: 'Vendor_Referrals',
  POINTS_LEDGER: 'Points_Ledger',
  REWARDS: 'Rewards',
  REDEMPTIONS: 'Redemptions',
  REVIEWS: 'Reviews_Ratings',
  CHAT_THREADS: 'Chat_Threads',
  CHAT_MESSAGES: 'Chat_Messages',
  TASKS: 'Tasks_Followups',
  FRIEND_GRAPH: 'Friend_Graph',
  INCIDENTS: 'Incident_Log',
  SETTINGS: 'Settings',
  CONTENT: 'Content',
  PRICING: 'Pricing',
  QUESTIONS: 'Questions',
  TESTIMONIALS: 'Testimonials',
  NOTIFICATIONS: 'Notifications',
};

const CURRENCIES = ['Priority', 'Incentive', 'Referral', 'Vendor', 'Shop'];

// ===================================================================
// SHEET / GENERIC CRUD UTILITIES
// ===================================================================

function ss_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function sheet_(name) {
  const sh = ss_().getSheetByName(name);
  if (!sh) throw new Error('Missing sheet: ' + name);
  return sh;
}

// Row 1 is reserved for notes, row 2 holds the column headers, row 3+ is data.
function headers_(sh) {
  return sh.getRange(2, 1, 1, sh.getLastColumn()).getValues()[0];
}

// Reads every data row of a sheet into an array of {header: value} objects.
function getRows_(sheetName) {
  const sh = sheet_(sheetName);
  const lastRow = sh.getLastRow();
  if (lastRow < 3) return [];
  const hdrs = headers_(sh);
  const data = sh.getRange(3, 1, lastRow - 2, hdrs.length).getValues();
  return data.map(function (row, i) {
    const obj = {};
    hdrs.forEach(function (h, j) { obj[h] = row[j]; });
    obj._row = i + 3; // 1-indexed sheet row, for in-place updates
    return obj;
  });
}

// Appends one row, filling columns by header name; unspecified headers left blank.
function appendRow_(sheetName, obj) {
  const sh = sheet_(sheetName);
  const hdrs = headers_(sh);
  const row = hdrs.map(function (h) { return obj[h] !== undefined ? obj[h] : ''; });
  sh.appendRow(row);
  return obj;
}

// Updates specific fields on the row matching keyCol === keyVal. Returns the row object, or null.
function updateRowByKey_(sheetName, keyCol, keyVal, updates) {
  const sh = sheet_(sheetName);
  const hdrs = headers_(sh);
  const keyIdx = hdrs.indexOf(keyCol);
  if (keyIdx === -1) throw new Error('Unknown column ' + keyCol + ' on ' + sheetName);
  const lastRow = sh.getLastRow();
  if (lastRow < 3) return null;
  const data = sh.getRange(3, 1, lastRow - 2, hdrs.length).getValues();
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][keyIdx]) === String(keyVal)) {
      const rowNum = i + 3;
      Object.keys(updates).forEach(function (field) {
        const colIdx = hdrs.indexOf(field);
        if (colIdx !== -1) sh.getRange(rowNum, colIdx + 1).setValue(updates[field]);
      });
      const updated = {};
      hdrs.forEach(function (h, j) { updated[h] = updates[h] !== undefined ? updates[h] : data[i][j]; });
      return updated;
    }
  }
  return null;
}

function findRow_(sheetName, keyCol, keyVal) {
  const rows = getRows_(sheetName);
  return rows.find(function (r) { return String(r[keyCol]) === String(keyVal); }) || null;
}

function genId_(prefix) {
  return prefix + '-' + Utilities.getUuid().slice(0, 8).toUpperCase();
}

function nowIso_() {
  return new Date().toISOString();
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function ok_(extra) {
  return Object.assign({ ok: true }, extra || {});
}

function fail_(message) {
  return { ok: false, error: message };
}

// ===================================================================
// AUTH & ACCOUNTS
// ===================================================================

function hashSecret_(raw) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(raw));
  return digest.map(function (b) { return ('0' + (b & 0xFF).toString(16)).slice(-2); }).join('');
}

function findAccountByIdentifier_(identifier) {
  const rows = getRows_(SHEETS.ACCOUNTS);
  return rows.find(function (r) {
    return r.username === identifier || r.email === identifier || r.phone === identifier || r.account_id === identifier;
  }) || null;
}

function issueSession_(accountId) {
  const token = Utilities.getUuid();
  PropertiesService.getScriptProperties().setProperty(
    'session_' + token,
    JSON.stringify({ account_id: accountId, expires: Date.now() + SESSION_TOKEN_TTL_HOURS * 3600 * 1000 })
  );
  return token;
}

function sessionAccountId_(token) {
  const raw = PropertiesService.getScriptProperties().getProperty('session_' + token);
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  if (parsed.expires < Date.now()) return null;
  return parsed.account_id;
}

// action: workerIdentify — works for any role now (Client/Crew/Vendor/Admin), name kept for frontend compat.
function actIdentify_(p) {
  const acc = findAccountByIdentifier_(p.identifier);
  if (!acc) return fail_('No account found');
  const method = acc.password_hash ? 'password' : 'email_code';
  if (method === 'email_code') {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    PropertiesService.getScriptProperties().setProperty('otp_' + acc.account_id, JSON.stringify({ code: code, expires: Date.now() + 10 * 60 * 1000 }));
    if (acc.email) MailApp.sendEmail(acc.email, 'Your Holiday Brothers code', 'Your login code is ' + code);
  }
  return ok_({ method: method, has_password: !!acc.password_hash, account_id: acc.account_id, roles: acc.roles_csv });
}

function actVerifyCode_(p) {
  const key = p.account_id || p.worker_id;
  const stored = PropertiesService.getScriptProperties().getProperty('otp_' + key);
  if (!stored) return fail_('No code issued');
  const parsed = JSON.parse(stored);
  if (parsed.expires < Date.now() || parsed.code !== String(p.code)) return fail_('Invalid or expired code');
  const token = issueSession_(key);
  return ok_({ account_id: key, token: token });
}

function actLoginPassword_(p) {
  const acc = findRow_(SHEETS.ACCOUNTS, 'account_id', p.account_id || p.worker_id) || findAccountByIdentifier_(p.identifier || p.username);
  if (!acc) return fail_('Account not found');
  if (acc.password_hash !== hashSecret_(p.password)) return fail_('Incorrect password');
  const token = issueSession_(acc.account_id);
  return ok_({ account_id: acc.account_id, token: token, roles: acc.roles_csv });
}

// Forgot-password entry point: unlike actIdentify_ (which only OTPs when no password is set yet),
// this always issues a fresh OTP by identifier so an existing password can be reset. The frontend
// then reuses actVerifyCode_ + actSetPassword_ unchanged to complete the reset.
function actRequestPasswordReset_(p) {
  const acc = findAccountByIdentifier_(p.identifier);
  if (!acc) return fail_('No account found');
  const code = String(Math.floor(100000 + Math.random() * 900000));
  PropertiesService.getScriptProperties().setProperty('otp_' + acc.account_id, JSON.stringify({ code: code, expires: Date.now() + 10 * 60 * 1000 }));
  if (acc.email) MailApp.sendEmail(acc.email, 'Reset your Holiday Brothers password', 'Your reset code is ' + code);
  return ok_({ account_id: acc.account_id });
}

function actSetPassword_(p) {
  const key = p.account_id || p.worker_id;
  updateRowByKey_(SHEETS.ACCOUNTS, 'account_id', key, { password_hash: hashSecret_(p.password), updated_at: nowIso_() });
  const token = issueSession_(key);
  return ok_({ account_id: key, token: token });
}

// Legacy-compatible admin login: now backed by Accounts + Roles_Permissions instead of one shared password.
function actAdminLogin_(p) {
  const acc = findAccountByIdentifier_(p.username || p.identifier || p.email);
  if (!acc) return fail_('Account not found');
  if (acc.password_hash !== hashSecret_(p.password)) return fail_('Incorrect password');
  if (String(acc.roles_csv || '').indexOf('admin') === -1 && acc.account_id !== OWNER_ACCOUNT_ID) {
    return fail_('Account has no admin access');
  }
  const token = issueSession_(acc.account_id);
  return ok_({ account_id: acc.account_id, token: token, permissions: permissionsForAccount_(acc.account_id) });
}

// ===================================================================
// PERMISSIONS (Discord-style toggle system)
// ===================================================================

function staffRoleIdForAccount_(accountId) {
  // An account's assigned staff role is stored as `staff_role_id::<role_id>` inside its notes-equivalent
  // roles_csv entry for simplicity in this single-table Accounts model, e.g. "admin:ROLE-MANAGER".
  const acc = findRow_(SHEETS.ACCOUNTS, 'account_id', accountId);
  if (!acc) return null;
  const match = String(acc.roles_csv || '').match(/admin:([A-Za-z0-9_-]+)/);
  return match ? match[1] : null;
}

function permissionsForAccount_(accountId) {
  if (accountId === OWNER_ACCOUNT_ID) {
    const allFlags = getRows_(SHEETS.PERMISSION_FLAGS).map(function (f) { return f.flag_id; });
    const all = {};
    allFlags.forEach(function (f) { all[f] = true; });
    return all;
  }
  const roleId = staffRoleIdForAccount_(accountId);
  if (!roleId) return {};
  const role = findRow_(SHEETS.ROLES, 'role_id', roleId);
  if (!role || !role.permissions_json) return {};
  try { return JSON.parse(role.permissions_json); } catch (e) { return {}; }
}

function hasPermission_(accountId, flagId) {
  if (accountId === OWNER_ACCOUNT_ID) return true;
  const perms = permissionsForAccount_(accountId);
  return !!perms[flagId];
}

function requirePermission_(accountId, flagId) {
  if (!hasPermission_(accountId, flagId)) throw new Error('Missing permission: ' + flagId);
  return true;
}

// Seeds a brand-new role's permissions_json from Permission_Flags defaults for the given preset column.
function seedRolePermissions_(presetColumn) {
  const flags = getRows_(SHEETS.PERMISSION_FLAGS);
  const perms = {};
  flags.forEach(function (f) { perms[f.flag_id] = String(f[presetColumn]).toUpperCase() === 'TRUE'; });
  return perms;
}

function actCreateCustomRole_(p) {
  requirePermission_(p.account_id, 'assign_staff_roles');
  const basedOn = p.based_on_preset || 'ROLE-CS';
  const baseRole = findRow_(SHEETS.ROLES, 'role_id', basedOn);
  const perms = baseRole ? JSON.parse(baseRole.permissions_json) : seedRolePermissions_('default_CS');
  const roleId = genId_('ROLE');
  appendRow_(SHEETS.ROLES, {
    role_id: roleId, role_name: p.role_name, is_preset: 'FALSE', based_on_preset: basedOn,
    permissions_json: JSON.stringify(perms), created_by: p.account_id, created_at: nowIso_(),
  });
  return ok_({ role_id: roleId });
}

function actToggleRolePermission_(p) {
  requirePermission_(p.account_id, 'assign_staff_roles');
  const role = findRow_(SHEETS.ROLES, 'role_id', p.role_id);
  if (!role) return fail_('Role not found');
  const perms = JSON.parse(role.permissions_json || '{}');
  perms[p.flag_id] = !!p.enabled;
  updateRowByKey_(SHEETS.ROLES, 'role_id', p.role_id, { permissions_json: JSON.stringify(perms) });
  return ok_();
}

function actAssignStaffRole_(p) {
  requirePermission_(p.account_id, 'assign_staff_roles');
  const target = findRow_(SHEETS.ACCOUNTS, 'account_id', p.target_account_id);
  if (!target) return fail_('Account not found');
  const rolesCsv = String(target.roles_csv || '').split(',').filter(function (r) { return r.indexOf('admin:') !== 0 && r !== 'admin'; });
  rolesCsv.push('admin:' + p.role_id);
  updateRowByKey_(SHEETS.ACCOUNTS, 'account_id', p.target_account_id, { roles_csv: rolesCsv.join(','), updated_at: nowIso_() });
  return ok_();
}

// ===================================================================
// POINTS (5-currency ledger)
// ===================================================================

function awardPoints_(accountId, currency, delta, reason, relatedId, awardedBy) {
  appendRow_(SHEETS.POINTS_LEDGER, {
    ledger_id: genId_('PL'), account_id: accountId, currency: currency, delta: delta,
    reason: reason, related_id: relatedId || '', awarded_by: awardedBy || 'SYSTEM', timestamp: nowIso_(),
  });
}

function getBalance_(accountId, currency) {
  const rows = getRows_(SHEETS.POINTS_LEDGER);
  return rows.reduce(function (sum, r) {
    if (r.account_id === accountId && r.currency === currency) return sum + Number(r.delta || 0);
    return sum;
  }, 0);
}

function getAllBalances_(accountId) {
  const balances = {};
  CURRENCIES.forEach(function (c) { balances[c] = getBalance_(accountId, c); });
  return balances;
}

function actAdjustPointsManual_(p) {
  requirePermission_(p.account_id, 'adjust_points_manual');
  awardPoints_(p.target_account_id, p.currency, Number(p.delta), p.reason || 'Manual admin adjustment', '', p.account_id);
  return ok_({ balance: getBalance_(p.target_account_id, p.currency) });
}

// ===================================================================
// PRICING
// ===================================================================

function settingNumber_(key, fallback) {
  const row = findRow_(SHEETS.SETTINGS, 'key', key);
  if (!row) return fallback;
  const n = Number(row.value);
  return isNaN(n) ? fallback : n;
}

function pricingModifier_(component, key) {
  const rows = getRows_(SHEETS.PRICING);
  const row = rows.find(function (r) { return r.formula_component === component && r.sukkah_type_or_tier === key; });
  return row ? Number(row.value || 0) : 0;
}

// selfDelivery/workerPickup are the two independent, stackable discount
// toggles from the booking flow's Delivery step (UserJourney.md §2.2 step
// 5) — both discount amounts are Pricing-sheet rows
// (formula_component: 'discount', sukkah_type_or_tier: 'self_delivery' /
// 'worker_pickup'), editable from /admin/content like every other Pricing
// row, not hardcoded.
function calculatePrice_(size, sukkahType, speedTier, selfDelivery, workerPickup) {
  const base = pricingModifier_('base', 'Small/Canvas/Regular') || settingNumber_('pricing_base_amount', 75);
  const sizeMod = size === 'Small' ? 0 : pricingModifier_('size_mod', size);
  const speedMod = pricingModifier_('speed_mod', speedTier);
  const typeMod = pricingModifier_('type_mod', sukkahType);
  const selfDeliveryDiscount = selfDelivery ? pricingModifier_('discount', 'self_delivery') : 0;
  const workerPickupDiscount = workerPickup ? pricingModifier_('discount', 'worker_pickup') : 0;
  return {
    base: base, size_mod: sizeMod, speed_mod: speedMod, type_mod: typeMod,
    self_delivery_discount: selfDeliveryDiscount, worker_pickup_discount: workerPickupDiscount,
    total: base + sizeMod + speedMod + typeMod - selfDeliveryDiscount - workerPickupDiscount,
  };
}

function actGetPricing_() {
  return ok_({ rows: getRows_(SHEETS.PRICING) });
}

// ===================================================================
// CONTENT / NOTIFICATIONS (shared, all roles)
// ===================================================================

function actGetContent_() {
  const rows = getRows_(SHEETS.CONTENT).map(function (r) { return { block_id: r.block_id, value: r.value }; });
  return ok_({ rows: rows });
}

function actGetNotifications_(p) {
  const rows = getRows_(SHEETS.NOTIFICATIONS).filter(function (r) {
    return (!p.audience || r.audience === p.audience) && (!p.target || r.target === p.target);
  });
  return ok_({ rows: rows });
}

function actSendNotification_(p) {
  requirePermission_(p.account_id, p.audience === 'admin' ? 'broadcast_any' : 'broadcast_role_segment');
  appendRow_(SHEETS.NOTIFICATIONS, {
    notification_id: genId_('NOTIF'), audience: p.audience, target: p.target || '',
    message: p.message, channel_csv: p.channel_csv || 'sms,push', created_at: nowIso_(),
  });
  return ok_();
}

function actSendBroadcastEmail_(p) {
  requirePermission_(p.account_id, 'broadcast_any');
  const accounts = getRows_(SHEETS.ACCOUNTS).filter(function (a) {
    return String(a.roles_csv || '').indexOf(p.audience) !== -1;
  });
  accounts.forEach(function (a) { if (a.email) MailApp.sendEmail(a.email, p.subject, p.body); });
  return ok_({ sent: accounts.length });
}

// ===================================================================
// BOOKINGS
// ===================================================================

const BOOKING_STATUS_CHAIN = [
  'Submitted Booking', 'Price Pending', 'Quote Sent', 'Job Confirmed',
  'Scheduled', 'In Progress', 'Paid', 'Pending Completion', 'Completed',
];

function actSubmitBooking_(p) {
  const answers = p.answers || {};
  let account = answers.account_id ? findRow_(SHEETS.ACCOUNTS, 'account_id', answers.account_id) : findAccountByIdentifier_(answers.phone || answers.email);
  if (!account) {
    const accountId = genId_('ACC');
    appendRow_(SHEETS.ACCOUNTS, {
      account_id: accountId, account_referral_id: genId_('REF'), username: answers.username || '',
      first_name: answers.name || '', email: answers.email || '', phone: answers.phone || '',
      roles_csv: 'client', status: answers.guest_ticket ? 'Guest' : 'Approved', created_at: nowIso_(), updated_at: nowIso_(),
    });
    account = { account_id: accountId };
  }
  const price = calculatePrice_(
    answers.size, answers.sukkah_type, answers.speed_tier,
    String(answers.self_delivery).toUpperCase() === 'TRUE',
    String(answers.worker_pickup).toUpperCase() === 'TRUE'
  );
  const priorityAward = { Patient: 45, Regular: 75, Express: 100 }[answers.speed_tier] || 0;
  const priorityCost = { Patient: 30, Regular: 60, Express: 90 }[answers.speed_tier] || 0;
  const bookingCode = genId_('BK');
  appendRow_(SHEETS.BOOKINGS, {
    booking_code: bookingCode, account_id: account.account_id, has_supplies: answers.has_supplies || 'FALSE',
    size: answers.size || '', sukkah_type: answers.sukkah_type || '', speed_tier: answers.speed_tier || '',
    self_delivery_discount: answers.self_delivery || 'FALSE', worker_pickup_discount: answers.worker_pickup || 'FALSE',
    address: answers.address || '', price_base: price.base, price_size_mod: price.size_mod,
    price_speed_mod: price.speed_mod, price_type_mod: price.type_mod, price_total: price.total,
    measurement_verification_method: answers.verification_method || '', status: 'Submitted Booking',
    job_confirmed_pct: 0, notes: answers.notes || '', created_at: nowIso_(), updated_at: nowIso_(),
  });
  awardPoints_(account.account_id, 'Priority', priorityAward - priorityCost, 'Booking submitted: ' + answers.speed_tier, bookingCode, 'SYSTEM');
  spawnTaskIfNeeded_('Stalled Quotes', bookingCode);
  ensurePersistentThread_(account.account_id);
  return ok_({ booking_code: bookingCode, price: price, account_id: account.account_id });
}

function actBookingStatus_(p) {
  const booking = findRow_(SHEETS.BOOKINGS, 'booking_code', p.code);
  if (!booking) return fail_('Booking not found');
  if (p.phone) {
    const account = findRow_(SHEETS.ACCOUNTS, 'account_id', booking.account_id);
    if (!account || account.phone !== p.phone) return fail_('Phone does not match booking');
  }
  const job = findRow_(SHEETS.JOBS, 'booking_code', p.code);
  return ok_({ booking: booking, job: job });
}

function actUpdateStatus_(p) {
  if (p.table === SHEETS.BOOKINGS) requirePermission_(p.account_id, 'lock_price_quote');
  updateRowByKey_(p.table, p.table === SHEETS.BOOKINGS ? 'booking_code' : 'account_id', p.key_value, { status: p.status, updated_at: nowIso_() });
  return ok_();
}

function actDeleteLead_(p) {
  requirePermission_(p.account_id, 'handle_refunds_disputes');
  const sh = sheet_(SHEETS.BOOKINGS);
  const row = findRow_(SHEETS.BOOKINGS, 'booking_code', p.booking_code);
  if (row) sh.deleteRow(row._row);
  return ok_();
}

function actConfirmClientConfirms_(p) {
  updateRowByKey_(SHEETS.BOOKINGS, 'booking_code', p.booking_code, { status: 'Job Confirmed', job_confirmed_pct: 40, updated_at: nowIso_() });
  return ok_();
}

function actConfirmCrewConfirms_(p) {
  requirePermission_(p.account_id, 'appoint_crew_to_job');
  updateRowByKey_(SHEETS.BOOKINGS, 'booking_code', p.booking_code, { job_confirmed_pct: 70, updated_at: nowIso_() });
  return ok_();
}

function actConfirmAdminApproves_(p) {
  requirePermission_(p.account_id, 'override_admin_checklist');
  updateRowByKey_(SHEETS.BOOKINGS, 'booking_code', p.booking_code, { job_confirmed_pct: 100, status: 'Scheduled', updated_at: nowIso_() });
  return ok_();
}

function actCancelBooking_(p) {
  const booking = findRow_(SHEETS.BOOKINGS, 'booking_code', p.booking_code);
  if (!booking) return fail_('Booking not found');
  const hoursUntilJob = Number(p.hours_until_job || 0);
  let fee = 0;
  if (hoursUntilJob < 12) fee = settingNumber_('cancel_fee_tier_under_12hr', 30);
  else fee = settingNumber_('cancel_fee_tier_over_12hr', 0);
  updateRowByKey_(SHEETS.BOOKINGS, 'booking_code', p.booking_code, { status: 'Cancelled', updated_at: nowIso_() });
  return ok_({ fee_charged: fee });
}

function actTriggerWeatherHold_(p) {
  requirePermission_(p.account_id, 'trigger_weather_hold');
  updateRowByKey_(SHEETS.BOOKINGS, 'booking_code', p.booking_code, { status: 'Weather Hold', updated_at: nowIso_() });
  return ok_();
}

// ===================================================================
// CREW APPLICATIONS (folded into Accounts)
// ===================================================================

function actGetQuestions_() {
  const rows = getRows_(SHEETS.QUESTIONS).filter(function (r) { return String(r.active).toUpperCase() === 'TRUE'; });
  return ok_({ rows: rows });
}

// Maps the Questions-sheet-facing labels (what the applicant picks) to the
// internal crew_subtype codes used everywhere else (job matching, portal UI).
const CREW_ROLE_TO_SUBTYPE = {
  'Builder Only': 'builder',
  'Builder + Driver': 'builder_driver',
  'Driver Only': 'driver_only',
};

function actSubmitCrewApplication_(p) {
  const a = p.answers || {};
  const birthDate = new Date(a.birthday);
  const age = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 3600 * 1000));
  const accountId = genId_('ACC');
  appendRow_(SHEETS.ACCOUNTS, {
    account_id: accountId, account_referral_id: genId_('REF'), first_name: a.name || '',
    email: a.email || '', phone: a.phone || '', roles_csv: 'crew',
    crew_subtype: CREW_ROLE_TO_SUBTYPE[a.crew_role] || 'builder',
    driving_subtype: a.driving_subtype || '', birthday: a.birthday || '', school_yeshiva: a.school || '',
    prior_work: a.prior_work || 'FALSE', address: a.address || '', transport_guaranteed: a.transport_guaranteed || 'FALSE',
    emergency_contact_name: a.emergency_contact_name || '', emergency_contact_phone: a.emergency_contact_phone || '',
    guardian_contact_name: a.guardian_contact_name || '', guardian_contact_phone: a.guardian_contact_phone || '',
    medical_experience: a.medical_experience || 'FALSE', medical_cert_url: a.medical_cert_url || '',
    waiver_accepted: a.waiver_accepted || 'FALSE', status: 'Submitted', created_at: nowIso_(), updated_at: nowIso_(),
  });
  spawnTask_('Crew Application', accountId, 'Manager');
  return ok_({ account_id: accountId, age: age, requires_parental_consent: age < 16 });
}

function actHireWorker_(p) {
  requirePermission_(p.account_id, 'approve_crew_application');
  updateRowByKey_(SHEETS.ACCOUNTS, 'account_id', p.applicant_id, { status: 'Approved', email: p.email || '', updated_at: nowIso_() });
  ensurePersistentThread_(p.applicant_id);
  return ok_();
}

// ===================================================================
// JOBS
// ===================================================================

function actGetOpenJobs_(p) {
  const jobs = getRows_(SHEETS.JOBS).filter(function (j) { return j.status === 'Requesting' || j.status === 'Open'; });
  const canSeeCost = p.account_id && hasPermission_(p.account_id, 'view_client_cost');
  return ok_({
    rows: jobs.map(function (j) {
      const booking = findRow_(SHEETS.BOOKINGS, 'booking_code', j.booking_code) || {};
      return {
        job_id: j.job_id, job_type: j.job_type, date: j.date, tier: j.tier,
        neighborhood: (booking.address || '').split(',')[1] || '',
        pay_amount: canSeeCost ? j.total_cost : undefined,
      };
    }),
  });
}

function actCreateJob_(p) {
  requirePermission_(p.account_id, 'appoint_crew_to_job');
  const jobId = genId_('JOB');
  appendRow_(SHEETS.JOBS, {
    job_id: jobId, booking_code: p.booking_code, job_type: p.job_type, date: p.date, tier: p.tier,
    total_cost: p.total_cost, crew_pickup_needed: p.crew_pickup_needed || 'FALSE',
    supply_pickup_needed: p.supply_pickup_needed || 'FALSE', assignments_json: JSON.stringify(p.assignments || []),
    staffing_mode: p.mode || 'open', status: 'Requesting', confirmation_code: String(Math.floor(100000 + Math.random() * 900000)),
    time_discrepancy_flag: 'FALSE', created_at: nowIso_(), updated_at: nowIso_(),
  });
  ensureJobGroupThread_(jobId, p.booking_code, p.assignments || []);
  return ok_({ job_id: jobId });
}

function actClaimJob_(p) {
  const job = findRow_(SHEETS.JOBS, 'job_id', p.job_id);
  if (!job) return fail_('Job not found');
  const assignments = JSON.parse(job.assignments_json || '[]');
  assignments.push({ account_id: p.worker_id || p.account_id, status: 'requested', requested_at: nowIso_() });
  updateRowByKey_(SHEETS.JOBS, 'job_id', p.job_id, { assignments_json: JSON.stringify(assignments), updated_at: nowIso_() });
  return ok_();
}

function actMarkJobDone_(p) {
  const field = p.role === 'client' ? 'client_ended_at' : 'crew_ended_at';
  updateRowByKey_(SHEETS.JOBS, 'job_id', p.job_id, { [field]: nowIso_(), status: 'Pending Completion', updated_at: nowIso_() });
  return ok_();
}

function actCompleteJob_(p) {
  requirePermission_(p.account_id, 'mark_job_completed');
  updateRowByKey_(SHEETS.JOBS, 'job_id', p.job_id, { status: 'Completed', updated_at: nowIso_() });
  updateRowByKey_(SHEETS.BOOKINGS, 'booking_code', p.booking_code, { status: 'Completed', updated_at: nowIso_() });
  spawnTask_('Post-Job Call', p.booking_code, 'CS');
  return ok_();
}

function actNotifyClientJobDone_(p) {
  appendRow_(SHEETS.NOTIFICATIONS, {
    notification_id: genId_('NOTIF'), audience: 'client', target: p.booking_code,
    message: 'Your job has been marked complete!', channel_csv: 'sms,push', created_at: nowIso_(),
  });
  return ok_();
}

// Generic timestamp logger for the client/crew dual-timer system (begin/break/end, both sides independent).
function actLogTimestamp_(p) {
  const field = (p.actor === 'client' ? 'client_' : 'crew_') + p.event + '_at'; // event in {began, break_began, break_ended, ended}
  updateRowByKey_(SHEETS.JOBS, 'job_id', p.job_id, { [field]: nowIso_(), updated_at: nowIso_() });
  const job = findRow_(SHEETS.JOBS, 'job_id', p.job_id);
  if (job && job.client_began_at && job.crew_began_at) {
    const gapMinutes = Math.abs(new Date(job.client_began_at) - new Date(job.crew_began_at)) / 60000;
    const threshold = settingNumber_('time_discrepancy_threshold_minutes', 15);
    if (gapMinutes > threshold) {
      updateRowByKey_(SHEETS.JOBS, 'job_id', p.job_id, { time_discrepancy_flag: 'TRUE' });
      appendRow_(SHEETS.INCIDENTS, { incident_id: genId_('INC'), type: 'time_discrepancy', related_id: p.job_id, triggered_by: 'SYSTEM', details: gapMinutes.toFixed(1) + ' min gap', admin_phone_call_made: 'FALSE', created_at: nowIso_() });
    }
  }
  return ok_();
}

// Drives the 4-tap Builder+Driver button flow: Begin Drive -> Begin Job (ends
// drive, starts build) -> Begin Drive/return (ends build, starts return drive)
// -> End Drive. Reuses drive_start_at/drive_end_at across both legs — the
// outbound leg's duration is overwritten by the return leg, a deliberate
// simplification since driving pay is computed from the summed total anyway.
function actCrewButtonTap_(p) {
  const job = findRow_(SHEETS.JOBS, 'job_id', p.job_id);
  if (!job) return fail_('Job not found');
  const now = nowIso_();
  if (!job.drive_start_at) {
    updateRowByKey_(SHEETS.JOBS, 'job_id', p.job_id, { drive_start_at: now, updated_at: now });
    return ok_({ next_label: 'Begin Job' });
  }
  if (!job.crew_began_at) {
    updateRowByKey_(SHEETS.JOBS, 'job_id', p.job_id, { drive_end_at: now, crew_began_at: now, updated_at: now });
    return ok_({ next_label: 'Begin Drive (return)' });
  }
  if (!job.crew_ended_at) {
    updateRowByKey_(SHEETS.JOBS, 'job_id', p.job_id, { crew_ended_at: now, drive_start_at: now, updated_at: now });
    return ok_({ next_label: 'End Drive' });
  }
  updateRowByKey_(SHEETS.JOBS, 'job_id', p.job_id, { drive_end_at: now, status: 'Pending Completion', updated_at: now });
  return ok_({ next_label: null, status: 'Pending Completion' });
}

function actSetPayoutPreference_(p) {
  updateRowByKey_(SHEETS.ACCOUNTS, 'account_id', p.account_id, { batch_payout_pref: p.batch ? 'TRUE' : 'FALSE', updated_at: nowIso_() });
  return ok_();
}

function actConfirmDayOfCode_(p) {
  const job = findRow_(SHEETS.JOBS, 'job_id', p.job_id);
  if (!job) return fail_('Job not found');
  if (String(job.confirmation_code) !== String(p.code)) return fail_('Code mismatch');
  updateRowByKey_(SHEETS.JOBS, 'job_id', p.job_id, { status: 'In Progress', updated_at: nowIso_() });
  return ok_({ unlocked: true });
}

function actOpenEmergencyInfo_(p) {
  appendRow_(SHEETS.INCIDENTS, {
    incident_id: genId_('INC'), type: 'emergency_info_accessed', related_id: p.job_id, triggered_by: p.account_id,
    details: 'Emergency contact info opened', admin_phone_call_made: 'TRUE', created_at: nowIso_(),
  });
  spawnTask_('Emergency Follow-up', p.job_id, 'Manager');
  return ok_({ acknowledged: true });
}

// ===================================================================
// VENDORS
// ===================================================================

function actSubmitVendorReferral_(p) {
  const vendorId = genId_('VEN');
  appendRow_(SHEETS.VENDORS, {
    vendor_id: vendorId, category: p.category || '', pricing_json: p.pricing_json || '{}',
    stock_status: p.stock_status || '', service_area: p.service_area || '', rental_availability: p.rental_availability || 'FALSE',
    photos_csv: p.photos_csv || '', delivery_capability: p.delivery_capability || 'FALSE', status: 'Submitted',
    vendor_points: 0, tier: 'Tier 1', created_at: nowIso_(), updated_at: nowIso_(),
  });
  appendRow_(SHEETS.VENDOR_REFERRALS, {
    referral_id: genId_('VREF'), referrer_account_id: p.referrer_account_id, vendor_id: vendorId,
    legitimacy_info: p.legitimacy_info || '', photos_csv: p.photos_csv || '', status: 'Submitted',
    points_awarded: 'FALSE', created_at: nowIso_(),
  });
  return ok_({ vendor_id: vendorId });
}

// A vendor that self-applied (actSubmitVendorApplication_) has an account_id on its Vendors row —
// approving that vendor also flips its linked Accounts row to Approved, parallel to actHireWorker_,
// so the vendor can then log in normally through workerIdentify/workerLoginPassword.
function actApproveVendor_(p) {
  requirePermission_(p.account_id, 'approve_vendor_application');
  updateRowByKey_(SHEETS.VENDORS, 'vendor_id', p.vendor_id, { status: 'Approved', updated_at: nowIso_() });
  const vendor = findRow_(SHEETS.VENDORS, 'vendor_id', p.vendor_id);
  if (vendor && vendor.account_id) {
    updateRowByKey_(SHEETS.ACCOUNTS, 'account_id', vendor.account_id, { status: 'Approved', updated_at: nowIso_() });
  }
  const referral = getRows_(SHEETS.VENDOR_REFERRALS).find(function (r) { return r.vendor_id === p.vendor_id; });
  if (referral && referral.referrer_account_id !== (vendor && vendor.account_id)) {
    awardPoints_(referral.referrer_account_id, 'Referral', 50, 'Vendor referral approved', p.vendor_id, p.account_id);
    updateRowByKey_(SHEETS.VENDOR_REFERRALS, 'referral_id', referral.referral_id, { status: 'Approved', points_awarded: 'TRUE', resolved_at: nowIso_() });
  }
  return ok_();
}

// Vendor self-signup: creates both an Accounts row (roles_csv: 'vendor') and a linked Vendors row,
// so the vendor genuinely gets an account and can log in like crew/customers do — unlike
// actSubmitVendorReferral_, which is an existing account referring someone else's vendor business.
function actSubmitVendorApplication_(p) {
  const a = p.answers || {};
  const accountId = genId_('ACC');
  appendRow_(SHEETS.ACCOUNTS, {
    account_id: accountId, account_referral_id: genId_('REF'), first_name: a.business_name || a.name || '',
    email: a.email || '', phone: a.phone || '', roles_csv: 'vendor', address: a.address || '',
    status: 'Submitted', created_at: nowIso_(), updated_at: nowIso_(),
  });
  const vendorId = genId_('VEN');
  appendRow_(SHEETS.VENDORS, {
    vendor_id: vendorId, account_id: accountId, category: a.category || '', pricing_json: a.pricing_json || '{}',
    stock_status: a.stock_status || '', service_area: a.service_area || '', rental_availability: a.rental_availability || 'FALSE',
    photos_csv: a.photos_csv || '', delivery_capability: a.delivery_capability || 'FALSE', status: 'Submitted',
    vendor_points: 0, tier: 'Tier 1', created_at: nowIso_(), updated_at: nowIso_(),
  });
  spawnTask_('Vendor Application', accountId, 'Manager');
  return ok_({ account_id: accountId, vendor_id: vendorId });
}

function actDecideVendorTier_(p) {
  requirePermission_(p.account_id, 'decide_vendor_tier');
  updateRowByKey_(SHEETS.VENDORS, 'vendor_id', p.vendor_id, { tier: p.tier, updated_at: nowIso_() });
  return ok_();
}

function actGetVendors_() {
  return ok_({ rows: getRows_(SHEETS.VENDORS) });
}

// ===================================================================
// CHAT (persistent 1:1 for every account + per-job group with aside layer)
// ===================================================================

function ensurePersistentThread_(accountId) {
  const existing = getRows_(SHEETS.CHAT_THREADS).find(function (t) {
    return t.thread_type === 'persistent_1on1' && String(t.account_ids_csv).indexOf(accountId) !== -1;
  });
  if (existing) return existing.thread_id;
  const threadId = genId_('THR');
  appendRow_(SHEETS.CHAT_THREADS, { thread_id: threadId, thread_type: 'persistent_1on1', account_ids_csv: accountId + ',SYSTEM', job_id: '', created_at: nowIso_() });
  return threadId;
}

function ensureJobGroupThread_(jobId, bookingCode, assignments) {
  const booking = findRow_(SHEETS.BOOKINGS, 'booking_code', bookingCode);
  const ids = [booking ? booking.account_id : ''].concat(assignments.map(function (a) { return a.account_id; })).concat(['SYSTEM']);
  const threadId = genId_('THR');
  appendRow_(SHEETS.CHAT_THREADS, { thread_id: threadId, thread_type: 'job_group', account_ids_csv: ids.join(','), job_id: jobId, created_at: nowIso_() });
  return threadId;
}

function actStartChat_(p) {
  const booking = findRow_(SHEETS.BOOKINGS, 'booking_code', p.booking_code);
  if (!booking) return fail_('Booking not found');
  const threadId = ensurePersistentThread_(booking.account_id);
  return ok_({ chat_code: threadId });
}

function actSendMessage_(p) {
  const threadId = p.chat_code || p.thread_id;
  const isStaff = p.account_id && hasPermission_(p.account_id, 'reply_chats');
  appendRow_(SHEETS.CHAT_MESSAGES, {
    message_id: genId_('MSG'), thread_id: threadId, sender_account_id: p.sender || p.account_id,
    text: p.text, visibility: p.visibility === 'aside' && isStaff ? 'aside' : 'public', timestamp: nowIso_(),
  });
  return ok_();
}

function actGetChatMessages_(p) {
  const threadId = p.chat_code || p.thread_id;
  const isStaff = p.account_id && hasPermission_(p.account_id, 'view_chats');
  const rows = getRows_(SHEETS.CHAT_MESSAGES).filter(function (m) {
    if (m.thread_id !== threadId) return false;
    if (m.visibility === 'aside' && !isStaff) return false;
    if (p.since && new Date(m.timestamp) <= new Date(p.since)) return false;
    return true;
  });
  return ok_({ rows: rows });
}

function actCloseChat_(p) {
  return ok_();
}

function actGetChatsList_(p) {
  requirePermission_(p.account_id, 'view_chats');
  return ok_({ threads: getRows_(SHEETS.CHAT_THREADS) });
}

function actCreateGroupChat_(p) {
  requirePermission_(p.account_id, 'create_group_chat');
  const threadId = genId_('THR');
  appendRow_(SHEETS.CHAT_THREADS, { thread_id: threadId, thread_type: 'job_group', account_ids_csv: (p.account_ids || []).join(','), job_id: p.job_id || '', created_at: nowIso_() });
  return ok_({ thread_id: threadId });
}

// ===================================================================
// REVIEWS
// ===================================================================

function actSubmitReview_(p) {
  const reviewId = genId_('REV');
  appendRow_(SHEETS.REVIEWS, {
    review_id: reviewId, job_id: p.job_id, reviewer_account_id: p.reviewer_account_id,
    reviewed_account_id: p.reviewed_account_id || 'company', review_type: p.review_type,
    stars: p.stars, bonus_stars: p.bonus_stars || 0, category_scores_json: JSON.stringify(p.category_scores || {}),
    text: p.text || '', is_testimonial_candidate: (p.review_type === 'client_to_company' && Number(p.stars) >= 4) ? 'TRUE' : 'FALSE',
    published: 'FALSE', created_at: nowIso_(),
  });
  if (p.review_type === 'client_to_crew_aggregate' || p.review_type === 'client_to_crew_individual') {
    awardPoints_(p.reviewer_account_id, 'Referral', 10, 'Left a crew review', reviewId, 'SYSTEM');
    awardPoints_(p.reviewed_account_id, 'Incentive', 15, 'Received a client review', reviewId, 'SYSTEM');
  }
  return ok_({ review_id: reviewId });
}

function actAddFriendRequest_(p) {
  appendRow_(SHEETS.FRIEND_GRAPH, { request_id: genId_('FRND'), requester_account_id: p.requester_account_id, target_account_id: p.target_account_id, status: 'Pending', created_at: nowIso_() });
  return ok_();
}

function actRespondFriendRequest_(p) {
  updateRowByKey_(SHEETS.FRIEND_GRAPH, 'request_id', p.request_id, { status: p.accept ? 'Accepted' : 'Declined' });
  return ok_();
}

// ===================================================================
// TASKS / FOLLOW-UPS (generic, event-spawned, cumulative escalation)
// ===================================================================

function spawnTask_(category, relatedId, startingTier) {
  appendRow_(SHEETS.TASKS, {
    task_id: genId_('TASK'), category: category, related_id: relatedId, current_tier: startingTier,
    status: 'Open', assigned_to: '', crew_shortage_mode: 'FALSE', notes: '', created_at: nowIso_(), escalated_at: '',
  });
}

function spawnTaskIfNeeded_(category, relatedId) {
  const existing = getRows_(SHEETS.TASKS).find(function (t) { return t.category === category && t.related_id === relatedId && t.status === 'Open'; });
  if (!existing) spawnTask_(category, relatedId, 'CS');
}

// Recomputes escalation tier for all open tasks against Settings thresholds. Intended to run on a time-driven trigger.
function recomputeTaskEscalation_() {
  const thresholds = {
    'Unpaid Balance': { cs: settingNumber_('followup_threshold_unpaid_cs_days', 3), manager: settingNumber_('followup_threshold_unpaid_manager_days', 7) },
    'Stalled Quotes': { cs: settingNumber_('followup_threshold_quote_cs_days', 5), manager: settingNumber_('followup_threshold_quote_manager_days', 10) },
    'Post-Job Call': { cs: settingNumber_('followup_threshold_postjob_cs_days', 4), manager: settingNumber_('followup_threshold_postjob_manager_days', 8) },
    'Crew Application': { cs: 0, manager: settingNumber_('followup_threshold_crewapp_manager_days', 10) },
  };
  const tasks = getRows_(SHEETS.TASKS).filter(function (t) { return t.status === 'Open'; });
  tasks.forEach(function (t) {
    const th = thresholds[t.category];
    if (!th) return;
    const ageDays = (Date.now() - new Date(t.created_at).getTime()) / 86400000;
    let tier = t.current_tier;
    if (t.category === 'Crew Application') tier = ageDays >= th.manager ? 'Admin' : 'Manager';
    else if (ageDays >= th.cs + th.manager) tier = 'Admin';
    else if (ageDays >= th.cs) tier = 'Manager';
    if (tier !== t.current_tier) updateRowByKey_(SHEETS.TASKS, 'task_id', t.task_id, { current_tier: tier, escalated_at: nowIso_() });
  });
}

function actTakeoverTask_(p) {
  updateRowByKey_(SHEETS.TASKS, 'task_id', p.task_id, { current_tier: p.new_tier, assigned_to: p.account_id, escalated_at: nowIso_() });
  return ok_();
}

function actResolveTask_(p) {
  updateRowByKey_(SHEETS.TASKS, 'task_id', p.task_id, { status: 'Resolved' });
  return ok_();
}

function actGetTasks_(p) {
  const perm = p.tier === 'Admin' ? 'manage_followups_admin_tier' : 'manage_followups_manager_tier';
  if (p.tier !== 'CS') requirePermission_(p.account_id, perm);
  return ok_({ rows: getRows_(SHEETS.TASKS).filter(function (t) { return t.status === 'Open'; }) });
}

// ===================================================================
// ADMIN CMS — generic draft/publish, extended to all editable tabs
// ===================================================================

// Keyed to match the exact `table` string every frontend page already sends
// (Content/Pricing/Questions/Testimonials/Settings) — kept case-sensitive
// rather than normalizing, since that's what every existing admin call sends.
const DRAFTABLE_TABS = {
  Content: { sheet: SHEETS.CONTENT, key: 'block_id', permission: 'edit_live_content' },
  Pricing: { sheet: SHEETS.PRICING, key: 'formula_component', permission: 'edit_pricing' },
  Questions: { sheet: SHEETS.QUESTIONS, key: 'question_id', permission: 'edit_questions' },
  Testimonials: { sheet: SHEETS.TESTIMONIALS, key: 'testimonial_id', permission: 'edit_testimonials' },
  Settings: { sheet: SHEETS.SETTINGS, key: 'key', permission: 'edit_placeholder_priority_numbers' },
};

function actSaveDraft_(p) {
  const cfg = DRAFTABLE_TABS[p.table];
  if (!cfg) return fail_('Unknown draftable table');
  requirePermission_(p.account_id, cfg.permission);
  updateRowByKey_(cfg.sheet, cfg.key, p.row_key, { draft_value: p.new_value, has_pending_draft: 'TRUE' });
  return ok_();
}

function actPublishDraft_(p) {
  const cfg = DRAFTABLE_TABS[p.table];
  if (!cfg) return fail_('Unknown draftable table');
  requirePermission_(p.account_id, cfg.permission);
  const row = findRow_(cfg.sheet, cfg.key, p.row_key);
  if (!row || !row.draft_value) return fail_('No pending draft');
  updateRowByKey_(cfg.sheet, cfg.key, p.row_key, { value: row.draft_value, draft_value: '', has_pending_draft: 'FALSE', last_updated_by: p.account_id, last_updated_at: nowIso_() });
  return ok_();
}

function actPublishAll_(p) {
  requirePermission_(p.account_id, 'publish_all_drafts');
  Object.keys(DRAFTABLE_TABS).forEach(function (table) {
    const cfg = DRAFTABLE_TABS[table];
    getRows_(cfg.sheet).filter(function (r) { return String(r.has_pending_draft).toUpperCase() === 'TRUE'; }).forEach(function (r) {
      updateRowByKey_(cfg.sheet, cfg.key, r[cfg.key], { value: r.draft_value, draft_value: '', has_pending_draft: 'FALSE', last_updated_by: p.account_id, last_updated_at: nowIso_() });
    });
  });
  return ok_();
}

function actCreateQuestion_(p) {
  requirePermission_(p.account_id, 'edit_questions');
  appendRow_(SHEETS.QUESTIONS, { question_id: genId_('Q'), label: p.label, type: p.type, options_csv: p.options || '', order: p.order || 0, required: p.required || 'FALSE', active: 'TRUE', conditional_rule: p.conditional_rule || '', has_pending_draft: 'FALSE' });
  return ok_();
}

function actCreateTestimonial_(p) {
  requirePermission_(p.account_id, 'edit_testimonials');
  appendRow_(SHEETS.TESTIMONIALS, { testimonial_id: genId_('TEST'), customer_name: p.customer_name, quote: p.quote, source_review_id: p.source_review_id || '', featured: 'FALSE', published: 'FALSE', created_at: nowIso_() });
  return ok_();
}

function actCreateReward_(p) {
  requirePermission_(p.account_id, 'fulfill_redemptions');
  appendRow_(SHEETS.REWARDS, { reward_id: genId_('RWD'), label: p.label, active: 'TRUE', cost_shop_points: p.cost_shop_points || 0, cost_priority_points: p.cost_priority_points || 0, cost_incentive_points: p.cost_incentive_points || 0, cost_referral_points: p.cost_referral_points || 0, cost_vendor_points: p.cost_vendor_points || 0, is_placeholder: 'TRUE' });
  return ok_();
}

function actUpdateReward_(p) {
  requirePermission_(p.account_id, 'fulfill_redemptions');
  updateRowByKey_(SHEETS.REWARDS, 'reward_id', p.reward_id, { [p.field]: p.value });
  return ok_();
}

function actRequestRedemption_(p) {
  const reward = findRow_(SHEETS.REWARDS, 'reward_id', p.reward_id);
  if (!reward) return fail_('Reward not found');
  const costField = 'cost_' + p.currency.toLowerCase() + '_points';
  const cost = Number(reward[costField] || 0);
  const balance = getBalance_(p.worker_id || p.account_id, p.currency);
  if (balance < cost) return fail_('Insufficient points');
  appendRow_(SHEETS.REDEMPTIONS, { redemption_id: genId_('RDM'), account_id: p.worker_id || p.account_id, reward_id: p.reward_id, currency_used: p.currency, cost_paid: cost, status: 'Pending', created_at: nowIso_() });
  awardPoints_(p.worker_id || p.account_id, p.currency, -cost, 'Redeemed: ' + reward.label, p.reward_id, 'SYSTEM');
  return ok_();
}

function actFulfillRedemption_(p) {
  requirePermission_(p.account_id, 'fulfill_redemptions');
  updateRowByKey_(SHEETS.REDEMPTIONS, 'redemption_id', p.redemption_id, { status: 'Fulfilled', fulfilled_by: p.account_id, fulfilled_at: nowIso_() });
  return ok_();
}

// ===================================================================
// WORKER / ACCOUNT DASHBOARD
// ===================================================================

function actWorkerDashboard_(p) {
  const accountId = p.worker_id || p.account_id;
  const account = findRow_(SHEETS.ACCOUNTS, 'account_id', accountId);
  if (!account) return fail_('Account not found');
  const jobs = getRows_(SHEETS.JOBS).filter(function (j) { return String(j.assignments_json || '').indexOf(accountId) !== -1; });
  return ok_({
    worker: account,
    balances: getAllBalances_(accountId),
    current_jobs: jobs.filter(function (j) { return j.status !== 'Completed'; }),
    past_jobs: jobs.filter(function (j) { return j.status === 'Completed'; }),
    rewards: getRows_(SHEETS.REWARDS).filter(function (r) { return String(r.active).toUpperCase() === 'TRUE'; }),
    redemptions: getRows_(SHEETS.REDEMPTIONS).filter(function (r) { return r.account_id === accountId; }),
  });
}

// Priority checklist of unresolved placeholder numbers, scoped to what this account is permitted to edit.
function actGetPrioritySettings_(p) {
  requirePermission_(p.account_id, 'edit_placeholder_priority_numbers');
  const rows = getRows_(SHEETS.SETTINGS).filter(function (r) { return String(r.is_placeholder).toUpperCase() === 'TRUE'; });
  return ok_({ rows: rows });
}

// ===================================================================
// ADMIN LIST/READ ACTIONS (permission-gated, list-based CMS views)
// ===================================================================

function adminList_(sheetName, permission, p) {
  if (permission) requirePermission_(p.account_id, permission);
  return ok_({ rows: getRows_(sheetName) });
}

// ===================================================================
// DISPATCH
// ===================================================================

const GET_ACTIONS = {
  content: actGetContent_,
  notifications: actGetNotifications_,
  booking_status: actBookingStatus_,
  chat_messages: actGetChatMessages_,
  questions: actGetQuestions_,
  pricing: actGetPricing_,
  worker_dashboard: actWorkerDashboard_,
  worker_open_jobs: actGetOpenJobs_,
  admin_leads: function (p) { return adminList_(SHEETS.BOOKINGS, null, p); },
  admin_crew: function (p) { return adminList_(SHEETS.ACCOUNTS, 'approve_crew_application', p); },
  admin_chats: actGetChatsList_,
  admin_workers: function (p) { return adminList_(SHEETS.ACCOUNTS, null, p); },
  admin_worker_points: function (p) { return adminList_(SHEETS.POINTS_LEDGER, 'adjust_points_manual', p); },
  admin_jobs: function (p) { return adminList_(SHEETS.JOBS, null, p); },
  admin_content_all: function (p) { return adminList_(SHEETS.CONTENT, 'edit_live_content', p); },
  admin_drafts: function (p) {
    requirePermission_(p.account_id, 'edit_live_content');
    const all = [];
    Object.keys(DRAFTABLE_TABS).forEach(function (t) {
      getRows_(DRAFTABLE_TABS[t].sheet).filter(function (r) { return String(r.has_pending_draft).toUpperCase() === 'TRUE'; }).forEach(function (r) { all.push(Object.assign({ table: t }, r)); });
    });
    return ok_({ rows: all });
  },
  admin_questions: function (p) { return adminList_(SHEETS.QUESTIONS, 'edit_questions', p); },
  admin_testimonials: function (p) { return adminList_(SHEETS.TESTIMONIALS, 'edit_testimonials', p); },
  admin_rewards: function (p) { return adminList_(SHEETS.REWARDS, null, p); },
  admin_redemptions: function (p) { return adminList_(SHEETS.REDEMPTIONS, 'fulfill_redemptions', p); },
  admin_vendors: actGetVendors_,
  admin_points_ledger: function (p) { return adminList_(SHEETS.POINTS_LEDGER, 'adjust_points_manual', p); },
  admin_roles: function (p) { return adminList_(SHEETS.ROLES, 'assign_staff_roles', p); },
  admin_permission_flags: function (p) { return adminList_(SHEETS.PERMISSION_FLAGS, 'assign_staff_roles', p); },
  admin_tasks: actGetTasks_,
  admin_settings: function (p) { return adminList_(SHEETS.SETTINGS, 'edit_settings_thresholds', p); },
  priority_settings: actGetPrioritySettings_,
  admin_incidents: function (p) { return adminList_(SHEETS.INCIDENTS, 'view_emergency_incidents', p); },
  admin_reviews: function (p) { return adminList_(SHEETS.REVIEWS, null, p); },
};

const POST_ACTIONS = {
  adminLogin: actAdminLogin_,
  workerIdentify: actIdentify_,
  workerVerifyCode: actVerifyCode_,
  workerLoginPassword: actLoginPassword_,
  workerSetPassword: actSetPassword_,
  requestPasswordReset: actRequestPasswordReset_,
  submitBooking: actSubmitBooking_,
  submitCrewApplication: actSubmitCrewApplication_,
  hireWorker: actHireWorker_,
  updateStatus: actUpdateStatus_,
  deleteLead: actDeleteLead_,
  confirmClientConfirms: actConfirmClientConfirms_,
  confirmCrewConfirms: actConfirmCrewConfirms_,
  confirmAdminApproves: actConfirmAdminApproves_,
  cancelBooking: actCancelBooking_,
  triggerWeatherHold: actTriggerWeatherHold_,
  createJob: actCreateJob_,
  claimJob: actClaimJob_,
  markJobDone: actMarkJobDone_,
  crewButtonTap: actCrewButtonTap_,
  setPayoutPreference: actSetPayoutPreference_,
  completeJob: actCompleteJob_,
  notifyClientJobDone: actNotifyClientJobDone_,
  logTimestamp: actLogTimestamp_,
  confirmDayOfCode: actConfirmDayOfCode_,
  openEmergencyInfo: actOpenEmergencyInfo_,
  submitVendorReferral: actSubmitVendorReferral_,
  submitVendorApplication: actSubmitVendorApplication_,
  approveVendor: actApproveVendor_,
  decideVendorTier: actDecideVendorTier_,
  startChat: actStartChat_,
  sendMessage: actSendMessage_,
  closeChat: actCloseChat_,
  createGroupChat: actCreateGroupChat_,
  submitReview: actSubmitReview_,
  addFriendRequest: actAddFriendRequest_,
  respondFriendRequest: actRespondFriendRequest_,
  takeoverTask: actTakeoverTask_,
  resolveTask: actResolveTask_,
  saveDraft: actSaveDraft_,
  publishDraft: actPublishDraft_,
  publishAll: actPublishAll_,
  createQuestion: actCreateQuestion_,
  createTestimonial: actCreateTestimonial_,
  createReward: actCreateReward_,
  updateReward: actUpdateReward_,
  requestRedemption: actRequestRedemption_,
  fulfillRedemption: actFulfillRedemption_,
  sendNotification: actSendNotification_,
  sendBroadcastEmail: actSendBroadcastEmail_,
  adjustPointsManual: actAdjustPointsManual_,
  createCustomRole: actCreateCustomRole_,
  toggleRolePermission: actToggleRolePermission_,
  assignStaffRole: actAssignStaffRole_,
};

function doGet(e) {
  try {
    const action = e.parameter.action;
    const handler = GET_ACTIONS[action];
    if (!handler) return jsonOut_(fail_('unknown action'));
    return jsonOut_(handler(e.parameter));
  } catch (err) {
    return jsonOut_(fail_(err.message));
  }
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const handler = POST_ACTIONS[body.action];
    if (!handler) return jsonOut_(fail_('unknown action'));
    return jsonOut_(handler(body));
  } catch (err) {
    return jsonOut_(fail_(err.message));
  }
}

// Attach a time-driven trigger (Apps Script > Triggers) to run this hourly for escalation.
function hourlyEscalationTrigger() {
  recomputeTaskEscalation_();
}
