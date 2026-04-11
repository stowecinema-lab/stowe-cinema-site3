export async function GET() {
  const veeziHeaders = {
    VeeziAccessToken: process.env.VEEZI_API_TOKEN || "",
    Accept: "application/json",
  };

  const OMDB_API_KEY = process.env.OMDB_API_KEY || "";

  const [filmsRes, sessionsRes] = await Promise.all([
    fetch("https://api.useast.veezi.com/v4/film", {
      headers: veeziHeaders,
      cache: "no-store",
    }),
    fetch("https://api.useast.veezi.com/v1/websession", {
      headers: veeziHeaders,
      cache: "no-store",
    }),
  ]);

  if (!filmsRes.ok || !sessionsRes.ok) {
    return new Response(
      JSON.stringify({
        error: "Failed to load Veezi data",
        filmStatus: filmsRes.status,
        sessionStatus: sessionsRes.status,
      }),
      { status: 500 }
    );
  }

  const films: any[] = await filmsRes.json();
  const sessions: any[] = await sessionsRes.json();

  const normalizeUrl = (url?: string) => {
    if (!url) return "";
    return String(url).replace(/^http:\/\//i, "https://").trim();
  };

  const unique = (values: string[]) =>
    Array.from(new Set(values.filter(Boolean)));

  const looksLikeImage = (contentType: string | null) => {
    if (!contentType) return false;
    return contentType.startsWith("image/");
  };

  const urlLoadsAsImage = async (url: string) => {
    try {
      let res = await fetch(url, {
        method: "HEAD",
        cache: "no-store",
      });

      let contentType = res.headers.get("content-type");

      if (!res.ok || !looksLikeImage(contentType)) {
        res = await fetch(url, {
          cache: "no-store",
        });
        contentType = res.headers.get("content-type");
      }

      return res.ok && looksLikeImage(contentType);
    } catch {
      return false;
    }
  };

  const extractYear = (film: any): string | undefined => {
    const possible =
      film.ReleaseDate ||
      film.OpeningDate ||
      film.ReleaseYear ||
      film.Year ||
      "";

    if (!possible) return undefined;

    const match = String(possible).match(/\b(19|20)\d{2}\b/);
    return match ? match[0] : undefined;
  };

  const searchOmdbPoster = async (title: string, year?: string) => {
    if (!OMDB_API_KEY || !title) return "";

    try {
      const params = new URLSearchParams({
        apikey: OMDB_API_KEY,
        t: title,
      });

      if (year) params.set("y", year);

      const res = await fetch(`https://www.omdbapi.com/?${params.toString()}`, {
        cache: "no-store",
      });

      if (!res.ok) return "";

      const data = await res.json();

      if (data && data.Poster && data.Poster !== "N/A") {
        return data.Poster;
      }

      return "";
    } catch {
      return "";
    }
  };

  const getPosterCandidates = (film: any) =>
    unique(
      [
        film.FilmPosterUrl,
        film.FilmPosterThumbnailUrl,
        film.PosterUrl,
        film.PosterThumbnailUrl,
        film.ImageUrl,
        film.ThumbnailUrl,
        film.BackdropImageUrl,
        film.BannerImageUrl,
        film?.Images?.Poster,
        film?.Images?.PosterUrl,
        film?.Images?.ThumbnailUrl,
        film?.Media?.PosterUrl,
        film?.Media?.ThumbnailUrl,
      ].map(normalizeUrl)
    );

  const getBackdropCandidates = (film: any) =>
    unique(
      [
        film.BackdropImageUrl,
        film.BannerImageUrl,
        film.FilmPosterUrl,
        film.FilmPosterThumbnailUrl,
        film.PosterUrl,
        film.PosterThumbnailUrl,
        film.ImageUrl,
      ].map(normalizeUrl)
    );

  const filmMap = new Map<string, any>(
    films.map((film: any) => [String(film.Id), film])
  );

  const grouped = new Map<string, any>();

  for (const session of sessions) {
    const filmId = String(session.FilmId);
    const film = filmMap.get(filmId);

    if (!film) continue;

    if (!grouped.has(filmId)) {
      const posterCandidates = getPosterCandidates(film);
      const backdropCandidates = getBackdropCandidates(film);

      const workingPosterCandidates: string[] = [];

      for (const candidate of posterCandidates) {
        if (await urlLoadsAsImage(candidate)) {
          workingPosterCandidates.push(candidate);
        }
      }

      if (workingPosterCandidates.length === 0) {
        const omdbPoster = await searchOmdbPoster(
          film.Title || "",
          extractYear(film)
        );

        if (omdbPoster) {
          workingPosterCandidates.push(omdbPoster);
        }
      }

      grouped.set(filmId, {
        id: String(film.Id),
        title: film.Title || "",
        rating: film.Rating || "",
        duration: film.Duration || 0,
        synopsis: film.Synopsis || "",
        poster: workingPosterCandidates[0] || "",
        posterCandidates: workingPosterCandidates,
        backdrop: backdropCandidates[0] || "",
        backdropCandidates,
        trailer: film.FilmTrailerUrl || "",
        showtimes: [],
      });
    }

    grouped.get(filmId).showtimes.push({
      sessionId: String(session.Id),
      time: session.FeatureStartTime || session.PreShowStartTime,
      url: session.URL || session.Url || session.url || "",
      soldOut: !!session.TicketsSoldOut,
      fewTicketsLeft: !!session.FewTicketsLeft,
      format: session.FilmFormat || "",
    });
  }

  const movies = Array.from(grouped.values()).map((movie: any) => ({
    ...movie,
    showtimes: movie.showtimes.sort(
      (a: any, b: any) =>
        new Date(a.time).getTime() - new Date(b.time).getTime()
    ),
  }));

  return Response.json(movies);
}
