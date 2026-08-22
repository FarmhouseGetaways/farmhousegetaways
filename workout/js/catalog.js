/* ==========================================================================
   The vocabulary: how hard a thing is, how many calories that comes to, and
   how to play a video of it.

   Nothing in here touches the page or the store. It is the arithmetic and the
   look-up tables, kept apart so both can be reasoned about on their own.
   ========================================================================== */

/* --------------------------------------------------------------------------
   Effort

   Every exercise carries an effort level rather than a number, because "heavy
   compound lifts" is a choice a person can make from a dropdown and "6.0" is
   not. The numbers are METs — multiples of resting metabolic rate — taken from
   the 2011 Compendium of Physical Activities, which is the same table fitness
   trackers and the NHS calculators use.

   The key is what gets stored. Renaming a label here is free; changing a key
   would orphan every workout already logged, so don't.
   -------------------------------------------------------------------------- */
export const EFFORTS = [
  { key: "mobility",  label: "Stretching or mobility",        met: 2.3 },
  { key: "yoga",      label: "Yoga",                          met: 2.5 },
  { key: "pilates",   label: "Pilates",                       met: 3.0 },
  { key: "core",      label: "Core and abs",                  met: 3.8 },
  { key: "light",     label: "Light weights",                 met: 3.5 },
  { key: "strength",  label: "Strength — moderate",           met: 5.0 },
  { key: "heavy",     label: "Strength — heavy or compound",  met: 6.0 },
  { key: "bodyweight",label: "Bodyweight",                    met: 8.0 },
  { key: "circuit",   label: "Circuit training",              met: 7.5 },
  { key: "hiit",      label: "HIIT or intervals",             met: 10.0 },
  { key: "jumprope",  label: "Jump rope",                     met: 11.0 },
  { key: "walk",      label: "Walking, brisk",                met: 4.3 },
  { key: "run",       label: "Running or jogging",            met: 8.0 },
  { key: "bike",      label: "Cycling",                       met: 7.0 },
  { key: "row",       label: "Rowing",                        met: 7.0 },
  { key: "swim",      label: "Swimming",                      met: 7.0 },
  { key: "dance",     label: "Dance or cardio class",         met: 6.5 },
];

/* Standing about between sets. Not nothing — she is on her feet, holding a
   dumbbell, breathing hard — but not the working rate either. */
export const REST_MET = 1.8;

const EFFORT_BY_KEY = Object.fromEntries(EFFORTS.map((e) => [e.key, e]));

export const effortOf = (key) => EFFORT_BY_KEY[key] || EFFORT_BY_KEY.strength;
export const effortLabel = (key) => effortOf(key).label;
export const metOf = (key) => effortOf(key).met;

/* --------------------------------------------------------------------------
   Calories

   The standard MET equation:

       kcal per minute  =  MET × 3.5 × body weight in kg ÷ 200

   It is an estimate and the app says so on screen. What makes this one better
   than the usual guess is that it is fed by measured time: the app knows how
   long each set actually took and how long the rest between them actually was,
   so a day she pushed through in twenty minutes and a day she took forty over
   the same sets do not come out the same.
   -------------------------------------------------------------------------- */
const LB_TO_KG = 0.45359237;

export function kcalFor({ met, seconds, weightLb }) {
  const kg = Math.max(0, Number(weightLb) || 0) * LB_TO_KG;
  const minutes = Math.max(0, Number(seconds) || 0) / 60;
  return (Number(met) || 0) * 3.5 * kg / 200 * minutes;
}

/**
 * Add up a whole session.
 *
 * Working time is charged at the exercise's own MET; the gaps between sets are
 * charged at the standing-about rate, and only if she has asked for them to
 * count. Anything unaccounted for — a pause, a phone call, the video buffering
 * — is charged at nothing at all, which is the honest answer.
 */
export function sessionCalories(session, settings = {}) {
  const weightLb = Number(settings.weightLb) || Number(session.weightLb) || 150;
  const countRest = settings.countRest !== false;

  let working = 0;
  for (const ex of session.exercises || []) {
    working += kcalFor({ met: metOf(ex.effort), seconds: ex.activeSec, weightLb });
  }

  const activeSec = (session.exercises || []).reduce((sum, ex) => sum + (ex.activeSec || 0), 0);

  /* The rest credited is capped, and this is not fussiness.
     A phone left running on a bench overnight would otherwise charge eight
     hours of "standing about" against the workout: a forty-minute session that
     really burned 181 calories would be logged as 1,253. Nothing poisons a
     record meant to encourage somebody faster than numbers it did not earn.
     Three minutes a set is generous for real training — long enough for heavy
     compound work with proper rests — and nowhere near long enough to invent a
     day's worth of calories out of a forgotten timer. */
  const restCap = REST_PER_SET_CAP * Math.max(0, Number(session.setsDone) || 0);
  const restSec = Math.min(Math.max(0, (session.elapsedSec || 0) - activeSec), restCap);
  const resting = countRest ? kcalFor({ met: REST_MET, seconds: restSec, weightLb }) : 0;

  return Math.round(working + resting);
}

/** The most rest, per completed set, the estimate will believe. */
export const REST_PER_SET_CAP = 180;

/* --------------------------------------------------------------------------
   Videos

   A video can arrive as any of five things, and the app has to know which so
   it can put it in the right kind of box. Anything unrecognised becomes a
   link rather than a broken player — better an honest "open the video" than a
   grey rectangle.
   -------------------------------------------------------------------------- */
const FILE = /\.(mp4|m4v|webm|ogv|ogg|mov)(\?|#|$)/i;

export function videoSource(url) {
  const raw = String(url || "").trim();
  if (!raw) return { kind: "none" };

  if (!/^https?:\/\//i.test(raw)) {
    /* Anything carrying a scheme is refused outright. An unrecognised link is
       offered to the page as <a href> and an embed as an iframe src, so a
       `javascript:` or `data:` string reaching either is script running on this
       origin. The server strips them on the way into storage, but the browser
       must not be relying on that: the editor renders what was typed before it
       has been anywhere near the server, and a plan can also be read straight
       from a committed file with no server involved at all. */
    if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) return { kind: "none" };

    // What is left is a relative path — a file dropped into workout/videos/,
    // or an upload at /media/<hash>. Same origin by definition, so it plays
    // inline and works with no signal once the browser has it.
    return FILE.test(raw) ? { kind: "file", src: raw } : { kind: "link", src: raw };
  }

  let u;
  try { u = new URL(raw); } catch { return { kind: "none" }; }
  const host = u.hostname.replace(/^www\./, "").toLowerCase();

  if (host === "youtu.be") return youtube(u.pathname.slice(1), u);
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    if (u.pathname.startsWith("/shorts/")) return youtube(u.pathname.split("/")[2], u);
    if (u.pathname.startsWith("/embed/")) return youtube(u.pathname.split("/")[2], u);
    const v = u.searchParams.get("v");
    if (v) return youtube(v, u);
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = (u.pathname.match(/(\d{6,})/) || [])[1];
    if (id) {
      return {
        kind: "embed",
        src: `https://player.vimeo.com/video/${id}?autoplay=1&muted=1&loop=1&title=0&byline=0&portrait=0`,
        still: `https://player.vimeo.com/video/${id}?title=0&byline=0&portrait=0`,
        provider: "Vimeo",
        href: u.href,
      };
    }
  }

  // Google Drive share links. The owner keeps photographs there already, so
  // videos will land there too — and a Drive "view" link shows a page, not a
  // video, unless it is turned into a /preview.
  if (host === "drive.google.com") {
    const id = (u.pathname.match(/\/file\/d\/([^/]+)/) || [])[1] || u.searchParams.get("id");
    if (id) {
      const src = `https://drive.google.com/file/d/${id}/preview`;
      return { kind: "embed", src, still: src, provider: "Google Drive", href: u.href };
    }
  }

  if (FILE.test(u.pathname)) return { kind: "file", src: u.href };

  return { kind: "link", src: u.href };
}

function youtube(id, u) {
  const clean = String(id || "").replace(/[^\w-]/g, "");
  if (!clean) return { kind: "link", src: u.href };
  // playlist= is what makes loop work on a single video — YouTube ignores
  // loop=1 on its own. muted=1 is what makes autoplay work at all on a phone.
  // enablejsapi is what lets the page tell the player to pause. Without it a
  // postMessage is ignored and the Pause button is a lie.
  const base = `https://www.youtube-nocookie.com/embed/${clean}?rel=0&modestbranding=1&playsinline=1&loop=1&enablejsapi=1&playlist=${clean}`;
  return {
    kind: "embed",
    src: `${base}&autoplay=1&mute=1`,
    still: base,
    provider: "YouTube",
    href: u.href,
  };
}

/* --------------------------------------------------------------------------
   Saying numbers out loud
   -------------------------------------------------------------------------- */

/** 0:45, 12:30, 1:04:12 — a clock, not a sentence. */
export function clock(seconds) {
  const s = Math.max(0, Math.round(Number(seconds) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

/** "40 min", "1 hr 5 min" — for a summary line, where a clock reads as a stopwatch. */
export function duration(seconds) {
  const mins = Math.round((Number(seconds) || 0) / 60);
  if (mins < 1) return "under a minute";
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} hr ${m} min` : `${h} hr`;
}

export const plural = (n, word, many) => `${n} ${n === 1 ? word : many || word + "s"}`;

/** "Today", "Yesterday", "Tue 19 Aug" — dates a person reads without decoding. */
export function niceDate(iso) {
  const d = new Date(iso + (iso.length === 10 ? "T12:00:00" : ""));
  if (Number.isNaN(d.getTime())) return iso;
  const today = new Date();
  const days = Math.round((startOfDay(today) - startOfDay(d)) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days > 1 && days < 7) return d.toLocaleDateString(undefined, { weekday: "long" });
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

export const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** Local date as YYYY-MM-DD. `toISOString` would give UTC and put an evening
    workout on tomorrow's card for anyone west of Greenwich — which is us. */
export function todayKey(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Monday=mon … Sunday=sun, matching the plan's day keys. */
export const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
export const DAY_NAMES = {
  mon: "Monday", tue: "Tuesday", wed: "Wednesday", thu: "Thursday",
  fri: "Friday", sat: "Saturday", sun: "Sunday",
};
export const DAY_SHORT = { mon: "Mon", tue: "Tue", wed: "Wed", thu: "Thu", fri: "Fri", sat: "Sat", sun: "Sun" };

/** JavaScript weeks start on Sunday; training weeks start on Monday. */
export const dayKeyOf = (date = new Date()) => DAY_KEYS[(date.getDay() + 6) % 7];
