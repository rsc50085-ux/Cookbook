# Cookbook (Auth0 + Render + TDD)

## One-shot deploy
1. Create Auth0 tenant:
   - Web App (“Cookbook Web”) and API (“Cookbook API”).
   - Audience: https://api.cookbook.
   - Copy: AUTH0_ISSUER_BASE_URL, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_DOMAIN, AUTH0_AUDIENCE.
2. Push this repo to GitHub.
3. In Render: *New → Blueprint* → select repo → follow prompts.
   - Fill requested secrets.
   - After first deploy, open cookbook-web and set AUTH0_BASE_URL to the *Public URL* shown.
4. Open the web URL → Login → Add a recipe → Export to PDF.

## Local dev (optional)
- Web: cd apps/web && npm i && npm run dev
- API: cd apps/api && pip install uv && uv pip install -r <(uv pip compile pyproject.toml) && uvicorn app.main:app --reload
- Set NEXT_PUBLIC_API_URL=http://localhost:8000.

## Notes
- PDF export uses ReportLab (no OS deps).
- DB schema is minimal; SQLAlchemy auto-creates tables.
- Tests use TESTING=1 to bypass external JWKS calls.




