"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
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
  synopsis?: string;
  poster?: string;
  backdrop?: string;
  trailer?: string;
  showtimes: Showtime[];
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
    backdrop: "",
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
  {
    id: "fallback-2",
    title: "Another Feature",
    rating: "PG",
    duration: 98,
    synopsis: "Live posters, showtimes, and ticket links will load here from Veezi.",
    poster: "",
    backdrop: "",
    trailer: "",
    showtimes: [
      {
        sessionId: 3,
        time: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
        url: VEEZI_TICKETING_URL,
        soldOut: false,
        fewTicketsLeft: false,
        format: "2D Digital",
      },
    ],
  },
  {
    id: "fallback-3",
    title: "Late Night Feature",
    rating: "R",
    duration: 110,
    synopsis:
      "This layout is built so your Veezi movie feed can replace all placeholder content automatically.",
    poster: "",
    backdrop: "",
    trailer: "",
    showtimes: [
      {
        sessionId: 4,
        time: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        url: VEEZI_TICKETING_URL,
        soldOut: false,
        fewTicketsLeft: true,
        format: "2D Digital",
      },
    ],
  },
  {
    id: "fallback-4",
    title: "Family Matinee",
    rating: "PG",
    duration: 102,
    synopsis:
      "Use this preview while deployment is happening, then swap to your live feed as soon as the token is added to Vercel.",
    poster: "",
    backdrop: "",
    trailer: "",
    showtimes: [
      {
        sessionId: 5,
        time: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
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

function formatDay(dateString: string) {
  try {
    return new Date(dateString).toLocaleDateString([], {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

function groupByDay(movies: Movie[]) {
  const grouped: Record<string, Array<Showtime & { movieTitle: string }>> = {};
  movies.forEach((movie) => {
    movie.showtimes.forEach((show) => {
      const key = new Date(show.time).toDateString();
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push({ ...show, movieTitle: movie.title });
    });
  });
  return grouped;
}

function MoviePoster({ title, poster }: { title: string; poster?: string }) {
  if (poster) {
    return <img src={poster} alt={title} className="h-full w-full object-cover" />;
  }

  return (
    <div className="relative flex h-full w-full items-end overflow-hidden bg-[linear-gradient(180deg,rgba(119,174,247,0.14),rgba(8,15,27,0.98))] p-5">
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
      className={`rounded-full border px-3 py-1.5 text-sm transition ${
        soldOut
          ? "cursor-default border-white/10 bg-white/5 text-white/40"
          : "border-white/10 bg-white/5 text-white/90 hover:bg-white/10"
      }`}
    >
      {formatShowtime(show.time)}
      {soldOut ? " · Sold Out" : low ? " · Few Left" : ""}
    </a>
  );
}

function MovieCard({ movie }: { movie: Movie }) {
  const heroUrl = movie.poster || movie.backdrop;

  return (
    <div className="group overflow-hidden rounded-[24px] border border-white/10 bg-[#111827] shadow-2xl shadow-black/25 transition duration-300 hover:-translate-y-1 hover:border-white/20">
      <div className="relative aspect-[2/3] overflow-hidden">
        <MoviePoster title={movie.title} poster={heroUrl} />
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

        <a
          href={movie.showtimes.find((s) => s.url)?.url || VEEZI_TICKETING_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 block w-full rounded-xl bg-[#77aef7] px-4 py-3 text-center text-sm font-semibold text-[#09111e] transition hover:bg-[#90bdff]"
        >
          Buy Tickets
        </a>
      </div>
    </div>
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

export default function StoweCinemaSite() {
  const [movies, setMovies] = useState<Movie[]>(fallbackMovies);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePage, setActivePage] = useState("home");

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
                  url: show.url && show.url !== "#" ? show.url : VEEZI_TICKETING_URL,
                }))
              : [],
          }));
          setMovies(patched);
        }
      } catch {
        # keep fallback
        pass
      }
    }

    loadMovies();
    return () => {
      active = false;
    };
  }, []);

  const groupedDays = useMemo(() => groupByDay(movies), [movies]);

  const pageLinks = [
    { id: "home", label: "Home" },
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
        <div className="mb-6">
          <div className="text-3xl font-semibold tracking-tight text-white md:text-5xl">
            Now Playing
          </div>
          <div className="mt-2 text-sm uppercase tracking-[0.22em] text-white/45">
            Movies • Showtimes • Tickets
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
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
            <a
              href={VEEZI_TICKETING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl bg-[#77aef7] px-6 py-3 font-semibold text-[#09111e] transition hover:bg-[#90bdff]"
            >
              View Tuesday Showtimes
            </a>
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
            <span className="font-semibold text-white">horror movie</span>. A different
            film every week on the big screen.
          </div>

          <div className="mt-6 flex justify-center">
            <a
              href={VEEZI_TICKETING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-2xl bg-red-500 px-6 py-3 font-semibold text-white transition hover:bg-red-400"
            >
              View Wednesday Showtimes
            </a>
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
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </section>
  );

  const ShowtimesPage = () => (
    <section className="mx-auto max-w-7xl px-6 py-16 md:py-20">
      <SectionHeading
        eyebrow="Showtimes"
        title="A full schedule page built for fast checkout."
        text="Grouped by day, clean on mobile, and focused on getting people into checkout quickly."
      />
      <div className="mt-10 grid gap-6">
        {Object.entries(groupedDays).map(([day, shows]) => (
          <div key={day} className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
            <div className="text-xl font-semibold text-white">
              {formatDay(shows[0]?.time || day)}
            </div>
            <div className="mt-4 grid gap-3">
              {shows.map((show) => (
                <div
                  key={String(show.sessionId)}
                  className="flex flex-col justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 px-4 py-4 md:flex-row md:items-center"
                >
                  <div>
                    <div className="text-lg font-medium text-white">{show.movieTitle}</div>
                    <div className="mt-1 text-sm text-white/55">{formatShowtime(show.time)}</div>
                  </div>
                  <a
                    href={show.url || VEEZI_TICKETING_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-xl bg-[#77aef7] px-4 py-2 text-sm font-semibold text-[#09111e]"
                  >
                    Buy Tickets
                  </a>
                </div>
              ))}
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
        text="Host your next birthday party, company outing, fundraiser, sports watch event, or special celebration at Stowe Cinema."
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
        Contact us at <a href="mailto:stowecinema@gmail.com" className="text-white underline">stowecinema@gmail.com</a> or call <a href="tel:8025853195" className="text-white underline">802-585-3195</a> to start planning your event.
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
        title="Everything guests need to find you quickly."
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
                <div><a href="tel:8025853195" className="underline">802-585-3195</a></div>
                <div><a href="mailto:stowecinema@gmail.com" className="underline">stowecinema@gmail.com</a></div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-[#0d1624] p-8">
          <div className="text-2xl font-semibold text-white">About Stowe Cinema</div>
          <div className="mt-5 space-y-4 text-white/72 leading-7">
            <p>If you’re looking for an affordable, relaxing night out, you’ve come to the right place.</p>
            <p>
              At Stowe Cinema we show first-run movies with a full concession stand and a full cocktail bar.
              We offer the best popcorn in town, made with canola oil and served with real butter.
            </p>
            <p>
              Stowe Cinema has been located in Stowe since 1972. Let us put our experience to work and entertain you for the night.
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
    <div className="min-h-screen bg-[#060b13] text-white">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,rgba(119,174,247,0.18),transparent_28%),linear-gradient(to_bottom,#0a1220,#060b13)]" />

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#08101b]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <LogoMark />

          <nav className="hidden items-center gap-6 text-sm text-white/75 lg:flex">
            {pageLinks.map((item) => (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
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
                    setActivePage(item.id);
                    setMenuOpen(false);
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

      <footer className="border-t border-white/10 bg-[#08101b]">
        <div className="mx-auto max-w-7xl px-6 py-12 text-center">
          <div className="text-2xl font-semibold text-white">Stowe Cinema</div>

          <div className="mt-4 text-white/70">454 Mountain Road, Stowe, VT</div>

          <div className="mt-2 text-white/70">📞 802-585-3195</div>

          <div className="mt-2 text-white/70">✉️ stowecinema@gmail.com</div>

          <div className="mt-6 text-sm text-white/40">
            © {new Date().getFullYear()} Stowe Cinema. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
