// Progressive enhancement. The ballot ovals are pure CSS where scroll-driven
// animations are supported; this file runs the tally, the navigation drawer,
// the figure magnifier, and the contact form, and fills the oval states in
// browsers without animation-timeline.

(function () {
  "use strict";

  var root = document.documentElement;
  var clamp = function (v, lo, hi) { return Math.min(hi, Math.max(lo, v)); };

  /* ---- Tally + scroll-spy fallback -------------------------------------- */

  var hasScrollTimeline = window.CSS && CSS.supports("animation-timeline: view()");
  if (!hasScrollTimeline) root.classList.add("no-scroll-timeline");

  var marks = document.querySelector(".tally-marks");
  var pctEl = document.querySelector(".tally-pct");
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".nav a"));
  var sections = navLinks.map(function (a) { return document.querySelector(a.getAttribute("href")); });

  var onScroll = function () {
    var max = root.scrollHeight - window.innerHeight;
    var p = max > 0 ? clamp((window.scrollY / max) * 100, 0, 100) : 100;
    if (marks) marks.style.setProperty("--p", p.toFixed(2));
    if (pctEl) pctEl.textContent = Math.round(p) + "%";

    if (!hasScrollTimeline) {
      var band = window.innerHeight * 0.38;
      var current = 0;
      sections.forEach(function (s, i) {
        if (s && s.getBoundingClientRect().top <= band) current = i;
      });
      navLinks.forEach(function (a, i) {
        a.classList.toggle("is-active", i === current);
        a.classList.toggle("is-voted", i <= current);
      });
    }
  };

  var ticking = false;
  var requestScroll = function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { onScroll(); ticking = false; });
  };
  window.addEventListener("scroll", requestScroll, { passive: true });
  window.addEventListener("resize", requestScroll);
  window.addEventListener("load", requestScroll);
  onScroll();

  /* ---- Navigation drawer ------------------------------------------------- */

  var menuBtn = document.querySelector(".menu-btn");
  var sidebar = document.getElementById("sidebar");
  var closeBtn = document.querySelector(".close-btn");
  var scrim = document.querySelector(".scrim");

  if (menuBtn && sidebar) {
    sidebar.setAttribute("inert", "");

    var openDrawer = function () {
      sidebar.removeAttribute("inert");
      sidebar.classList.add("is-open");
      scrim.hidden = false;
      menuBtn.setAttribute("aria-expanded", "true");
      document.body.classList.add("drawer-open");
      closeBtn.focus();
    };

    var closeDrawer = function (returnFocus) {
      if (!sidebar.classList.contains("is-open")) return;
      sidebar.classList.remove("is-open");
      sidebar.setAttribute("inert", "");
      scrim.hidden = true;
      menuBtn.setAttribute("aria-expanded", "false");
      document.body.classList.remove("drawer-open");
      if (returnFocus) menuBtn.focus();
    };

    menuBtn.addEventListener("click", function () {
      if (sidebar.classList.contains("is-open")) closeDrawer(true); else openDrawer();
    });
    closeBtn.addEventListener("click", function () { closeDrawer(true); });
    scrim.addEventListener("click", function () { closeDrawer(true); });
    sidebar.addEventListener("click", function (e) {
      if (e.target.closest("a[href^='#']")) closeDrawer(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeDrawer(true);
    });
  }

  /* ---- Figure magnifier -------------------------------------------------- */

  var ZOOM_MIN = 1.5, ZOOM_MAX = 6, ZOOM_STEP = 0.5;
  var hovered = null;

  Array.prototype.forEach.call(document.querySelectorAll(".project-fig img"), function (img) {
    var wrap = document.createElement("div");
    wrap.className = "zoom";
    img.parentNode.insertBefore(wrap, img);
    wrap.appendChild(img);

    var lens = document.createElement("div");
    lens.className = "zoom-lens";
    lens.setAttribute("aria-hidden", "true");
    wrap.appendChild(lens);

    var controls = document.createElement("div");
    controls.className = "zoom-controls";
    controls.innerHTML =
      '<button type="button" data-step="-1" aria-label="Zoom out">&minus;</button>' +
      '<output aria-live="polite"></output>' +
      '<button type="button" data-step="1" aria-label="Zoom in">+</button>';
    wrap.appendChild(controls);
    var readout = controls.querySelector("output");

    var z = 2.5;
    var last = null;   // last pointer position, so a zoom change redraws in place
    var lastType = "mouse";

    var render = function () {
      readout.textContent = z.toFixed(1).replace(/\.0$/, "") + "×";
      if (!last) return;
      var r = img.getBoundingClientRect();
      var x = clamp(last.x - r.left, 0, r.width);
      var y = clamp(last.y - r.top, 0, r.height);
      var L = lens.offsetWidth;
      // on touch, lift the lens above the finger so it isn't hidden
      var lift = lastType === "touch" ? L * 0.65 : 0;
      lens.style.left = (x - L / 2) + "px";
      lens.style.top = (y - L / 2 - lift) + "px";
      lens.style.backgroundImage = "url('" + (img.currentSrc || img.src) + "')";
      lens.style.backgroundSize = (r.width * z) + "px " + (r.height * z) + "px";
      lens.style.backgroundPosition = (L / 2 - x * z) + "px " + (L / 2 - y * z) + "px";
    };

    var setZoom = function (next) {
      z = clamp(next, ZOOM_MIN, ZOOM_MAX);
      render();
    };

    var show = function (e) {
      if (e.target.closest(".zoom-controls")) { wrap.classList.remove("is-zooming"); return; }
      last = { x: e.clientX, y: e.clientY };
      lastType = e.pointerType;
      wrap.classList.add("is-zooming");
      render();
    };

    // mouse / pen: magnify on hover
    wrap.addEventListener("pointerenter", function () {
      hovered = { step: function (d) { setZoom(z + d * ZOOM_STEP); } };
    });
    wrap.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch" && !wrap.classList.contains("is-touch-active")) return;
      show(e);
    });
    wrap.addEventListener("pointerleave", function (e) {
      hovered = null;
      if (e.pointerType !== "touch") wrap.classList.remove("is-zooming");
    });

    // touch: tap a figure to enter magnify mode, then drag; tap elsewhere to exit
    wrap.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "touch" || e.target.closest(".zoom-controls")) return;
      wrap.classList.add("is-touch-active");
      show(e);
    });
    wrap.addEventListener("pointerup", function (e) {
      if (e.pointerType === "touch") wrap.classList.remove("is-zooming");
    });
    document.addEventListener("pointerdown", function (e) {
      if (!wrap.contains(e.target)) wrap.classList.remove("is-touch-active", "is-zooming");
    });

    controls.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (b) setZoom(z + Number(b.dataset.step) * ZOOM_STEP);
    });

    render();
  });

  // + / - keys adjust the figure under the cursor
  document.addEventListener("keydown", function (e) {
    if (!hovered || e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^(input|textarea)$/i.test(document.activeElement.tagName)) return;
    if (e.key === "+" || e.key === "=") { hovered.step(1); e.preventDefault(); }
    if (e.key === "-" || e.key === "_") { hovered.step(-1); e.preventDefault(); }
  });

  /* ---- Contact form ------------------------------------------------------ */
  // Posts to Formspree in the background and shows the result in place.
  // Without JS the form still works: the action attribute posts directly
  // and Formspree shows its own confirmation page.

  var form = document.querySelector(".contact-form");
  if (!form) return;

  var status = form.querySelector(".form-status");
  var button = form.querySelector("button[type=submit]");

  var setStatus = function (msg, kind) {
    status.textContent = msg;
    status.className = "form-status" + (kind ? " " + kind : "");
  };

  var clearInvalid = function () {
    Array.prototype.forEach.call(form.querySelectorAll("[aria-invalid]"), function (el) {
      el.removeAttribute("aria-invalid");
    });
  };

  form.addEventListener("input", function (e) {
    if (e.target.hasAttribute("aria-invalid")) e.target.removeAttribute("aria-invalid");
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var data = new FormData(form);
    if (data.get("_gotcha")) return;

    clearInvalid();
    button.disabled = true;
    setStatus("Sending…");

    fetch(form.action, {
      method: "POST",
      body: data,
      headers: { Accept: "application/json" }
    }).then(function (res) {
      if (res.ok) {
        form.reset();
        setStatus("Thanks, your request is in. I'll be in touch soon.", "ok");
        return;
      }
      // Formspree returns { errors: [{ field, message }] } for validation problems
      return res.json().catch(function () { return {}; }).then(function (body) {
        var errors = (body && body.errors) || [];
        errors.forEach(function (err) {
          var el = err.field && form.elements[err.field];
          if (el && el.setAttribute) el.setAttribute("aria-invalid", "true");
        });
        var msg = errors.map(function (err) { return err.message; }).filter(Boolean).join(" ");
        setStatus(msg || "Something went wrong. Please try again, or reach out on LinkedIn.", "err");
      });
    }).catch(function () {
      setStatus("Couldn't reach the server. Check your connection and try again, or reach out on LinkedIn.", "err");
    }).finally(function () {
      button.disabled = false;
    });
  });
})();
