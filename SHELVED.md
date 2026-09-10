# Shelved content — removed from the site, kept for a decision

Content that came off the site but is **not** abandoned. Cory asked on
10 Sep 2026 to keep it "in the back pocket" and put it back on request,
exactly as it was.

**How to restore any block below:** the verbatim markup is here, and the
original is also recoverable from git with
`git show <commit> -- <file>`. Paste the block back at the anchor named
for it, then check the page renders — every one of these sat between two
`<section>` bands, so the surrounding markup is unchanged and the paste
is mechanical.

---

## The arranged-services offer (removed 8 Sep 2026)

**Why it went:** the same offer appeared on four pages in four different
voices — chef, caterer, in-home massage, group yoga, welcome brunch,
morning-after brunch. It read as an unmanaged service menu rather than
one clear offer.

**Cory's position, 10 Sep 2026:** *"we may need to add those services
back in"* — so this is shelved, not dead.

**If it goes back, put it back in one voice on one page** and link to it
from the others, rather than restoring all four copies. The
Groups & Gatherings version below is the fullest and is the natural home.

**Two things that came out with these sections were NOT services and
have already been put back** — do not restore them twice:

- book-both's reservation rule ("everyone sleeping over needs to be on
  the reservation") — restored in `96744b7`, currently live.
- book-both's chemical-free "Good to know" rows — restored in `c5eb41a`,
  currently live on the board that survived.
- red-barn-ranch's "getting married nearby" line — replaced in `c5eb41a`
  by a fuller "Where the wedding party stays" section, currently live.
  Do not bring back the old one-line version.

A related judgement that still stands: the properties allow **no parties
or events of any kind**, and the Google Ads campaign blocks twelve party
terms. Anything restored here must not read as an offer to host an event.

---

### `wedding-groups.html` — removed in `59907b6`

Anchor: it sat immediately before the section that follows it in the file today.

```html
  <!-- WE LOOK AFTER YOUR PEOPLE -->
  <section class="band band-field">
    <div class="wrap split">
      <div>
        <span class="tag">What we can help with</span>
        <h2 class="headline">You plan the weekend. We help you line up the rest.</h2>
        <div class="prose">
          <p>You are in an unfamiliar town with a lot of people to feed, and the last thing you want is to be hunting down breakfast for twenty on the morning of.</p>
          <p>Tell us what you have in mind and we will point you to the people we would call ourselves &mdash; a chef, a caterer, someone for massage or yoga in the morning. Nine years here means we know who is good.</p>
          <p>On the day, we are around. We know where things plug in, where vans can park and how the property works, so when your family is busy being your family, we are glad to meet the vendors and show them where to go. The setting up is yours to run, and you will never be working the place out on your own.</p>
        </div>
      </div>
      <div class="board board-light">
        <p class="board-title">We can arrange</p>
        <ul class="board-list">
          <li><span class="k">Welcome brunch</span><span class="dots"></span><span class="v">On request</span></li>
          <li><span class="k">Farm-to-table dinner</span><span class="dots"></span><span class="v">On request</span></li>
          <li><span class="k">Private chef</span><span class="dots"></span><span class="v">On request</span></li>
          <li><span class="k">In-home massage</span><span class="dots"></span><span class="v">On request</span></li>
          <li><span class="k">Morning-after brunch</span><span class="dots"></span><span class="v">On request</span></li>
          <li><span class="k">Group yoga</span><span class="dots"></span><span class="v">On request</span></li>
        </ul>
        <p class="board-sub" style="margin-top:1.4rem;font-size:.9rem;">These are additions to the stay, arranged ahead of time. Every one of them depends on what you are after, so tell us and we will be glad to put a quote together.</p>
      </div>
    </div>
  </section>
```

### `book-both.html` — removed in `c3bae15`

Anchor: it sat immediately before the section that follows it in the file today.

```html
  <!-- WHAT WE CAN ARRANGE -->
  <section class="band band-field">
    <div class="wrap split">
      <div>
        <span class="tag">While you are here</span>
        <h2 class="headline">You plan the weekend. We help you line up the rest.</h2>
        <div class="prose">
          <p>Tell us what you have in mind and we will point you to the people we would call ourselves &mdash; a chef for dinner, a caterer for the morning everyone arrives, someone for massage or yoga. On the day we are around, so when your family is busy being your family, we can meet the vendors and show them where to park and where things plug in. These are additions to the stay, arranged ahead of time. What each costs depends on what you are after, so tell us and we will be glad to put a quote together.</p>
          <p>One thing to know before you book: each house is set up for its own numbers. Everyone sleeping over needs to be on the reservation, and if you want the whole party together at one house for a meal or a celebration, tell us early &mdash; that takes arranging, and there is a cost.</p>
        </div>
      </div>
      <div class="board board-light">
        <p class="board-title">We can help you line up</p>
        <ul class="board-list">
          <li><span class="k">Welcome brunch</span><span class="dots"></span><span class="v">Ask ahead</span></li>
          <li><span class="k">Farm-to-table dinner</span><span class="dots"></span><span class="v">Ask ahead</span></li>
          <li><span class="k">Private chef</span><span class="dots"></span><span class="v">Ask ahead</span></li>
          <li><span class="k">In-home massage</span><span class="dots"></span><span class="v">Ask ahead</span></li>
          <li><span class="k">Morning-after brunch</span><span class="dots"></span><span class="v">Ask ahead</span></li>
        </ul>
        <p class="board-sub" style="margin-top:1.6rem;padding-top:1.1rem;border-top:1px solid var(--bloom-3);">Good to know</p>
        <ul class="board-list">
          <li><span class="k">Chemicals on the grounds</span><span class="dots"></span><span class="v">None</span></li>
          <li><span class="k">Bath &amp; laundry</span><span class="dots"></span><span class="v">Provided, chemical-free</span></li>
        </ul>
      </div>
    </div>
  </section>
```

### `index.html` — removed in `c3bae15`

Anchor: it sat immediately before the section that follows it in the file today.

```html
For groups who want to go all in, we offer add-on experiences too, from neighboring farm visits, in-house massages and chefs, to the kids trying their luck to sift some gems at our mining sluice &mdash; ask us and we&rsquo;ll set it up.<br>
<br>
```

### `red-barn-ranch.html` — removed in `c3bae15`

Anchor: it sat immediately before the section that follows it in the file today.

```html
  <!-- ALSO AVAILABLE -->
  <section class="band band-field">
    <div class="wrap">
      <span class="tag">If you want it</span>
      <h2 class="headline">Also available</h2>
      <div class="prose">
        <p>Private chef dinners, in-home massage, group yoga and group dinners can all be lined up with notice. Tell us what you have in mind and we will point you to people we trust, and we are around on the day if anyone needs showing where things are. These are additions to the stay, and we are glad to put a quote together once we know what you are after.</p>
        <p><strong>Getting married nearby?</strong> Wedding parties book this house often, and Mt. Woodson Castle is under three miles away.</p>
      </div>
      <div class="btn-row">
        <a class="btn btn-ghost" href="/wedding-groups.html">See Groups &amp; Gatherings</a>
      </div>
    </div>
  </section>
```

