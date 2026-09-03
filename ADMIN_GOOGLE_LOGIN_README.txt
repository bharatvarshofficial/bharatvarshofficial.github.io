NOTE 2026-09-03: Do not approve creator channels. Channels activate instantly; admin reviews creator media and handles trusted monetization/payout operations.

BharatVarshOfficial — Secure Google Admin Login
================================================

This patch replaces the incompatible email/password Admin Login with Google
sign-in. Firebase confirms that the administrator account uses Google as its
authentication provider.

Security
--------
- Google account chooser is shown for every login attempt.
- Access is granted only when the signed-in Firebase UID exactly matches:
  hGrTepDbtsaCoSQL5D2bBG0iZzD2
- Every other Google account is signed out immediately.
- The Admin Dashboard independently repeats the same UID check.
- No Gmail password is requested, stored or handled by this website.

Test
----
1. Start the local website with npm run dev.
2. Open /admin.html.
3. Click Continue with Google.
4. Select vaibhav.mshivaji@gmail.com.
5. Confirm that the Admin Dashboard opens.
6. Open Creator Verification Queue and approve the pending creator.

Verification
------------
    npm test
    npm run build
