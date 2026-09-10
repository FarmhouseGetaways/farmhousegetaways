/* ==========================================================================
   The Ramona Farmstand Map — live, on the marketing site.

   Reads the SAME endpoint the app's own Map tab reads —
   https://farmhousegetawaysapp.netlify.app/.netlify/functions/stands —
   instead of a Google My Maps embed that had to be reimported by hand every
   time a stand was approved. Approve a submission on farmhouse-admin and it
   shows up here on the next load, same as it does in the app. See that
   repo's js/map.js, which this is adapted from (this copy is trimmed of the
   app's own landmarks/roads/basemap-switcher layers — a plainer map for a
   marketing page, not a second thing to keep in sync with the app's).
   ========================================================================== */

var LIVE = "https://farmhousegetawaysapp.netlify.app/.netlify/functions/stands";

var CENTER = [33.0300, -116.8700];
var ZOOM = 12;
var TILE_URL = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
var TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

var TAG_LABELS = {
  produce: "Produce", eggs: "Eggs", bakery: "Bakery", honey: "Honey",
  flowers: "Flowers", prepared: "Prepared food", goods: "Goods"
};

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/* Longitude out here is negative; a positive one is a missing minus sign. */
function sane(s) {
  if (s.lat == null || s.lng == null) return s;
  if (s.lng > 0 && s.lat > 20 && s.lat < 50) s.lng = -s.lng;
  if (s.lat < 32 || s.lat > 34.5 || s.lng < -118.5 || s.lng > -115.5) s.outOfRange = true;
  return s;
}

function isAppleMobile() {
  var ua = navigator.userAgent || "";
  if (/iPhone|iPod/.test(ua)) return true;
  return /iPad/.test(ua) || (/Macintosh/.test(ua) && "ontouchend" in document);
}

function directionsURL(s) {
  var q = s.lat != null && !s.outOfRange ? s.lat + "," + s.lng : s.address;
  return isAppleMobile()
    ? "https://maps.apple.com/?daddr=" + encodeURIComponent(q) + "&dirflg=d"
    : "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(q);
}

function pinIcon() {
  return L.divIcon({
    className: "fspin",
    html: '<span style="display:block;width:14px;height:14px;border-radius:50% 50% 50% 0;' +
          'transform:rotate(-45deg);background:#3F5548;border:2px solid #fff;' +
          'box-shadow:0 2px 6px rgba(0,0,0,.35);"></span>',
    iconSize: [14, 14], iconAnchor: [7, 16], popupAnchor: [0, -16]
  });
}

function popup(s) {
  var bits = ['<div class="fspop"><h3>' + esc(s.name) + "</h3>"];
  if (s.sells) bits.push("<p>" + esc(s.sells) + "</p>");
  if (s.hours) bits.push("<p>" + esc(s.hours) + "</p>");
  if (s.address) bits.push("<p>" + esc(s.address) + "</p>");
  bits.push('<p class="fspop-links"><a href="' + esc(directionsURL(s)) + '" target="_blank" rel="noopener">Directions</a>');
  if (s.url) {
    var u = s.url.indexOf("http") === 0 ? s.url : "https://" + s.url;
    bits.push('<a href="' + esc(u) + '" target="_blank" rel="noopener">Website</a>');
  }
  if (s.phone) bits.push('<a href="tel:' + esc(s.phone.replace(/[^0-9+]/g, "")) + '">Call</a>');
  bits.push("</p></div>");
  return bits.join("");
}

function boot(stands) {
  stands = stands.map(sane).sort(function (a, b) { return a.name.localeCompare(b.name); });

  var mapEl = document.getElementById("fsmap");
  var listEl = document.getElementById("fslist");
  var countEl = document.getElementById("fscount");
  var chipsEl = document.getElementById("fschips");
  var active = "all";

  var hasMap = typeof L !== "undefined" && mapEl;
  var map = null, group = null;

  if (hasMap) {
    map = L.map(mapEl, { scrollWheelZoom: false }).setView(CENTER, ZOOM);
    L.tileLayer(TILE_URL, { attribution: TILE_ATTR, maxZoom: 20, subdomains: "abcd" }).addTo(map);
    map.on("click", function () { map.scrollWheelZoom.enable(); });
    map.on("mouseout", function () { map.scrollWheelZoom.disable(); });
    group = L.layerGroup().addTo(map);
  }

  function matches(s) { return active === "all" || (s.tags || []).indexOf(active) > -1; }

  function render() {
    if (group) group.clearLayers();
    var shown = stands.filter(matches);
    var plotted = 0;

    shown.forEach(function (s) {
      if (s.lat == null || s.outOfRange) return;
      plotted++;
      if (!hasMap) return;
      s._marker = L.marker([s.lat, s.lng], { icon: pinIcon(), title: s.name })
                   .bindPopup(popup(s)).addTo(group);
    });

    if (countEl) {
      countEl.textContent = shown.length + (shown.length === 1 ? " stand" : " stands") +
        (plotted < shown.length ? " · " + plotted + " with pins so far" : "");
    }

    if (hasMap && plotted) {
      var pts = shown.filter(function (s) { return s.lat != null && !s.outOfRange; })
                     .map(function (s) { return [s.lat, s.lng]; });
      map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 14 });
    }

    if (listEl) {
      listEl.innerHTML = shown.map(function (s, i) {
        return '<li class="fsrow" data-i="' + i + '">' +
          "<div><b>" + esc(s.name) + "</b>" +
          (s.hours ? '<span class="fsrow-hours">' + esc(s.hours) + "</span>" : "") +
          (s.sells ? '<span class="fsrow-sells">' + esc(s.sells) + "</span>" : "") +
          '<span class="fsrow-addr">' + esc(s.address) + "</span></div>" +
          '<a class="fsrow-dir" href="' + esc(directionsURL(s)) + '" target="_blank" rel="noopener">Directions</a></li>';
      }).join("");

      Array.prototype.forEach.call(listEl.querySelectorAll(".fsrow"), function (el) {
        el.addEventListener("click", function (e) {
          if (e.target.classList.contains("fsrow-dir")) return;
          var s = shown[+el.dataset.i];
          if (hasMap && s && s._marker) {
            map.flyTo([s.lat, s.lng], 15, { duration: .6 });
            s._marker.openPopup();
            mapEl.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        });
      });
    }
  }

  var present = {};
  stands.forEach(function (s) { (s.tags || []).forEach(function (t) { present[t] = 1; }); });
  if (chipsEl) {
    var html = ['<button class="fschip is-on" data-t="all">All</button>'];
    Object.keys(TAG_LABELS).forEach(function (t) {
      if (present[t]) html.push('<button class="fschip" data-t="' + t + '">' + TAG_LABELS[t] + "</button>");
    });
    chipsEl.innerHTML = html.join("");
    chipsEl.addEventListener("click", function (e) {
      var b = e.target.closest(".fschip"); if (!b) return;
      active = b.dataset.t;
      Array.prototype.forEach.call(chipsEl.children, function (c) { c.classList.toggle("is-on", c === b); });
      render();
    });
  }

  render();
}

function fail(msg) {
  var el = document.getElementById("fsmap");
  if (el) el.innerHTML = '<p class="fsfail">' + esc(msg) + "</p>";
}

fetch(LIVE)
  .then(function (r) { if (!r.ok) throw 0; return r.json(); })
  .then(function (d) {
    if (d.stands && d.stands.length) boot(d.stands);
    else fail("The map could not load right now.");
  })
  .catch(function () { fail("The map could not load right now."); });
