BharatVarshOfficial - Phase 6 Secure Creator Uploads
====================================================

Outcome
-------

Approved creators can submit wallpapers, photos and videos from Creator Studio.
Files upload directly to Cloudinary through a short-lived signed request. Every
submission remains private in the admin review queue until the administrator
approves and publishes it.

Security boundary
-----------------

- The Cloudinary API secret is stored only as a Cloudflare Worker secret.
- Creator Studio sends the current Firebase ID token to the Worker.
- The Worker verifies the Firebase token and the approved creators/{uid} record.
- The Worker allows only configured website origins and supported media types.
- Every authorization receives a unique public ID and a one-hour Cloudinary
  timestamp window. The upload preset must keep overwrite disabled.
- Firestore rules allow an approved creator to create only a pending submission
  owned by the same Firebase UID.
- Only the fixed admin UID can approve a submission and create a public media
  document.

Files added or changed
----------------------

- creator-upload-worker/ - Cloudflare signature service
- creator-upload-config.js - deployed Worker endpoint only; never a secret
- creator-studio.html, creator-studio.css, creator-studio.js - upload form,
  preview, progress and creator submission history
- css/js/firebase/dashboard.* - administrator creator-media review queue
- firestore.rules - owner-only pending submissions and admin-only review
- test/creator-upload-worker.test.js
- test/phase6-creator-upload.test.js

1. Create a separate signed Cloudinary preset
------------------------------------------------

Cloudinary Console > Settings > Upload > Upload Presets > Add Upload Preset

Use these values:

- Preset name: bharatvarsh_creator_uploads
- Signing mode: Signed
- Overwrite: false
- Unique filename: true
- Disallow public ID: false (the Worker signs a unique public ID)
- Allowed formats: jpg, jpeg, png, webp, mp4, webm, ogg
- Maximum file size: 100 MB

Do not replace the existing bharatvarsh_wallpapers admin preset. Creator uploads
use this new signed preset. This product environment uses dynamic folders, so
the Worker sends asset_folder rather than the legacy folder parameter.

2. Deploy the Cloudflare Worker
--------------------------------

Open PowerShell in the project and run:

    cd C:\Users\pankaj\Desktop\bharatvarshofficial.github.io\creator-upload-worker
    npm install
    npx wrangler login
    npx wrangler secret put CLOUDINARY_API_KEY
    npx wrangler secret put CLOUDINARY_API_SECRET
    npm run deploy

Enter each Cloudinary value only inside the Wrangler prompt. Never paste the API
secret into ChatGPT, GitHub, creator-upload-config.js or any browser file.

The deployment prints a workers.dev URL. Append this path:

    /api/cloudinary-signature

Example shape only:

    https://bharatvarsh-creator-upload-signature.YOUR-SUBDOMAIN.workers.dev/api/cloudinary-signature

3. Connect Creator Studio
--------------------------

Open creator-upload-config.js and set signingEndpoint to the complete HTTPS
endpoint printed in step 2. This URL is public configuration and is safe to
commit. Do not add an API key or API secret to that file.

4. Deploy Firestore rules
--------------------------

From the project root:

    npx firebase-tools deploy --only firestore:rules --project bharatvarshofficial-21a59

5. Verify locally
-----------------

From the project root:

    npm test
    npm run build
    npm run dev

Sign in as the approved test creator, open Creator Studio and submit one small
JPG. Confirm that:

1. Upload progress reaches 100 percent.
2. The creator sees the item with Pending status.
3. The item is not visible publicly yet.
4. The administrator sees it in Creator Media Review Queue.
5. Approve & publish creates the public wallpaper and increments the creator's
   upload count.
6. The public website displays and downloads the approved wallpaper.

Do not commit or push Phase 6 until this complete live test succeeds.

Current validation
------------------

- 33 automated tests passed.
- Phase 6 JavaScript syntax checks passed.
- Git whitespace validation passed.

Known follow-up
---------------

Rejecting a submission does not automatically delete its Cloudinary asset.
Keep rejected assets in the creator-submissions folder for manual review. A
future backend deletion endpoint can remove them safely without exposing the
Cloudinary API secret.
