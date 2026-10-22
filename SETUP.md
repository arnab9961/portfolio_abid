# Supabase and Vercel setup

1. Create a Supabase project and run `supabase/migrations/20261021204759_portfolio.sql` in the SQL editor.
2. In Supabase **Project Settings → API**, copy the Project URL and publishable (anon) key into `.env.local` using the names in `.env.example`. Never expose a service-role key.
3. In **Authentication → Users**, create the first user with email/password. In a trusted server-side SQL/provisioning workflow, set that user’s `app_metadata` to `{ "role": "admin" }`; do not allow users to set this value themselves.
4. Run the app locally with the project’s package manager. Add the same two variables to Vercel **Settings → Environment Variables** for Preview and Production.
5. Add the deployed Vercel URL to Supabase **Authentication → URL Configuration → Redirect URLs**. The app does not include public registration.

RLS keeps drafts and all writes private to users whose verified JWT has the `admin` app metadata role. Public image buckets only allow reads; uploads, replacements, and deletes require that same role.

## Chatbot and music

Apply `supabase/migrations/20261022090000_chatbot_music.sql` after the portfolio migrations. It adds the protected `inquiries` table, the singleton `music_settings` row, and the public `music` storage bucket. The inquiry insert policy permits anonymous submissions while reads remain admin-only.

Add `GROQ_API_KEY` and `GROQ_MODEL` only as server-side Vercel environment variables. Choose a currently available Groq GPT-OSS model from the Groq model catalog; do not add either variable with a `NEXT_PUBLIC_` prefix. The chatbot reads only published profile, artwork, and activity rows.

In the admin dashboard's Music tab, upload an audio file you own or have permission to use, record its attribution and license, preview it, and enable the player. The player is hidden until a published enabled setting has both a title/audio URL and a successful database read. Music is never autoplayed.

`RESEND_API_KEY` and `INQUIRY_FROM_EMAIL` are reserved for an optional notification provider. Inquiry saving does not depend on notifications; until a provider is configured, the admin can review saved inquiries in Supabase.

## AI knowledge base and RAG

Apply `supabase/migrations/20261022101500_ai_knowledge_base.sql` after the existing migrations. It adds `knowledge_entries`, `knowledge_chunks`, full-text search, pgvector cosine search, published-only RLS policies, and the `match_knowledge_chunks` RPC.

The admin dashboard now includes **AI knowledge base**. Add long-form approved information, select its language/category, add tags and an optional source URL, then publish it. Published entries are split into sentence-aware overlapping chunks and indexed immediately. Drafts are never searchable. Editing or deleting an entry removes its old chunks before reindexing, preventing stale answers. Failed indexing is shown on the entry and can be retried with **Index**.

Keyword retrieval works without extra credentials. Gemini embeddings are supported directly. Add your Gemini key server-side:

```env
GEMINI_API_KEY=your-gemini-key
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
```

`gemini-embedding-001` is requested at 1536 dimensions to match the pgvector migration. Keep `GEMINI_API_KEY` server-side; never prefix it with `NEXT_PUBLIC_`. The chat route retrieves up to eight published chunks, preferring Gemini vector similarity when configured and falling back to PostgreSQL full-text search. It does not send the entire knowledge base to Groq. The admin-only **Test AI Chatbot** panel shows the generated answer, selected retrieval method, context sufficiency, and retrieved chunks/scores.

The previous generic OpenAI-compatible configuration remains supported as a fallback:

```env
EMBEDDING_API_KEY=
EMBEDDING_MODEL=
EMBEDDING_API_URL=https://api.openai.com/v1/embeddings
```
