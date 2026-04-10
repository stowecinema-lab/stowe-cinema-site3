# Stowe Cinema Website

## Deploy
1. Upload this project to GitHub.
2. Import the repo into Vercel.
3. Add environment variable:

VEEZI_API_TOKEN=your_real_token_here

4. Deploy.

## What is included
- Poster-first homepage
- Date-based showtimes selector with today selected by default
- Live `/api/movies` route using Veezi `/v4/film` and `/v1/websession`
- About Us and Green Room content integrated

## Notes
- If `VEEZI_API_TOKEN` is missing, the site shows fallback preview movies.
- Replace placeholder contact/private event details as needed.
