"""Build /experiences/index.html: one page listing every micro-site, each shown with the same picture a texted link
shows (its og card), its name, one line, its address, and an Explore pill (Cory, 10 Oct 2026: "make a cool page
dedicated to our amazing micro-sites... experience the Farmhouse Getaways magic").

Head, masthead, footer and tracking are taken from ramona.html so the page stays in step with the site; the
Lodgify box and ramona's own meta are dropped. Re-run after adding a micro-site:  python tools/build_experiences.py
The tiny home page (/imm/) is left off on purpose: the main site does not name the tiny home.
"""
import pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent
src = (ROOT / "ramona.html").read_text(encoding="utf-8")

G = "https://farmhousegetaways.com"
SITES = {
    "Red Barn Ranch": [
        ("The Barn", f"{G}/thebarn/", f"{G}/thebarn/images/og-thebarn-card.jpg", "Twenty-two hundred square feet where the whole family ends up."),
        ("The Oasis", f"{G}/theoasis/", f"{G}/theoasis/images/og-theoasis-card.jpg", "A pool and a spa together in one fully gated area."),
        ("The Bird Garden", f"{G}/birdgarden/", f"{G}/birdgarden/images/og-birdgarden-card.jpg", "Peacocks, ducks and hens, all of them used to visitors."),
        ("Mini Barn Market", "https://minibarnmarket.com/", "https://minibarnmarket.com/images/og-mbm-card.jpg", "Our honor-system farm stand at the back gate, open 24 hours."),
    ],
    "Mountain Retreat": [
        ("Boulder Oak Arcade", f"{G}/arcade/", f"{G}/arcade/images/og-arcade-card.jpg", "An arcade you can sit down in."),
        ("Boulder Oak Disc Golf", "https://boulderoakdiscgolf.com/", "https://boulderoakdiscgolf.com/images/og.png", "Our own three-hole course, with a leaderboard for your whole group."),
        ("Hillside Horseshoes", f"{G}/horseshoes/", f"{G}/horseshoes/images/og-horseshoes-card.jpg", "A regulation pit across the stream, with its own scoring system."),
        ("Dos Picos County Park", f"{G}/dospicos/", f"{G}/dospicos/images/og-dospicos-card.jpg", "Bordering the property, just a short walk."),
        ("The Lodge", f"{G}/thelodge/", f"{G}/thelodge/images/og-thelodge-card.jpg", "A new farm stand, coming soon."),
    ],
}


def card(name, url, img, line):
    ext = "" if url.startswith(G) else ' target="_blank" rel="noopener"'
    shown = re.sub(r"^https://", "", url).rstrip("/")
    return f'''        <li class="xp-card">
          <a class="xp-img" href="{url}"{ext} aria-label="{name}"><img src="{img}" width="1200" height="630" loading="lazy" decoding="async" alt="The top of the {name} page"></a>
          <div class="xp-body">
            <h3>{name}</h3>
            <p>{line}</p>
            <div class="xp-foot">
              <a class="xp-url" href="{url}"{ext}>{shown}</a>
              <a class="btn btn-primary xp-go" href="{url}"{ext}>Explore</a>
            </div>
          </div>
        </li>'''


groups = []
for prop, items in SITES.items():
    slug = "rbr" if prop.startswith("Red") else "mr"
    page = "/red-barn-ranch.html" if slug == "rbr" else "/mountain-retreat.html"
    groups.append(f'''  <section class="band xp-band xp-{slug}" aria-labelledby="xp-{slug}-h">
    <div class="wrap">
      <h2 class="xp-prop" id="xp-{slug}-h">{prop}</h2>
      <p class="xp-prop-sub">{"Four acres of things to do." if slug == "rbr" else "Eight acres at the foot of Iron Mountain."}</p>
      <ul class="xp-grid">
{chr(10).join(card(*i) for i in items)}
      </ul>
      <p class="xp-stay"><a class="btn btn-{slug}" href="{page}">Stay at {prop}</a></p>
    </div>
  </section>''')

main = f'''<main id="main">
  <section class="band band-dark xp-hero">
    <div class="wrap">
      <span class="tag tag-on-dark">Our places, up close</span>
      <h1 class="headline xp-h1">Experience the Farmhouse Getaways magic.</h1>
      <p class="xp-lede">A closer look at the places our guests love most at Red Barn Ranch and Mountain Retreat.</p>
    </div>
  </section>

{chr(10).join(groups)}
</main>'''

STYLE = '''<style>
  .xp-hero { text-align: center; padding-block: clamp(3.5rem, 9vw, 6rem); }
  .xp-hero .tag { justify-content: center; }
  .xp-h1 { font-size: clamp(2.3rem, 6vw, 4rem); max-width: 18ch; margin: .6rem auto 1rem; }
  .xp-lede { max-width: 38rem; margin: 0 auto; font-size: 1.15rem; opacity: .9; }
  .xp-grid { list-style: none; margin: 2rem 0 0; padding: 0; display: flex; flex-wrap: wrap; justify-content: center; gap: 1.6rem; }
  .xp-grid > li { flex: 0 1 calc((100% - 3.2rem) / 3); min-width: min(100%, 19rem); }
  @media (max-width: 62rem) { .xp-grid > li { flex-basis: calc((100% - 1.6rem) / 2); } }
  .xp-card { display: flex; flex-direction: column; background: #fff; border-radius: 1.1rem; overflow: hidden; box-shadow: 0 1rem 2.4rem -1.4rem rgba(50,40,45,.45), 0 0 0 1px rgba(69,57,64,.08); transition: transform .25s ease, box-shadow .25s ease; }
  .xp-img { display: block; overflow: hidden; aspect-ratio: 1200 / 630; background: #e9e1d6; }
  .xp-img img { display: block; width: 100%; height: 100%; object-fit: cover; transition: transform .45s ease; }
  .xp-body { display: flex; flex-direction: column; gap: .4rem; padding: 1.1rem 1.25rem 1.25rem; flex: 1; }
  .xp-body h3 { margin: 0; font-family: "Instrument Serif", Georgia, serif; font-weight: 400; font-size: 1.7rem; line-height: 1.1; color: var(--plum); }
  .xp-body p { margin: 0; color: var(--plum-soft); }
  .xp-foot { display: flex; flex-direction: column; align-items: flex-start; gap: .8rem; margin-top: auto; padding-top: .9rem; }
  .xp-url { font-size: .85rem; color: var(--sage-deep); text-decoration: none; word-break: break-all; }
  .xp-url:hover { text-decoration: underline; }
  .xp-go { white-space: nowrap; }
  .xp-stay { margin: 2.2rem 0 0; text-align: center; }
  .xp-mr { background: var(--sage-pale); }
  /* The property name is the section title, big, centred and in the house colour (Cory, 10 Oct 2026) */
  .xp-prop { margin: 0; text-align: center; font-family: "Instrument Serif", Georgia, serif; font-weight: 400; font-size: clamp(2.8rem, 7vw, 5rem); line-height: 1; }
  .xp-rbr .xp-prop { color: var(--rbr); }
  .xp-mr .xp-prop { color: var(--mr); }
  .xp-prop-sub { margin: .7rem auto 0; text-align: center; font-size: 1.15rem; color: var(--plum-soft); }
  /* site.css hovers these to white, which is made for a dark band; these bands are light */
  .xp-stay .btn-rbr:hover { background: var(--rbr); border-color: var(--rbr); color: #fff; }
  .xp-stay .btn-mr:hover { background: var(--mr); border-color: var(--mr); color: #fff; }
  @media (hover: hover) {
    .xp-card:hover { transform: translateY(-4px); box-shadow: 0 1.6rem 3rem -1.4rem rgba(50,40,45,.55), 0 0 0 1px rgba(69,57,64,.1); }
    .xp-card:hover .xp-img img { transform: scale(1.04); }
  }
  @media (prefers-reduced-motion: reduce) { .xp-card, .xp-img img { transition: none; } }
</style>'''

head_end = src.index("<style>")
head = src[:head_end]
head = re.sub(r"<title>.*?</title>", "<title>Experience the Farmhouse Getaways Magic | Our Places Up Close | Ramona, CA</title>", head)
head = re.sub(r'<meta name="description" content="[^"]*">', '<meta name="description" content="The barn, the pool, the bird garden, the arcade, disc golf, horseshoes, the farm stands and Dos Picos park: every corner of Red Barn Ranch and Mountain Retreat in Ramona, each with a page of its own.">', head)
head = re.sub(r'<link rel="canonical" href="[^"]*">', '<link rel="canonical" href="https://farmhousegetaways.com/experiences/">', head)
head = re.sub(r'<meta property="og:title" content="[^"]*">', '<meta property="og:title" content="Experience the Farmhouse Getaways magic">', head)
head = re.sub(r'<meta property="og:description" content="[^"]*">', '<meta property="og:description" content="Every corner of Red Barn Ranch and Mountain Retreat, each with a page of its own.">', head)
head = re.sub(r'<meta property="og:image" content="[^"]*">', '<meta property="og:image" content="https://farmhousegetaways.com/arcade/images/og-arcade-card.jpg">\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">\n<meta property="og:url" content="https://farmhousegetaways.com/experiences/">', head)
head = re.sub(r'<script type="application/ld\+json">.*?</script>\n?', "", head, flags=re.S)

body_start = src.index("</head>")
masthead = src[body_start:src.index('<main id="main">')]
masthead = masthead.replace('<a href="/experiences/">', '<a href="/experiences/" aria-current="page">')
footer = src[src.index("</main>") + len("</main>"):]
footer = footer.replace('<script src="https://app.lodgify.com/book-now-box/stable/renderBookNowBox.js" defer></script>\n', "")

out = head + STYLE + "\n" + masthead + main + footer
(ROOT / "experiences").mkdir(exist_ok=True)
(ROOT / "experiences" / "index.html").write_text(out, encoding="utf-8", newline="")
print("wrote", len(out))
