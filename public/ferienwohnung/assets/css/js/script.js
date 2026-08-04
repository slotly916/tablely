/* =================================================================
   Ferienhaus Veider — script.js
   Header-Zustand · Mobile-Menü · Scroll-Reveal · Hero-Parallax ·
   Wohnungs-Auswahl · Formular
   ================================================================= */

(function () {
  "use strict";

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ---------- Aktuelles Jahr im Footer ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Header: transparent über Hero, fest beim Scrollen ---------- */
  const header = document.getElementById("siteHeader");
  const hero = document.querySelector(".hero");

  function updateHeaderState() {
    if (!header) return;
    const threshold = hero ? hero.offsetHeight - 120 : 80;
    header.dataset.state = window.scrollY > threshold ? "solid" : "top";
  }

  /* ---------- Hero-Parallax (dezent) ---------- */
  const heroMedia = document.querySelector(".hero__media");

  function updateParallax() {
    if (prefersReducedMotion || !heroMedia) return;
    const y = window.scrollY;
    if (y < window.innerHeight) {
      heroMedia.style.transform = `scale(1.06) translateY(${y * 0.18}px)`;
    }
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      updateHeaderState();
      updateParallax();
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", updateHeaderState);
  updateHeaderState();

  /* ---------- Mobile-Menü ---------- */
  const navToggle = document.getElementById("navToggle");
  const mobileNav = document.getElementById("mobileNav");

  function setMenu(open) {
    if (!navToggle || !mobileNav) return;
    mobileNav.classList.toggle("is-open", open);
    mobileNav.setAttribute("aria-hidden", String(!open));
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Menü schließen" : "Menü öffnen");
    document.body.classList.toggle("menu-open", open);
  }

  if (navToggle && mobileNav) {
    navToggle.addEventListener("click", function () {
      const isOpen = mobileNav.classList.contains("is-open");
      setMenu(!isOpen);
    });
    mobileNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        setMenu(false);
      });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setMenu(false);
    });
  }

  /* ---------- Scroll-Reveal ---------- */
  const revealEls = document.querySelectorAll(".reveal");

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) {
      el.classList.add("is-visible");
    });
  } else {
    const observer = new IntersectionObserver(
      function (entries, obs) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ---------- "Wohnung ansehen" -> Auswahl setzen + zum Formular ---------- */
  const wohnungSelect = document.getElementById("wohnung");
  const kontakt = document.getElementById("kontakt");

  document.querySelectorAll("[data-wohnung]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      const wahl = btn.getAttribute("data-wohnung");
      if (wohnungSelect && wahl) wohnungSelect.value = wahl;
      if (kontakt) {
        kontakt.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "start",
        });
      }
    });
  });

  /* ---------- Formular ----------
     Hinweis: Für den Live-Betrieb das Formular an einen Endpunkt
     anbinden (z. B. Formspree, eigenes Resend-Backend o. Ä.).
     Hier: Validierung + freundliche Bestätigung, ohne Server.       */
  const form = document.getElementById("anfrageForm");
  const success = document.getElementById("formSuccess");

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      // --- Hier könnte der Versand an einen Endpunkt erfolgen ---
      // const data = new FormData(form);
      // fetch("DEIN_ENDPUNKT", { method: "POST", body: data });

      if (success) {
        success.hidden = false;
        success.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "nearest",
        });
      }
      form.reset();
    });
  }
})();