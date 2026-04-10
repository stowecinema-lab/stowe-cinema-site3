export async function GET() {
  const headers = {
    VeeziAccessToken: process.env.VEEZI_API_TOKEN || "",
    Accept: "application/json",
  };

  const [filmsRes, sessionsRes] = await Promise.all([
    fetch("https://api.useast.veezi.com/v4/film", { headers, cache: "no-store" }),
    fetch("https://api.useast.veezi.com/v1/websession", { headers, cache: "no-store" }),
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

  const films = await filmsRes.json();
  const sessions = await sessionsRes.json();

  const filmMap = new Map(films.map((film: any) => [film.Id, film]));
  const grouped = new Map<string, any>();

  for (const session of sessions) {
    const film = filmMap.get(session.FilmId);
    if (!film) continue;

    if (!grouped.has(session.FilmId)) {
      grouped.set(session.FilmId, {
        id: film.Id,
        title: film.Title,
        rating: film.Rating,
        duration: film.Duration,
        synopsis: film.Synopsis,
        poster: film.FilmPosterUrl || film.FilmPosterThumbnailUrl || "",
        backdrop: film.BackdropImageUrl || "",
        trailer: film.FilmTrailerUrl || "",
        showtimes: [],
      });
    }

    grouped.get(session.FilmId).showtimes.push({
      sessionId: session.Id,
      time: session.FeatureStartTime || session.PreShowStartTime,
      url:
        session.URL ||
        session.Url ||
        session.url ||
        "",
      soldOut: session.TicketsSoldOut,
      fewTicketsLeft: session.FewTicketsLeft,
      format: session.FilmFormat,
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
