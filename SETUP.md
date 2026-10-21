# Supabase and Vercel setup

1. Create a Supabase project and run `supabase/migrations/20261021204759_portfolio.sql` in the SQL editor.
2. In Supabase **Project Settings → API**, copy the Project URL and publishable (anon) key into `.env.local` using the names in `.env.example`. Never expose a service-role key.
3. In **Authentication → Users**, create the first user with email/password. In a trusted server-side SQL/provisioning workflow, set that user’s `app_metadata` to `{ "role": "admin" }`; do not allow users to set this value themselves.
4. Run the app locally with the project’s package manager. Add the same two variables to Vercel **Settings → Environment Variables** for Preview and Production.
5. Add the deployed Vercel URL to Supabase **Authentication → URL Configuration → Redirect URLs**. The app does not include public registration.

RLS keeps drafts and all writes private to users whose verified JWT has the `admin` app metadata role. Public image buckets only allow reads; uploads, replacements, and deletes require that same role.
