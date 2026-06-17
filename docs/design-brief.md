# AlgoLens — Design Brief (content & behavior spec, visuals open)

> **How to use this.** This brief defines **what each page contains, how it behaves, and what
> states it has** — the product, not the look. It deliberately does **not** prescribe a visual
> design: no color palette, no typography, no spacing scale, no specific layouts. **You (the design
> tool) own every aesthetic decision** — color system, type, density, shape, illustration, the whole
> visual language — based on your own judgment of what serves this product best. The only "visual"
> items below are *functional* constraints (e.g. "these algorithm states must be instantly and
> consistently distinguishable") and accessibility requirements; realize them however you see fit.
>
> Design for **desktop and a 390px mobile** width, in both a **light and a dark theme** (a theme
> toggle exists and persists). Every data-backed view needs a designed **loading**, **empty**, and
> **error** state — never an endless spinner.

---

## 1. What AlgoLens is

A production-grade web platform where developers **learn data structures & algorithms** by (1)
**watching** them run step by step, (2) **reading** lessons built around those visualizations, (3)
**measuring** how their own code scales, and (4) **practicing** in a real judge — with spaced
repetition so it sticks. It visualizes the *user's own code*, so it should read as a serious
developer tool, not a children's education site. Audience: CS students and self-taught developers.

**The four pillars** (the primary navigation):

- **Visualize** — an interactive step-player for algorithms (arrays, trees, graphs).
- **Learn** — an MDX lesson curriculum with embedded visualizations and quizzes.
- **Analyze** — a "Complexity Lab" that estimates a function's Big-O two independent ways.
- **Practice** — LeetCode-style problems with a sandboxed judge, in multiple languages.

**The core loop to make obvious in the design:** *watch it → understand why → prove the cost →
practice it → get reminded before you forget.* The same visualization engine appears in all four
pillars, so a learner never loses context moving between them.

---

## 2. Global shell (every page)

### 2.1 Top navigation
- **Brand / home** link.
- **Pillar links:** Learn, Visualize, Analyze, Practice — with an active-state indication for the
  current section.
- **Review** entry with a **due-count indicator** (a small badge showing how many review cards are
  due; hidden when zero).
- **Theme toggle** (light/dark).
- **Auth-dependent cluster (right):**
  - **Signed out →** two distinct controls: **"Sign in"** (→ `/login`) and a more prominent
    **"Get started"** (→ `/register`). These are separate destinations — not one button.
  - **Signed in →** a **"Dashboard"** link, the user's **avatar** (their uploaded OAuth picture if
    present, otherwise an initial; links to their profile), and a **Sign out** control.
  - A brief **loading placeholder** while the session resolves (the nav hydrates client-side).
- Must collapse gracefully on mobile (e.g., the pillar labels can reduce to icons; provide whatever
  compact pattern you think is best).

### 2.2 Footer
Quiet, secondary. Product links (the four pillars, Review), informational links, and a small brand
mark. No pricing.

### 2.3 Cross-cutting requirements
- **Theming:** full light + dark support; the chosen theme persists across visits and applies before
  first paint (no flash).
- **States:** design **loading**, **empty**, and **error** variants for every list/detail/data view.
  Errors are friendly and actionable, never a raw stack trace or a spinner that never ends.
- **Responsiveness:** desktop + 390px mobile at minimum.

---

## 3. Authentication (new) — pages, fields, flows

AlgoLens supports **two ways to authenticate, side by side**: **email + password** and **OAuth
(GitHub, Google)**. Both appear on the same pages. An account is what lets progress, submissions,
and the review schedule sync across devices; everything is otherwise saved on-device.

### 3.1 `/register` — Create your account  *(public; if already signed in, redirect to dashboard)*
- Short value statement + a few benefit bullets (sync progress/XP/streaks; scheduled spaced
  repetition; saved submissions).
- **Email/password form:** **Name**, **Email**, **Password** (min 8 chars) fields + a
  **"Create account"** submit button.
- A divider ("or sign up with").
- **OAuth buttons:** "Continue with GitHub" and "Continue with Google" (only the providers that are
  configured appear).
- A line clarifying GitHub/Google create the account automatically on first use.
- A cross-link: "Already have an account? → Sign in."
- **States:** field validation errors shown inline; a submitting/pending state on the button; a
  top-level error message (e.g., "An account with this email already exists").

### 3.2 `/login` — Welcome back  *(public; if already signed in, redirect to dashboard)*
- **Email/password form:** **Email**, **Password** + **"Sign in"** button.
- Divider ("or continue with") + the same **OAuth buttons**.
- Cross-link: "New to AlgoLens? → Create an account."
- **States:** inline validation; pending state; a generic **"Invalid email or password"** error
  (does not reveal which field was wrong).

### 3.3 Behavior
- On success, the user lands on the **Dashboard**.
- **Gated routes** (require sign-in): **`/dashboard`** (and any future account-only area). A
  signed-out visitor to a gated route is sent to `/login`.
- A "not configured" fallback for the OAuth section when no providers are set up (dev convenience).

---

## 4. Pages

For each: purpose, auth, the content/sections it must contain, key interactions, and states.

### 4.1 Landing `/`  *(public)*
The marketing/overview page. It should be **substantial and informative** — communicate clearly
what the project is and why it's different. Sections to include:
1. **Hero** — a strong headline + subcopy explaining the product, two CTAs (**primary "Get started
   — free"** → `/register`; **secondary "Explore — no signup"** → `/visualize`), and a note that the
   tools work instantly without an account. Feature a **live, scrubbable algorithm visualization**
   here (a real player, not a static image) that the visitor can immediately interact with.
2. **At-a-glance stats** — e.g., number of algorithms, lessons, problems, languages.
3. **The four pillars** — one explanatory block each (Visualize, Learn, Analyze, Practice) with a
   short description, 2–3 concrete capability bullets, and a link into that pillar.
4. **How it works** — the core loop as a short sequence of steps (watch → learn → prove → practice
   → retain).
5. **Principles / what makes it trustworthy** — a few short blocks: exact step-replay ("trace, don't
   animate"), honest complexity (two methods, shown with confidence), sandboxed judging (hidden
   tests never leak), spaced repetition.
6. **Credibility** — the lessons are researched and cited to standard references (CLRS; Sedgewick &
   Wayne; the Competitive Programmer's Handbook; cp-algorithms; Cracking the Coding Interview).
7. **Final call-to-action** — create a free account / start a lesson.

### 4.2 Dashboard `/dashboard`  *(signed-in only)*
A developer-tool home. Two parts:
- **Profile header (from the account):** avatar, name, email, a **role badge** when the user is an
  author/admin, and a **Sign out** control.
- **Progress (device-local today):**
  - Greeting + **streak** indicator + **XP / level** indicator.
  - **"Continue learning"** card: current track, lessons-complete count + percent, a progress bar,
    and a deep link to the next lesson.
  - **"Due reviews"** card: count + estimated minutes, link into `/review`.
  - **Activity heatmap** (calendar-style, like a contribution graph).
  - **"Jump back in"** quick links (last-used playground / lab / problems / profile).
- A small honest note that progress is on-device until cross-device sync ships.
- Everything important reachable without deep scrolling on a small laptop.

### 4.3 Profile `/profile`  *(public, résumé-friendly)*
A shareable summary: identity (avatar/name), solved-activity heatmap, badges earned, track
completion, and any shared visualization snapshots. Design an empty/new-user state.

### 4.4 Learn — catalog `/learn`  *(public)*
Lists the **tracks** (currently "DSA Foundations"). For each track: title, description, level, and
overall progress. Entering a track shows its lessons.

### 4.5 Learn — track overview `/learn/[track]`  *(public)*
The track's **modules and lessons in order**, grouped by module (e.g., Complexity → Searching →
Sorting → Graph Traversal). Each lesson row shows: title, a one-line summary, estimated minutes,
difficulty, **completion state**, and **prerequisite locks** (a lesson with unmet prerequisites is
visibly locked with an explanation). Show overall track progress.

### 4.6 Lesson reader `/learn/[track]/[lesson]`  *(public)*
The reading experience — should feel like a **beautifully typeset interactive textbook**, not a SaaS
page. Contains:
- A readable prose column with a **sticky reading-progress indicator** and a **collapsible track
  outline** (showing completion ticks; collapses to a compact form).
- **Embedded interactive blocks** that break out of the prose width:
  - **Mini visualizer** — the real player with a compact transport, opened at a meaningful frame,
    with an "open in full playground" link.
  - **Quiz blocks** — multiple choice; on a **wrong answer**, reveal an explanation **plus a "replay
    at this step" link** that jumps the visualization to the exact step that explains the mistake
    (this replay-to-explain moment is a signature interaction — make it feel integral).
  - **Callouts** — Insight / Warning / Try-it variants.
- A **lesson structure** authors follow (reflect it in the layout): hook → intuition with a viz →
  formal explanation → a **complexity table** → two quizzes → summary → a **"Sources & further
  reading"** citations block → links to the next lesson and a linked practice problem.
- **Completion:** when the lesson is read and quizzes passed, show a **completion card** (+XP, next
  lesson CTA, "practice this" link).

### 4.7 Visualize — catalog `/visualize`  *(public)*
A browsable grid of all algorithms (currently 12: linear/binary search; bubble/selection/insertion/
merge/quick/heap sort; BST insert & search; BFS; DFS), grouped by category (searching, sorting,
trees, graphs). Each card: name, category, a complexity summary, and a tiny preview. Links to the
playground.

### 4.8 Visualize — playground `/visualize/[slug]`  *(public)*
The core visualization surface. Regions (arrange however reads best):
- **The canvas** — renders the data structure (array bars, tree, or graph) and is the focal point of
  the page (it should feel like the canvas *is* the page, not a small widget).
- **Input controls** — size, an ordering/preset picker, a custom-values field, randomize.
- **Side panels (e.g., tabs):** **Pseudocode** (line-numbered, with the current line highlighted in
  sync with the animation), **Variables** (key→value chips that flash on change; plus a call stack
  for recursive algorithms), and **About** (complexity + description).
- **Transport bar** (full-width): play/pause, step back/forward, a **scrub slider with step ticks**,
  a speed control, and **share** (deep-link to the current algorithm + input + frame).
- **Keyboard:** space = play/pause, ←/→ = step, ↑/↓ = speed.
- **Reduced-motion variant:** show discrete snapshots + a textual step caption — design this
  explicitly (see §6).

### 4.9 Analyze — Complexity Lab `/analyze`  *(public)*
Split experience:
- **Input side:** a code editor prefilled with a sample function, an **input-generator picker**
  (preset chips: random array, sorted, reversed, string, integer n), and a prominent **"Analyze"**
  action (with a cancel/stop state while running).
- **Results side (a stack):**
  1. **Verdict** — the estimated class (e.g., `O(n²)`) with a **confidence** indication and a note
     that static analysis + empirical measurement agree.
  2. **Annotated source** — per-line complexity notes; the dominant loop emphasized.
  3. **Growth chart** — measured points with the best-fit curve(s), fit-quality labels, and a
     log-log toggle.
  4. A collapsed **"AI walkthrough"** placeholder (future).
- **Divergence state (important):** when the two methods disagree, show **both verdicts side by side
  with an explanatory banner** — make disagreement look *intentional and honest*, not broken.
- A note that the user's code runs in a sandboxed worker and static analysis never executes it.

### 4.10 Practice — problem list `/practice`  *(public)*
A filterable/browsable list of problems (currently 32) with: title, difficulty, topic/tags, and
**solved state**. Design filters (by difficulty/topic) and the empty/no-results state.

### 4.11 Practice — problem workspace `/practice/[slug]`  *(public)*
LeetCode-style "implement the function." Resizable split:
- **Left — problem panel** with tabs: **Description**, **Editorial** (locked until solved — show the
  locked state), **Submissions** (history).
- **Right — code editor** with a **language selector** (JavaScript, TypeScript, Python, C++, Java;
  the function signature/starter stub regenerates per language), plus **"Run samples"** (secondary)
  and **"Submit"** (primary).
- **Results drawer (slides up):** sample runs show input/expected/actual; submissions show a **live
  per-case status row** (queued → running → pass/fail) streaming in, then a **verdict card**
  (Accepted / Wrong Answer / Time-Limit / Memory-Limit / Runtime / Compile error, with per-case
  results — hidden test details are never shown).
- **Accepted state:** a brief celebratory moment, the editorial unlocks, and a **"Check its
  complexity →"** link that carries the code into the Complexity Lab.
- Note: languages without a server judge yet show an honest "coming soon / needs the judge host"
  message rather than failing silently.

### 4.12 Review `/review`  *(public; tied to the user's schedule)*
A calm, focused spaced-repetition flow: a **single centered card**, minimal chrome. Front → reveal
(tap/space) → **four grade buttons** (Again / Hard / Good / Easy) each showing the **next-interval
preview** (e.g., "Good · 3d"). A thin **session-progress** indicator. **End screen:** cards done,
streak status, one CTA back to the dashboard. Design a teaching **empty state** (no cards due).

---

## 5. The visualization system (functional, design-agnostic)

This is the heart of the product and recurs everywhere (playground, lessons, landing, charts).

- **Renders three structure types:** arrays (as bars/cells), trees, and graphs.
- **Element/edge states that MUST be instantly and consistently distinguishable** — and must mean
  the *same thing everywhere* (lessons, playground, charts, verdict badges):
  **comparing**, **swapping/writing**, **sorted/done/success**, **visited**, **frontier/active**,
  **pivot/special**, and **inactive/idle**. Assign each a distinct, consistent visual treatment of
  your choosing. **Never encode a state by color alone** — pair it with an icon, shape, label, or
  pattern (e.g., a sorted element also gets a check mark).
- The current step is reflected in three synchronized places: the **canvas**, the **highlighted
  pseudocode line**, and the **variable inspector**.
- **Backward stepping is exact** — design the transport so stepping back is a first-class action,
  not a "restart and replay."

---

## 6. Motion (motion is pedagogy here — functional rules, timings are yours)

- **Algorithm motion = content.** The animation must *communicate the operation*: a compare reads as
  a comparison, a swap reads as two elements exchanging places, a write/commit reads as a value
  landing. Motion must **scale proportionally with the speed control**. (You choose the exact
  durations, easing, and gestures — make them smooth and legible.)
- **UI chrome motion = quiet.** Interface transitions should never compete with the canvas; keep them
  subtle and brief. One thing animates at a time outside the canvas.
- **`prefers-reduced-motion` is a first-class mode, not a fallback.** When set: replace tweens with
  **discrete state snapshots** and surface a **textual step caption** ("swapped a[3] and a[4]") in an
  `aria-live` region. Design this variant explicitly for the player, charts, and celebrations.
- **Celebration moments** (lesson complete, Accepted verdict): one short, **skippable**,
  reduced-motion-aware flourish.

---

## 7. Component inventory (design once, reuse everywhere)

Functional list — style them to your system, each with default/hover/focus/disabled/loading and
reduced-motion states as applicable:

- **Buttons** (primary / secondary / ghost / outline; sizes incl. icon-only).
- **Auth forms:** labeled text/email/password inputs with inline validation + error display; OAuth
  provider buttons; an "or" divider.
- **Nav** (with the signed-in/out variants from §2.1) and **footer**.
- **Transport bar** (play/pause, step, scrub-with-ticks, speed, share).
- **Pseudocode panel** (line numbers + animated current-line highlight).
- **Variable inspector** (key→value chips that flash on change) + **call-stack** view.
- **Complexity badge** (a Big-O chip with a confidence indicator).
- **Verdict card** (judge result + per-case tick row).
- **Growth chart** (log-log toggle, fitted-curve overlays, residual tooltip).
- **Quiz block** (options, instant feedback, explanation reveal, "replay at step" link).
- **Lesson callouts** (Insight / Warning / Try-it).
- **Complexity table** (cases × cost) used in lessons.
- **Track/lesson progress** indicators; **streak** indicator; **XP/level** indicator; **due-count**
  badge; **activity heatmap**.
- **Code editor frame** (multi-language, run/submit actions).
- **Profile bits:** avatar (image or initial fallback), role badge, badge shelf.
- **Cards / list rows** for catalogs (algorithms, lessons, problems) with locked + solved + complete
  states.
- **Empty / loading / error** state treatments.

---

## 8. Accessibility (hard requirements — not optional)

- **Full keyboard operability**, including the player transport; visible focus on everything; logical
  tab order.
- **Screen-reader step narration** via `aria-live="polite"` ("comparing index 3 and 4"); provide an
  offscreen textual state alternative to the canvas.
- **AA contrast** in both themes; **state is never color-only**; touch hit-targets ≥ 44px.
- The **reduced-motion** variant is designed (per §6), not improvised.
- Form inputs and quiz options are **labeled**; error messages are programmatically associated with
  their fields.

---

## 9. Deliverables

1. A **visual system of your own design** — color (light + dark), typography, spacing, shape,
   iconography, elevation — expressed as reusable tokens.
2. A **component library** (§7) in all relevant states.
3. **High-fidelity desktop + 390px mobile** for the pages in §4 (include light + dark for the
   playground and the lesson reader, and the reduced-motion player variant).
4. A short **motion reference** for the four core algorithm gestures (compare, swap, write/commit,
   pseudocode line advance).

---

## 10. Explicitly your call (don't wait for direction)

Color palette · typography · spacing/density · corner radius & shape language · shadow/elevation ·
illustration & iconography style · the exact layout of each page · how the nav collapses on mobile ·
motion timing/easing · light/dark treatments. **Decide all of it yourself.** The sections above tell
you *what must be present and how it must behave*; the look is yours to invent.
