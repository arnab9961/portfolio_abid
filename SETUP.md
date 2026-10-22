# Supabase and Vercel setup

1. Create a Supabase project and run `supabase/migrations/20261021204759_portfolio.sql` in the SQL editor.
2. In Supabase **Project Settings → API**, copy the Project URL and publishable (anon) key into `.env.local` using the names in `.env.example`. Never expose a service-role key.
3. In **Authentication → Users**, create the first user with email/password. In a trusted server-side SQL/provisioning workflow, set that user’s `app_metadata` to `{ "role": "admin" }`; do not allow users to set this value themselves.
4. Run the app locally with the project’s package manager. Add the same two variables to Vercel **Settings → Environment Variables** for Preview and Production.
5. Add the deployed Vercel URL to Supabase **Authentication → URL Configuration → Redirect URLs**. The app does not include public registration.

RLS keeps drafts and all writes private to users whose verified JWT has the `admin` app metadata role. Public image buckets only allow reads; uploads, replacements, and deletes require that same role.

## Chatbot and music

Apply `supabase/migrations/20261022090000_chatbot_music.sql` after the portfolio migrations. It adds the protected `inquiries` table, the singleton `music_settings` row, and the public `music` storage bucket. The inquiry insert policy permits anonymous submissions while reads remain admin-only.

If the app reports `Could not find the table 'public.music_settings' in the schema cache`, open Supabase **SQL Editor**, paste and run the complete `20261022090000_chatbot_music.sql` migration, then wait a few seconds and reload the app. If the error remains, open **Project Settings → API → Reload schema cache** (or restart the project API). The migration must be applied to the same Supabase project whose URL is in `NEXT_PUBLIC_SUPABASE_URL`.

Add `GROQ_API_KEY` and `GROQ_MODEL` only as server-side Vercel environment variables. Choose a currently available Groq GPT-OSS model from the Groq model catalog; do not add either variable with a `NEXT_PUBLIC_` prefix. The chatbot reads only published profile, artwork, and activity rows.

In the admin dashboard's Music tab, upload an audio file you own or have permission to use, record its attribution and license, preview it, and enable the player. The player is hidden until a published enabled setting has both a title/audio URL and a successful database read. Music is never autoplayed.

`RESEND_API_KEY` and `INQUIRY_FROM_EMAIL` are reserved for an optional notification provider. Inquiry saving does not depend on notifications; until a provider is configured, the admin can review saved inquiries in Supabase.

## AI knowledge base and RAG

Apply `supabase/migrations/20261022101500_ai_knowledge_base.sql` after the existing migrations. It adds `knowledge_entries`, `knowledge_chunks`, full-text search, pgvector cosine search, published-only RLS policies, and the `match_knowledge_chunks` RPC.

The admin dashboard now includes a simplified **AI knowledge base**. Add information by typing/pasting it into the text area or uploading a `.txt`, `.md`, or `.json` document. Give it a title, choose its language, and publish it when ready. Existing entries can be edited or deleted. Published content is split into sentence-aware overlapping chunks and indexed immediately; drafts are never searchable.

Keyword retrieval works without extra credentials. Gemini embeddings are supported directly. Add your Gemini key server-side:

```env
GEMINI_API_KEY=your-gemini-key
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
```

`gemini-embedding-001` is requested at 768 dimensions to reduce vector storage while retaining semantic retrieval. Keep `GEMINI_API_KEY` server-side; never prefix it with `NEXT_PUBLIC_`. The chat route retrieves up to eight published chunks, preferring Gemini vector similarity when configured and falling back to PostgreSQL full-text search. It does not send the entire knowledge base to Groq. The admin-only **Test AI Chatbot** panel shows the generated answer, selected retrieval method, context sufficiency, and retrieved chunks/scores.

If the original 1536-dimension AI migration has already been applied, also apply `supabase/migrations/20261022104500_resize_knowledge_embeddings.sql`. It recreates the embedding column at 768 dimensions and clears old vectors; reindex published knowledge entries from the admin dashboard afterward.

The previous generic OpenAI-compatible configuration remains supported as a fallback:

```env
EMBEDDING_API_KEY=
EMBEDDING_MODEL=
EMBEDDING_API_URL=https://api.openai.com/v1/embeddings
```
