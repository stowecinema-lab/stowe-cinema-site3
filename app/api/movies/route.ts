export const dynamic = "force-dynamic";

type CachedMovie = {
  id: string;
  showtimes: Array<{ sessionId: string | number; time: string }>;
  [key: string]: any;
};

let sameDayMovieMemory = new Map<string, CachedMovie>();
let sameDayMemoryKey = "";

function getNewYorkDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getShowDateKey(time?: string) {
  if (!time) return "";
  return String(time).split("T")[0];
}

function mergeRememberedSameDayMovies(movies: CachedMovie[]) {
  const todayKey = getNewYorkDateKey();

  if (sameDayMemoryKey !== todayKey) {
    sameDayMovieMemory = new Map();
    sameDayMemoryKey = todayKey;
  }

  for (const movie of movies) {
    const todayShowtimes = (movie.showtimes || []).filter(
      (show) => getShowDateKey(show.time) === todayKey
    );

    if (todayShowtimes.length > 0) {
      const remembered = sameDayMovieMemory.get(movie.id);
      const rememberedShowtimes = remembered?.showtimes || [];
      const bySessionId = new Map(
        [...rememberedShowtimes, ...todayShowtimes].map((show) => [
          String(show.sessionId),
          show,
        ])
      );

      sameDayMovieMemory.set(movie.id, {
        ...(remembered || movie),
        ...movie,
        showtimes: Array.from(bySessionId.values()),
      });
    }
  }

  const byMovieId = new Map(movies.map((movie) => [movie.id, movie]));

  for (const remembered of sameDayMovieMemory.values()) {
    const existing = byMovieId.get(remembered.id);

    if (!existing) {
      byMovieId.set(remembered.id, remembered);
      continue;
    }

    const bySessionId = new Map(
      [...(remembered.showtimes || []), ...(existing.showtimes || [])].map(
        (show) => [String(show.sessionId), show]
      )
    );

    byMovieId.set(existing.id, {
      ...remembered,
      ...existing,
      showtimes: Array.from(bySessionId.values()),
    });
  }

  return Array.from(byMovieId.values()).map((movie) => ({
    ...movie,
    showtimes: (movie.showtimes || []).sort(
      (a: any, b: any) =>
        new Date(a.time).getTime() - new Date(b.time).getTime()
    ),
  }));
}

export async function GET() {
  const headers = {
    VeeziAccessToken: process.env.VEEZI_API_TOKEN || "",
    Accept: "application/json",
  };

  const [filmsRes, sessionsRes, webSessionsRes] = await Promise.all([
    fetch("https://api.useast.veezi.com/v4/film", {
      headers,
      cache: "no-store",
    }),
    fetch("https://api.useast.veezi.com/v1/session", {
      headers,
      cache: "no-store",
    }),
    fetch("https://api.useast.veezi.com/v1/websession", {
      headers,
      cache: "no-store",
    }),
  ]);

  if (!filmsRes.ok || !sessionsRes.ok || !webSessionsRes.ok) {
    return new Response(
      JSON.stringify({
        error: "Failed to load Veezi data",
        filmStatus: filmsRes.status,
        sessionStatus: sessionsRes.status,
        webSessionStatus: webSessionsRes.status,
      }),
      { status: 500 }
    );
  }

  const films: any[] = await filmsRes.json();
  const sessions: any[] = await sessionsRes.json();
  const webSessions: any[] = await webSessionsRes.json();

  const normalizeUrl = (url?: string) => {
    if (!url) return "";
    return String(url).trim();
  };

  const unique = (values: string[]) =>
    Array.from(new Set(values.filter(Boolean)));

  const toImageCandidates = (url?: string) => {
    const clean = normalizeUrl(url);
    if (!clean) return [];
    return [clean, `/api/poster?url=${encodeURIComponent(clean)}`];
  };

  const expandImageCandidates = (urls: string[]) =>
    unique(urls.flatMap(toImageCandidates));

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
        film.LandscapeImageUrl,
        film.LandscapePosterUrl,
        film.HeroImageUrl,
        film.CoverImageUrl,
        film.WideImageUrl,
        film?.Images?.Backdrop,
        film?.Images?.BackdropUrl,
        film?.Images?.Banner,
        film?.Images?.BannerUrl,
        film?.Images?.Landscape,
        film?.Images?.LandscapeUrl,
        film?.Images?.Hero,
        film?.Images?.HeroUrl,
        film?.Media?.BackdropUrl,
        film?.Media?.BannerUrl,
        film?.Media?.LandscapeUrl,
        film?.Media?.HeroUrl,
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
  const webSessionUrlById = new Map(
    webSessions.map((session: any) => [
      String(session.Id),
      session.URL || session.Url || session.url || "",
    ])
  );

  const grouped = new Map<string, any>();

  const buildMovie = (film: any) => {
    const rawPosterCandidates = getPosterCandidates(film);
    const rawBackdropCandidates = getBackdropCandidates(film);

    const posterCandidates = expandImageCandidates(rawPosterCandidates);
    const backdropCandidates = expandImageCandidates(rawBackdropCandidates);

    return {
      id: String(film.Id),
      title: film.Title || "",
      rating: film.Rating || "",
      duration: film.Duration || 0,
      openingDate: film.OpeningDate || "",
      synopsis: film.Synopsis || "",
      poster: posterCandidates[0] || "",
      posterCandidates,
      backdrop: backdropCandidates[0] || "",
      backdropCandidates,
      trailer: film.FilmTrailerUrl || "",
      showtimes: [],
    };
  };

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  for (const session of sessions) {
    const showType = String(session.ShowType || "").toLowerCase();
    const status = String(session.Status || "").toLowerCase();
    if (showType && showType !== "public") continue;
    if (status && status !== "open") continue;

    const filmId = String(session.FilmId);
    const film = filmMap.get(filmId);
    const sessionTime = session.FeatureStartTime || session.PreShowStartTime;

    if (!film || !sessionTime) continue;

    if (!grouped.has(filmId)) {
      grouped.set(filmId, buildMovie(film));
    }

    grouped.get(filmId).showtimes.push({
      sessionId: String(session.Id),
      time: sessionTime,
      url:
        webSessionUrlById.get(String(session.Id)) ||
        session.URL ||
        session.Url ||
        session.url ||
        "",
      soldOut: !!session.TicketsSoldOut,
      fewTicketsLeft: !!session.FewTicketsLeft,
      format: session.FilmFormat || "",
    });
  }

  for (const film of films) {
    const filmId = String(film.Id);
    if (grouped.has(filmId) || !film.OpeningDate) continue;

    const openingDate = new Date(film.OpeningDate);
    if (Number.isNaN(openingDate.getTime())) continue;

    openingDate.setHours(0, 0, 0, 0);
    if (openingDate.getTime() >= startOfToday.getTime()) {
      grouped.set(filmId, buildMovie(film));
    }
  }

  const movies = Array.from(grouped.values()).map((movie: any) => ({
    ...movie,
    showtimes: movie.showtimes.sort(
      (a: any, b: any) =>
        new Date(a.time).getTime() - new Date(b.time).getTime()
    ),
  }));
  const rememberedMovies = mergeRememberedSameDayMovies(movies);

  return Response.json(rememberedMovies, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    },
  });
}
