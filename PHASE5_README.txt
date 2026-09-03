NOTE 2026-09-03: Creator channel creation is now instant self-service. Any older approval wording below is historical.

BharatVarshOfficial - Phase 5 Account Foundation

Purpose
-------
This milestone gives signed-in visitors a familiar YouTube-style account
entry point while keeping the public wallpaper experience and the private
admin dashboard separate.

Included
--------
1. Navbar profile avatar replaces Login after Google authentication.
2. Accessible account menu with profile, favourites, creator and sign-out
   actions.
3. Private My Profile page with overview, favourites and creator tabs.
4. Existing favourites and download counts are loaded from the user's own
   Firestore document.
5. A user can create a private creator-channel draft. Public creator data,
   verification and uploads remain a later milestone.
6. Profile pages are noindex and never display the user's email publicly.
7. Normal users never receive access to the UID-protected Admin Dashboard.

Privacy boundary
----------------
- The users/{uid} document remains readable only by its owner and the admin.
- Email, mobile number and location are not rendered on the profile page.
- Creator drafts remain private until a separate public creator collection
  and verification rules are introduced.

Verification
------------
1. Run: npm test
2. Run: npm run build
3. Sign in with Google on the public website.
4. Confirm Login changes to the user's avatar and the account menu opens.
5. Open My Profile and verify counts and favourites.
6. Open Creator Channel and create one private draft.
7. Sign out and confirm the private page returns to the signed-out state.
