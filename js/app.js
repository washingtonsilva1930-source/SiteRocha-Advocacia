(() => {
  "use strict";

  /* Header state on scroll */
  const header = document.getElementById("site-header");
  const onScroll = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 40);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* Mobile menu toggle */
  const menuToggle = document.getElementById("menu-toggle");
  const mobileNav = document.getElementById("mobile-nav");
  menuToggle.addEventListener("click", () => {
    const isOpen = mobileNav.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
  });
  mobileNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mobileNav.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });

  /* Reveal on scroll */
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* FAQ accordion */
  document.querySelectorAll(".faq-question").forEach((btn) => {
    btn.addEventListener("click", () => {
      const item = btn.closest(".faq-item");
      const answer = item.querySelector(".faq-answer");
      const isOpen = btn.getAttribute("aria-expanded") === "true";

      document.querySelectorAll(".faq-question").forEach((otherBtn) => {
        if (otherBtn !== btn) {
          otherBtn.setAttribute("aria-expanded", "false");
          otherBtn.closest(".faq-item").querySelector(".faq-answer").style.maxHeight = null;
        }
      });

      btn.setAttribute("aria-expanded", String(!isOpen));
      answer.style.maxHeight = isOpen ? null : answer.scrollHeight + "px";
    });
  });

  /* Background videos: load + play only near viewport, pause when offscreen.
     If the visitor prefers reduced motion, never load them — the poster image stays.
     Sections sit flush against each other now, so on a tall desktop viewport
     several can be "intersecting" at once — decoding/playing them all at the
     same time is what made playback feel slow. Cap how many actually play
     simultaneously (the ones closest to the viewport center win); the rest
     stay paused on their poster frame until they earn a slot. */
  const bgVideos = document.querySelectorAll(".bg-video");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const MAX_PLAYING = 2;

  if (bgVideos.length && !prefersReducedMotion && "IntersectionObserver" in window) {
    const intersecting = new Set();

    const updatePlayback = () => {
      const vh = window.innerHeight;
      const center = vh / 2;
      const ranked = Array.from(intersecting).sort((a, b) => {
        const da = Math.abs(a.getBoundingClientRect().top + a.getBoundingClientRect().height / 2 - center);
        const db = Math.abs(b.getBoundingClientRect().top + b.getBoundingClientRect().height / 2 - center);
        return da - db;
      });
      const shouldPlay = new Set(ranked.slice(0, MAX_PLAYING));
      bgVideos.forEach((video) => {
        if (shouldPlay.has(video)) {
          if (!video.dataset.loaded) {
            const source = video.querySelector("source");
            source.src = source.dataset.src;
            video.load();
            video.dataset.loaded = "true";
          }
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    };

    const videoIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) intersecting.add(entry.target);
          else intersecting.delete(entry.target);
        });
        updatePlayback();
      },
      { rootMargin: "0px" }
    );
    bgVideos.forEach((video) => videoIO.observe(video));

    let rankTicking = false;
    window.addEventListener(
      "scroll",
      () => {
        if (!rankTicking) {
          requestAnimationFrame(() => {
            if (intersecting.size > MAX_PLAYING) updatePlayback();
            rankTicking = false;
          });
          rankTicking = true;
        }
      },
      { passive: true }
    );
  }

  /* Section crossfade: each background video/image fades in as its section
     enters the viewport and fades out as it scrolls past the top, so one
     clip dissolves into the next instead of cutting abruptly — reinforcing
     the illusion that the whole page is a single continuous video. */
  const fadeWrappers = document.querySelectorAll(
    ".hero, .authority-strip, .media-banner, .fill-wrap, .transition-section, .final-cta, .site-footer"
  );
  const fadeTargets = Array.from(fadeWrappers)
    .map((wrap) => ({ wrap, media: wrap.querySelector(".bg-video, .fill-bg img") }))
    .filter((t) => t.media);

  if (fadeTargets.length && !prefersReducedMotion) {
    let fadeTicking = false;
    const updateFades = () => {
      const vh = window.innerHeight;
      const fadeZone = Math.min(vh * 0.35, 220);
      fadeTargets.forEach(({ wrap, media }) => {
        const rect = wrap.getBoundingClientRect();
        const enter = Math.min(1, Math.max(0, (vh - rect.top) / fadeZone));
        const exit = Math.min(1, Math.max(0, rect.bottom / fadeZone));
        media.style.opacity = Math.min(enter, exit).toFixed(3);
      });
      fadeTicking = false;
    };
    window.addEventListener(
      "scroll",
      () => {
        if (!fadeTicking) {
          requestAnimationFrame(updateFades);
          fadeTicking = true;
        }
      },
      { passive: true }
    );
    window.addEventListener("resize", updateFades);
    updateFades();
  }

  /* Subtle hero parallax (very light, rAF-throttled) */
  const heroMedia = document.querySelector(".hero-media");
  if (heroMedia && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    let ticking = false;
    window.addEventListener(
      "scroll",
      () => {
        if (!ticking) {
          requestAnimationFrame(() => {
            const y = window.scrollY;
            if (y < window.innerHeight) {
              heroMedia.style.transform = `translateY(${y * 0.15}px)`;
            }
            ticking = false;
          });
          ticking = true;
        }
      },
      { passive: true }
    );
  }
})();
