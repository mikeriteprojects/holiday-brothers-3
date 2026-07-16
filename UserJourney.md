# Holiday Brothers — User Journey

Reconciled from two sources: the [Super-Master Prompt](../holiday-brothers-super-master-prompt%20(1).md) (visual/design direction) and `MASTER_PROMPT_USER_JOURNEY.md` (functional/backend spec). The two agree everywhere they overlap — this document merges the design framing with the functional detail, and resolves the open product questions the sources left unanswered (marked ✅ *resolved* below, with the decision noted).

Covers every persona: **customer**, **crew applicant**, **worker**, **vendor**, and **admin**.

---

## 1. System overview

Holiday Brothers is a sukkah build-and-delivery service. Four kinds of participants share one unified `Account` entity (differentiated by a roles field, not separate tables): **customers**, **crew**, **vendors**, and **admin/staff**.

There is no traditional backend — all data lives in Google Sheets, read/written through a single Google Apps Script Web App called via one dispatch endpoint. There is **no payment processor**; a booking's `Paid` status is set manually by staff (see §7 for future-scope note).

---

## 2. Customer journey — homepage → booking → confirmation

### 2.1 Homepage (`/`)

| Step | What the visitor sees | Notes |
|---|---|---|
| Landing | Hero: a 3D sukkah under **scroll-scrubbed construction** — frame goes up, walls go on (canvas unfurls / panels lock / beams get nailed — one method only, used consistently), roof (s'chach) settles into place. An eyebrow/status line above the headline shows current season status, sourced from the Settings sheet. | Directional and scripted — not a free-orbit showpiece. Scroll paces it frame by frame. |
| Numbered narrative | The same numbering as the real booking sequence (§2.2), each step paired with a short beat of the 3D model reacting — e.g. the Type step visibly swaps the wall material on the model. | This section *is* the booking flow, explained — not a decorative summary. Links into `/booking` rather than restating it. |
| FAQ | Real questions the business fields: service area, what happens if it rains (Weather Hold status — a real booking status, see §2.3), what "guest" checkout means. Sourced from the `Questions` sheet via the CMS. | No invented/static copy — staff can edit this. |
| Closing CTA | A smaller, at-rest, fully-assembled version of the sukkah model — not a plain form. | Same 3D asset as the hero, not a new one. |

### 2.2 Booking flow (`/booking`) — the numbered narrative made interactive

Step order is **hardcoded on the backend** because it's load-bearing for pricing math that must mirror the backend's calculation exactly. Design must never reorder it or imply steps are skippable beyond the one documented branch:

1. **Supplies check** — "Do you already have supplies?" (Yes/No). Answering "Yes" removes the Delivery step entirely, since delivery/self-delivery/pickup discounts only make sense when Holiday Brothers is sourcing supplies. The 3D build sequence and step count both honestly reflect this shorter path — it's a real branch, not a hidden one.
2. **Size** — Small / Medium / Large.
3. **Type** — Canvas (fabric-over-frame, fastest/cheapest) / Modular (interlocking wood panels) / Construction (full nail-and-wood, most durable). Each type has a consistent visual signature (material swatch / icon derived from the 3D model) reused in booking, marketing copy, and the admin job list.
4. **Speed tier** — Patient (flexible, cheapest) / Regular (standard) / Express (rushed, premium).
5. **Delivery** *(skipped entirely if the customer has their own supplies)* — two independent, stackable toggles, each pulling its discount live from the Pricing sheet (not hardcoded):
   - Self-deliver and save a discount.
   - Pick up the crew and save a separate discount.
6. **Address** — free-text street/city/state/zip with debounced (500ms) autocomplete against the public Nominatim/OpenStreetMap geocoding API, scoped to US results. **Service-area validation** is advisory, not a hard gate: the geocoder's returned county is authoritative when present (must equal "Rockland County" exactly), otherwise falls back to a hardcoded whitelist of ~35 Rockland County, NY zip codes. Outside the service area shows a heads-up warning, never blocks submission.
7. **Account** — "Let's lock it in." Two mutually exclusive paths, both genuinely different real end states (not one glossed as the other):
   - **Full account**: first/last name, username, password, email, phone.
   - **Guest**: email and/or phone only, explicitly framed as "no account needed."
   - Submission requires address, plus at least one of phone or email (either path).

Throughout the flow: a **live price estimate** (base price + size/speed/type modifiers, computed client-side mirroring the backend Pricing-sheet formula) and the **3D model** update together whenever a step changes — the signature motif doing real functional work, not decoration.

**No payment step exists anywhere** — no card entry, no cart. "Paid" is a status staff set manually, later, outside this flow.

### 2.3 Submission & confirmation

On submit, the backend looks up an existing account by ID or phone/email, creates one if none exists, and creates a new booking row with a generated booking code, initial status `Submitted Booking`, and the computed price breakdown.

- **Guest path** → printable receipt: booking code, size/type/speed, address, itemized price lines (including discounts), total, and a "temporary guest login code" (literally the booking code, usable for later lookup/login). Includes a print action.
- **Full-account path** → confirmation panel with the customer's name, confirmation code, and estimated total.

**Booking status lifecycle** (staff/crew-driven, never automatic on the customer's side): `Submitted Booking → Price Pending → Quote Sent → Job Confirmed → Scheduled → In Progress → Paid → Pending Completion → Completed`, with side states `Cancelled` and `Weather Hold`. Cancellation computes a fee from hours-until-job tiers in the Settings sheet — no charge is actually processed, only recorded.

### 2.4 Track my booking ✅ *resolved: build it*

A customer-facing lookup page (booking code + phone) so guests can check status without logging in. The backend already supports this lookup — this journey formalizes it as a real customer-facing route, not just a backend capability.

### 2.5 Accessibility branch (applies to every step above)

- `prefers-reduced-motion` → swap the scroll-scrubbed build for a small set of static, labeled frames (start / mid-build / complete). Never just disable motion and leave a blank hero.
- No WebGL / low-end device → poster image or simplified SVG cross-section fallback, so the *information* survives even when the *spectacle* doesn't.
- Touch input → tap-to-advance controls instead of drag-to-rotate. Drag/hover-driven 3D interaction only activates on fine-pointer, hover-capable input.

---

## 3. Accounts & authentication

No third-party auth provider — fully custom, implemented in the Apps Script backend with a thin client-side session wrapper (account ID + session token in `localStorage`, checked server-side per privileged action rather than via request middleware).

### 3.1 Login (`/worker-login`) — unified for customers, crew, and vendors

1. Enter an identifier (username, email, phone, or account ID).
2. Backend determines password vs. one-time email-code auth for that account.
3. **Password path**: enter password → account ID + session token + roles. **Email-code path**: enter 6-digit code → account ID + session token.
4. Redirect to `/worker-portal`.

### 3.2 Password reset ✅ *resolved: add a standalone flow*

A dedicated "forgot password" entry point from `/worker-login`, reusing the backend's existing password-set action — not just the inline password creation that happens during the booking flow's full-account path.

### 3.3 Standalone customer signup ✅ *resolved: not added*

No independent `/signup` route. A customer only gets an account via (a) the booking flow's full-account path, or (b) as a byproduct of a crew application. This stays as-is.

### 3.4 Admin login (`/admin`)

Separate, dedicated login (username + password only, no email-code fallback), returning account ID + session token + a full permission map (not just role names) — admin auth resolves directly to fine-grained permission flags.

---

## 4. Crew applicant journey (`/join-crew`)

A distinct onboarding form from the customer booking flow — different content, same visual world/type system/motion language, equal design density.

Collects: name, email, phone, birthday, desired crew role (Builder Only / Builder + Driver / Driver Only), driving subtype (if applicable), school/yeshiva, prior work experience, address, transport guarantee, emergency contact, guardian contact, medical experience/certification, waiver acceptance.

Backend computes age from birthday and automatically flags the application as requiring parental consent if under 18. Creates a pending account, later approved via a distinct staff-only "hire worker" action.

---

## 5. Vendor journey ✅ *resolved: scoped now*

Vendors already exist as an account role with their own backend sheet, but previously had no defined onboarding/portal experience. Scoped analogous to `/join-crew`:

- **`/join-vendor`** (new route) — a vendor-specific application form (business name, contact info, service/product category, relevant licensing or references), same visual world and density as `/join-crew`, submitted as a pending vendor account.
- **Approval** — a staff-only "approve vendor" admin action, parallel to "hire worker."
- **Portal** — vendors log in through the same unified `/worker-login` and land on `/worker-portal`, seeing the vendor-specific module described in §6.

---

## 6. Worker/customer/vendor portal (`/worker-portal`)

The single post-login destination for anyone who isn't staff.

**Modules shown per role** ✅ *resolved: tailored, not unified*:

| Role | Sees |
|---|---|
| Customer | Current and past bookings, guest/account receipt history |
| Crew | Current and past jobs, points/rewards |
| Vendor | Vendor-specific job/order history (per §5) |
| All roles | Account/profile info; points/rewards balances across multiple gamified tracks (priority, incentive, referral, vendor, shop points); available rewards and redemption history |

Calmer motion overall than the public marketing site; same token system, more dashboard, less spectacle.

---

## 7. Admin journey (`/admin`)

Same design tokens as the public site, denser data-first layout. Real, full-featured tools, not stubs:

- **Bookings/leads** — view, update status, delete.
- **Crew & workers** — view applications, approve/hire, manage roles.
- **Jobs** — view, assign, track scheduling and crew-confirmation state; reference the same construction-method visual tokens (Canvas/Modular/Construction) used in booking and marketing.
- **Vendors** — view/approve vendor applications (§5).
- **Content management** — CMS with draft/publish workflow for content, pricing, FAQ/questions, testimonials — how non-technical staff update site copy and prices without a code deploy. Same visual care as the public site since staff live in it daily.
- **Rewards & points** — reward catalog, redemptions, points ledger.
- **Roles & permissions (RBAC)** — role list, permission toggles, preset indicators — custom roles (not a fixed enum), each a record with a name, "is preset" flag, optional base preset, and a JSON permissions blob. Enforcement happens server-side at the point of each privileged action.
- **Settings** — operational settings including cancellation-fee tiers.
- **Incidents & reviews** — tracking on-site issues and customer feedback.

**Payment** ✅ *resolved: stays manual, noted as future scope*: no payment processor is integrated today, and "Paid" remains a manually-set staff status for the foreseeable future. Real payment collection (deposit/balance) is explicitly flagged as a possible future addition, not part of the current journey — don't design a card-entry step, cart, or "purchase" language anywhere, including `/worker-portal` or `/admin`.

---

## 8. Site map

| Route | Purpose |
|---|---|
| `/` | Marketing home — hero build sequence, numbered narrative, FAQ, closing CTA (§2.1) |
| `/booking` | Customer booking flow — live 3D + live price (§2.2–2.4) |
| `/about/[slug]` | Marketing content pages, statically generated, same type system and motion language, full design density |
| `/join-crew` | Crew application (§4) |
| `/join-vendor` | Vendor application (§5) — new |
| `/worker-login` | Unified login for customer/crew/vendor/staff (§3.1–3.2) |
| `/worker-portal` | Post-login dashboard, tailored per role (§6) |
| `/admin` | Staff/admin dashboard, separately gated (§3.4, §7) |

---

## 9. Cross-cutting rules for every journey above

- Booking step order is fixed for pricing-math reasons — never reorder or imply steps are skippable except the one documented branch (Delivery, when supplies are already owned).
- Never design or imply payment/cart/checkout anywhere, including `/worker-portal` and `/admin` — "Paid" is a manual staff status only (§7).
- Page-to-page transitions use a subtle build/settle motion consistent with the hero motif — never a default crossfade.
- Every sub-page (`/about/[slug]`, `/join-crew`, `/join-vendor`, `/worker-portal`, `/admin`) gets the same design density and motion investment as the homepage.
