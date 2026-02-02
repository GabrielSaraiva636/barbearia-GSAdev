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

  function formatDate(dateValue) {
    if (!dateValue) return "";
    const parts = String(dateValue).split("-");
    if (parts.length !== 3) return dateValue;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  function buildWhatsAppLink({
    service,
    name,
    date,
    time,
    professional,
    payment,
    notes,
  }) {
    const safeName = (name || "").trim();
    const safeService = (service || "").trim();
    const safeDate = formatDate(date);
    const safeTime = (time || "").trim();
    const safeProfessional = (professional || "").trim();
    const safePayment = (payment || "").trim();
    const safeNotes = (notes || "").trim();

    const parts = [];
    if (safeName) {
      parts.push(`Olá! Meu nome é ${safeName}.`);
    } else {
      parts.push("Olá!");
    }

    let agendaLine = "Quero agendar um horário";
    if (safeService) {
      agendaLine += ` para ${safeService}`;
    }
    if (safeDate) {
      agendaLine += ` no dia ${safeDate}`;
    }
    if (safeTime) {
      agendaLine += ` às ${safeTime}`;
    }
    agendaLine += ".";
    parts.push(agendaLine);

    if (safeProfessional) {
      parts.push(`Profissional: ${safeProfessional}.`);
    }

    if (safePayment) {
      parts.push(`Pagamento: ${safePayment}.`);
    }

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

  const bookingModal = document.getElementById("bookingModal");
  const modalBackdrop = document.getElementById("modalBackdrop");
  const bookingForm = document.getElementById("bookingForm");
  const bookingDate = bookingForm
    ? bookingForm.querySelector('input[name="date"]')
    : null;
  const bookingTime = bookingForm
    ? bookingForm.querySelector('input[name="time"]')
    : null;
  const scheduleHint = bookingForm
    ? bookingForm.querySelector("[data-schedule-hint]")
    : null;
  const serviceSelect = document.querySelector("[data-service-select]");
  const serviceTrigger = serviceSelect
    ? serviceSelect.querySelector(".service-select-trigger")
    : null;
  const servicePanel = serviceSelect
    ? serviceSelect.querySelector(".service-select-panel")
    : null;
  const serviceHidden = serviceSelect
    ? serviceSelect.querySelector('input[name="services"]')
    : null;
  const serviceError = serviceSelect
    ? serviceSelect.querySelector(".service-error")
    : null;
  const serviceOptions = serviceSelect
    ? Array.from(serviceSelect.querySelectorAll(".service-option input"))
    : [];
  const bookingNotes = bookingForm
    ? bookingForm.querySelector('textarea[name="notes"]')
    : null;
  const charCount = bookingForm
    ? bookingForm.querySelector("[data-char-count]")
    : null;
  const notesToggle = bookingForm
    ? bookingForm.querySelector("[data-notes-toggle]")
    : null;
  const notesWrapper = bookingForm
    ? bookingForm.querySelector("[data-notes]")
    : null;

  const openModal = (service, triggerEl) => {
    if (!bookingModal || !modalBackdrop) return;
    if (serviceOptions.length) {
      serviceOptions.forEach((opt) => {
        opt.checked = false;
      });
      if (service) {
        const match = serviceOptions.find((opt) => opt.value === service);
        if (match) match.checked = true;
      }
      updateServiceSummary();
    }
    bookingModal.classList.add("is-open");
    modalBackdrop.classList.add("is-open");
    bookingModal.setAttribute("aria-hidden", "false");
    modalBackdrop.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    updateSchedule();

    const isMobile = window.matchMedia("(max-width: 600px)").matches;
    if (isMobile && triggerEl) {
      requestAnimationFrame(() => {
        const rect = triggerEl.getBoundingClientRect();
        const modalRect = bookingModal.getBoundingClientRect();
        const modalHeight = modalRect.height || 0;
        const viewportH = window.innerHeight;
        let top = rect.top - modalHeight - 12;
        if (top < 16) top = 16;
        if (top > viewportH - modalHeight - 16) {
          top = Math.max(16, viewportH - modalHeight - 16);
        }
        bookingModal.style.top = `${top}px`;
        bookingModal.style.left = "12px";
        bookingModal.style.transform = "none";
      });
    }
  };

  const closeModal = () => {
    if (!bookingModal || !modalBackdrop) return;
    bookingModal.classList.remove("is-open");
    modalBackdrop.classList.remove("is-open");
    bookingModal.setAttribute("aria-hidden", "true");
    modalBackdrop.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    bookingModal.style.top = "";
    bookingModal.style.left = "";
    bookingModal.style.transform = "";
    if (notesWrapper) {
      notesWrapper.classList.remove("is-open");
    }
    if (notesToggle) {
      notesToggle.setAttribute("aria-expanded", "false");
      notesToggle.textContent = "Adicionar observações";
    }
  };

  document.querySelectorAll("[data-appointment]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      openModal(btn.dataset.service || "", btn);
    });
  });

  document.querySelectorAll("[data-modal-close]").forEach((btn) => {
    btn.addEventListener("click", closeModal);
  });

  if (modalBackdrop) {
    modalBackdrop.addEventListener("click", closeModal);
  }

  const schedule = {
    0: null, // domingo fechado
    1: { open: "09:00", close: "20:00" },
    2: { open: "09:00", close: "20:00" },
    3: { open: "09:00", close: "20:00" },
    4: { open: "09:00", close: "20:00" },
    5: { open: "09:00", close: "20:00" },
    6: { open: "09:00", close: "18:00" },
  };

  const updateSchedule = () => {
    if (!bookingDate || !bookingTime) return;
    const today = new Date();
    const todayIso = today.toISOString().split("T")[0];
    bookingDate.min = todayIso;
    const value = bookingDate.value;
    if (!value) {
      bookingTime.removeAttribute("min");
      bookingTime.removeAttribute("max");
      bookingTime.disabled = true;
      if (scheduleHint) scheduleHint.textContent = "Selecione a data.";
      return;
    }
    if (value < todayIso) {
      bookingDate.value = "";
      bookingTime.removeAttribute("min");
      bookingTime.removeAttribute("max");
      bookingTime.disabled = true;
      if (scheduleHint) scheduleHint.textContent = "Selecione a data.";
      return;
    }
    if (value === todayIso) {
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const bufferMinutes = 30;
      const minMinutes = parseInt(bookingTime.min.split(":")[0], 10) * 60 + parseInt(bookingTime.min.split(":")[1], 10);
      const effectiveMin = Math.max(currentMinutes + bufferMinutes, minMinutes);
      const hours = String(Math.floor(effectiveMin / 60)).padStart(2, "0");
      const minutes = String(effectiveMin % 60).padStart(2, "0");
      bookingTime.min = `${hours}:${minutes}`;
    }
    const day = new Date(`${value}T00:00:00`).getDay();
    const slot = schedule[day];
    if (!slot) {
      bookingTime.value = "";
      bookingTime.disabled = true;
      if (scheduleHint) {
        scheduleHint.textContent = "Sem atendimento neste dia.";
      }
      return;
    }
    bookingTime.disabled = false;
    bookingTime.min = slot.open;
    bookingTime.max = slot.close;
    if (scheduleHint) {
      scheduleHint.textContent = `Atendimento: ${slot.open}–${slot.close}`;
    }
  };

  const closeServicePanel = () => {
    if (!servicePanel || !serviceTrigger) return;
    servicePanel.classList.remove("is-open");
    serviceTrigger.setAttribute("aria-expanded", "false");
  };

  const updateServiceSummary = () => {
    if (!serviceOptions.length || !serviceHidden || !serviceTrigger) return;
    const selected = serviceOptions.filter((opt) => opt.checked);
    const labels = selected.map((opt) => opt.value);
    serviceHidden.value = labels.join(", ");
    serviceTrigger.textContent =
      labels.length > 0
        ? labels.join(", ")
        : "Selecione um ou mais serviços";
    if (serviceError) serviceError.textContent = "";
  };

  if (serviceTrigger && servicePanel) {
    serviceTrigger.addEventListener("click", () => {
      const isOpen = servicePanel.classList.contains("is-open");
      servicePanel.classList.toggle("is-open", !isOpen);
      serviceTrigger.setAttribute("aria-expanded", String(!isOpen));
    });

    serviceOptions.forEach((opt) => {
      opt.addEventListener("change", updateServiceSummary);
    });

    document.addEventListener("click", (event) => {
      if (!serviceSelect) return;
      if (!serviceSelect.contains(event.target)) {
        closeServicePanel();
      }
    });
  }

  if (bookingNotes && charCount) {
    const updateCount = () => {
      charCount.textContent = `${bookingNotes.value.length}/255`;
    };
    bookingNotes.addEventListener("input", updateCount);
    updateCount();
  }

  if (notesToggle && notesWrapper) {
    notesToggle.addEventListener("click", () => {
      const isOpen = notesWrapper.classList.toggle("is-open");
      notesToggle.setAttribute("aria-expanded", String(isOpen));
      notesToggle.textContent = isOpen
        ? "Ocultar observações"
        : "Adicionar observações";
    });
  }

  if (bookingForm) {
    bookingForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(bookingForm);
      const selectedServices = serviceOptions
        .filter((opt) => opt.checked)
        .map((opt) => opt.value);
      if (!selectedServices.length) {
        if (serviceError) {
          serviceError.textContent = "Selecione pelo menos um serviço.";
        }
        return;
      }
      if (bookingTime && bookingTime.disabled) {
        if (scheduleHint) {
          scheduleHint.textContent =
            "Escolha uma data com atendimento para continuar.";
        }
        return;
      }
      const payload = {
        service: selectedServices.join(", "),
        date: data.get("date"),
        time: data.get("time"),
        professional: data.get("professional"),
        payment: data.get("payment"),
        notes: data.get("notes"),
      };
      openWhatsApp(payload);
      bookingForm.reset();
      serviceOptions.forEach((opt) => {
        opt.checked = false;
      });
      updateServiceSummary();
      if (charCount) charCount.textContent = "0/255";
      updateSchedule();
      closeModal();
    });
  }

  if (bookingDate) {
    bookingDate.addEventListener("change", updateSchedule);
    bookingDate.addEventListener("input", updateSchedule);
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
      closeModal();
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
