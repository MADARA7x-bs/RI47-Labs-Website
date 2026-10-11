# RI 47 Labs — App Release Website

A mobile-friendly, minimal portfolio and app-release website with a Supabase-backed private admin dashboard.

## Included

- Public homepage and project cards
- Per-project release details and changelog dialog
- Direct download links (recommended: GitHub Releases for APKs)
- Private email/password admin login
- Add, edit, publish/unpublish and delete projects
- Supabase Row Level Security (RLS) policies
- Responsive layout for mobile phones

## Important security model

The browser uses only the Supabase **anon/publishable key**. It must never contain a service-role key. Admin access is checked by the `admin_users` table and enforced again by database RLS policies. A hidden admin URL alone is not security; the database policies are essential.

## Setup from an Android phone

### 1. Create a Supabase project

1. Open https://supabase.com/ and create a free project.
2. Open **Project Settings → API** (or **Connect**) and copy the Project URL and anon/publishable key.
3. Open `config.js` in a code editor and replace:
   - `https://YOUR-PROJECT.supabase.co`
   - `YOUR_SUPABASE_ANON_OR_PUBLISHABLE_KEY`
   - `hello@example.com` with your contact email.

### 2. Create database tables and policies

1. In Supabase, open **SQL Editor → New query**.
2. Paste all of `supabase-schema.sql` and run it.
3. Open **Authentication → Users** and create your admin user with email/password.
4. Copy the user's UUID from the Users page.
5. In SQL Editor, run the following, replacing the UUID with your user's actual UUID:

   ```sql
   insert into public.admin_users (user_id)
   values ('PASTE-YOUR-AUTH-USER-UUID-HERE');
   ```

   Do not use an email/UUID from anyone else. Only add accounts you personally control as admins.

6. In **Authentication → URL Configuration**, add your deployed website URL to Site URL / Redirect URLs as appropriate. Password sign-in does not require email redirects, but correct URLs are good practice.
7. For a first test, sign in at `/admin.html`, create a project and confirm it appears on the public homepage.

### 3. Publish free with Cloudflare Pages

This starter uses plain HTML/CSS/JS, so there is no build step.

1. Create a GitHub repository for these files and upload the contents of this folder (not the ZIP itself).
2. Open https://pages.cloudflare.com/ and connect that repository.
3. Choose **Deploy a site** / Pages. Set the build command to blank (or `exit 0` if required) and the output directory to `/` or the repository root, depending on the setup screen.
4. Deploy. Cloudflare will provide a `*.pages.dev` URL.
5. Open that URL on your phone, test the homepage, then visit `/admin.html`.
6. Add the exact deployed domain in Supabase Authentication URL settings if requested.

You can also deploy the folder as a static site using another static host. Do not upload your Supabase service-role key anywhere in the frontend.

### 4. Publish APK releases

Recommended: attach APKs to a GitHub Release and paste the direct asset URL into the project's **Download URL** field. Keep APK files out of the website repository so deployments stay small. Add release notes in the Changelog field and update the version number when you publish a new release.

## Admin usage

- **Publish project**: creates a public listing immediately.
- **Edit**: change details, version, changelog or download link.
- **Unpublish**: hides a project from the public website but keeps it in the admin list.
- **Delete**: permanently removes a project record from the database; it does not delete the APK hosted elsewhere.
- **Feature**: puts a project near the top of the homepage.

## Before going live

- Change the contact email.
- Use a unique, strong password and enable email-based protections available in your Supabase project.
- Confirm RLS is enabled and policies are present.
- Test admin and public access in a private/incognito browser.
- Only publish trusted download links; optionally add SHA-256 hashes to release notes for APK verification.
- This starter does not upload APK binaries itself. It stores release metadata and links; hosting binaries on GitHub Releases is more reliable for the free tier.

## Troubleshooting

- **Homepage says setup required**: check `config.js` URL/key and browser console.
- **Admin can sign in but gets logged out**: add the signed-in user's UUID to `public.admin_users`.
- **Permission denied**: re-run the SQL schema and verify RLS policies.
- **Download button fails**: confirm the URL points to a public, direct release asset, not a private repository page.
