BharatVarshOfficial - Phase 2 Core Media Manager

Purpose
-------
This patch makes categories consistent across the public website and admin
dashboard, and upgrades the dashboard from preview-only files to a real media
management workflow.

Included
--------
1. Shared canonical category model in categories.js.
2. Legacy values such as "Shivaji Maharaj", "Temple" and "Nature" resolve to
   their official labels without duplicate or empty category results.
3. New media records save both category and stable categoryKey fields.
4. Admin can upload image/video files directly to Firebase Storage.
5. Existing public media URLs remain supported as an optional fallback.
6. Admin can edit metadata, replace media, or delete recent media.
7. Storage size/type validation and secure storage.rules are included.
8. Dashboard queries fall back safely when an older document has no createdAt.
9. Automated category tests and the production Vite build are available through
   npm run check.

Required Firebase setup
-----------------------
1. Enable Firebase Storage for the existing Firebase project if it is not
   already enabled.
2. Publish both Firestore and Storage rules before using file upload:

   firebase deploy --only firestore:rules,storage

3. The manual public URL method continues to work even before Storage upload is
   enabled.

Deployment
----------
1. Extract this patch over the project root.
2. Run: npm ci
3. Run: npm run check
4. Review: git status --short
5. Commit the reviewed Phase 2 files on a new branch and open a pull request.

Important
---------
- Keep the ADMIN_UID value synchronized in dashboard.js, firestore.rules and
  storage.rules.
- Do not place Firebase service-account JSON, private keys or .env files in the
  repository.
- Do not edit dist directly; Vite recreates it.
