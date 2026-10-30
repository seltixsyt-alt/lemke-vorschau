/* Fahrschule Lemke: Menü, Theorie-Zeiten und Kontaktformular */
(function () {
  "use strict";

  /* ---------- Mobiles Menü ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("mobile-menu");
  function setMenu(open) {
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
    menu.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
  }
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      setMenu(toggle.getAttribute("aria-expanded") !== "true");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("is-open")) { setMenu(false); toggle.focus(); }
    });
    window.matchMedia("(min-width: 1081px)").addEventListener("change", function (m) { if (m.matches) setMenu(false); });
  }

  /* ---------- Aufklappmenüs in der Kopfzeile ---------- */
  var drops = document.querySelectorAll(".nav-drop");
  function closeDrops(except) {
    drops.forEach(function (d) {
      if (d === except) return;
      d.classList.remove("is-open");
      d.querySelector("button").setAttribute("aria-expanded", "false");
    });
  }
  drops.forEach(function (d) {
    var btn = d.querySelector("button");
    btn.addEventListener("click", function () {
      var open = !d.classList.contains("is-open");
      closeDrops(d);
      d.classList.toggle("is-open", open);
      btn.setAttribute("aria-expanded", String(open));
    });
    d.addEventListener("focusout", function (e) {
      if (!d.contains(e.relatedTarget)) { d.classList.remove("is-open"); btn.setAttribute("aria-expanded", "false"); }
    });
  });
  document.addEventListener("click", function (e) { if (!e.target.closest(".nav-drop")) closeDrops(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeDrops(); });

  /* ---------- Theorie-Zeiten ---------- */
  // 1 = Montag ... 5 = Freitag. Quelle: Seite "Standorte" der bisherigen Website.
  var THEORY = [
    { name: "Kronshagen", t: { 1: ["17:45", "19:15"], 2: ["17:45", "19:15"], 3: ["17:45", "19:15"], 4: ["17:45", "19:15"], 5: ["17:45", "19:15"] } },
    { name: "Kiel", t: { 2: ["19:30", "21:00"], 3: ["19:30", "21:00"], 4: ["19:30", "21:00"] } },
    { name: "Altenholz", t: { 1: ["17:30", "19:00"], 3: ["19:00", "20:30"], 4: ["19:00", "20:30"] } },
    { name: "Gettorf", t: { 1: ["17:30", "19:00"], 3: ["17:30", "19:00"], 5: ["17:30", "19:00"] } }
  ];
  var DAYS = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
  function toMin(s) { var p = s.split(":"); return +p[0] * 60 + +p[1]; }
  function on(day) {
    return THEORY.filter(function (l) { return l.t[day]; })
      .sort(function (a, b) { return toMin(a.t[day][0]) - toMin(b.t[day][0]); });
  }

  var now = new Date();
  var today = now.getDay();
  var nowMin = now.getHours() * 60 + now.getMinutes();

  document.querySelectorAll('.week [data-day="' + today + '"]').forEach(function (c) { c.classList.add("is-today"); });

  var box = document.querySelector("[data-today]");
  if (box) {
    var list = box.querySelector(".today-list");
    var title = box.querySelector(".today-title");
    var label = box.querySelector(".today-date");
    var day = today;
    var remaining = on(today).filter(function (l) { return nowMin < toMin(l.t[today][1]); });
    if (!remaining.length) {
      var guard = 0;
      do { day = (day + 1) % 7; guard++; } while (!on(day).length && guard < 7);
      title.textContent = "Nächste Theorie: " + (day === (today + 1) % 7 ? "morgen, " + DAYS[day] : DAYS[day]);
      label.textContent = on(today).length ? "Heute ist schon alles vorbei" : "Heute kein Unterricht";
    } else {
      label.textContent = DAYS[today] + ", " + now.toLocaleDateString("de-DE", { day: "numeric", month: "long" });
    }
    list.innerHTML = "";
    on(day).forEach(function (l) {
      var s = l.t[day][0], e = l.t[day][1];
      var status = "", live = false;
      if (day === today) {
        if (nowMin >= toMin(s) && nowMin < toMin(e)) { status = "Läuft gerade"; live = true; }
        else if (nowMin < toMin(s)) {
          var d = toMin(s) - nowMin;
          status = d <= 90 ? "in " + d + " Min." : "ab " + s + " Uhr";
        } else { status = "Vorbei"; }
      } else { status = DAYS[day]; }
      var li = document.createElement("li");
      li.innerHTML = '<div><strong></strong><span class="time"></span></div><span class="today-status"></span>';
      li.querySelector("strong").textContent = l.name;
      li.querySelector(".time").textContent = s + " bis " + e + " Uhr";
      var st = li.querySelector(".today-status");
      st.textContent = status;
      if (live) st.classList.add("is-live");
      list.appendChild(li);
    });
  }

  /* ---------- Stand des Theorieplans ---------- */
  // Das Datum kommt aus dem Dateinamen der aktuellen PDF (siehe theorieplan.php)
  var standEls = document.querySelectorAll("[data-plan-stand]");
  if (standEls.length && window.fetch) {
    fetch("theorieplan.json", { cache: "no-store" })
      .then(function (r) { return r.json(); })
      .then(function (info) {
        var text = !info.vorhanden ? "Der neue Plan kommt in Kürze. Frag gern im Büro nach."
          : info.stand ? "Gültig ab " + info.stand : "";
        if (!text) return;
        standEls.forEach(function (el) { el.textContent = text; el.hidden = false; });
      })
      .catch(function () {});
  }

  /* ---------- Cookie-Einwilligung ---------- */
  // Auswahl steht im Cookie "lemke_consent", z. B. "v1|preferences=1|statistics=0|marketing=0".
  // Dienste für später so einbinden, dann starten sie erst nach Zustimmung:
  // <script type="text/plain" data-consent-category="statistics" data-src="https://..."></script>
  var CONSENT_CATS = ["preferences", "statistics", "marketing"];
  var banner = document.getElementById("cookie-banner");

  function readConsent() {
    var m = document.cookie.match(/(?:^|;\s*)lemke_consent=([^;]+)/);
    if (!m) return null;
    var out = {};
    decodeURIComponent(m[1]).split("|").slice(1).forEach(function (part) {
      var kv = part.split("=");
      out[kv[0]] = kv[1] === "1";
    });
    return out;
  }

  function applyConsent(c) {
    document.querySelectorAll('script[type="text/plain"][data-consent-category]').forEach(function (el) {
      if (!c[el.getAttribute("data-consent-category")]) return;
      var s = document.createElement("script");
      if (el.getAttribute("data-src")) s.src = el.getAttribute("data-src"); else s.text = el.text;
      el.parentNode.replaceChild(s, el);
    });
    document.dispatchEvent(new CustomEvent("lemke:consent", { detail: c }));
  }

  function saveConsent(c) {
    var val = "v1|" + CONSENT_CATS.map(function (k) { return k + "=" + (c[k] ? 1 : 0); }).join("|");
    document.cookie = "lemke_consent=" + encodeURIComponent(val) + "; max-age=31536000; path=/; SameSite=Lax" +
      (location.protocol === "https:" ? "; Secure" : "");
    closeBanner();
    applyConsent(c);
  }

  function showSettings(show) {
    banner.querySelector("#cookie-cats").hidden = !show;
    banner.querySelector('[data-consent="save"]').hidden = !show;
    var btn = banner.querySelector('[data-consent="settings"]');
    btn.hidden = show;
    btn.setAttribute("aria-expanded", String(show));
  }

  function openBanner(withSettings) {
    var c = readConsent() || {};
    banner.querySelectorAll("[data-consent-cat]").forEach(function (cb) { cb.checked = !!c[cb.getAttribute("data-consent-cat")]; });
    showSettings(!!withSettings);
    banner.hidden = false;
    document.body.classList.add("cookie-open");
  }

  function closeBanner() {
    banner.hidden = true;
    document.body.classList.remove("cookie-open");
  }

  if (banner) {
    banner.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-consent]");
      if (!btn) return;
      var action = btn.getAttribute("data-consent");
      var c = {};
      if (action === "all") { CONSENT_CATS.forEach(function (k) { c[k] = true; }); saveConsent(c); }
      else if (action === "necessary") { saveConsent(c); }
      else if (action === "settings") { showSettings(true); banner.querySelector("#cookie-cats").querySelector("summary").focus(); }
      else if (action === "save") {
        banner.querySelectorAll("[data-consent-cat]").forEach(function (cb) { c[cb.getAttribute("data-consent-cat")] = cb.checked; });
        saveConsent(c);
      }
    });
    document.querySelectorAll("[data-consent-open]").forEach(function (el) {
      el.addEventListener("click", function () { openBanner(true); banner.querySelector("#cookie-title").focus(); });
    });
    var existing = readConsent();
    if (existing) applyConsent(existing); else openBanner(false);
  }

  /* ---------- Jahr im Footer ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = String(now.getFullYear()); });

  /* ---------- Kontaktformular ---------- */
  var form = document.querySelector("form[data-validate]");
  if (form) {
    var status = document.querySelector(".form-status");
    var q = new URLSearchParams(location.search).get("status");
    if (status && q === "ok") {
      status.textContent = "Danke, deine Nachricht ist angekommen. Wir melden uns so schnell wie möglich.";
      status.classList.add("is-ok");
    } else if (status && q === "fehler") {
      status.textContent = "Das hat leider nicht geklappt. Bitte prüf deine Angaben und die Sicherheitsfrage oder ruf uns direkt an.";
      status.classList.add("is-error");
    } else if (status && q === "zuviel") {
      status.textContent = "Von deinem Anschluss kamen gerade sehr viele Nachrichten. Bitte versuch es später noch einmal oder ruf uns an unter 0431 54 86 08.";
      status.classList.add("is-error");
    }
    var sel = new URLSearchParams(location.search).get("thema");
    if (sel && form.thema) {
      Array.prototype.forEach.call(form.thema.options, function (o) { if (o.value === sel) form.thema.value = sel; });
    }

    /* Sicherheitsfrage und Token vom Server holen. Die Antwort steht nicht im HTML. */
    var tokenUrl = form.getAttribute("data-token-url");
    var tokenField = form.querySelector('input[name="formular_token"]');
    var frageLabel = form.querySelector("[data-frage]");
    if (tokenUrl && tokenField && window.fetch) {
      fetch(tokenUrl, { cache: "no-store", headers: { Accept: "application/json" } })
        .then(function (r) { if (!r.ok) throw new Error("token"); return r.json(); })
        .then(function (data) {
          if (!data || !data.token || !data.frage) throw new Error("token");
          tokenField.value = data.token;
          if (frageLabel) frageLabel.textContent = "Sicherheitsfrage: " + data.frage;
        })
        .catch(function () {
          tokenField.value = "";
          if (frageLabel) frageLabel.textContent = "Sicherheitsfrage (konnte nicht geladen werden)";
          if (status) {
            status.textContent = "Die Sicherheitsfrage konnte nicht geladen werden. Bitte lade die Seite neu oder ruf uns an unter 0431 54 86 08.";
            status.className = "form-status is-error";
          }
        });
    }

    form.setAttribute("novalidate", "");
    form.addEventListener("submit", function (e) {
      if (tokenField && !tokenField.value) {
        e.preventDefault();
        if (status) {
          status.textContent = "Die Sicherheitsfrage fehlt noch. Bitte lade die Seite neu und versuch es noch einmal.";
          status.className = "form-status is-error";
          status.scrollIntoView({ block: "center" });
        }
        return;
      }
      var firstBad = null;
      form.querySelectorAll("[required]").forEach(function (input) {
        var field = input.closest(".field") || input.closest(".check");
        var ok = input.type === "checkbox" ? input.checked : input.checkValidity() && input.value.trim() !== "";
        if (field) field.classList.toggle("has-error", !ok);
        input.setAttribute("aria-invalid", String(!ok));
        if (!ok && !firstBad) firstBad = input;
      });
      if (firstBad) { e.preventDefault(); firstBad.scrollIntoView({ block: "center" }); firstBad.focus({ preventScroll: true }); }
    });
  }
})();

/* Vorschau auf GitHub: Das Formular sendet nichts, es zeigt nur eine Rückmeldung */
(function () {
  var form = document.getElementById("kontaktformular");
  if (!form) return;
  form.addEventListener("submit", function (e) {
    if (e.defaultPrevented) return;
    e.preventDefault();
    var status = document.querySelector(".form-status");
    if (status) {
      status.textContent = "Vorschau: Das Formular ist hier nur eine Demo, es wird nichts gesendet.";
      status.className = "form-status is-ok";
      status.scrollIntoView({ block: "center" });
    }
  });
})();
