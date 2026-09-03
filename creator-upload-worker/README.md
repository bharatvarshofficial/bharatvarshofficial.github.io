# BharatVarshOfficial Creator Upload Signature Worker

This Cloudflare Worker verifies a Firebase ID token, confirms that the user has
an approved `creators/{uid}` Firestore record, and returns a short-lived signed
Cloudinary upload request. The Cloudinary API secret never enters website code.

## Setup

1. Create a signed Cloudinary upload preset named
   `bharatvarsh_creator_uploads`.
2. Install dependencies with `npm install` in this directory.
3. Sign in with `npx wrangler login`.
4. Save credentials securely:

   ```text
   npx wrangler secret put CLOUDINARY_API_KEY
   npx wrangler secret put CLOUDINARY_API_SECRET
   ```

5. Deploy with `npm run deploy`.
6. Copy the deployed Worker URL into `creator-upload-config.js`.

Never add `.dev.vars`, an API secret, or a copied credential to Git.
