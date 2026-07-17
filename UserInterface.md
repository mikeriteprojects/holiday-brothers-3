# Holiday Brothers — User Interface / Design System

Reconciled from two sources: `MASTER_PROMPT_User_interface.md` (the generic Anti-Template Design System) and the [Super-Master Prompt](../holiday-brothers-super-master-prompt%20(1).md) (the same system specialized for this business). The Super-Master Prompt is authoritative wherever it specializes a generic principle — this document keeps the specific version and notes the generic rule it replaces.

**Companion to [UserJourney.md](./UserJourney.md), not a duplicate of it.** UserJourney.md owns *what happens and in what order* (booking steps, routes, account flows). This document owns *what it looks and moves like* — visual language, tokens, motion, structural pattern. Where a UI decision depends on a specific flow step, this doc points at the relevant UserJourney.md section rather than restating the step logic.

---

## 1. Design principles

- **Confidence, not decoration.** Oversized display type carries the page. The hero's 3D sukkah build is scripted and directional, paced by scroll — not a free-spinning object the visitor can idly orbit away from a sequence meant to be seen in order (see [UserJourney.md §2.1](./UserJourney.md#21-homepage-)).
- **One accent, held with discipline.** Warm, harvest-toned base palette (Sukkot is a fall harvest holiday — earn that honestly) plus exactly one accent. No gradients, no multi-color palette. Avoid the reflexive terracotta-on-cream combination that's become the generic AI default — if terracotta is genuinely right here, earn it with a distinct value and pairing, don't default to it.
- **Specific copy.** "Canvas up in a day, Construction built to last the season" beats "flexible options for every need." Ban filler: seamless, unlock, elevate, empower, cutting-edge, leverage. Copy reads like it was written by someone who has actually built a sukkah. Never implies checkout, cart, or online payment — "lock in your booking," not "complete your purchase" (no payment processor exists — see UserJourney.md §2.2, §7).
- **Numbered narrative structure = the real booking sequence.** Generic version of this principle: reuse numbered-narrative structure for whatever the business's real sequential process is. Specialized here: the numbering isn't decorative reuse — it *is* the booking sequence from UserJourney.md §2.2, so the design must reflect real constraints (fixed order, the one legitimate skip-branch) rather than a marketing-friendly reordering.
- **Motion with a job.** Every animation clarifies the build sequence, the price responding to a choice, or which step is active. Cut anything that's just atmosphere.
- **Depth over flatness, restraint over noise.** One motif (the assembling sukkah), one motion language (scroll-paced construction beats), one accent — maximalist commitment to few ideas, not a sampling of many trends.
- **Accessibility is part of the design, not a patch.** See §5.

---

## 2. Token-first visual system

Design as a small set of tokens, not per-component magic numbers, so the whole system can be re-skinned by changing a handful of values. No specific values are chosen yet — this section documents what needs deciding and the constraints on each decision, not final hex codes or font names.

| Token category | Constraint |
|---|---|
| Canvas / raised-surface colors | Draw from actual materials — canvas fabric, raw and finished wood — not abstract UI grays. |
| Ink / muted-ink | Legible against both surfaces. |
| Border color | One, system-wide. |
| Accent color | Exactly one, plus an ink-on-accent pairing for text sitting on top of it. Used sparingly enough to still read as a decision, not a default. |
| Spacing scale | One scale, reused everywhere. |
| Type families | Two (display + body), chosen for a build/craft register — not a generic SaaS pairing. |
| Light/dark | Both from day one; dark falls out of token swaps, not separate components. |
| Display type sizing | Fluid, `clamp()`-based, so headlines scale smoothly across viewport widths instead of jumping between fixed breakpoints. |
| Construction-method tokens | Extend the token set with a visual signature per method (Canvas / Modular / Construction) — a material swatch or icon derived from the 3D model, not a generic checkbox. Reused everywhere the type is referenced: booking step (UserJourney.md §2.2 step 3), marketing copy, admin job listings (UserJourney.md §7). |

---

## 3. Motion language

- **The signature motif**: a 3D sukkah under scroll-scrubbed construction — frame, then walls (one construction method chosen as the signature and used consistently — not all three cycling), then roof covering. This single asset is reused across hero, booking configurator, and closing CTA (UserJourney.md §2.1, §2.2) rather than three separately authored models — both a design and a performance decision.
- Where the site needs a live configurator feel, the same 3D asset is reused, driven by real state (the booking step + live price, per UserJourney.md §2.2) instead of scroll position.
- Page-to-page transitions are distinct and on-brand — a subtle build/settle motion matching the hero motif, never a default crossfade or instant swap.
- Every animation must clarify structure, sequence, price response, or which step is active — decoration with no job gets cut or toned down.

---

## 4. Structural pattern

### 4.1 Homepage

- Hero: the scroll-scrubbed build sequence (§3), short eyebrow/status line above the headline (current season status, sourced live — see UserJourney.md §2.1).
- Numbered narrative: the real booking sequence, each numbered step paired with a short beat of the 3D model reacting. Links into `/booking` rather than restating it decoratively (UserJourney.md §2.1–2.2).
- FAQ: answers real questions this business fields, sourced from CMS content rather than static/invented copy (UserJourney.md §2.1, §7).
- Closing CTA: its own smaller visual moment — a smaller, at-rest, fully-assembled version of the sukkah model — not a plain form.

### 4.2 Sub-pages

Every route in UserJourney.md's site map (§8) gets the same density and motion investment as the homepage — a strong homepage with a thin `/admin` or `/join-crew` is an unfinished design. Sub-pages are real, full-density pages, not modals or same-page anchors.

- `/booking` — the numbered narrative made interactive: live 3D + live price update together on every step change (UserJourney.md §2.2).
- `/about/[slug]` — same type system and motion language, statically generated, full density.
- `/join-crew`, `/join-vendor` — distinct content, same visual world, equal design density to the homepage (UserJourney.md §4, §5).
- `/worker-login` — restrained, but on-brand, never a bare unstyled form.
- `/worker-portal` — dashboard register: calmer motion than the marketing site, more dashboard/less spectacle, but built from the same token system (UserJourney.md §6). The gamified points/rewards layer is a legitimate place for a small, disciplined visual treatment distinct in tone from the marketing site.
- `/admin` — same tokens, denser data-first layout. Content editor, RBAC interface, and job listings get real UI, not stub tables (UserJourney.md §7).

---

## 5. Accessibility & performance constraints

- `prefers-reduced-motion`: swap the scroll-scrubbed build for a small set of static, labeled frames (start / mid-build / complete) everywhere the motif appears — never just disable motion and leave a blank hero.
- Provide a lightweight fallback (poster image or simplified SVG cross-section) for low-end devices or where WebGL isn't available, so the hero's *information* survives even if the *spectacle* doesn't.
- Any pointer-driven 3D interaction (drag-to-rotate, hover-reveal) activates only on fine-pointer, hover-capable input; touch gets tap-to-advance controls instead, never a broken drag gesture.
- Keep the 3D asset reused across hero, booking configurator, and CTA rather than authoring three separate models — a performance decision as much as a design one.

---

## 6. Process

1. Study any inspiration references given, naming specifically what's borrowed (a structural move, a motion idea, a copy voice) versus what's generic and discarded. Don't imitate a reference's specific business content, only its underlying moves.
2. Lock the real decisions before writing code: the one accent, the type pairing, which construction method is the signature build sequence (§3), the token set (§2). No placeholders — they have a way of shipping.
3. Bring every route in UserJourney.md §8's site map up to the same density (§4.2).
4. Review against §1 like a checklist before calling it done: one accent held with discipline, motion that has a job, copy free of filler, structure argued from the business.
