export async function GET() {
  const headers = {
    VeeziAccessToken: process.env.VEEZI_API_TOKEN || "",
    Accept: "application/json",
  };

  const [filmsRes, sessionsRes] = await Promise.all([
    fetch("https://api.useast.veezi.com/v4/film", {
      headers,
      cache: "no-store",
    }),
    fetch("https://api.useast.veezi.com/v1/websession", {
      headers,
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
    return String(url).replace(/^http:\/\//i, "https://");
  };

  const pickPoster = (film: any) => {
    const candidates = [
      film.FilmPosterUrl,
      film.FilmPosterThumbnailUrl,
      film.PosterUrl,
      film.PosterThumbnailUrl,
      film.BackdropImageUrl,
      film.BannerImageUrl,
      film.ImageUrl,
      film.ThumbnailUrl,
      film?.Images?.Poster,
      film?.Images?.PosterUrl,
      film?.Images?.ThumbnailUrl,
      film?.Media?.PosterUrl,
      film?.Media?.ThumbnailUrl,
    ]
      .map(normalizeUrl)
      .filter(Boolean);

    return candidates[0] || "";
  };

  const pickBackdrop = (film: any) => {
    const candidates = [
      film.BackdropImageUrl,
      film.BannerImageUrl,
      film.FilmPosterUrl,
      film.FilmPosterThumbnailUrl,
      film.PosterUrl,
    ]
      .map(normalizeUrl)
      .filter(Boolean);

    return candidates[0] || "";
  };

  const filmMap = new Map<string, any>(
    films.map((film: any) => [String(film.Id), film])
  );

  const grouped = new Map<string, any>();

  for (const session of sessions) {
    const filmId = String(session.FilmId);
    const film = filmMap.get(filmId);

    if (!film) continue;

    if (!grouped.has(filmId)) {
      grouped.set(filmId, {
        id: String(film.Id),
        title: film.Title || "",
        rating: film.Rating || "",
        duration: film.Duration || 0,
        synopsis: film.Synopsis || "",
        poster: pickPoster(film),
        backdrop: pickBackdrop(film),
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
