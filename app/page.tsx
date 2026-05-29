"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Film,
  Mail,
  MapPin,
  Menu,
  PartyPopper,
  Phone,
  Play,
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

type PageState = {
  page: string;
  selectedDate?: string;
  selectedAdvanceMovieId?: string | null;
  selectedMovieId?: string | null;
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
      "Showtimes are loading. Please check back in a moment for the latest schedule.",
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

function LogoMark({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-[14px] border border-[#8dbdff]/20 bg-[linear-gradient(135deg,rgba(14,22,36,0.94),rgba(7,12,22,0.9))] px-3 py-2 text-left text-white shadow-lg shadow-black/25 backdrop-blur transition hover:border-[#9fc4ff]/35 hover:bg-[linear-gradient(135deg,rgba(18,29,47,0.96),rgba(8,14,25,0.94))] sm:gap-3 sm:rounded-[20px] sm:px-4 sm:py-3"
      aria-label="Go to Stowe Cinema home"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-[12px] border border-[#9ec5ff]/28 bg-[linear-gradient(180deg,rgba(119,174,247,0.2),rgba(119,174,247,0.06))] sm:h-11 sm:w-11 sm:rounded-[14px]">
        <Film className="h-4 w-4 text-[#dcecff] sm:h-5 sm:w-5" />
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-[1rem] font-semibold uppercase tracking-[0.2em] text-white sm:text-[1.35rem] sm:tracking-[0.28em]">
          STOWE
        </span>
        <span className="mt-1 text-[0.58rem] font-medium uppercase tracking-[0.38em] text-[#9fc4ff] sm:text-[0.72rem] sm:tracking-[0.52em]">
          CINEMA
        </span>
      </div>
    </button>
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

function getUpcomingWeekendDate() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const day = today.getDay();

  if (day === 0) {
    return today;
  }

  const saturday = 6;
  const offset = (saturday - day + 7) % 7;
  today.setDate(today.getDate() + offset);
  return today;
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

function isPastShowtime(show: Showtime) {
  return new Date(show.time).getTime() < Date.now();
}

function scrollToPageTop() {
  const scroll = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  scroll();
  window.requestAnimationFrame(scroll);
  window.setTimeout(scroll, 80);
}

function getNextAvailableShowtime(movie: Movie) {
  return movie.showtimes
    .filter((show) => !isPastShowtime(show) && !show.soldOut)
    .sort(
      (a, b) =>
        parseCalendarDate(a.time).getTime() - parseCalendarDate(b.time).getTime()
    )[0];
}

function getMovieStatus(movie: Movie) {
  if (isAdvanceMovie(movie)) return "Advance Tickets";
  if (movie.showtimes.some((show) => show.fewTicketsLeft && !isPastShowtime(show))) {
    return "Few Tickets Left";
  }
  if (movie.showtimes.length > 0 && movie.showtimes.every((show) => show.soldOut)) {
    return "Sold Out";
  }
  if (movie.showtimes.length > 0 && movie.showtimes.every(isPastShowtime)) {
    return "Showtime Passed";
  }
  return "Now Playing";
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="mt-8 rounded-[24px] border border-white/10 bg-white/[0.04] p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#77aef7]/25 bg-[#77aef7]/10 text-[#9fc4ff]">
        <CalendarDays className="h-5 w-5" />
      </div>
      <div className="mx-auto mt-4 max-w-xl text-base leading-7 text-white/72">
        {message}
      </div>
    </div>
  );
}

function getTrailerEmbedUrl(url?: string) {
  if (!url) return "";

  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtube.com")) {
      const videoId = parsed.searchParams.get("v");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }
    if (parsed.hostname.includes("youtu.be")) {
      const videoId = parsed.pathname.replace("/", "");
      return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
    }
    if (parsed.hostname.includes("vimeo.com")) {
      const videoId = parsed.pathname.split("/").filter(Boolean)[0];
      return videoId ? `https://player.vimeo.com/video/${videoId}` : url;
    }
  } catch {
    return url;
  }

  return url;
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
  const past = isPastShowtime(show);
  const low = !soldOut && !past && show.fewTicketsLeft;

  if (past) {
    return (
      <span className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-semibold text-white/35 line-through">
        {formatShowtime(show.time)} - Passed
      </span>
    );
  }

  if (soldOut) {
    return (
      <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-semibold text-white/40">
        {formatShowtime(show.time)} - Sold Out
      </span>
    );
  }

  return (
    <a
      href={show.url || VEEZI_TICKETING_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-xl border border-[#a8ccff]/70 bg-[#77aef7] px-3 py-2 text-center text-sm font-bold text-[#07101c] shadow-lg shadow-[#77aef7]/18 transition-all duration-200 hover:scale-105 hover:bg-[#a8ccff] hover:shadow-[#77aef7]/30"
    >
      {formatShowtime(show.time)}
      {low ? " - Few Left" : ""}
    </a>
  );
}

function MovieCard({
  movie,
  onOpenDetails,
  onOpenTrailer,
}: {
  movie: Movie;
  onOpenDetails: (movie: Movie) => void;
  onOpenTrailer: (movie: Movie) => void;
}) {
  const heroUrl = movie.poster || movie.backdrop;
  const availableShowtimes = movie.showtimes.filter((show) => !isPastShowtime(show));
  const hasAvailableShowtimes = availableShowtimes.length > 0;
  const status = getMovieStatus(movie);
  const firstValidUrl =
    availableShowtimes.find((s) => s.url)?.url ||
    movie.showtimes.find((s) => s.url)?.url ||
    VEEZI_TICKETING_URL;
  const hasMultipleShowtimes = movie.showtimes.length > 1;
  const hasTrailer = Boolean(movie.trailer);

  return (
    <div className="group overflow-hidden rounded-[8px] border border-white/10 bg-[#101723] shadow-2xl shadow-black/25 transition duration-300 hover:-translate-y-1 hover:border-[#77aef7]/35">
      <button
        onClick={() => onOpenDetails(movie)}
        className="relative block aspect-[4/5] w-full overflow-hidden text-left sm:aspect-[2/3]"
        aria-label={`View details for ${movie.title}`}
      >
        <MoviePoster
          title={movie.title}
          poster={heroUrl}
          posterCandidates={[
            ...(movie.posterCandidates || []),
            ...(movie.backdropCandidates || []),
          ]}
        />
        <div className="absolute left-3 top-3 rounded-full border border-black/20 bg-black/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur">
          {status}
        </div>
      </button>

      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <button
              onClick={() => onOpenDetails(movie)}
              className="text-left text-xl font-semibold leading-tight text-white transition hover:text-[#9fc4ff]"
            >
              {movie.title}
            </button>
            <div className="mt-1 text-sm text-white/60">
              {[movie.rating, formatRuntime(movie.duration)]
                .filter(Boolean)
                .join(" / ")}
            </div>
          </div>
          <div className="mt-1 flex items-center gap-2">
            {hasTrailer ? (
              <button
                onClick={() => onOpenTrailer(movie)}
                aria-label={`Watch trailer for ${movie.title}`}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/78 transition hover:border-[#9fc4ff]/35 hover:bg-white/10 hover:text-white"
              >
                <Play className="ml-0.5 h-4 w-4" />
              </button>
            ) : null}
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#9fc4ff]/22 bg-[#77aef7]/10">
              <Ticket className="h-4 w-4 text-[#9fc4ff]" />
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5">
          {movie.showtimes.slice(0, 8).map((show) => (
            <ShowtimeChip key={String(show.sessionId)} show={show} />
          ))}
        </div>

        {!hasAvailableShowtimes ? (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center text-sm font-semibold text-white/45">
            All showtimes have passed
          </div>
        ) : hasMultipleShowtimes ? (
          <div className="mt-4">
            <div className="block w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-white/90">
              Select Showtime
            </div>
            <div className="mt-2 text-center text-xs text-white/50">
              Tap a showtime above to book that specific show.
            </div>
          </div>
        ) : (
          <div className="mt-4 grid gap-3">
            <a
              href={firstValidUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-xl bg-[#77aef7] px-4 py-3 text-center text-sm font-semibold text-[#09111e] transition hover:bg-[#90bdff]"
            >
              Buy Tickets
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function MovieCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#111827] shadow-2xl shadow-black/20">
      <div className="aspect-[2/3] animate-pulse bg-white/[0.06]" />
      <div className="space-y-4 p-4">
        <div className="h-5 w-3/4 animate-pulse rounded-full bg-white/[0.08]" />
        <div className="h-4 w-1/2 animate-pulse rounded-full bg-white/[0.06]" />
        <div className="flex gap-2">
          <div className="h-8 w-16 animate-pulse rounded-full bg-white/[0.06]" />
          <div className="h-8 w-16 animate-pulse rounded-full bg-white/[0.06]" />
        </div>
        <div className="h-11 animate-pulse rounded-xl bg-white/[0.06]" />
      </div>
    </div>
  );
}

function AdvanceTicketsSkeleton() {
  return (
    <div className="mb-10 rounded-[8px] border border-amber-300/18 bg-[linear-gradient(135deg,rgba(255,199,79,0.08),rgba(255,255,255,0.03))] p-4 md:p-6">
      <div className="h-4 w-40 animate-pulse rounded-full bg-amber-200/12" />
      <div className="mt-4 h-9 w-full max-w-lg animate-pulse rounded-full bg-white/[0.08]" />
      <div className="mt-3 h-5 w-full max-w-2xl animate-pulse rounded-full bg-white/[0.06]" />
      <div className="mt-6 h-[260px] animate-pulse rounded-[8px] bg-white/[0.06] md:h-[320px]" />
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
  const posterImage = movie.poster || movie.backdrop;

  return (
    <button
      onClick={() => onOpen(movie)}
      className="group relative w-full overflow-hidden rounded-[8px] border border-amber-300/20 bg-[#101723] text-left shadow-2xl shadow-black/30 transition duration-300 hover:-translate-y-1 hover:border-amber-200/45"
    >
      <div className="relative min-h-[260px] md:min-h-[320px]">
        {bannerImage ? (
          <img
            src={bannerImage}
            alt={`${movie.title} advance tickets`}
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
          />
        ) : null}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,11,19,0.96)_0%,rgba(6,11,19,0.82)_48%,rgba(6,11,19,0.35)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,196,71,0.16),transparent_45%,rgba(6,11,19,0.6))]" />

        <div className="relative z-10 grid min-h-[260px] gap-5 p-5 md:min-h-[320px] md:grid-cols-[150px_1fr] md:p-6">
          <div className="hidden overflow-hidden rounded-[8px] border border-white/12 shadow-xl shadow-black/40 md:block">
            <MoviePoster
              title={movie.title}
              poster={posterImage}
              posterCandidates={[
                ...(movie.posterCandidates || []),
                ...(movie.backdropCandidates || []),
              ]}
            />
          </div>

          <div className="flex max-w-2xl flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-amber-300/35 bg-amber-300/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-200">
                  Advance Tickets
                </span>
                <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
                  On Sale Now
                </span>
              </div>
              <div className="mt-5 text-3xl font-semibold tracking-tight text-white md:text-5xl">
                {movie.title}
              </div>
              <div className="mt-3 inline-flex rounded-full border border-white/10 bg-black/28 px-3 py-1 text-sm font-semibold uppercase tracking-[0.18em] text-white/72">
                Opens {formatLongDate(movie.openingDate || movie.firstShowtime.time)}
              </div>
              <div className="mt-4 max-w-xl text-sm leading-6 text-white/78 md:text-base md:leading-7">
                Reserve seats early for this upcoming release.
              </div>
            </div>

            <div className="mt-6 inline-flex w-fit items-center gap-3 rounded-2xl bg-amber-300 px-5 py-3 text-sm font-semibold text-[#171006] shadow-lg shadow-amber-300/20 transition group-hover:bg-amber-200">
              See Advance Showtimes
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

        <div className="mt-5 flex justify-center">
          <label className="relative inline-flex w-full max-w-md cursor-pointer items-center justify-center gap-3 rounded-2xl border border-[#7db3ff]/25 bg-[linear-gradient(135deg,rgba(20,33,53,0.96),rgba(10,18,32,0.96))] px-6 py-4 text-sm font-semibold uppercase tracking-[0.22em] text-[#d7e7ff] shadow-lg shadow-black/20 transition hover:border-[#9fc4ff]/45 hover:bg-[linear-gradient(135deg,rgba(28,46,72,0.98),rgba(13,23,39,0.98))] hover:text-white md:hidden">
            <input
              ref={futureDateInputRef}
              type="date"
              min={normalizeDateKey(new Date())}
              value={selectedDate}
              onChange={(e) => handleFutureDateSelect(e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#9ec5ff]/30 bg-[#77aef7]/12 text-[#9fc4ff]">
              <CalendarDays className="h-5 w-5" />
            </span>
            <span className="flex flex-col items-start text-left md:items-center md:text-center">
              <span className="text-[11px] tracking-[0.28em] text-white/55">
                Need a later date?
              </span>
              <span>Select Future Showtimes</span>
            </span>
          </label>

          <div className="hidden md:flex">
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
              className="inline-flex min-w-[320px] items-center justify-center gap-3 rounded-2xl border border-[#7db3ff]/25 bg-[linear-gradient(135deg,rgba(20,33,53,0.96),rgba(10,18,32,0.96))] px-6 py-4 text-sm font-semibold uppercase tracking-[0.22em] text-[#d7e7ff] shadow-lg shadow-black/20 transition hover:border-[#9fc4ff]/45 hover:bg-[linear-gradient(135deg,rgba(28,46,72,0.98),rgba(13,23,39,0.98))] hover:text-white"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#9ec5ff]/30 bg-[#77aef7]/12 text-[#9fc4ff]">
                <CalendarDays className="h-5 w-5" />
              </span>
              <span className="flex flex-col items-center text-center">
                <span className="text-[11px] tracking-[0.28em] text-white/55">
                  Need a later date?
                </span>
                <span>Select Future Showtimes</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickDateFilters({
  selectedDate,
  onSelect,
}: {
  selectedDate: string;
  onSelect: (dateKey: string) => void;
}) {
  const options = [
    { label: "Today", date: new Date() },
    { label: "Tomorrow", date: (() => {
      const date = new Date();
      date.setDate(date.getDate() + 1);
      return date;
    })() },
    { label: "Weekend", date: getUpcomingWeekendDate() },
  ];

  return (
    <div className="sticky top-[88px] z-30 -mx-6 mt-5 flex justify-center gap-2 overflow-x-auto border-y border-white/10 bg-[#060b13]/92 px-6 py-3 backdrop-blur md:static md:mx-0 md:flex-wrap md:border-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-0">
      {options.map((option) => {
        const key = normalizeDateKey(option.date);
        const active = selectedDate === key;

        return (
          <button
            key={option.label}
            onClick={() => onSelect(key)}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
              active
                ? "border-[#77aef7]/45 bg-[#77aef7] text-[#09111e]"
                : "border-white/10 bg-white/5 text-white/72 hover:border-white/20 hover:text-white"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default function Page() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loadingMovies, setLoadingMovies] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePage, setActivePage] = useState("home");
  const [selectedDate, setSelectedDate] = useState(normalizeDateKey(new Date()));
  const [selectedAdvanceMovieId, setSelectedAdvanceMovieId] = useState<string | null>(null);
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);
  const [trailerMovie, setTrailerMovie] = useState<Movie | null>(null);
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
        setMovies(fallbackMovies);
      } finally {
        if (active) setLoadingMovies(false);
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
  const selectedMovie = useMemo(
    () => movies.find((movie) => movie.id === selectedMovieId) || null,
    [movies, selectedMovieId]
  );
  const nextAvailableShowtime = useMemo(() => {
    return selectedDayMovies
      .flatMap((movie) =>
        movie.showtimes.map((show) => ({ movie, show }))
      )
      .filter(({ show }) => !isPastShowtime(show))
      .sort(
        (a, b) =>
          parseCalendarDate(a.show.time).getTime() -
          parseCalendarDate(b.show.time).getTime()
      )[0];
  }, [selectedDayMovies]);

  useEffect(() => {
    if (!selectedAdvanceMovieId && advanceMovies[0]) {
      setSelectedAdvanceMovieId(advanceMovies[0].id);
    }
  }, [advanceMovies, selectedAdvanceMovieId]);

  useEffect(() => {
    const initialState: PageState = {
      page: activePage,
      selectedDate,
      selectedAdvanceMovieId,
      selectedMovieId,
    };
    window.history.replaceState(initialState, "");

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state as PageState | null;
      if (!state?.page) return;

      setActivePage(state.page);
      if (state.selectedDate) setSelectedDate(state.selectedDate);
      setSelectedAdvanceMovieId(state.selectedAdvanceMovieId ?? null);
      setSelectedMovieId(state.selectedMovieId ?? null);
      setMenuOpen(false);
      scrollToPageTop();
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const goToPage = (
    page: string,
    options: {
      selectedDate?: string;
      selectedAdvanceMovieId?: string | null;
      selectedMovieId?: string | null;
      push?: boolean;
      scroll?: boolean;
    } = {}
  ) => {
    const nextState: PageState = {
      page,
      selectedDate: options.selectedDate ?? selectedDate,
      selectedAdvanceMovieId:
        options.selectedAdvanceMovieId !== undefined
          ? options.selectedAdvanceMovieId
          : selectedAdvanceMovieId,
      selectedMovieId:
        options.selectedMovieId !== undefined
          ? options.selectedMovieId
          : selectedMovieId,
    };

    setActivePage(page);
    if (options.selectedDate) setSelectedDate(options.selectedDate);
    if (options.selectedAdvanceMovieId !== undefined) {
      setSelectedAdvanceMovieId(options.selectedAdvanceMovieId);
    }
    if (options.selectedMovieId !== undefined) {
      setSelectedMovieId(options.selectedMovieId);
    }
    setMenuOpen(false);

    if (options.push !== false) {
      window.history.pushState(nextState, "");
    }

    if (options.scroll !== false) {
      scrollToPageTop();
    }
  };

  const handleFutureDateSelect = (value: string) => {
    if (!value) return;
    goToPage("home", { selectedDate: value });
  };

  const openAdvanceMovie = (movie: AdvanceBannerMovie) => {
    goToPage("advance-tickets", {
      selectedAdvanceMovieId: movie.id,
      selectedDate: normalizeDateKey(movie.firstShowtime.time),
    });
  };

  const openMovieDetails = (movie: Movie) => {
    goToPage("movie-details", { selectedMovieId: movie.id });
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
      <section id="showtimes" className="mx-auto max-w-7xl px-6 py-6 md:py-10">
        {loadingMovies ? (
          <AdvanceTicketsSkeleton />
        ) : advanceMovies.length > 0 ? (
          <div className="mb-10 rounded-[8px] border border-amber-300/18 bg-[linear-gradient(135deg,rgba(255,199,79,0.08),rgba(255,255,255,0.03))] p-4 md:p-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <SectionHeading
                eyebrow="Upcoming releases"
                title="Advance tickets on sale now."
                text="Reserve seats early for upcoming releases before opening weekend arrives."
              />
              <button
                onClick={() => goToPage("advance-tickets")}
                className="inline-flex w-fit items-center gap-2 rounded-2xl border border-amber-300/30 bg-amber-300/12 px-4 py-2 text-sm font-semibold text-amber-100 transition hover:bg-amber-300 hover:text-[#171006]"
              >
                View All Advance Tickets
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-6 flex snap-x gap-5 overflow-x-auto pb-3">
              {advanceMovies.slice(0, 3).map((movie) => (
                <div key={movie.id} className="min-w-full snap-center md:min-w-[72%] lg:min-w-[58%]">
                  <AdvanceBanner
                    movie={movie}
                    onOpen={openAdvanceMovie}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mb-6 text-center">
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#86b7ff]">
            {selectedDate === normalizeDateKey(new Date())
              ? "Today's Showtimes"
              : "Selected Date"}
          </div>
          <div className="text-3xl font-semibold tracking-tight text-white md:text-5xl">
            Showtimes
          </div>
          <div className="mt-2 text-sm uppercase tracking-[0.28em] text-[#86b7ff]">
            Select a date, then choose your movie and showtime
          </div>

          <div className="mx-auto mt-5 max-w-3xl rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm leading-6 text-white/75">
            Movies begin at the advertised showtime. Trailers and previews play before
            the listed start time.
          </div>
        </div>

        <QuickDateFilters selectedDate={selectedDate} onSelect={setSelectedDate} />

        <DateSelector
          dates={selectableDates}
          selectedDate={selectedDate}
          onSelect={setSelectedDate}
          futureDateInputRef={futureDateInputRef}
          handleFutureDateSelect={handleFutureDateSelect}
        />

        <div className="mt-8">
          <div className="mb-5 text-xl font-semibold text-white">
            {selectedDayMovies.length > 0
              ? formatLongDate(selectedDayMovies[0].showtimes[0].time)
              : formatLongDate(selectedDate)}
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {loadingMovies
              ? Array.from({ length: 4 }).map((_, index) => (
                  <MovieCardSkeleton key={index} />
                ))
              : selectedDayMovies.map((movie) => (
                  <MovieCard
                    key={movie.id}
                    movie={movie}
                    onOpenDetails={openMovieDetails}
                    onOpenTrailer={setTrailerMovie}
                  />
                ))}
          </div>

          {!loadingMovies && selectedDayMovies.length === 0 ? (
            <EmptyState message="Nothing is scheduled for this date yet. Try another day or check back soon for newly added showtimes." />
          ) : null}
        </div>

        <div className="mt-16 rounded-[32px] border border-[#77aef7]/30 bg-gradient-to-br from-[#0c1626] to-[#0a1220] p-8 text-center md:p-10">
          <div className="text-xs uppercase tracking-[0.3em] text-[#9fc4ff]">
            Weekly Special
          </div>

          <div className="mt-3 text-4xl font-semibold text-white md:text-5xl">
            $6 Tuesdays
          </div>

          <div className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-white/70">
            Every Tuesday, all movie tickets are just{" "}
            <span className="font-semibold text-white">$6</span>. The perfect excuse
            for a midweek movie night.
          </div>

          <div className="mt-6 flex justify-center">
            <button
              onClick={() => {
                goToPage("home", {
                  selectedDate: normalizeDateKey(getNextWeekday(2)),
                });
              }}
              className="rounded-2xl bg-[#77aef7] px-6 py-3 font-semibold text-[#09111e] transition hover:bg-[#90bdff]"
            >
              View Tuesday Showtimes
            </button>
          </div>
        </div>

        <div className="mt-10 rounded-[32px] border border-red-500/30 bg-gradient-to-br from-[#140b0b] to-[#0a0a0f] p-8 text-center md:p-10">
          <div className="text-xs uppercase tracking-[0.3em] text-red-400">
            Late Night Series
          </div>

          <div className="mt-3 text-4xl font-semibold text-white md:text-5xl">
            Late Night Wednesdays
          </div>

          <div className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-white/70">
            Every Wednesday night, we feature a rotating{" "}
            <span className="font-semibold text-white">FREE horror movie</span>. A
            different film every week on the big screen.
          </div>

          <div className="mt-6 flex justify-center">
            <button
              onClick={() => {
                goToPage("home", {
                  selectedDate: normalizeDateKey(getNextWeekday(3)),
                });
              }}
              className="rounded-2xl bg-red-500 px-6 py-3 font-semibold text-white transition hover:bg-red-400"
            >
              View Wednesday Showtimes
            </button>
          </div>
        </div>
      </section>
    </>
  );

  const NowPlayingPage = () => (
    <section className="mx-auto max-w-7xl px-6 py-10 md:py-12">
      <div className="mb-6 inline-flex items-center rounded-full border border-[#7db3ff]/20 bg-[#77aef7]/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.3em] text-[#a9cdff]">
        Now Playing
      </div>

      <QuickDateFilters selectedDate={selectedDate} onSelect={setSelectedDate} />

      <DateSelector
        dates={selectableDates}
        selectedDate={selectedDate}
        onSelect={setSelectedDate}
        futureDateInputRef={futureDateInputRef}
        handleFutureDateSelect={handleFutureDateSelect}
      />

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {loadingMovies
          ? Array.from({ length: 4 }).map((_, index) => (
              <MovieCardSkeleton key={index} />
            ))
          : selectedDayMovies.map((movie) => (
              <MovieCard
                key={movie.id}
                movie={movie}
                onOpenDetails={openMovieDetails}
                onOpenTrailer={setTrailerMovie}
              />
            ))}
      </div>

      {!loadingMovies && selectedDayMovies.length === 0 ? (
        <EmptyState message="Nothing is scheduled for this date yet. Try another day or check back soon for newly added showtimes." />
      ) : null}
    </section>
  );

  const AdvanceTicketsPage = () => {
    if (!selectedAdvanceMovie) {
      return (
        <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
          <SectionHeading
            eyebrow="Advance Tickets"
            title="No advance titles are posted right now."
            text="Check back soon for upcoming releases with advance tickets available."
          />
        </section>
      );
    }

    const groupedAdvanceShowtimes = Object.entries(
      groupShowtimesByDay(selectedAdvanceMovie.showtimes)
    ).sort(([a], [b]) => a.localeCompare(b));
    const heroImage = selectedAdvanceMovie.backdrop || selectedAdvanceMovie.poster;

    return (
      <section className="mx-auto max-w-7xl px-6 py-10 md:py-12">
        <div className="mb-6 flex flex-wrap gap-3">
          {advanceMovies.map((movie) => (
            <button
              key={movie.id}
              onClick={() => openAdvanceMovie(movie)}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                movie.id === selectedAdvanceMovie.id
                  ? "border-amber-300/40 bg-amber-300/15 text-amber-200"
                  : "border-white/10 bg-white/5 text-white/70 hover:border-white/20 hover:text-white"
              }`}
            >
              {movie.title}
            </button>
          ))}
        </div>

        <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#111827] shadow-2xl shadow-black/30">
          <div className="relative min-h-[280px] md:min-h-[360px]">
            {heroImage ? (
              <img
                src={heroImage}
                alt={`${selectedAdvanceMovie.title} advance tickets`}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : null}
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,11,19,0.95)_0%,rgba(6,11,19,0.72)_50%,rgba(6,11,19,0.32)_100%)]" />
            <div className="relative z-10 flex h-full flex-col justify-end p-6 md:p-10">
              <div className="max-w-3xl">
                <div className="mb-4 flex flex-wrap gap-3">
                  <span className="rounded-full border border-amber-300/35 bg-amber-300/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-200">
                    Advance Tickets
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/80">
                    On Sale Now
                  </span>
                </div>
                <h1 className="text-4xl font-semibold tracking-tight text-white md:text-6xl">
                  {selectedAdvanceMovie.title}
                </h1>
                <div className="mt-3 text-sm uppercase tracking-[0.24em] text-white/65 md:text-base">
                  Opens {formatLongDate(
                    selectedAdvanceMovie.openingDate || selectedAdvanceMovie.firstShowtime.time
                  )}
                </div>
                {selectedAdvanceMovie.synopsis ? (
                  <p className="mt-5 max-w-2xl text-sm leading-7 text-white/78 md:text-base">
                    {selectedAdvanceMovie.synopsis}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <SectionHeading
            eyebrow="Advance Showtimes"
            title="Pick your date and lock in seats early."
            text="Choose an available advance showtime below and reserve seats online."
          />
          <div className="mt-8 grid gap-6">
            {groupedAdvanceShowtimes.map(([day, shows]) => (
              <div
                key={day}
                className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6"
              >
                <div className="text-xl font-semibold text-white">
                  {formatLongDate(day)}
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  {shows
                    .slice()
                    .sort(
                      (a, b) =>
                        parseCalendarDate(a.time).getTime() -
                        parseCalendarDate(b.time).getTime()
                    )
                    .map((show) => (
                      <a
                        key={String(show.sessionId)}
                        href={show.url || VEEZI_TICKETING_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-2xl border border-[#a8ccff]/70 bg-[#77aef7] px-4 py-3 text-sm font-bold text-[#07101c] shadow-lg shadow-[#77aef7]/18 transition hover:bg-[#a8ccff] hover:shadow-[#77aef7]/30"
                      >
                        {formatShowtime(show.time)}
                      </a>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  const MovieDetailsPage = () => {
    if (!selectedMovie) {
      return (
        <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
          <SectionHeading
            eyebrow="Movie Details"
            title="Select a movie to view details."
            text="Choose any poster or movie title from the schedule to see showtimes, trailer, and ticket options."
          />
        </section>
      );
    }

    const heroImage = selectedMovie.backdrop || selectedMovie.poster;
    const groupedMovieShowtimes = Object.entries(
      groupShowtimesByDay(selectedMovie.showtimes)
    ).sort(([a], [b]) => a.localeCompare(b));
    const nextMovieShowtime = selectedMovie.showtimes
      .filter((show) => !isPastShowtime(show))
      .sort(
        (a, b) =>
          parseCalendarDate(a.time).getTime() -
          parseCalendarDate(b.time).getTime()
      )[0];

    return (
      <section className="mx-auto max-w-7xl px-6 py-10 md:py-12">
        <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#111827] shadow-2xl shadow-black/30">
          <div className="relative min-h-[420px]">
            {heroImage ? (
              <img
                src={heroImage}
                alt={selectedMovie.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : null}
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,11,19,0.96)_0%,rgba(6,11,19,0.76)_52%,rgba(6,11,19,0.35)_100%)]" />
            <div className="relative z-10 grid min-h-[420px] gap-8 p-6 md:grid-cols-[220px_1fr] md:p-10">
              <div className="max-w-[220px] overflow-hidden rounded-[22px] border border-white/10 shadow-2xl shadow-black/40">
                <MoviePoster
                  title={selectedMovie.title}
                  poster={selectedMovie.poster || selectedMovie.backdrop}
                  posterCandidates={[
                    ...(selectedMovie.posterCandidates || []),
                    ...(selectedMovie.backdropCandidates || []),
                  ]}
                />
              </div>
              <div className="flex flex-col justify-end">
                <div className="mb-4 flex flex-wrap gap-3">
                  {selectedMovie.rating ? (
                    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white/78">
                      {selectedMovie.rating}
                    </span>
                  ) : null}
                  {formatRuntime(selectedMovie.duration) ? (
                    <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-white/78">
                      {formatRuntime(selectedMovie.duration)}
                    </span>
                  ) : null}
                </div>
                <h1 className="text-4xl font-semibold tracking-tight text-white md:text-6xl">
                  {selectedMovie.title}
                </h1>
                {selectedMovie.synopsis ? (
                  <p className="mt-5 max-w-3xl text-base leading-7 text-white/76">
                    {selectedMovie.synopsis}
                  </p>
                ) : null}
                <div className="mt-7 flex flex-wrap gap-3">
                  {nextMovieShowtime ? (
                    <a
                      href={nextMovieShowtime.url || VEEZI_TICKETING_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-2xl bg-[#77aef7] px-5 py-3 font-semibold text-[#09111e] transition hover:bg-[#90bdff]"
                    >
                      <Ticket className="h-4 w-4" />
                      Buy Tickets
                    </a>
                  ) : null}
                  {selectedMovie.trailer ? (
                    <button
                      onClick={() => setTrailerMovie(selectedMovie)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/8 px-5 py-3 font-semibold text-white transition hover:bg-white/12"
                    >
                      <Play className="h-4 w-4" />
                      Watch Trailer
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <SectionHeading
            eyebrow="Showtimes"
            title="All posted showtimes."
            text="Choose an available showtime below to continue to ticket checkout."
          />
          <div className="mt-8 grid gap-6">
            {groupedMovieShowtimes.map(([day, shows]) => (
              <div
                key={day}
                className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6"
              >
                <div className="text-xl font-semibold text-white">
                  {formatLongDate(day)}
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  {shows
                    .slice()
                    .sort(
                      (a, b) =>
                        parseCalendarDate(a.time).getTime() -
                        parseCalendarDate(b.time).getTime()
                    )
                    .map((show) => (
                      <ShowtimeChip key={String(show.sessionId)} show={show} />
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  const ShowtimesPage = () => (
    <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
      <SectionHeading
        eyebrow="Showtimes"
        title="Browse the full Stowe Cinema schedule."
        text="Find showtimes by day and choose a movie to buy tickets online."
      />
      <div className="mt-10 grid gap-6">
        {Object.entries(groupedDays)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([day, shows]) => (
            <div key={day} className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
              <div className="text-xl font-semibold text-white">
                {formatLongDate(day)}
              </div>
              <div className="mt-4 grid gap-3">
                {shows.map((show) => {
                  const past = isPastShowtime(show);

                  return (
                    <div
                      key={String(show.sessionId)}
                      className={`flex flex-col justify-between gap-4 rounded-2xl border px-4 py-4 md:flex-row md:items-center ${
                        past
                          ? "border-white/5 bg-white/[0.03] text-white/40"
                          : "border-white/10 bg-black/20 text-white"
                      }`}
                    >
                      <div>
                        <div
                          className={`text-lg font-medium ${
                            past ? "text-white/40" : "text-white"
                          }`}
                        >
                          {show.movieTitle}
                        </div>
                        <div
                          className={`mt-1 text-sm ${
                            past
                              ? "text-white/35 line-through"
                              : "text-white/55"
                          }`}
                        >
                          {formatShowtime(show.time)}
                        </div>
                      </div>
                      {past ? (
                        <span className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-center text-sm font-semibold text-white/35">
                          Showtime Passed
                        </span>
                      ) : (
                        <a
                          href={show.url || VEEZI_TICKETING_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-xl border border-[#a8ccff]/70 bg-[#77aef7] px-4 py-2 text-center text-sm font-bold text-[#07101c] shadow-lg shadow-[#77aef7]/18 transition hover:bg-[#a8ccff]"
                        >
                          Buy Tickets
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
      </div>
    </section>
  );

  const PrivateEventsPage = () => (
    <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
      <SectionHeading
        eyebrow="Private Events"
        title="Private screenings, parties, and unforgettable group nights."
        text="Bring your group to Stowe Cinema for birthdays, company outings, fundraisers, sports watch events, and special celebrations."
      />
      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <InfoCard
          icon={<PartyPopper className="h-5 w-5" />}
          title="Private Screenings"
          text="Enjoy a premium big-screen experience for birthday parties, company events, fundraisers, sports watch parties, school groups, and more."
        />
        <InfoCard
          icon={<Sparkles className="h-5 w-5" />}
          title="Custom Event Options"
          text="Private events can include movie screenings, food and drink packages, and customized group experiences designed to make your event easy and memorable."
        />
      </div>
      <div className="mt-8 rounded-[32px] border border-white/10 bg-[#0d1624] p-8 text-white/72">
        Contact us at{" "}
        <a href="mailto:stowecinema@gmail.com" className="text-white underline">
          stowecinema@gmail.com
        </a>{" "}
        or call{" "}
        <a href="tel:8025853195" className="text-white underline">
          802-585-3195
        </a>{" "}
        to start planning your event.
      </div>
    </section>
  );

  const GreenRoomPage = () => (
    <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
      <SectionHeading
        eyebrow="The Green Room"
        title="Full Swing Golf, multisport simulators, and bar."
        text="Looking for something to do before or after the movie? Step into our cozy bar or reserve a simulator for one of the most realistic golf and multisport experiences around."
      />
      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        <InfoCard
          icon={<Martini className="h-5 w-5" />}
          title="Bar & Drinks"
          text="Nestled just steps from the cinema, The Green Room is the perfect place to unwind before or after your movie."
        />
        <InfoCard
          icon={<PartyPopper className="h-5 w-5" />}
          title="Private Room"
          text="A great spot for casual gatherings, parties, watch events, and private bookings."
        />
        <InfoCard
          icon={<Sparkles className="h-5 w-5" />}
          title="Golf & Multisport"
          text="Full Swing Golf with realistic ball flight plus baseball, soccer, basketball, zombie dodgeball, and more."
        />
      </div>

      <div className="mt-8">
        <Link
          href="https://www.thegreenroomstowe.com/"
          target="_blank"
          className="inline-flex rounded-2xl bg-[#77aef7] px-5 py-3 font-semibold text-[#09111e]"
        >
          Visit The Green Room
        </Link>
      </div>
    </section>
  );

  const ContactPage = () => (
    <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
      <SectionHeading
        eyebrow="Contact & Visit"
        title="Plan your visit to Stowe Cinema."
        text="Visit us in the heart of Stowe for first-run movies, great concessions, and a full cocktail bar."
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-[32px] border border-white/10 bg-[#0d1624] p-8">
          <div className="space-y-6 text-white/78">
            <div className="flex gap-3">
              <MapPin className="mt-1 h-5 w-5 text-[#8bbcff]" />
              <div>
                <div className="font-medium text-white">Address</div>
                <div>454 Mountain Road, Stowe, VT</div>
              </div>
            </div>

            <div className="flex gap-3">
              <CalendarDays className="mt-1 h-5 w-5 text-[#8bbcff]" />
              <div>
                <div className="font-medium text-white">Contact</div>
                <div>
                  <a href="tel:8025853195" className="underline">
                    802-585-3195
                  </a>
                </div>
                <div>
                  <a href="mailto:stowecinema@gmail.com" className="underline">
                    stowecinema@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-[#0d1624] p-8">
          <div className="text-2xl font-semibold text-white">About Stowe Cinema</div>
          <div className="mt-5 space-y-4 text-white/72 leading-7">
            <p>
              If you’re looking for an affordable, relaxing night out, you’ve come to
              the right place.
            </p>
            <p>
              Stowe Cinema shows first-run movies with a full concession stand and
              a full cocktail bar. Enjoy popcorn made with canola oil and served
              with real butter.
            </p>
            <p>
              Stowe Cinema has been located in Stowe since 1972, welcoming locals
              and visitors for relaxed nights at the movies.
            </p>
          </div>
        </div>
      </div>
    </section>
  );

  const renderPage = () => {
    switch (activePage) {
      case "now-playing":
        return <NowPlayingPage />;
      case "advance-tickets":
        return <AdvanceTicketsPage />;
      case "movie-details":
        return <MovieDetailsPage />;
      case "showtimes":
        return <ShowtimesPage />;
      case "private-events":
        return <PrivateEventsPage />;
      case "green-room":
        return <GreenRoomPage />;
      case "contact":
        return <ContactPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#060b13] pb-24 text-white md:pb-0">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(119,174,247,0.18),transparent_28%),linear-gradient(to_bottom,#0a1220,#060b13)]" />

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#08101b]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6 sm:py-4">
          <LogoMark
            onClick={() => {
              goToPage("home");
            }}
          />

          <nav className="hidden items-center gap-6 text-sm text-white/75 lg:flex">
            {pageLinks.map((item) => (
              <button
                key={item.id}
                onClick={() => goToPage(item.id)}
                className="transition hover:text-white"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <a
              href={VEEZI_TICKETING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl bg-[#77aef7] px-5 py-2.5 text-sm font-semibold text-[#09111e] shadow-lg shadow-[#77aef7]/15 transition hover:bg-[#90bdff]"
            >
              Buy Tickets
            </a>
          </div>

          <button
            className="rounded-xl border border-white/10 bg-white/5 p-2 lg:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {menuOpen ? (
          <div className="border-t border-white/10 px-6 py-4 lg:hidden">
            <div className="flex flex-col gap-3 text-white/85">
              {pageLinks.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    goToPage(item.id);
                  }}
                  className="rounded-xl bg-white/5 px-4 py-3 text-left"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </header>

      {renderPage()}

      {nextAvailableShowtime &&
      (activePage === "home" || activePage === "now-playing") ? (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#08101b]/96 p-3 shadow-2xl shadow-black/40 backdrop-blur md:hidden">
          <a
            href={nextAvailableShowtime.show.url || VEEZI_TICKETING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-2xl bg-[#77aef7] px-4 py-3 font-semibold text-[#09111e]"
          >
            <span>
              Next: {nextAvailableShowtime.movie.title} at{" "}
              {formatShowtime(nextAvailableShowtime.show.time)}
            </span>
            <Ticket className="h-5 w-5" />
          </a>
        </div>
      ) : null}

      {trailerMovie ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur">
          <div className="w-full max-w-4xl overflow-hidden rounded-[28px] border border-white/10 bg-[#08101b] shadow-2xl shadow-black/50">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="font-semibold text-white">{trailerMovie.title}</div>
              <button
                onClick={() => setTrailerMovie(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white"
                aria-label="Close trailer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="aspect-video bg-black">
              <iframe
                src={getTrailerEmbedUrl(trailerMovie.trailer)}
                title={`${trailerMovie.title} trailer`}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="flex justify-end px-5 py-4">
              <a
                href={trailerMovie.trailer || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-[#9fc4ff] underline"
              >
                Open trailer in new tab
              </a>
            </div>
          </div>
        </div>
      ) : null}

      <footer className="border-t border-white/10 bg-[#08101b]">
        <div className="mx-auto max-w-7xl px-6 py-12 text-center">
          <div className="text-2xl font-semibold text-white">Stowe Cinema</div>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 text-white/70 sm:flex-row sm:gap-6">
            <div className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#9fc4ff]" />
              454 Mountain Road, Stowe, VT
            </div>
            <a href="tel:8025853195" className="inline-flex items-center gap-2 transition hover:text-white">
              <Phone className="h-4 w-4 text-[#9fc4ff]" />
              802-585-3195
            </a>
            <a
              href="mailto:stowecinema@gmail.com"
              className="inline-flex items-center gap-2 transition hover:text-white"
            >
              <Mail className="h-4 w-4 text-[#9fc4ff]" />
              stowecinema@gmail.com
            </a>
          </div>
          <div className="mt-6 text-sm text-white/40">
            &copy; {new Date().getFullYear()} Stowe Cinema. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

