import { NextResponse } from 'next/server';

type Film = {
  Id: string;
  Title: string;
  Rating?: string;
  Duration?: number;
  Synopsis?: string;
  FilmPosterUrl?: string;
  FilmPosterThumbnailUrl?: string;
  BackdropImageUrl?: string;
  FilmTrailerUrl?: string;
};

type WebSession = {
  Id: number;
  FilmId: string;
  FeatureStartTime?: string;
  PreShowStartTime?: string;
  URL?: string;
  TicketsSoldOut?: boolean;
  FewTicketsLeft?: boolean;
  FilmFormat?: string;
};

const fallbackMovies = [
  {
    id: 'fallback-1',
    title: 'Now Playing Example',
    rating: 'PG-13',
    duration: 122,
    synopsis: 'This preview card is shown until your live Veezi feed is connected in Vercel.',
    poster: '',
    backdrop: '',
    trailer: '',
    showtimes: [
      { sessionId: 1, time: new Date().toISOString(), url: '#', soldOut: false, fewTicketsLeft: true, format: '2D Digital' },
      { sessionId: 2, time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), url: '#', soldOut: false, fewTicketsLeft: false, format: '2D Digital' },
    ],
  },
];

export async function GET() {
  const token = process.env.VEEZI_API_TOKEN;

  if (!token) {
    return NextResponse.json(fallbackMovies);
  }

  const headers = {
    VeeziAccessToken: token,
    Accept: 'application/json',
  };

  try {
    const [filmsRes, sessionsRes] = await Promise.all([
      fetch('https://api.useast.veezi.com/v4/film', { headers, cache: 'no-store' }),
      fetch('https://api.useast.veezi.com/v1/websession', { headers, cache: 'no-store' }),
    ]);

    if (!filmsRes.ok || !sessionsRes.ok) {
      return NextResponse.json(fallbackMovies);
    }

    const films: Film[] = await filmsRes.json();
    const sessions: WebSession[] = await sessionsRes.json();

    const filmMap = new Map(films.map((film) => [film.Id, film]));
    const grouped = new Map<string, any>();

    for (const session of sessions) {
      const film = filmMap.get(session.FilmId);
      if (!film) continue;

      if (!grouped.has(session.FilmId)) {
        grouped.set(session.FilmId, {
          id: film.Id,
          title: film.Title,
          rating: film.Rating || '',
          duration: film.Duration || 0,
          synopsis: film.Synopsis || '',
          poster: film.FilmPosterUrl || film.FilmPosterThumbnailUrl || '',
          backdrop: film.BackdropImageUrl || '',
          trailer: film.FilmTrailerUrl || '',
          showtimes: [],
        });
      }

      grouped.get(session.FilmId).showtimes.push({
        sessionId: session.Id,
        time: session.FeatureStartTime || session.PreShowStartTime || '',
        url: session.URL || '#',
        soldOut: Boolean(session.TicketsSoldOut),
        fewTicketsLeft: Boolean(session.FewTicketsLeft),
        format: session.FilmFormat || '',
      });
    }

    const movies = Array.from(grouped.values())
      .map((movie: any) => ({
        ...movie,
        showtimes: movie.showtimes.sort((a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime()),
      }))
      .sort((a: any, b: any) => a.title.localeCompare(b.title));

    return NextResponse.json(movies.length ? movies : fallbackMovies);
  } catch {
    return NextResponse.json(fallbackMovies);
  }
}
