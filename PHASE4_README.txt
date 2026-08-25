BharatVarshOfficial - Phase 4 Cloudinary Admin Upload

Purpose
-------
This phase connects the existing Firebase-protected admin dashboard to
Cloudinary so the owner can select and upload an image or video without first
creating a separate public URL. The manual HTTPS URL method remains available
as a fallback.

Included
--------
1. Cloudinary cloud-name and unsigned-preset setup inside the admin dashboard.
2. Configuration is validated and saved only in the current browser.
3. Direct JPG, PNG, WebP, MP4, WebM and OGG selection with local preview.
4. Upload progress and readable Cloudinary error messages.
5. Cloudinary URL, public ID, asset ID, format, file size and dimensions saved
   with the Firestore media record.
6. Existing edit, public-URL fallback, category, featured and trending flows
   remain available.
7. Automated Cloudinary configuration, file-validation and wiring tests.

One-time Cloudinary setup
-------------------------
1. Create or open a Cloudinary account.
2. Copy the Cloud name from the Cloudinary Console.
3. Open Settings > Upload > Upload presets.
4. Add an UNSIGNED preset. Recommended preset name: bharat_admin_upload
5. In that preset, restrict allowed formats to:
   jpg, jpeg, png, webp, mp4, webm, ogg
6. Disable overwrite and use a dedicated BharatVarshOfficial asset folder.
7. Open the BharatVarshOfficial Admin Dashboard.
8. Enter only the Cloud name and unsigned preset, then click Save Connection.

Security boundary
-----------------
- Never put a Cloudinary API secret, Firebase service-account key or any other
  private credential in HTML, JavaScript, GitHub or the dashboard form.
- An unsigned preset is intentionally public. Keep its allowed formats, size
  limits and folder restrictions narrow in the Cloudinary Console.
- Permanent programmatic Cloudinary deletion requires a server-side signature.
  Until a backend signing endpoint is added, deleting a website record shows
  the exact Cloudinary public ID that the admin must also remove from the
  Cloudinary Media Library.
- Signed upload/delete endpoints remain required before creator uploads launch.

Verification
------------
1. Run: npm test
2. Run: npm run build
3. Login as the configured Firebase admin UID.
4. Save the Cloudinary connection.
5. Upload one test image and confirm the progress reaches 100%.
6. Confirm the new Firestore record has source = cloudinary and the public page
   displays the uploaded image.
7. Test edit and delete with a temporary asset before using production media.
