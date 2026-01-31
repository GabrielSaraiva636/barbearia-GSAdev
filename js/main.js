(() => {
  const body = document.body;
  const waRaw = body.dataset.whatsapp || "";
  const waDigits = waRaw.replace(/\D/g, "");
  const utm = (body.dataset.utm || "").trim();
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const waDisplayEls = document.querySelectorAll("[data-wa-display]");
  waDisplayEls.forEach((el) => {
    el.textContent = waRaw || "WhatsApp";
  });

  const yearEls = document.querySelectorAll("[data-current-year]");
  const currentYear = new Date().getFullYear();
  yearEls.forEach((el) => {
    el.textContent = currentYear;
  });

  const telLinks = document.querySelectorAll("[data-tel-link]");
  telLinks.forEach((el) => {
    if (waDigits) {
      el.href = `tel:+${waDigits}`;
    }
  });

  function buildWhatsAppLink({ service, name, day, time, notes }) {
    const safeName = (name || "").trim();
    const safeService = (service || "").trim();
    const safeDay = (day || "").trim();
    const safeTime = (time || "").trim();
    const safeNotes = (notes || "").trim();

    const parts = [];
    if (safeName) {
      parts.push(`Olá! Meu nome é ${safeName}.`);
    } else {
      parts.push("Olá!");
    }

    let agendaLine = "Quero agendar";
    if (safeService) {
      agendaLine += ` ${safeService}`;
    } else {
      agendaLine += " um horário";
    }

    if (safeDay) {
      agendaLine += ` para ${safeDay}`;
    }

    if (safeTime) {
      agendaLine += ` às ${safeTime}`;
    }

    agendaLine += ".";
    parts.push(agendaLine);

    if (safeNotes) {
      parts.push(safeNotes);
    }

    if (utm) {
      parts.push(`UTM: ${utm}`);
    }

    const message = parts.join(" ");
    return `https://wa.me/${waDigits}?text=${encodeURIComponent(message)}`;
  }

  function openWhatsApp(payload) {
    if (!waDigits) return;
    const url = buildWhatsAppLink(payload);
    window.open(url, "_blank", "noopener");
  }

  const serviceSelect = document.getElementById("service");
  const serviceOptions = serviceSelect
    ? Array.from(serviceSelect.options).map((opt) => opt.value)
    : [];

  document.querySelectorAll("[data-service]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const service = btn.dataset.service || "";
      if (serviceSelect && serviceOptions.includes(service)) {
        serviceSelect.value = service;
      }
    });
  });

  document.querySelectorAll("[data-wa]").forEach((btn) => {
    if (btn.tagName === "A") {
      btn.setAttribute(
        "href",
        waDigits ? buildWhatsAppLink({ service: btn.dataset.service }) : "#"
      );
      btn.setAttribute("target", "_blank");
      btn.setAttribute("rel", "noopener");
    }
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      const service = btn.dataset.service || "";
      openWhatsApp({ service });
    });
  });

  const form = document.getElementById("contactForm");
  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(form);
      const payload = {
        name: data.get("name"),
        service: data.get("service"),
        day: data.get("day"),
        time: data.get("time"),
        notes: data.get("notes"),
      };
      openWhatsApp(payload);
    });
  }

  const navToggle = document.getElementById("navToggle");
  const navMenu = document.getElementById("navMenu");
  const navBackdrop = document.getElementById("navBackdrop");

  const closeMenu = () => {
    if (!navMenu || !navToggle || !navBackdrop) return;
    navMenu.classList.remove("is-open");
    navBackdrop.classList.remove("is-open");
    navMenu.setAttribute("aria-hidden", "true");
    navBackdrop.setAttribute("aria-hidden", "true");
    navToggle.setAttribute("aria-expanded", "false");
  };

  const openMenu = () => {
    if (!navMenu || !navToggle || !navBackdrop) return;
    navMenu.classList.add("is-open");
    navBackdrop.classList.add("is-open");
    navMenu.setAttribute("aria-hidden", "false");
    navBackdrop.setAttribute("aria-hidden", "false");
    navToggle.setAttribute("aria-expanded", "true");
  };

  if (navToggle && navMenu && navBackdrop) {
    navMenu.setAttribute("aria-hidden", "true");
    navToggle.addEventListener("click", () => {
      const isOpen = navMenu.classList.contains("is-open");
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    navBackdrop.addEventListener("click", closeMenu);
    navMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");
      if (!targetId || targetId === "#") return;
      const target = document.querySelector(targetId);
      if (!target) return;
      event.preventDefault();
      target.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
      closeMenu();
    });
  });

  const faqItems = document.querySelectorAll(".faq-item");
  faqItems.forEach((item) => {
    const button = item.querySelector(".faq-question");
    const answer = item.querySelector(".faq-answer");
    if (!button || !answer) return;
    button.addEventListener("click", () => {
      const isOpen = button.getAttribute("aria-expanded") === "true";
      faqItems.forEach((other) => {
        const otherButton = other.querySelector(".faq-question");
        const otherAnswer = other.querySelector(".faq-answer");
        if (!otherButton || !otherAnswer) return;
        otherButton.setAttribute("aria-expanded", "false");
        otherAnswer.hidden = true;
      });
      button.setAttribute("aria-expanded", String(!isOpen));
      answer.hidden = isOpen;
    });
  });

  const revealItems = document.querySelectorAll(".reveal");
  if (!prefersReducedMotion && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("in-view"));
  }

  const countdown = document.querySelector("[data-countdown]");
  if (countdown) {
    const hoursEl = countdown.querySelector('[data-countdown-part="hours"]');
    const minutesEl = countdown.querySelector(
      '[data-countdown-part="minutes"]'
    );
    const secondsEl = countdown.querySelector(
      '[data-countdown-part="seconds"]'
    );

    const updateCountdown = () => {
      const now = new Date();
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      let diff = end - now;
      if (diff < 0) diff = 24 * 60 * 60 * 1000;

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      if (hoursEl) hoursEl.textContent = String(hours).padStart(2, "0");
      if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, "0");
      if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, "0");
    };

    if (prefersReducedMotion) {
      countdown.textContent = "Oferta válida hoje";
    } else {
      updateCountdown();
      setInterval(updateCountdown, 1000);
    }
  }
})();
