'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Film,
  MapPin,
  Martini,
  Menu,
  PartyPopper,
  Sparkles,
  Ticket,
  X,
} from 'lucide-react';

type Showtime = {
  sessionId: number;
  time: string;
  url: string;
  soldOut?: boolean;
  fewTicketsLeft?: boolean;
  format?: string;
};

type Movie = {
  id: string;
  title: string;
  rating?: string;
  duration?: number;
  synopsis?: string;
  poster?: string;
  backdrop?: string;
  trailer?: string;
  showtimes: Showtime[];
};

const fallbackMovies: Movie[] = [
  {
    id: 'fallback-1',
    title: 'Now Playing Example',
    rating: 'PG-13',
    duration: 122,
    synopsis: 'This preview card is shown until your live Veezi feed is connected in Vercel.',
    showtimes: [
      { sessionId: 1, time: new Date().toISOString(), url: '#', fewTicketsLeft: true },
      { sessionId: 2, time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), url: '#' },
    ],
  },
  {
    id: 'fallback-2',
    title: 'Another Feature',
    rating: 'PG',
    duration: 98,
    synopsis: 'Today’s films will appear here with posters and direct ticket links.',
    showtimes: [{ sessionId: 3, time: new Date(Date.now() + 90 * 60 * 1000).toISOString(), url: '#' }],
  },
  {
    id: 'fallback-3',
    title: 'Late Night Feature',
    rating: 'R',
    duration: 110,
    synopsis: 'This layout is built to feel like a true movie theater website from the first second.',
    showtimes: [{ sessionId: 4, time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), url: '#', fewTicketsLeft: true }],
  },
  {
    id: 'fallback-4',
    title: 'Family Matinee',
    rating: 'PG',
    duration: 102,
    synopsis: 'Once Veezi is connected, the calendar and listings will populate by date automatically.',
    showtimes: [{ sessionId: 5, time: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), url: '#' }],
  },
];

const topLinks = [
  { id: 'showtimes', label: 'Showtimes' },
  { id: 'about', label: 'About Us' },
  { id: 'green-room', label: 'The Green Room' },
  { id: 'private-events', label: 'Private Events' },
  { id: 'contact', label: 'Contact' },
];

function formatShowtime(dateString: string) {
  try {
    return new Date(dateString).toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return dateString;
  }
}

function formatRuntime(minutes?: number) {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function groupByDay(movies: Movie[]) {
  const grouped: Record<string, Array<Showtime & { movieTitle: string; poster?: string; rating?: string }>> = {};
  movies.forEach((movie) => {
    movie.showtimes.forEach((show) => {
      const key = startOfDay(new Date(show.time)).toDateString();
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push({ ...show, movieTitle: movie.title, poster: movie.poster, rating: movie.rating });
    });
  });
  return grouped;
}


function LogoMark() {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-[#7db3ff]/25 bg-[#77aef7]/15 px-4 py-2 text-white shadow-lg shadow-[#77aef7]/10 backdrop-blur">
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#9ec5ff]/35 bg-[#9ec5ff]/10">
        <Film className="h-5 w-5 text-[#dcecff]" />
      </div>
      <div className="text-2xl font-semibold uppercase tracking-[0.18em] text-white">Stowe Cinema</div>
    </div>
  );
}

function MoviePoster({ title, poster }: { title: string; poster?: string }) {
  if (poster) {
    return <Image src={poster} alt={title} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" unoptimized />;
  }

  return (
    <div className="relative flex h-full w-full items-end overflow-hidden bg-[linear-gradient(180deg,rgba(119,174,247,0.14),rgba(8,15,27,0.98))] p-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(145,190,255,0.14),transparent_35%)]" />
      <div className="relative z-10">
        <div className="text-[10px] uppercase tracking-[0.25em] text-white/70">Now Playing</div>
        <div className="mt-2 text-2xl font-semibold leading-tight text-white">{title}</div>
      </div>
    </div>
  );
}

function ShowtimeChip({ show }: { show: Showtime }) {
  const soldOut = show.soldOut;
  const low = !soldOut && show.fewTicketsLeft;

  return (
    <a
      href={show.url || '#'}
      className={`rounded-full border px-3 py-1.5 text-sm transition ${
        soldOut ? 'cursor-default border-white/10 bg-white/5 text-white/40' : 'border-white/10 bg-white/5 text-white/90 hover:bg-white/10'
      }`}
    >
      {formatShowtime(show.time)}
      {soldOut ? ' · Sold Out' : low ? ' · Few Left' : ''}
    </a>
  );
}

function MovieCard({ movie }: { movie: Movie }) {
  return (
    <div className="group overflow-hidden rounded-[24px] border border-white/10 bg-[#111827] shadow-2xl shadow-black/25 transition duration-300 hover:-translate-y-1 hover:border-white/20">
      <div className="relative aspect-[2/3] overflow-hidden">
        <MoviePoster title={movie.title} poster={movie.poster || movie.backdrop} />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.18em] text-white/80">Now Playing</span>
          {movie.rating ? <span className="rounded-full border border-[#7db3ff]/25 bg-[#77aef7]/12 px-3 py-1 text-xs uppercase tracking-[0.18em] text-[#b5d3ff]">{movie.rating}</span> : null}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-white">{movie.title}</div>
            <div className="mt-1 text-sm text-white/60">{[movie.rating, formatRuntime(movie.duration)].filter(Boolean).join(' • ')}</div>
          </div>
          <Ticket className="mt-1 h-5 w-5 text-[#9fc4ff]" />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {movie.showtimes.map((show) => (
            <ShowtimeChip key={show.sessionId} show={show} />
          ))}
        </div>

        <a href={movie.showtimes[0]?.url || '#'} className="mt-4 block w-full rounded-xl bg-[#77aef7] px-4 py-3 text-center text-sm font-semibold text-[#09111e] transition hover:bg-[#90bdff]">
          Buy Tickets
        </a>
      </div>
    </div>
  );
}

function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <div className="max-w-3xl">
      <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[#86b7ff]">{eyebrow}</div>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-5xl">{title}</h2>
      {text ? <p className="mt-4 text-base leading-7 text-white/70 md:text-lg">{text}</p> : null}
    </div>
  );
}

function InfoCard({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#7db3ff]/25 bg-[#77aef7]/10 text-[#9fc4ff]">{icon}</div>
      <h3 className="mt-5 text-2xl font-semibold text-white">{title}</h3>
      <p className="mt-3 leading-7 text-white/68">{text}</p>
    </div>
  );
}

export default function StoweCinemaSite() {
  const [movies, setMovies] = useState<Movie[]>(fallbackMovies);
  const [status, setStatus] = useState<'loading' | 'ready' | 'fallback'>('loading');
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(startOfDay(new Date()));
  const [dayOffset, setDayOffset] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadMovies() {
      try {
        const response = await fetch('/api/movies', { cache: 'no-store' });
        if (!response.ok) throw new Error(`Request failed: ${response.status}`);
        const data = await response.json();
        if (!active) return;
        if (Array.isArray(data) && data.length > 0) {
          setMovies(data);
          setStatus('ready');
        } else {
          setStatus('fallback');
        }
      } catch {
        if (active) setStatus('fallback');
      }
    }

    loadMovies();
    return () => {
      active = false;
    };
  }, []);

  const availableDays = useMemo(() => {
    const sourceDates = movies.flatMap((movie) => movie.showtimes.map((show) => startOfDay(new Date(show.time)).getTime()));
    const unique = Array.from(new Set(sourceDates)).sort((a, b) => a - b);
    if (unique.length === 0) {
      return Array.from({ length: 10 }, (_, i) => new Date(startOfDay(new Date()).getTime() + i * 86400000));
    }
    return unique.map((t) => new Date(t));
  }, [movies]);

  useEffect(() => {
    const hasSelected = availableDays.some((day) => sameDay(day, selectedDay));
    if (!hasSelected && availableDays[0]) {
      setSelectedDay(availableDays[0]);
    }
  }, [availableDays, selectedDay]);

  const visibleDays = useMemo(() => availableDays.slice(dayOffset, dayOffset + 5), [availableDays, dayOffset]);

  const moviesForSelectedDay = useMemo(() => {
    return movies
      .map((movie) => ({
        ...movie,
        showtimes: movie.showtimes.filter((show) => sameDay(new Date(show.time), selectedDay)),
      }))
      .filter((movie) => movie.showtimes.length > 0);
  }, [movies, selectedDay]);

  const groupedDays = useMemo(() => groupByDay(movies), [movies]);

  const today = startOfDay(new Date());

  return (
    <div className="min-h-screen bg-[#060b13] text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(119,174,247,0.18),transparent_28%),linear-gradient(to_bottom,#0a1220,#060b13)]" />

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#08101b]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <LogoMark />

          <nav className="hidden items-center gap-6 text-sm text-white/75 lg:flex">
            {topLinks.map((item) => (
              <a key={item.id} href={`#${item.id}`} className="transition hover:text-white">
                {item.label}
              </a>
            ))}
          </nav>

          <a href="#showtimes" className="hidden rounded-2xl bg-[#77aef7] px-5 py-2.5 text-sm font-semibold text-[#09111e] shadow-lg shadow-[#77aef7]/15 transition hover:bg-[#90bdff] md:block">
            Buy Tickets
          </a>

          <button className="rounded-xl border border-white/10 bg-white/5 p-2 lg:hidden" onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle menu">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen ? (
          <div className="border-t border-white/10 px-6 py-4 lg:hidden">
            <div className="flex flex-col gap-3 text-white/85">
              {topLinks.map((item) => (
                <a key={item.id} href={`#${item.id}`} className="rounded-xl bg-white/5 px-4 py-3 text-left" onClick={() => setMenuOpen(false)}>
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        ) : null}
      </header>

      <section className="border-b border-white/10 bg-[#08101b]">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="inline-flex items-center rounded-full border border-[#7db3ff]/20 bg-[#77aef7]/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.3em] text-[#a9cdff]">
            Now Playing in Stowe
          </div>
        </div>
      </section>

      <section id="showtimes" className="mx-auto max-w-7xl px-6 py-8 md:py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <div className="text-3xl font-semibold tracking-tight text-white md:text-5xl">Now Playing</div>
            <div className="mt-2 text-sm uppercase tracking-[0.22em] text-white/45">Movies • Showtimes • Tickets</div>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.22em] text-[#9fc4ff]">
            {status === 'ready' ? 'Live from Veezi' : status === 'loading' ? 'Loading' : 'Preview'}
          </div>
        </div>

        <div className="mb-8 flex items-center gap-3 overflow-x-auto pb-2">
          <button
            onClick={() => setDayOffset((v) => Math.max(0, v - 1))}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          {visibleDays.map((day) => {
            const isToday = sameDay(day, today);
            const isActive = sameDay(day, selectedDay);
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(day)}
                className={`min-w-[130px] rounded-[20px] border p-4 text-left transition ${
                  isActive ? 'border-red-600 bg-red-600 text-white' : 'border-white/10 bg-[#09111e] text-white/70 hover:bg-white/10'
                }`}
              >
                <div className="text-sm font-semibold">{day.toLocaleDateString([], { month: 'long' })}</div>
                <div className="mt-3 text-5xl font-bold leading-none">{day.getDate()}</div>
                <div className="mt-3 text-sm font-semibold">{isToday ? 'Today' : day.toLocaleDateString([], { weekday: 'long' })}</div>
              </button>
            );
          })}

          <button
            onClick={() => setDayOffset((v) => Math.min(Math.max(0, availableDays.length - 5), v + 1))}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-2xl border border-[#e0bc54]/40 px-5 py-3 text-sm font-semibold text-[#e0bc54]">
            <CalendarDays className="h-4 w-4" />
            Select Future Date
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {moviesForSelectedDay.map((movie) => (
            <MovieCard key={`${movie.id}-${selectedDay.toISOString()}`} movie={movie} />
          ))}
        </div>
      </section>

      <section id="about" className="border-t border-white/10 bg-[#0a1220]">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
          <SectionHeading eyebrow="About Us" title="A Stowe movie night with history, comfort, and a little fun." />
          <div className="mt-10 rounded-[32px] border border-white/10 bg-[#0d1624] p-8 text-lg leading-8 text-white/76">
            <p>
              If you’re looking for an affordable, relaxing night out, you’ve come to the right place.
            </p>
            <p className="mt-5">
              At <span className="font-semibold text-white">Stowe Cinema</span>, we show first-run movies with a full concession stand and a full cocktail bar. We offer the best popcorn in town, made with canola oil and served with real butter.
            </p>
            <p className="mt-5">
              Stowe Cinema has been part of the community since 1972. Let us put our experience to work and entertain you for the night.
            </p>
          </div>
        </div>
      </section>

      <section id="green-room" className="border-t border-white/10 bg-[#08101b]">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
          <SectionHeading eyebrow="The Green Room" title="Full Swing Golf, multisport simulators, and a bar just steps from the cinema." />
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <InfoCard
              icon={<Sparkles className="h-5 w-5" />}
              title="Real Ball Flight"
              text="The only simulator that measures your ball at impact with an overhead ION3 camera and in-flight with infrared technology and high-speed blue light LED cameras for realistic ball flight with no delay."
            />
            <InfoCard
              icon={<PartyPopper className="h-5 w-5" />}
              title="Multisport for All Ages"
              text="The multisport package includes baseball, soccer, basketball, zombie dodgeball, and more, making it fun whether you are there for serious golf or a group outing."
            />
            <InfoCard
              icon={<Martini className="h-5 w-5" />}
              title="Bar Experience"
              text="Looking for something to do before or after the movie? Step into our cozy bar for drinks, conversation, and a polished pre- or post-movie night experience."
            />
          </div>
          <div className="mt-8">
            <Link href="https://www.thegreenroomstowe.com/" className="inline-flex rounded-2xl bg-[#77aef7] px-6 py-3 font-semibold text-[#09111e] transition hover:bg-[#90bdff]">
              Visit The Green Room
            </Link>
          </div>
        </div>
      </section>

      <section id="private-events" className="border-t border-white/10 bg-[#0a1220]">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
          <SectionHeading eyebrow="Private Events" title="Private screenings, parties, and group nights deserve a premium presentation." text="I left this section ready for your rental pricing, event packages, and booking information so we can drop your old-site details straight in." />
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <InfoCard icon={<PartyPopper className="h-5 w-5" />} title="Private Screenings" text="Birthday parties, company events, fundraisers, and sports watch nights all belong on a dedicated premium rentals page." />
            <InfoCard icon={<Sparkles className="h-5 w-5" />} title="Ready for Your Details" text="Send your private-event pricing, food packages, and policies and I’ll lay them into this section cleanly." />
          </div>
        </div>
      </section>

      <section id="contact" className="border-t border-white/10 bg-[#08101b]">
        <div className="mx-auto max-w-7xl px-6 py-16 md:py-20">
          <SectionHeading eyebrow="Contact & Visit" title="Everything guests need to find you quickly." />
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="rounded-[32px] border border-white/10 bg-[#0d1624] p-8">
              <div className="space-y-5 text-white/78">
                <div className="flex gap-3"><MapPin className="mt-1 h-5 w-5 text-[#8bbcff]" /><div><div className="font-medium text-white">Address</div><div>454 Mountain Road, Stowe, VT</div></div></div>
                <div className="flex gap-3"><CalendarDays className="mt-1 h-5 w-5 text-[#8bbcff]" /><div><div className="font-medium text-white">Hours & special nights</div><div>Add your current hours and any recurring promotions here.</div></div></div>
              </div>
            </div>
            <div className="rounded-[32px] border border-white/10 bg-[#0d1624] p-8 text-white/72">
              <div className="text-2xl font-semibold text-white">Still to add from your old site</div>
              <div className="mt-5 space-y-3">
                <p>Exact hours of operation</p>
                <p>Phone numbers and contact emails</p>
                <p>FAQ or policies</p>
                <p>Any other text you want moved over word-for-word</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10 bg-[#08101b]">
  <div className="mx-auto max-w-7xl px-6 py-12 text-center">
    <div className="text-2xl font-semibold text-white">
      Stowe Cinema
    </div>

    <div className="mt-4 text-white/70">
      454 Mountain Road, Stowe, VT
    </div>

    <div className="mt-2 text-white/70">
      📞 802-585-3195
    </div>

    <div className="mt-2 text-white/70">
      ✉️ stowecinema@gmail.com
    </div>

    <div className="mt-6 text-sm text-white/40">
      © {new Date().getFullYear()} Stowe Cinema. All rights reserved.
    </div>
  </div>
</footer>
</div>
);
}
