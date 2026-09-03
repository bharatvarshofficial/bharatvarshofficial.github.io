# BharatVarshOfficial — FINAL WEBSITE COMPLETION PACK

> Purpose: Use this file as the single implementation brief inside VS Code / GitHub Copilot to finish the remaining BharatVarshOfficial website work without rewriting completed phases.
>
> IMPORTANT: Audit existing code first. Preserve working features. Make incremental production-ready updates only. Do not recreate Firebase, Cloudinary, Cloudflare Worker, authentication, or creator-upload foundations that already exist.

---


## 2026-09-03 CREATOR PLATFORM OVERRIDE — HIGHEST PRIORITY

This section overrides any older creator-approval or device-advisor instructions later in this file.

- BharatVarshOfficial is **not only a wallpaper website**. It is a broader creator platform for wallpapers, photography/images, digital art and videos.
- Creator channel creation is **instant self-service** after sign-in. Do **not** require a creator application or repeated admin approval to create/open a channel.
- Admin moderation remains required for each creator media submission before that media becomes public.
- Creator Studio includes an earnings/monetization area inspired by creator platforms: estimated earnings, available balance, lifetime earnings, monetization status, minimum payout and payout requests.
- Financial values are trusted-backend/admin controlled. Creators must never be able to edit their own earnings balances.
- Creator profit share is fixed at **20% of verified net platform profit attributable to that creator's eligible content/activity**. Do not use a fake client-side fixed rupee amount per download.
- The previous **Smart Size Recommendation / Device Wallpaper Advisor** UI and device-specific recommendation logic are removed. The download-size selector remains with fixed presets, original quality and custom size.
- Public creator pages should show all published creator media types, not only wallpapers.

## 0. CURRENT VERIFIED STATE — DO NOT REBUILD

The following work is already completed and must be preserved:

- Public BharatVarshOfficial wallpaper website exists and builds with Vite.
- Categories, search/filter foundations, wallpaper cards, preview/details and download experience exist.
- Smart Size Recommendation / Device Wallpaper Advisor has been removed; manual download size selection remains.
- Policies page and public discovery files exist.
- Google Firebase Authentication exists.
- Old admin password login has been removed.
- Admin access uses exact authorized Firebase UID logic.
- Private user profile/account foundation exists.
- Creator channel onboarding is instant self-service; creator application/approval is no longer required for channel creation.
- Creator Studio foundation exists.
- Creator submissions are private until admin review.
- Admin approval publishes creator media atomically.
- Cloudinary integration exists.
- Cloudflare Worker for secure signed Cloudinary creator uploads is LIVE.
- Worker endpoint:
  `https://bharatvarsh-creator-upload-signature.bharatvarshofficial.workers.dev/api/cloudinary-signature`
- Worker verifies Firebase ID tokens.
- Worker checks active creator status.
- Cloudinary API key and API secret are stored as Cloudflare Worker secrets.
- `creator-upload-config.js` contains the live signing endpoint.
- Creator upload security tests pass.
- Full automated test suite currently passes: **33/33**.
- Production build succeeds with Vite.
- Current remaining build warning: Firebase JS chunk is above 500 kB; this is a warning, not a build failure.

Do not modify generated `dist/assets/*` files manually. Always rebuild with Vite.

---

# 1. PRIMARY FINAL GOAL

Finish BharatVarshOfficial as a stable, mobile-first, production-ready Indian wallpaper + creator platform.

The final product must allow:

1. Visitors to discover, preview and download wallpapers easily.
2. Signed-in users to manage their private account/profile.
3. Approved creators to upload original media securely.
4. Admin to review creator applications and creator media.
5. Approved creator submissions to become public content only after admin approval.
6. Public creator/channel pages to work like a lightweight YouTube-style creator profile.
7. The site to be responsive, secure, SEO-friendly and deployable without manual code edits for normal content management.

---

# 2. FINAL PUBLIC WEBSITE POLISH

Audit and improve `index.html`, main CSS and main JS without breaking existing behavior.

Required:

- Keep a clean premium Bharat/Indian visual identity.
- Make header/navigation mobile responsive.
- Keep logo crisp and correctly sized.
- Add or polish: Home, Categories, Trending / Popular, Latest, Creators, About / Policies, Account menu when signed in.
- Ensure no dead links, fake counters or placeholder buttons.
- Add proper empty-state UI when no wallpapers match a filter.
- Add loading/skeleton state while Firestore content loads.
- Add friendly error state when network/Firebase loading fails.
- Make all major buttons keyboard accessible.
- Add visible focus states.
- Ensure dialogs/modals trap focus correctly where practical.
- Add `aria-label` / accessible names to icon-only buttons.
- Ensure contrast is readable on mobile.
- Prevent layout shift caused by wallpaper images.
- Use lazy loading for offscreen images.
- Add width/height or aspect-ratio placeholders for wallpaper cards.
- Optimize Cloudinary image delivery using appropriate transformations such as `f_auto` and `q_auto` where already compatible with current uploader logic.

Acceptance:
- No horizontal scroll at common mobile widths.
- No broken buttons.
- No console-breaking errors on home page.
- Public site remains usable without login.

---

# 3. WALLPAPER DISCOVERY EXPERIENCE

Keep existing categories and aliases, but complete the browsing experience.

Required features:

- Search by title/category/creator where data is available.
- Category filtering.
- Latest sorting.
- Popular/download sorting.
- Creator filter if creator metadata exists.
- Clear-all-filters action.
- Query state should be understandable and recoverable.
- URL query parameters may be used for shareable search/filter state if it can be added safely.
- Add “Related Wallpapers” inside or below wallpaper details.
- Add creator attribution on creator-uploaded wallpapers.
- Add safe fallback when old/legacy wallpaper documents do not contain newer fields.
- Never hide legacy media simply because new metadata is missing.

Wallpaper detail should show where available:
- title
- category
- creator/channel
- resolution
- orientation
- file format
- download count
- upload/publish date
- recommended fit for current device
- download button

Do not expose private creator/user contact details publicly.

---

# 4. DOWNLOAD EXPERIENCE

Keep existing download count protections and improve UX.

Required:

- Device-aware recommended resolution text.
- Clear “Download” primary button.
- Avoid accidental duplicate download count increments caused by repeated UI events.
- Gracefully handle download failure.
- Show a short success/started state after download begins.
- Preserve public read access and controlled download counter updates in Firestore rules.
- Do not allow users to directly edit arbitrary wallpaper fields.

Optional if simple and safe:
- “Copy link”
- “Share” using Web Share API with fallback.

---

# 5. USER ACCOUNT — COMPLETE PROFILE EXPERIENCE

Existing private profile foundation must be completed, not rebuilt.

Private account fields may include:
- full name
- profile photo
- username
- optional DOB
- optional gender
- email
- optional verified mobile
- optional website
- country
- state
- district
- taluka/city
- village
- PIN
- mother tongue / preferred language

Privacy rule:
- Sensitive/private account data remains owner/admin only.
- Public profile must NEVER expose email, phone, exact location, verification documents or admin-only status data.

Add:
- profile edit form
- save status
- validation
- cancel/reset behavior
- avatar preview
- useful signed-out state
- account menu links to profile and creator studio
- logout

If any field is not yet supported by Firestore rules, add it only after updating rules safely.

---

# 6. PUBLIC CREATOR CHANNEL PAGE

Create/complete a public creator/channel page.

Public creator data may show:
- display/channel name
- unique handle
- logo/avatar
- banner
- short bio
- creator category
- optional public website/social links
- verification badge only when admin-approved/verified
- published uploads
- public follower count if follow system is implemented

Never show:
- private email
- private phone
- exact home location
- creator application notes
- admin review notes
- private rejected/pending uploads
- earnings/payment details

Routes can be static-page + query parameter if full SPA routing is not currently used, for example:
`creator.html?handle=...`

Acceptance:
- Only approved/published creator media appears publicly.
- Deleted/rejected/private submissions never appear.

---

# 7. CREATOR STUDIO — FINISH END-TO-END

Keep the existing signed upload Worker architecture.

Required upload flow:

1. User signs in with Firebase.
2. Verify approved creator record.
3. User selects wallpaper/image/video.
4. Client validates size/type before upload.
5. Client requests signed Cloudinary parameters from:
   `https://bharatvarsh-creator-upload-signature.bharatvarshofficial.workers.dev/api/cloudinary-signature`
6. Firebase ID token is sent as Bearer token.
7. Cloudflare Worker verifies Firebase token + approved creator.
8. Worker returns signed parameters.
9. Browser uploads directly to Cloudinary.
10. Client writes normalized metadata to `creatorMediaSubmissions`.
11. New submission has `status: "pending"`.
12. Submission remains private until admin review.

Creator Studio UI must provide:
- upload form
- upload progress
- clear file type/size validation
- rights/ownership confirmation
- title
- description
- category
- media type
- preview
- upload success/error state
- list of creator's submissions
- status badges: pending / approved / rejected
- rejection note if a safe owner-only review field exists
- ability to remove a rejected submission if rules allow
- disable double-submit while uploading

Do not put Cloudinary API secret in frontend code.

---

# 8. ADMIN PANEL — FINAL CONTROL CENTER

Do not remove exact UID admin protection.

Admin dashboard should manage:

### Wallpapers
- create
- edit metadata
- delete
- category management where supported
- legacy URL-safe editing
- download counts read-only unless explicitly needed

### Creator Applications
- list pending applications
- view applicant public/application details
- approve
- reject
- optional review note
- atomic updates where multiple documents must change

### Creator Media Submissions
- pending queue
- preview image/video
- creator/channel information
- approve
- reject
- optional reason/note
- approval publishes to public `wallpapers`/relevant collection atomically
- prevent duplicate publishing
- preserve Cloudinary asset identifiers

### Users / Creator overview
At minimum:
- creator status
- upload counts
- approved/rejected/pending counts

Do not expose admin-only tools to ordinary signed-in users.

---

# 9. FOLLOW / LIKE SYSTEM — PHASED, SAFE IMPLEMENTATION

Implement only if it can be added without destabilizing the launch.

Preferred data design must avoid unbounded arrays on a single Firestore document.

Recommended pattern:
- `users/{uid}/likedWallpapers/{wallpaperId}`
- `users/{uid}/following/{creatorId}`
- optionally mirrored/count documents or transaction-controlled counts

Required:
- authenticated user only
- unlike/unfollow supported
- no arbitrary count manipulation
- public counts can be displayed
- owner/private relationship documents remain protected

If this cannot be completed safely in the same pass, leave it clearly marked as post-launch rather than introducing insecure rules.

---

# 10. CREATOR DASHBOARD STATS

For approved creators, add useful non-sensitive stats:

- total published uploads
- pending submissions
- rejected submissions
- total downloads across published content
- follower count if follow system exists

Future-ready placeholders in architecture:
- earnings
- rank
- monetization eligibility

Do NOT implement fake earnings or fake monetization.
Do NOT show financial values until a real payout system exists.

---

# 11. CREATOR MONETIZATION + 20% PROFIT SHARE

Current implementation:
- creator monetization status
- verified creator-attributed platform profit settlement
- fixed creator share: **20%**
- estimated/lifetime/available creator earnings
- payout request flow with ₹1,000 minimum threshold
- admin payout processing
- creator-visible verified earnings history

Security requirements:
- creators cannot write financial balances or share rates
- only admin/trusted backend can settle profit and earnings
- invalid/fake traffic must not be included in attributed profit
- never claim guaranteed income

Future production integration:
- connect ads/sponsorship/payment analytics so verified creator-attributed profit is ingested automatically
- add payout provider, KYC/tax and reconciliation workflows

---

# 12. REPORTING / MODERATION FOUNDATION

Add a lightweight reporting system if practical:

Users/public can report:
- copyright concern
- inappropriate content
- wrong category
- spam
- other

Store reports privately.
Admin can review reports.
Do not publicly expose reporter identity.

Creator uploads require rights confirmation before submission.
Add copyright/reporting guidance to policy text if missing.

---

# 13. POLICIES / TRUST PAGES

Audit current policies and ensure working links from footer.

At minimum:
- Privacy Policy
- Terms / Terms of Use
- Copyright / DMCA-style reporting guidance
- Creator upload rights declaration
- Contact method
- Content moderation statement

Do not claim legal guarantees that are not actually provided.
Public policy pages must be readable without login.

---

# 14. SEO + DISCOVERY

Audit:
- page title
- meta description
- canonical URL
- Open Graph tags
- Twitter/X social preview tags
- favicon
- site manifest
- robots.txt
- sitemap.xml

Add structured data where appropriate and accurate:
- WebSite
- Organization
- ImageObject only when actual metadata is available

Do not create fake ratings/reviews.
Ensure sitemap contains actual public pages only.

---

# 15. PWA / MOBILE EXPERIENCE

Keep the current web app lightweight.

Audit `site.webmanifest`:
- name
- short_name
- icons
- theme_color
- background_color
- display mode

Optional:
- install prompt handling
- minimal service worker for static shell caching

Do not cache Firebase-auth private pages/content in a way that leaks private account information.

---

# 16. PERFORMANCE

Current Vite build warning shows a Firebase chunk above 500 kB.

Optimize carefully:

- avoid importing unused Firebase modules
- use per-module Firebase imports
- consider dynamic import for admin/creator-only code
- split admin/dashboard/creator/profile code from public home bundle where practical
- lazy load non-critical UI
- avoid loading creator/admin code on public home page
- keep images lazy and Cloudinary optimized

Do not “fix” the warning by only increasing `chunkSizeWarningLimit` unless there is a justified reason.

Acceptance:
- `npm run build` succeeds
- no new runtime errors
- public home does not unnecessarily execute admin code

---

# 17. SECURITY AUDIT — MANDATORY BEFORE FINAL DEPLOY

Verify:

### Firebase
- admin-only writes remain admin-only
- private user profile is owner/admin only
- creator applications private to owner/admin
- public creators read-only to public
- creator submissions owner/admin only
- creator submission creation requires approved creator + pending status + rights confirmation
- public wallpapers cannot be arbitrarily edited
- catch-all deny rule remains

### Cloudinary / Cloudflare
- Cloudinary API secret never appears in frontend/repo
- Worker secret values remain Cloudflare secrets
- Worker accepts only configured origins
- Worker only supports intended route/method
- Worker verifies Firebase JWT
- Worker verifies approved creator
- Worker restricts resource/media types
- Worker generates controlled asset folder/public ID
- no unsigned creator upload path bypasses the signed flow

### Frontend
- sanitize/render user text safely
- avoid `innerHTML` for untrusted creator/user content unless properly escaped
- no private data in public HTML/JS

---

# 18. ALLOWED ORIGINS — PRODUCTION CHECK

The Worker currently has `ALLOWED_ORIGINS`.

Before final production launch ensure it includes only intended origins such as:

- local Vite development origin:
  `http://localhost:5173`
- official GitHub Pages production origin:
  `https://bharatvarshofficial.github.io`

If a custom domain is added later, explicitly add that origin.
Do not use `*` for the signed creator upload Worker.
After changing Worker environment variables, redeploy Worker and re-test CORS.

---

# 19. FIRESTORE RULES DEPLOYMENT

After all rule changes:

1. Run automated tests.
2. Review `firestore.rules`.
3. Deploy rules using the project's existing Firebase CLI setup.
4. Test public read, signed-in profile access, approved creator submission, non-approved creator rejection, admin approval, and arbitrary public write rejection.

Never deploy untested permissive rules such as:
`allow read, write: if true;`

---

# 20. FINAL TEST SUITE

Existing baseline is **33/33 pass**.
Do not remove tests merely to make the suite green.
Add tests for any new security-sensitive feature.

Final commands from project root:

```powershell
npm test
npm run build
git status
```

Required final result:
- all tests pass
- build succeeds
- no accidental secrets tracked
- no generated/debug junk accidentally staged

Useful checks:

```powershell
git diff --check
git status -sb
```

Search for accidental secrets before commit:

```powershell
Get-ChildItem -Recurse -File |
Where-Object { $_.FullName -notmatch "node_modules|dist|\.git" } |
Select-String -Pattern "CLOUDINARY_API_SECRET|api_secret"
```

Expected: no real secret value in tracked frontend/source files.

---

# 21. MANUAL END-TO-END ACCEPTANCE TEST

Perform this exact user journey:

### Public visitor
1. Open home page.
2. Browse categories.
3. Search wallpaper.
4. Open wallpaper detail.
5. See device recommendation.
6. Download wallpaper.
7. Verify count/UI behavior.

### New signed-in user
1. Google sign in.
2. Open account menu.
3. Open private profile.
4. Save supported profile fields.
5. Submit creator application with rights confirmation.

### Admin
1. Google admin sign in.
2. Open creator application queue.
3. Approve test creator.

### Approved creator
1. Open Creator Studio.
2. Select valid image.
3. Request signed upload.
4. Upload to Cloudinary.
5. Confirm pending submission appears privately.

### Admin media review
1. Open pending creator media.
2. Preview.
3. Approve.
4. Confirm media is published publicly once.
5. Confirm creator upload count/stat updates.

### Public verification
1. Sign out.
2. Open public site.
3. Find newly approved wallpaper.
4. Confirm creator attribution.
5. Confirm no private creator information is exposed.

---

# 22. GIT / DEPLOYMENT WORKFLOW

Do not rewrite history.

Before starting final completion:

```powershell
git status -sb
git log -1 --oneline
```

Create a final completion branch if desired:

```powershell
git switch -c final-website-completion
```

After implementation:

```powershell
npm test
npm run build
git diff --check
git status
```

Commit:

```powershell
git add .
git commit -m "Complete BharatVarshOfficial production website"
git push -u origin HEAD
```

Then merge using the existing GitHub workflow/PR process.

Do not commit:
- `.env`
- `.dev.vars`
- API secrets
- private keys
- local logs

---

# 23. FILES THAT SHOULD BE AUDITED

Audit existing files rather than creating duplicates.

Likely important files include:

- `index.html`
- `script.js`
- `style.css`
- `categories.js`
- `profile.html`
- `profile.js`
- `profile.css`
- `creator-studio.html`
- `creator-studio.js`
- `creator-studio.css`
- `creator-upload-config.js`
- `cloudinary-uploader.js`
- `admin.html`
- `admin.js`
- `css/js/firebase/dashboard.html`
- `css/js/firebase/dashboard.js`
- dashboard/admin CSS
- `firestore.rules`
- `firebase.json`
- `vite.config.js`
- `public/robots.txt`
- `public/sitemap.xml`
- `public/site.webmanifest`
- `policies.html`
- `policies.css`
- `.github/workflows/deploy.yml`
- `.gitignore`
- `test/*`
- `creator-upload-worker/src/index.js`
- `creator-upload-worker/src/security.js`
- `creator-upload-worker/wrangler.jsonc`

Do not manually edit fingerprinted files inside `dist/assets`.

---

# 24. PRIORITY ORDER — FINISH WEBSITE WITHOUT ENDLESS PHASES

Implement in this order:

## P0 — Must finish before launch
- production origin in Worker CORS
- end-to-end signed creator upload
- creator approval + media approval verified live
- public creator attribution/channel page
- profile privacy/security audit
- mobile/public UI polish
- policies/footer links
- SEO basics
- all tests pass
- build succeeds
- Firestore rules deployed
- final production deployment

## P1 — Strongly recommended
- creator dashboard stats
- report/moderation flow
- related wallpapers
- share/copy link
- loading/error/empty states
- performance bundle split

## P2 — Post-launch acceptable
- likes
- follows
- advanced analytics
- automated ad/sponsorship profit attribution backend
- AI-based wallpaper recommendation
- advanced creator ranking
- full notification system

Do not delay launch for P2 items.

---

# 25. DEFINITION OF “WEBSITE COMPLETE”

BharatVarshOfficial is considered launch-complete when all P0 items are working.

Completion does NOT require:
- real creator payouts
- advanced AI recommendations
- a native Android app
- every future social feature
- unlimited analytics

The launch version must be secure, functional, polished and maintainable.

---

# 26. INSTRUCTIONS FOR GITHUB COPILOT / CODING AGENT

Use this section as the execution prompt.

## EXECUTION PROMPT

You are completing the existing **BharatVarshOfficial** production website.

Rules:

1. Do not rewrite the project from scratch.
2. Audit the repository before editing.
3. Preserve all currently passing functionality.
4. Treat the verified state in Section 0 as already complete.
5. Implement P0 tasks first.
6. Reuse existing architecture and file names.
7. Do not create duplicate authentication, upload or profile systems.
8. Do not modify generated `dist/assets` manually.
9. Do not expose Cloudinary API secrets.
10. Preserve Firebase security boundaries.
11. Do not weaken Firestore rules to make features work.
12. Add tests for new security-sensitive behavior.
13. Run tests after meaningful changes.
14. Run production build before final completion.
15. Fix actual root causes; do not delete failing tests merely to get green output.
16. Keep code comments and code identifiers in English.
17. Keep the UI mobile-first and simple for ordinary users.
18. Maintain legacy wallpaper compatibility.
19. Do not fabricate analytics, downloads, followers or earnings.
20. If a P2 feature threatens launch stability, defer it cleanly instead of destabilizing P0.

Before making edits, inspect:
- `package.json`
- `git status`
- public website files
- Firebase config/rules
- profile files
- creator studio files
- admin dashboard files
- Cloudinary uploader/config
- tests
- deployment workflow

Then implement the remaining P0 work in small coherent commits or one final branch.

The final response from the coding agent must report:
- files changed
- features completed
- tests added/updated
- final `npm test` result
- final `npm run build` result
- any items intentionally deferred to P1/P2
- exact deployment commands still required

Do not stop after creating a plan. Implement the code.

---

# 27. FINAL LAUNCH CHECKLIST

- [ ] Worker production CORS origin configured
- [ ] Signed creator upload works from real website
- [ ] Firebase login works
- [ ] Creator application works
- [ ] Admin creator approval works
- [ ] Creator Studio opens only for approved creator
- [ ] Cloudinary upload succeeds
- [ ] Submission remains pending/private
- [ ] Admin media approval works
- [ ] Approved media appears publicly
- [ ] Creator attribution works
- [ ] Public creator page works
- [ ] Private user fields stay private
- [ ] Mobile layout checked
- [ ] Search/category filters checked
- [ ] Wallpaper preview checked
- [ ] Download flow checked
- [ ] Policies links checked
- [ ] robots.txt checked
- [ ] sitemap.xml checked
- [ ] manifest checked
- [ ] no secrets in repo
- [ ] Firestore rules deployed
- [ ] `npm test` all green
- [ ] `npm run build` succeeds
- [ ] `git diff --check` clean
- [ ] production deployment completed
- [ ] final public smoke test completed

---

## END OF FINAL WEBSITE COMPLETION PACK
