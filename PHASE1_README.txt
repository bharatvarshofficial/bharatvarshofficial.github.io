BharatVarshOfficial - Phase 1 Final Launch Patch

Purpose
-------
This patch completes the current stabilization pass without replacing the
existing project or deleting user files.

Included fixes
--------------
1. All Firestore wallpaper documents are loaded without excluding valid items.
2. Wallpapers are sorted newest-first in the browser when createdAt is present.
3. Local wallpaper files are copied into the production dist build.
4. Firebase is initialized from one shared module.
5. Public website, admin login and dashboard routes use the Vite build.
6. Category loading, search, theme, mobile menu, newsletter and loader wiring
   are preserved from the stabilization patch.
7. Firestore rules are included in English for repository tracking.

How to apply on Windows PowerShell
----------------------------------
1. Open PowerShell in the BharatVarshOfficial project root.
2. Extract this patch over the project root and allow file replacement.
3. Run: npm run build
4. Confirm that the build ends with: built in ...
5. Run: git status

Important
---------
- Do not edit files inside dist. Vite regenerates that directory.
- Do not delete the existing project.
- The included firestore.rules file does not automatically publish rules to
  Firebase Console. Keep the already-published Console rules in place.
- Firebase Storage upload, admin edit/delete and creator-platform features are
  planned for later phases; they are not claimed as complete in this patch.
