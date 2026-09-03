NOTE 2026-09-03: Creator channel verification/approval has been retired. New channels activate instantly. This file describes the legacy Phase 5 flow only.

BharatVarshOfficial — Phase 5 Creator Verification Update
=========================================================

This update extends the Phase 5 user-account foundation with a safe creator
onboarding and approval workflow.

Included
--------
- Creator channel application form on profile.html#creator
- Content-rights declaration and private Firestore application
- Pending / approved / rejected creator states
- Admin Creator Verification Queue
- Atomic admin approve/reject operation
- Public creators collection containing channel data only (no private email)
- Creator Studio access gate for approved creators
- Tests for onboarding, rules, admin approval and Studio access

Important security boundary
---------------------------
Creator Studio intentionally does not accept files yet. Creator uploads must
use a signed backend endpoint with a separate Cloudinary preset. Never place a
Cloudinary API Secret in HTML or JavaScript, and never give normal creators the
admin unsigned upload preset.

Required Firebase step
----------------------
Deploy firestore.rules before testing creator application submission:

    firebase deploy --only firestore:rules

Test sequence
-------------
1. Sign in as a normal Google user.
2. Open profile.html#creator and create the channel draft.
3. Complete the creator application and submit it.
4. Sign in as the authorized admin and open the Admin Dashboard.
5. Approve or request changes in Creator Verification Queue.
6. After approval, the user can open creator-studio.html.

Local verification
------------------
    npm test
    npm run build

Next milestone
--------------
Add a signed Cloudinary upload backend, pending media submissions, admin media
review and approved public publishing.
