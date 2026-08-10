(() => {
  "use strict";

  const body = document.body;
  const header = document.querySelector(".site-header");
  const menuButton = document.querySelector(".menu-button");
  const nav = document.querySelector(".global-nav");

  document.querySelectorAll("[data-year]").forEach((element) => {
    element.textContent = new Date().getFullYear();
  });

  const currentPage = body.dataset.page;
  const activeLink = document.querySelector(`[data-nav="${currentPage}"]`);
  if (activeLink) {
    activeLink.classList.add("active");
    activeLink.setAttribute("aria-current", "page");
  }

  const updateHeader = () => header?.classList.toggle("scrolled", window.scrollY > 24);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  const closeMenu = () => {
    if (!menuButton || !nav) return;
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-label", "メニューを開く");
    nav.classList.remove("open");
    body.classList.remove("menu-open");
  };

  menuButton?.addEventListener("click", () => {
    const willOpen = menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(willOpen));
    menuButton.setAttribute("aria-label", willOpen ? "メニューを閉じる" : "メニューを開く");
    nav?.classList.toggle("open", willOpen);
    body.classList.toggle("menu-open", willOpen);
  });
  nav?.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
      menuButton?.focus();
    }
  });

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealElements = document.querySelectorAll(".reveal");
  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealElements.forEach((element) => element.classList.add("visible"));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px" });
    revealElements.forEach((element) => observer.observe(element));
  }

  const form = document.querySelector("[data-contact-form]");
  if (!form) return;

  const status = form.querySelector(".form-status");
  const submitButton = form.querySelector('button[type="submit"]');
  const requiredFields = form.querySelectorAll("[required]");

  const validateField = (field) => {
    const wrapper = field.closest(".form-field");
    const error = wrapper?.querySelector(".field-error");
    let message = "";
    if (field.validity.valueMissing) message = "この項目を入力してください。";
    if (field.validity.typeMismatch) message = "正しいメールアドレスを入力してください。";
    wrapper?.classList.toggle("invalid", Boolean(message));
    if (error) error.textContent = message;
    field.setAttribute("aria-invalid", String(Boolean(message)));
    return !message;
  };

  requiredFields.forEach((field) => {
    field.addEventListener("invalid", () => validateField(field));
    field.addEventListener("blur", () => validateField(field));
    field.addEventListener("input", () => {
      if (field.closest(".form-field")?.classList.contains("invalid")) validateField(field);
    });
  });

  form.addEventListener("submit", async (event) => {
    const isValid = [...requiredFields].every(validateField);
    if (!isValid) {
      event.preventDefault();
      requiredFields.forEach((field) => {
        if (field.getAttribute("aria-invalid") === "true") field.focus();
      });
      return;
    }

    event.preventDefault();
    submitButton.disabled = true;
    submitButton.firstChild.textContent = "送信中… ";
    status.className = "form-status";
    status.textContent = "";

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      });
      if (!response.ok) throw new Error("Submission failed");
      form.reset();
      status.textContent = "お問い合わせを送信しました。内容を確認のうえ、順次返信いたします。";
      status.className = "form-status show success";
    } catch {
      status.textContent = "送信できませんでした。時間をおいて、もう一度お試しください。";
      status.className = "form-status show error";
    } finally {
      submitButton.disabled = false;
      submitButton.firstChild.textContent = "送信する ";
      status.focus?.();
    }
  });
})();