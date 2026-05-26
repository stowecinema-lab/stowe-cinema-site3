"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Film,
  MapPin,
  Menu,
  PartyPopper,
  Sparkles,
  Ticket,
  X,
  Martini,
} from "lucide-react";

type Showtime = {
  sessionId: number | string;
  time: string;
  url?: string;
  soldOut?: boolean;
  fewTicketsLeft?: boolean;
  format?: string;
};

type Movie = {
  id: string;
  title: string;
  rating?: string;
  duration?: number;
  openingDate?: string;
  synopsis?: string;
  poster?: string;
  posterCandidates?: string[];
  backdrop?: string;
  backdropCandidates?: string[];
  trailer?: string;
  showtimes: Showtime[];
};

type AdvanceBannerMovie = Movie & {
  firstShowtime: Showtime;
};

const VEEZI_TICKETING_URL =
  "https://ticketing.useast.veezi.com/sessions/?siteToken=vj2rd320rz8shtsprx8110dk9g";

const fallbackMovies: Movie[] = [
  {
    id: "fallback-1",
    title: "Now Playing Example",
    rating: "PG-13",
    duration: 122,
    synopsis:
      "This placeholder card is shown until your live Veezi feed is connected.",
    poster: "",
    posterCandidates: [],
    backdrop: "",
    backdropCandidates: [],
    trailer: "",
    showtimes: [
      {
        sessionId: 1,
        time: new Date().toISOString(),
        url: VEEZI_TICKETING_URL,
        soldOut: false,
        fewTicketsLeft: true,
        format: "2D Digital",
      },
      {
        sessionId: 2,
        time: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        url: VEEZI_TICKETING_URL,
        soldOut: false,
        fewTicketsLeft: false,
        format: "2D Digital",
      },
    ],
  },
];

function LogoMark() {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-[#7db3ff]/25 bg-[#77aef7]/15 px-4 py-2 text-white shadow-lg shadow-[#77aef7]/10 backdrop-blur">
      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#9ec5ff]/35 bg-[#9ec5ff]/10">
        <Film className="h-5 w-5 text-[#dcecff]" />
      </div>
      <div className="text-2xl font-semibold uppercase tracking-[0.18em] text-white">
        Stowe Cinema
      </div>
    </div>
  );
}

function formatRuntime(minutes?: number) {
  if (!minutes || Number.isNaN(minutes)) return null;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
}

function formatShowtime(dateString: string) {
  try {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
}

function parseCalendarDate(input: string | Date) {
  if (input instanceof Date) {
    return new Date(input);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const [year, month, day] = input.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  return new Date(input);
}

function formatLongDate(dateString: string) {
  try {
    return parseCalendarDate(dateString).toLocaleDateString([], {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

function normalizeDateKey(input: string | Date) {
  const d = parseCalendarDate(input);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
}

function isToday(date: Date) {
  return normalizeDateKey(date) === normalizeDateKey(new Date());
}

function getDateRange(days = 10) {
  return Array.from({ length: days }, (_, index) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + index);
    return d;
  });
}

function getNextWeekday(targetDay: number) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);

  const currentDay = date.getDay();
  let offset = (targetDay - currentDay + 7) % 7;
  if (offset === 0) offset = 7;

  date.setDate(date.getDate() + offset);
  return date;
}

function isTomorrow(date: Date) {
  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return normalizeDateKey(date) === normalizeDateKey(tomorrow);
}

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function isAdvanceMovie(movie: Movie) {
  const firstShowtime = movie.showtimes[0];
  if (!firstShowtime) return false;

  if (movie.openingDate) {
    return parseCalendarDate(movie.openingDate).getTime() > startOfToday().getTime();
  }

  return parseCalendarDate(firstShowtime.time).getTime() > startOfToday().getTime();
}

function getAdvanceMovies(movies: Movie[]) {
  return movies
    .filter((movie) => movie.showtimes.length > 0)
    .map((movie) => ({
      ...movie,
      firstShowtime: movie.showtimes
        .slice()
        .sort(
          (a, b) =>
            parseCalendarDate(a.time).getTime() -
            parseCalendarDate(b.time).getTime()
        )[0],
    }))
    .filter((movie) => movie.firstShowtime && isAdvanceMovie(movie))
    .sort(
      (a, b) =>
        parseCalendarDate(a.firstShowtime.time).getTime() -
        parseCalendarDate(b.firstShowtime.time).getTime()
    );
}

function groupShowtimesByDay(shows: Showtime[]) {
  return shows.reduce<Record<string, Showtime[]>>((acc, show) => {
    const key = normalizeDateKey(show.time);
    if (!acc[key]) acc[key] = [];
    acc[key].push(show);
    return acc;
  }, {});
}

function groupByDay(movies: Movie[]) {
  const grouped: Record<string, Array<Showtime & { movieTitle: string }>> = {};
  movies.forEach((movie) => {
    movie.showtimes.forEach((show) => {
      const key = normalizeDateKey(show.time);
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push({ ...show, movieTitle: movie.title });
    });
  });
  return grouped;
}

function filterMoviesForDate(movies: Movie[], selectedDate: string) {
  return movies
    .map((movie) => ({
      ...movie,
      showtimes: movie.showtimes.filter(
        (show) => normalizeDateKey(show.time) === selectedDate
      ),
    }))
    .filter((movie) => movie.showtimes.length > 0);
}

function MoviePoster({
  title,
  poster,
  posterCandidates = [],
}: {
  title: string;
  poster?: string;
  posterCandidates?: string[];
}) {
  const candidates = useMemo(() => {
    const list = [poster || "", ...posterCandidates].filter(Boolean);
    return Array.from(new Set(list));
  }, [poster, posterCandidates]);

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    setCurrentIndex(0);
  }, [title, poster, posterCandidates]);

  const currentPoster = candidates[currentIndex];

  if (currentPoster) {
    return (
      <img
        src={currentPoster}
        alt={title}
        className="h-full w-full object-cover"
        onError={() => {
          setCurrentIndex((prev) => prev + 1);
        }}
      />
    );
  }

  return (
    <div className="relative flex h-full w-full items-end overflow-hidden bg-[linear-gradient(180deg,rgba(119,174,247,0.16),rgba(8,15,27,0.98))] p-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(145,190,255,0.14),transparent_35%)]" />
      <div className="relative z-10">
        <div className="text-[10px] uppercase tracking-[0.25em] text-white/70">
          Now Playing
        </div>
        <div className="mt-2 text-2xl font-semibold leading-tight text-white">
          {title}
        </div>
      </div>
    </div>
  );
}

function ShowtimeChip({ show }: { show: Showtime }) {
  const soldOut = show.soldOut;
  const low = !soldOut && show.fewTicketsLeft;

  return (
    <a
      href={show.url || VEEZI_TICKETING_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`rounded-full border px-3 py-1.5 text-sm transition-all duration-200 ${
        soldOut
          ? "cursor-default border-white/10 bg-white/5 text-white/40"
          : "border-white/10 bg-white/5 text-white/90 hover:scale-105 hover:bg-[#77aef7] hover:text-[#09111e] hover:shadow-lg hover:shadow-[#77aef7]/20"
      }`}
    >
      {formatShowtime(show.time)}
      {soldOut ? " · Sold Out" : low ? " · Few Left" : ""}
    </a>
  );
}

function MovieCard({ movie }: { movie: Movie }) {
  const heroUrl = movie.poster || movie.backdrop;
  const firstValidUrl =
    movie.showtimes.find((s) => s.url)?.url || VEEZI_TICKETING_URL;
  const hasMultipleShowtimes = movie.showtimes.length > 1;

  return (
    <div className="group overflow-hidden rounded-[24px] border border-white/10 bg-[#111827] shadow-2xl shadow-black/25 transition duration-300 hover:-translate-y-1 hover:border-white/20">
      <div className="relative aspect-[2/3] overflow-hidden">
        <MoviePoster
          title={movie.title}
          poster={heroUrl}
          posterCandidates={[
            ...(movie.posterCandidates || []),
            ...(movie.backdropCandidates || []),
          ]}
        />
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-lg font-semibold text-white">{movie.title}</div>
            <div className="mt-1 text-sm text-white/60">
              {[movie.rating, formatRuntime(movie.duration)]
                .filter(Boolean)
                .join(" • ")}
            </div>
          </div>
          <Ticket className="mt-1 h-5 w-5 text-[#9fc4ff]" />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {movie.showtimes.slice(0, 8).map((show) => (
            <ShowtimeChip key={String(show.sessionId)} show={show} />
          ))}
        </div>

        {hasMultipleShowtimes ? (
          <div className="mt-4">
            <div className="block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-white/90">
              Select Showtime
            </div>
            <div className="mt-2 text-center text-xs text-white/50">
              Tap a showtime above to book that specific show.
            </div>
          </div>
        ) : (
          <a
            href={firstValidUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 block w-full rounded-xl bg-[#77aef7] px-4 py-3 text-center text-sm font-semibold text-[#09111e] transition hover:bg-[#90bdff]"
          >
            Buy Tickets
          </a>
        )}
      </div>
    </div>
  );
}

function AdvanceBanner({
  movie,
  onOpen,
}: {
  movie: AdvanceBannerMovie;
  onOpen: (movie: AdvanceBannerMovie) => void;
}) {
  const bannerImage = movie.backdrop || movie.poster;

  return (
    <button
      onClick={() => onOpen(movie)}
      className="group relative w-full overflow-hidden rounded-[28px] border border-white/10 bg-[#111827] text-left shadow-2xl shadow-black/30 transition duration-300 hover:-translate-y-1 hover:border-white/20"
    >
      <div className="relative min-h-[220px] md:min-h-[280px]">
        {bannerImage ? (
          <img
            src={bannerImage}
            alt={`${movie.title} advance tickets`}
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
          />
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,11,19,0.92)_0%,rgba(6,11,19,0.72)_48%,rgba(6,11,19,0.28)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,196,71,0.12),transparent_45%,rgba(6,11,19,0.35))]" />

        <div className="relative z-10 flex h-full flex-col justify-between p-5 md:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-amber-300/35 bg-amber-300/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-200">
              Advance Tickets
            </span>
            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/80">
              On Sale Now
            </span>
          </div>

          <div className="max-w-2xl">
            <div className="text-3xl font-semibold tracking-tight text-white md:text-5xl">
              {movie.title}
            </div>
            <div className="mt-3 text-sm uppercase tracking-[0.24em] text-white/65 md:text-base">
              Opens {formatLongDate(movie.openingDate || movie.firstShowtime.time)}
            </div>
            <div className="mt-4 max-w-xl text-sm leading-6 text-white/75 md:text-base md:leading-7">
              Reserve seats early and view every posted advance showtime for this release.
            </div>
            <div className="mt-5 inline-flex items-center gap-3 rounded-2xl bg-[#77aef7] px-5 py-3 text-sm font-semibold text-[#09111e] shadow-lg shadow-[#77aef7]/20 transition group-hover:bg-[#90bdff]">
              View Advance Showtimes
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}

function SectionHeading({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: string;
  text?: string;
}) {
  return (
    <div className="max-w-3xl">
      <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[#86b7ff]">
        {eyebrow}
      </div>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-5xl">
        {title}
      </h2>
      {text ? <p className="mt-4 text-base leading-7 text-white/70 md:text-lg">{text}</p> : null}
    </div>
  );
}

function InfoCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#7db3ff]/25 bg-[#77aef7]/10 text-[#9fc4ff]">
        {icon}
      </div>
      <h3 className="mt-5 text-2xl font-semibold text-white">{title}</h3>
      <p className="mt-3 leading-7 text-white/68">{text}</p>
    </div>
  );
}

function DateSelector({
  dates,
  selectedDate,
  onSelect,
  futureDateInputRef,
  handleFutureDateSelect,
}: {
  dates: Date[];
  selectedDate: string;
  onSelect: (dateKey: string) => void;
  futureDateInputRef: React.RefObject<HTMLInputElement | null>;
  handleFutureDateSelect: (value: string) => void;
}) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const selectedButton = container.querySelector<HTMLButtonElement>(
      `[data-date-key="${selectedDate}"]`
    );

    if (!selectedButton) return;

    selectedButton.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [selectedDate]);

  return (
    <div className="mt-4">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center gap-3">
          <div className="hidden h-[110px] w-[52px] shrink-0 items-center justify-center text-white/50 md:flex">
            <ChevronLeft className="h-8 w-8" />
          </div>

          <div
            ref={scrollContainerRef}
            className="flex flex-1 overflow-x-auto bg-black/30"
          >
            {dates.map((date) => {
              const key = normalizeDateKey(date);
              const active = key === selectedDate;

              return (
                <button
                  key={key}
                  data-date-key={key}
                  onClick={() => onSelect(key)}
                  className={`min-w-[150px] shrink-0 border-r border-white/5 px-6 py-5 text-center transition ${
                    active
                      ? "bg-red-600 text-white"
                      : "bg-black/40 text-white/60 hover:bg-black/55 hover:text-white/90"
                  }`}
                >
                  <div
                    className={`text-sm font-semibold ${
                      active ? "text-white/90" : "text-white/50"
                    }`}
                  >
                    {date.toLocaleDateString([], { month: "long" })}
                  </div>

                  <div className="mt-2 text-6xl font-bold leading-none">
                    {date.getDate()}
                  </div>

                  <div className="mt-2 text-sm font-semibold">
                    {isToday(date)
                      ? "Today"
                      : isTomorrow(date)
                        ? "Tomorrow"
                        : date.toLocaleDateString([], { weekday: "long" })}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="hidden h-[110px] w-[52px] shrink-0 items-center justify-center text-white/50 md:flex">
            <ChevronRight className="h-8 w-8" />
          </div>
        </div>

        <div className="mt-5 hidden justify-center md:flex">
          <input
            ref={futureDateInputRef}
            type="date"
            min={normalizeDateKey(new Date())}
            value={selectedDate}
            onChange={(e) => handleFutureDateSelect(e.target.value)}
            className="sr-only"
          />

          <button
            onClick={() => {
              const input = futureDateInputRef.current;
              if (!input) return;

              const nativeInput = input as HTMLInputElement & {
                showPicker?: () => void;
              };

              if (nativeInput.showPicker) {
                nativeInput.showPicker();
              } else {
                input.click();
              }
            }}
            className="inline-flex items-center gap-2 border-2 border-yellow-400 px-6 py-3 font-semibold text-yellow-300 transition hover:bg-yellow-400/10"
          >
            <CalendarDays className="h-5 w-5" />
            Select Future Date
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const [movies, setMovies] = useState<Movie[]>(fallbackMovies);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePage, setActivePage] = useState("home");
  const [selectedDate, setSelectedDate] = useState(normalizeDateKey(new Date()));
  const [selectedAdvanceMovieId, setSelectedAdvanceMovieId] = useState<string | null>(null);
  const futureDateInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let active = true;

    async function loadMovies() {
      try {
        const response = await fetch("/api/movies");
        if (!response.ok) throw new Error("Failed to load");
        const data = await response.json();
        if (!active) return;
        if (Array.isArray(data) && data.length > 0) {
          const patched = data.map((movie: Movie) => ({
            ...movie,
            showtimes: Array.isArray(movie.showtimes)
              ? movie.showtimes.map((show) => ({
                  ...show,
                  url: show.url || VEEZI_TICKETING_URL,
                }))
              : [],
          }));
          setMovies(patched);
        }
      } catch {
        // keep fallback
      }
    }

    loadMovies();
    return () => {
      active = false;
    };
  }, []);

  const groupedDays = useMemo(() => groupByDay(movies), [movies]);
  const advanceMovies = useMemo(() => getAdvanceMovies(movies), [movies]);
  const selectableDates = useMemo(() => getDateRange(10), []);
  const selectedDayMovies = useMemo(
    () => filterMoviesForDate(movies, selectedDate),
    [movies, selectedDate]
  );
  const selectedAdvanceMovie = useMemo(
    () =>
      advanceMovies.find((movie) => movie.id === selectedAdvanceMovieId) ||
      advanceMovies[0] ||
      null,
    [advanceMovies, selectedAdvanceMovieId]
  );

  useEffect(() => {
    if (!selectedAdvanceMovieId && advanceMovies[0]) {
      setSelectedAdvanceMovieId(advanceMovies[0].id);
    }
  }, [advanceMovies, selectedAdvanceMovieId]);

  const handleFutureDateSelect = (value: string) => {
    if (!value) return;
    setActivePage("home");
    setSelectedDate(value);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openAdvanceMovie = (movie: AdvanceBannerMovie) => {
    setSelectedAdvanceMovieId(movie.id);
    setSelectedDate(normalizeDateKey(movie.firstShowtime.time));
    setActivePage("advance-tickets");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pageLinks = [
    { id: "home", label: "Home" },
    { id: "advance-tickets", label: "Advance Tickets" },
    { id: "now-playing", label: "Now Playing" },
    { id: "showtimes", label: "Showtimes" },
    { id: "private-events", label: "Private Events" },
    { id: "green-room", label: "The Green Room" },
    { id: "contact", label: "Contact" },
  ];

  const HomePage = () => (
    <>
      <section className="border-b border-white/10 bg-[#08101b]">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="inline-flex items-center rounded-full border border-[#7db3ff]/20 bg-[#77aef7]/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.3em] text-[#a9cdff]">
            Now Playing in Stowe
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8 md:py-10">
        {advanceMovies.
