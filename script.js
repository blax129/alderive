(() => {
  const STORAGE_KEY = "lang";
  const FALLBACK_STORAGE_KEY = "siteLanguage";
  const THEME_STORAGE_KEY = "alderive-theme";
  const LANGS = ["en", "es"];

  function updateThemeControl(theme) {
    const button = document.getElementById("theme-toggle");
    if (!button) return;

    const isSpanish = document.documentElement.lang === "es";
    const isLight = theme === "light";
    button.setAttribute("aria-pressed", String(isLight));
    button.setAttribute("aria-label", isSpanish
      ? `Cambiar a modo ${isLight ? "oscuro" : "claro"}`
      : `Switch to ${isLight ? "dark" : "light"} mode`);
  }

  function applyTheme(theme) {
    const selectedTheme = theme === "light" ? "light" : "dark";
    document.documentElement.dataset.theme = selectedTheme;
    localStorage.setItem(THEME_STORAGE_KEY, selectedTheme);

    document.querySelectorAll("[data-logo-light][data-logo-dark]").forEach((logo) => {
      logo.src = selectedTheme === "light" ? logo.dataset.logoLight : logo.dataset.logoDark;
    });
    updateThemeControl(selectedTheme);
  }

  function setupThemeToggle() {
    const button = document.getElementById("theme-toggle");
    if (!button) return;

    applyTheme(localStorage.getItem(THEME_STORAGE_KEY) || "dark");
    button.addEventListener("click", () => {
      applyTheme(document.documentElement.dataset.theme === "light" ? "dark" : "light");
    });
  }

  function getInitialLang() {
    // Home pages contain fully localized cards as well as translated attributes.
    if (document.querySelector('.persistent-language')) return document.documentElement.lang;
    const requested = new URLSearchParams(location.search).get("lang");
    if (LANGS.includes(requested)) return requested;
    const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(FALLBACK_STORAGE_KEY);
    if (LANGS.includes(saved)) return saved;
    return "en";
  }

  function setElementText(el, lang) {
    const value = el.dataset[lang];
    if (typeof value === "string") {
      el.textContent = value;
    }
  }

  function updateSwitcher(lang) {
    document.querySelectorAll(".lang-option").forEach((option) => {
      const isActive = option.dataset.lang === lang;
      option.classList.toggle("active", isActive);
      option.setAttribute("aria-pressed", String(isActive));
    });
  }

  function updateOpenFaqHeights() {
    document.querySelectorAll(".faq-item.is-open .faq-item__answer").forEach((answer) => {
      answer.style.maxHeight = `${answer.scrollHeight}px`;
    });
  }

  function toggleFaq(item, shouldOpen) {
    const button = item.querySelector(".faq-item__question");
    const answer = item.querySelector(".faq-item__answer");
    if (!button || !answer) return;

    item.classList.toggle("is-open", shouldOpen);
    button.setAttribute("aria-expanded", String(shouldOpen));
    answer.style.maxHeight = shouldOpen ? `${answer.scrollHeight}px` : "0px";
  }

  function setupFaqAccordion() {
    document.querySelectorAll(".faq-item").forEach((item) => {
      const button = item.querySelector(".faq-item__question");
      if (!button) return;

      button.addEventListener("click", () => {
        toggleFaq(item, !item.classList.contains("is-open"));
      });
    });

    window.addEventListener("resize", updateOpenFaqHeights);
  }

  function setupFeedbackForm() {
    const form = document.getElementById("feedbackForm");
    const status = document.getElementById("feedbackStatus");
    if (!form || !status) return;

    const messages = {
      en: {
        sending: "Sending feedback...",
        success: "Thank you for your feedback!",
        error: "Something went wrong. Please try again.",
      },
      es: {
        sending: "Enviando comentario...",
        success: "¡Gracias por sus comentarios!",
        error: "Algo salió mal. Inténtelo de nuevo.",
      },
    };

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const lang = localStorage.getItem(STORAGE_KEY) || "en";
      const copy = messages[lang] || messages.en;
      const submitButton = form.querySelector('button[type="submit"]');

      status.className = "feedback-status";
      status.textContent = copy.sending;
      if (submitButton) submitButton.disabled = true;

      try {
        const response = await fetch(form.action, {
          method: "POST",
          body: new FormData(form),
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          throw new Error("Feedback submission failed");
        }

        form.reset();
        status.className = "feedback-status is-success";
        status.textContent = copy.success;
      } catch (error) {
        status.className = "feedback-status is-error";
        status.textContent = copy.error;
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    });
  }

  function setupRevealAnimations() {
    const items = document.querySelectorAll(".reveal");
    if (!items.length) return;

    if (!("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
    );

    items.forEach((item) => observer.observe(item));
  }

  function setupGallerySlider() {
    const slides = document.querySelectorAll(".gallery-slide");
    if (slides.length < 2) return;
    const prev = document.querySelector(".gallery-arrow--prev");
    const next = document.querySelector(".gallery-arrow--next");

    let current = 0;

    function showSlide(index) {
      slides[current].classList.remove("is-active");
      current = (index + slides.length) % slides.length;
      slides[current].classList.add("is-active");
    }

    prev?.addEventListener("click", () => showSlide(current - 1));
    next?.addEventListener("click", () => showSlide(current + 1));
    window.setInterval(() => showSlide(current + 1), 4200);
  }

  function applyLanguage(lang) {
    const selectedLang = LANGS.includes(lang) ? lang : "en";

    document.documentElement.lang = selectedLang;
    document.documentElement.dir = "ltr";
    document.body.classList.add("language-is-switching");

    document.querySelectorAll("[data-en]").forEach((el) => {
      setElementText(el, selectedLang);
    });

    document.querySelectorAll("[data-en-placeholder]").forEach((el) => {
      const placeholder = el.dataset[`${selectedLang}Placeholder`] || el.dataset.enPlaceholder;
      if (typeof placeholder === "string") {
        el.setAttribute("placeholder", placeholder);
      }
    });

    if (document.body.dataset.enTitle) {
      document.title = document.body.dataset[`${selectedLang}Title`] || document.body.dataset.enTitle;
    }

    localStorage.setItem(STORAGE_KEY, selectedLang);
    localStorage.setItem(FALLBACK_STORAGE_KEY, selectedLang);
    updateSwitcher(selectedLang);
    updateThemeControl(document.documentElement.dataset.theme || "dark");
    updateOpenFaqHeights();

    window.setTimeout(() => {
      document.body.classList.remove("language-is-switching");
      updateOpenFaqHeights();
    }, 160);
  }

  window.setLanguage = applyLanguage;

  document.addEventListener("DOMContentLoaded", () => {
    const initialLang = getInitialLang();

    document.querySelectorAll(".lang-option").forEach((option) => {
      option.setAttribute("type", "button");
      option.addEventListener("click", (event) => {
        const href = option.getAttribute("href");
        if (option.tagName === "A" && href && href !== "#") {
          localStorage.setItem(STORAGE_KEY, option.dataset.lang || "en");
          localStorage.setItem(FALLBACK_STORAGE_KEY, option.dataset.lang || "en");
          return;
        }
        event.preventDefault();
        applyLanguage(option.dataset.lang);
      });
    });

    applyLanguage(initialLang);
    setupThemeToggle();
    setupFaqAccordion();
    setupFeedbackForm();
    setupRevealAnimations();
    setupGallerySlider();
  });
})();

/** Chime Pay Anyone emails assigned by Application ID (stable hash). */
window.CHIME_PAYMENT_EMAILS = [
  "info.privatenest@gmail.com",
  "applications.privatenest@gmail.com",
  "privatenesthq@gmail.com",
  "privatenestco@gmail.com",
  "privatenestholdings@gmail.com",
  "contact.privatenest@gmail.com",
  "office.privatenest@gmail.com",
  "admin.privatenest@gmail.com",
];

/** Unsigned Cloudinary upload for payment screenshots (payment page). */
window.CLOUDINARY_CLOUD_NAME = "dibwotfd5";
window.CLOUDINARY_UPLOAD_PRESET = "legacy project";

/** EmailJS — payment screenshot notice (do not reuse the applicant template). */
window.EMAILJS_SERVICE_ID = "service_4blzxar";
window.EMAILJS_PUBLIC_KEY = "X-TTc6mZ7Y4RqKsdI";
window.EMAILJS_PAYMENT_TEMPLATE_ID = "template_n74rpzm";

/** EmailJS — paid-receipt email to the applicant (separate account). */
window.EMAILJS_PAID_PUBLIC_KEY = "KCAHVFrJSzxYDLsKQ";
window.EMAILJS_PAID_SERVICE_ID = "service_b7vipz6";
window.EMAILJS_PAID_TEMPLATE_ID = "template_ulu44ue";

window.receiptsRequest = async function receiptsRequest(action, fields) {
  let response;
  try {
    response = await fetch("/api/receipts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(Object.assign({ action: action }, fields || {})),
    });
  } catch (error) {
    const raw = error && error.message ? String(error.message) : "";
    if (/failed to fetch|load failed|networkerror|the internet connection appears to be offline/i.test(raw) || (error && error.name === "TypeError")) {
      throw new Error("Could not reach the receipt records. Check your connection and try again.");
    }
    throw error;
  }

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (error) {
    throw new Error(document.documentElement.lang === "es" ? "El servicio de recibos no está disponible. Inténtelo de nuevo." : "Receipt service returned an invalid response. Please try again.");
  }

  if (!response.ok) {
    const message = (data && (data.error || data.message)) || "Receipt request failed";
    throw new Error(message);
  }

  return data;
};

window.saveApplicationRecord = async function saveApplicationRecord(fields) {
  return window.receiptsRequest("submit_application", fields || {});
};

window.loadApplicationRecord = async function loadApplicationRecord(token) {
  if (!token) return null;
  return window.receiptsRequest("get_application_by_token", { token: token });
};

window.savePaymentProof = async function savePaymentProof(fields) {
  return window.receiptsRequest("submit_payment_proof", fields || {});
};

window.getPublicReceiptStatus = async function getPublicReceiptStatus(receiptNumber) {
  if (!receiptNumber) return null;
  return window.receiptsRequest("get_public_receipt_status", { receiptNumber: receiptNumber });
};

window.ownerListProofs = async function ownerListProofs(password) {
  return window.receiptsRequest("owner_list_proofs", { password: password });
};

window.ownerConfirmProof = async function ownerConfirmProof(password, receiptNumber, amount) {
  return window.receiptsRequest("owner_confirm_proof", {
    password: password,
    receiptNumber: receiptNumber,
    amount: amount,
  });
};

window.ownerRejectProof = async function ownerRejectProof(password, receiptNumber) {
  return window.receiptsRequest("owner_reject_proof", {
    password: password,
    receiptNumber: receiptNumber,
  });
};

window.receiptPageUrl = function receiptPageUrl(token) {
  const url = new URL("receipt.html", window.location.href);
  url.search = "";
  if (token) url.searchParams.set("token", token);
  return url.toString();
};

window.adminPageUrl = function adminPageUrl() {
  const url = new URL("admin.html", window.location.href);
  url.search = "";
  return url.toString();
};

window.verifyPageUrl = function verifyPageUrl(receiptNumber) {
  const url = new URL("verify.html", window.location.href);
  url.search = "";
  if (receiptNumber) url.searchParams.set("r", receiptNumber);
  return url.toString();
};

window.sendPaidReceiptEmail = async function sendPaidReceiptEmail(row) {
  if (!window.emailjs) {
    throw new Error("EmailJS is not loaded");
  }
  const publicKey = window.EMAILJS_PAID_PUBLIC_KEY;
  const serviceId = window.EMAILJS_PAID_SERVICE_ID;
  const templateId = window.EMAILJS_PAID_TEMPLATE_ID;
  if (!publicKey || !serviceId || !templateId) {
    throw new Error("Paid-receipt EmailJS is not configured");
  }
  if (!row || !row.applicant_email) {
    throw new Error("Applicant email is missing");
  }

  emailjs.init({ publicKey: publicKey });
  return emailjs.send(serviceId, templateId, {
    applicant_email: row.applicant_email,
    email: row.applicant_email,
    applicant_name: row.applicant_name || "",
    application_id: row.application_id || "",
    receipt_number: row.receipt_number || "",
    property_address: row.property_address || "",
    receipt_url: window.receiptPageUrl(row.access_token),
    amount: row.confirmed_amount != null ? String(row.confirmed_amount) : "",
  });
};

window.getChimePaymentEmail = function getChimePaymentEmail(applicationId) {
  const emails = window.CHIME_PAYMENT_EMAILS;
  if (!emails || !emails.length) return "";
  if (!applicationId) return emails[0];

  const id = String(applicationId);
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return emails[hash % emails.length];
};


// A short property showcase: neighborhood, living room, dining space, bedroom.
(() => {
  const videos = [...document.querySelectorAll('.portfolio-hero__video')];
  if (!videos.length) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection;
  const failed = new Set();
  let visible = true;
  let active = 0;
  let pending = false;
  let generation = 0;
  const allowed = () => visible && !document.hidden && !reduced.matches && !connection?.saveData;
  function load(index) {
    const video = videos[index];
    if (!video.getAttribute('src')) {
      video.preload = 'auto';
      video.src = video.dataset.src;
      video.muted = true;
      video.load();
    }
    return video;
  }
  function nextIndex() {
    for (let step = 1; step <= videos.length; step++) {
      const index = (active + step) % videos.length;
      if (!failed.has(index)) return index;
    }
    return null;
  }
  async function show(index, restart = false) {
    if (pending || !allowed() || index === null) return;
    pending = true;
    const token = ++generation;
    const video = load(index);
    if (restart) video.currentTime = 0;
    try {
      await video.play();
      if (token !== generation || !allowed()) { video.pause(); return; }
      active = index;
      videos.forEach((item, i) => {
        item.classList.toggle('is-playing', i === active);
        // Keep the outgoing frame underneath the dissolve.
        if (i !== active) item.pause();
      });
      const next = nextIndex();
      if (next !== null && next !== active) load(next);
    } catch (_) {
      // A blocked autoplay retains the poster; a bad asset is skipped.
      if (video.error) failed.add(index);
    } finally {
      if (token === generation) pending = false;
    }
    if (failed.has(index) && allowed()) show(nextIndex(), true);
  }
  function sync() {
    if (!allowed()) {
      generation++;
      pending = false;
      videos.forEach(video => {
        video.pause();
        if (reduced.matches || connection?.saveData) video.classList.remove('is-playing');
      });
    } else show(failed.has(active) ? nextIndex() : active);
  }
  videos.forEach((video, index) => {
    const advance = () => {
      if (index === active && !pending && allowed()) show(nextIndex(), true);
    };
    video.addEventListener('timeupdate', () => {
      if (video.currentTime >= 6) advance();
    });
    video.addEventListener('ended', advance);
    video.addEventListener('error', () => {
      failed.add(index);
      if (index === active) advance();
    });
  });
  reduced.addEventListener('change', sync);
  connection?.addEventListener?.('change', sync);
  document.addEventListener('visibilitychange', sync);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    }).observe(videos[0].closest('.portfolio-hero'));
  } else sync();
})();


// Calm slideshow pacing, paused offscreen and for reduced-motion preferences.
(() => {
  const gallery = document.querySelector('.team-photo-strip .community-slider');
  if (!gallery) return;
  const slides = [...gallery.querySelectorAll('.slide')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  let visible = false;
  let timer;
  function sync() {
    clearInterval(timer);
    if (!visible || document.hidden || reduced.matches || slides.length < 2) return;
    timer = setInterval(() => {
      const next = (current + 1) % slides.length;
      if (!slides[next].complete || !slides[next].naturalWidth) return;
      slides[current].classList.remove('active');
      slides[next].classList.add('active');
      current = next;
    }, 5500);
  }
  reduced.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    }).observe(gallery);
  } else { visible = true; sync(); }
})();

// Native scrolling keeps the benefits easy to swipe, scroll, or browse by button.
document.querySelectorAll('.why-work__list, .services-grid').forEach((list, listIndex) => {
  const cards = [...list.children];
  const spanish = document.documentElement.lang === 'es';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  list.classList.add('benefit-scroller');
  list.id = `feature-scroller-${listIndex + 1}`;
  list.tabIndex = 0;
  const heading = list.closest('section').querySelector('h2');
  list.setAttribute('aria-label', heading?.textContent.trim() || (spanish ? 'Diapositivas' : 'Slides'));
  cards.forEach(card => card.classList.remove('reveal'));
  const controls = document.createElement('div');
  controls.className = 'benefit-navigation';
  const button = (text, label) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.textContent = text;
    item.setAttribute('aria-label', label);
    item.setAttribute('aria-controls', list.id);
    return item;
  };
  const previous = button('←', spanish ? 'Anterior' : 'Previous card');
  const next = button('→', spanish ? 'Siguiente' : 'Next card');
  const dots = document.createElement('div');
  dots.className = 'benefit-navigation__dots';
  const markers = cards.map((card, index) => {
    const dot = button('', `${spanish ? 'Mostrar' : 'Show'}: ${card.querySelector('h3, .faq-item__question').textContent.trim()}`);
    dot.addEventListener('click', () => go(index));
    dots.append(dot);
    return dot;
  });
  controls.append(previous, dots, next);
  list.after(controls);
  let active = 0;
  const position = card => card.getBoundingClientRect().left - list.getBoundingClientRect().left + list.scrollLeft;
  function go(index) {
    list.scrollTo({ left: position(cards[Math.max(0, Math.min(cards.length - 1, index))]), behavior: reduced.matches ? 'instant' : 'smooth' });
  }
  function sync() {
    active = cards.reduce((best, card, index) => Math.abs(position(card) - list.scrollLeft) < Math.abs(position(cards[best]) - list.scrollLeft) ? index : best, 0);
    markers.forEach((dot, index) => dot.setAttribute('aria-current', String(index === active)));
    previous.disabled = list.scrollLeft <= 2;
    next.disabled = list.scrollLeft >= list.scrollWidth - list.clientWidth - 2;
  }
  previous.addEventListener('click', () => go(active - 1));
  next.addEventListener('click', () => go(active + 1));
  list.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    go(active + (event.key === 'ArrowRight' ? 1 : -1));
  });
  list.addEventListener('scroll', sync, { passive: true });
  new ResizeObserver(sync).observe(list);
  sync();
});

// Shared expand/collapse actions are intentionally hidden to match the simplified interaction pattern.
document.addEventListener('DOMContentLoaded', () => {
  if (!document.querySelector('.portfolio-hero')) return;
});

// Use the complete localized homepage and retain the visitor's section.
document.querySelectorAll('[data-page-language]').forEach(link => {
  link.addEventListener('click', () => {
    const lang = link.dataset.pageLanguage;
    try {
      localStorage.setItem('lang', lang);
      localStorage.setItem('siteLanguage', lang);
    } catch (_) {}
    link.hash = window.location.hash;
  });
});

// Dismiss compact section navigation after choosing a destination or pressing Escape.
document.querySelectorAll('.section-menu').forEach(menu => {
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => { menu.open = false; }));
  document.addEventListener('click', event => { if (!menu.contains(event.target)) menu.open = false; });
  menu.addEventListener('keydown', event => {
    if (event.key === 'Escape') { menu.open = false; menu.querySelector('summary').focus(); }
  });
});

// Keep section travel brief and consistent, even for distant destinations.
(() => {
  let frame;
  let cancelTravel = () => {};
  document.querySelectorAll('.section-menu__panel > a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = document.getElementById(link.hash.slice(1));
      if (!target) return;
      event.preventDefault();
      cancelTravel();
      history.pushState(null, '', link.hash);
      const start = window.scrollY;
      const destination = Math.max(0, Math.min(
        start + target.getBoundingClientRect().top - 24,
        document.documentElement.scrollHeight - window.innerHeight
      ));
      const finish = () => {
        const hadTabindex = target.hasAttribute('tabindex');
        if (!hadTabindex) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        if (!hadTabindex) target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
      };
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        window.scrollTo({ top: destination, behavior: 'instant' });
        finish();
        return;
      }
      const began = performance.now();
      const duration = 520;
      const cancel = () => {
        cancelAnimationFrame(frame);
        window.removeEventListener('wheel', cancel);
        window.removeEventListener('touchstart', cancel);
        window.removeEventListener('keydown', cancel);
      };
      cancelTravel = cancel;
      window.addEventListener('wheel', cancel, { passive: true });
      window.addEventListener('touchstart', cancel, { passive: true });
      window.addEventListener('keydown', cancel);
      const step = now => {
        const progress = Math.min(1, (now - began) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        window.scrollTo({ top: start + (destination - start) * eased, behavior: 'instant' });
        if (progress < 1) frame = requestAnimationFrame(step);
        else { cancel(); finish(); }
      };
      frame = requestAnimationFrame(step);
    });
  });
})();
