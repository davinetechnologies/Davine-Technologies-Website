// =====================================================================
// Davine Technologies — interactions
// =====================================================================
(function () {
  "use strict";

  // ========================================
// API CONFIGURATION
// ========================================

// Local Development
const API_BASE_URL = "https://davine-technologies-website.onrender.com";

// Production (Future)
// const API_BASE_URL = "https://your-backend-domain.com";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* -------------------------------------------------------------
     Mobile nav toggle
  ------------------------------------------------------------- */
  var navToggle = document.getElementById("navToggle");
  var mainNav = document.getElementById("mainNav");
  if (navToggle && mainNav) {
    navToggle.addEventListener("click", function () {
      var open = mainNav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    mainNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mainNav.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* -------------------------------------------------------------
     Scroll reveal (fade-up / left / right / zoom / blur via
     the data-reveal attribute value — see styles.css)
  ------------------------------------------------------------- */
  var revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* -------------------------------------------------------------
     Button ripple effect
  ------------------------------------------------------------- */
  /*document.querySelectorAll(".btn").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      var rect = btn.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height) * 1.2;
      var ripple = document.createElement("span");
      ripple.className = "ripple-el";
      ripple.style.width = ripple.style.height = size + "px";
      ripple.style.left = (e.clientX - rect.left - size / 2) + "px";
      ripple.style.top = (e.clientY - rect.top - size / 2) + "px";
      btn.appendChild(ripple);
      window.setTimeout(function () { ripple.remove(); }, 650);
    });
  });

  /* -------------------------------------------------------------
     Hero visual — subtle mouse parallax
  ------------------------------------------------------------- */
  var heroSection = document.getElementById("hero");
  var visualPanel = document.querySelector(".visual-panel");
  if (heroSection && visualPanel && !reduceMotion && window.matchMedia("(min-width: 1021px)").matches) {
    var rafId = null;
    heroSection.addEventListener("mousemove", function (e) {
      if (rafId) return;
      rafId = window.requestAnimationFrame(function () {
        var rect = heroSection.getBoundingClientRect();
        var relX = (e.clientX - rect.left) / rect.width - 0.5;
        var relY = (e.clientY - rect.top) / rect.height - 0.5;
        visualPanel.style.transform =
          "rotateY(" + (relX * 4) + "deg) rotateX(" + (relY * -4) + "deg)";
        rafId = null;
      });
    });
    heroSection.addEventListener("mouseleave", function () {
      visualPanel.style.transform = "rotateY(0deg) rotateX(0deg)";
    });
    visualPanel.style.transition = "transform 0.3s ease";
    visualPanel.style.transformStyle = "preserve-3d";
  }

  /* -------------------------------------------------------------
     Animated stat counters — count up when scrolled into view
  ------------------------------------------------------------- */
  var statEls = document.querySelectorAll(".stat-num");
  function animateStat(el) {
    var target = parseFloat(el.getAttribute("data-target")) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    var isDecimal = target % 1 !== 0;
    if (reduceMotion) {
      el.textContent = target + suffix;
      return;
    }
    var start = 0;
    var duration = 1400;
    var startTime = null;

    function step(ts) {
      if (startTime === null) startTime = ts;
      var progress = Math.min((ts - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = start + (target - start) * eased;
      el.textContent = (isDecimal ? value.toFixed(1) : Math.round(value)) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  if (statEls.length) {
    if ("IntersectionObserver" in window) {
      var statIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animateStat(entry.target);
            statIo.unobserve(entry.target);
          }
        });
      }, { threshold: 0.5 });
      statEls.forEach(function (el) { statIo.observe(el); });
    } else {
      statEls.forEach(animateStat);
    }
  }

  /* -------------------------------------------------------------
     Careers — "Apply now" pre-selects the role and scrolls to form
  ------------------------------------------------------------- */
  var roleSelect = document.getElementById("role");
  var applyForm = document.getElementById("applyForm");
  document.querySelectorAll(".career-apply").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var role = btn.getAttribute("data-role");
      if (roleSelect && role) {
        roleSelect.value = role;
      }
      if (applyForm) {
        applyForm.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
        var nameField = document.getElementById("fullName");
        if (nameField) window.setTimeout(function () { nameField.focus(); }, 400);
      }
    });
  });

  /* -------------------------------------------------------------
     File drop label
  ------------------------------------------------------------- */
  var resumeInput = document.getElementById("resume");
  var fileDropLabel = document.getElementById("fileDropLabel");
  if (resumeInput && fileDropLabel) {
    resumeInput.addEventListener("change", function () {
      if (resumeInput.files && resumeInput.files.length) {
        fileDropLabel.textContent = resumeInput.files[0].name;
      } else {
        fileDropLabel.textContent = "Drop file or click to browse";
      }
    });
  }

  /* -------------------------------------------------------------
     Forms — front-end only demo handling.
     No backend is wired up: swap this for a real fetch() call to
     your API or form service (e.g. Formspree, your own endpoint).
  ------------------------------------------------------------- */
  function wireForm(formId, noteId, successText) {
    var form = document.getElementById(formId);
    var note = document.getElementById(noteId);
    if (!form || !note) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      note.textContent = successText;
      form.reset();
      if (fileDropLabel && formId === "applyForm") {
        fileDropLabel.textContent = "Drop file or click to browse";
      }
      window.setTimeout(function () {
        note.textContent = "";
      }, 6000);
    });
  }

  function initApplicationForm() {
  var form = document.getElementById("applyForm");
  var note = document.getElementById("applyNote");

  if (!form || !note) return;

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    note.textContent = "Submitting application...";

    try {
      var formData = new FormData(form);

      var response = await fetch(API_BASE_URL + "/api/applications", {
        method: "POST",
        body: formData
      });

      var result = await response.json();

      if (response.ok && result.success) {
        note.textContent = "Application submitted successfully.";

        form.reset();

        if (fileDropLabel) {
          fileDropLabel.textContent = "Drop file or click to browse";
        }
      } else {
        note.textContent = result.message || "Application submission failed.";
      }

    } catch (error) {
      console.error(error);
      note.textContent = "Server connection failed.";
    }

    setTimeout(function () {
      note.textContent = "";
    }, 5000);
  });
}

  //wireForm("applyForm", "applyNote", "Application received — we'll be in touch shortly.");
  initApplicationForm();
  wireForm("contactForm", "contactNote", "Message sent — we'll reply within one business day.");

  /* -------------------------------------------------------------
     Header — glass effect + shadow on scroll
  ------------------------------------------------------------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var onScroll = function () {
      if (window.scrollY > 8) {
        header.classList.add("is-scrolled");
      } else {
        header.classList.remove("is-scrolled");
      }
    };
    window.addEventListener("scroll", onScroll);
    onScroll();
  }
})();
