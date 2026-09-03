BharatVarshOfficial - Phase 3 Website Completion

Purpose
-------
This patch completes the public wallpaper experience before the separate
Cloudinary media-storage integration.

Included
--------
1. Device-aware recommended wallpaper resolution, orientation and aspect ratio.
2. Accessible wallpaper preview dialog with original image dimensions.
3. Wallpaper preview, favourite action and original download action. Smart device-size recommendation has been removed.
4. Signed-in favourite/download metrics and a My Favourites shortcut.
5. Honest live wallpaper, download and category statistics from Firestore data.
6. Dead AI Wallpaper and disabled mobile-login controls removed.
7. About, Privacy Policy, Terms of Use and Copyright information page.
8. Canonical/Open Graph metadata, robots.txt, sitemap.xml and web manifest.
9. Keyboard focus improvements, skip links and reduced-motion support.
10. Admin dashboard explicitly uses public HTTPS URLs while direct storage is off.
11. Automated category, device and Phase 3 structure tests.

Cloudinary boundary
-------------------
- Direct file selection is intentionally disabled in the admin dashboard.
- Existing public media URL publishing, editing and deletion remain available.
- Do not enable Firebase Storage billing for this phase.
- Cloudinary will replace the paused direct-upload path in a later integration.

Verification
------------
1. Run: npm ci
2. Run: npm run check
3. Confirm all tests pass and the Vite production build completes.
4. Preview the site and test desktop/mobile layouts before merging.

Important before creator launch
-------------------------------
- Publish a verified public support/privacy contact.
- Complete signed Cloudinary uploads and media cleanup.
- Complete creator moderation, reporting and monetisation terms.
