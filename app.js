// ===============================
// DAVINE TECHNOLOGIES - app.js
// Premium Startup Website Script
// ===============================

// NAVBAR SCROLL EFFECT
const navbar = document.getElementById("navbar");

window.addEventListener("scroll", () => {
  if (window.scrollY > 40) {
    navbar.classList.add("scrolled");
  } else {
    navbar.classList.remove("scrolled");
  }
});

// ===============================
// MOBILE MENU
// ===============================

const hamburger = document.getElementById("hamburger");
const navLinks = document.getElementById("navLinks");

hamburger.addEventListener("click", () => {

  navLinks.classList.toggle("open");
  hamburger.classList.toggle("open");

});

// CLOSE MOBILE MENU ON LINK CLICK

document.querySelectorAll(".nav__link").forEach(link => {

  link.addEventListener("click", () => {

    navLinks.classList.remove("open");
    hamburger.classList.remove("open");

  });

});

// ===============================
// SMOOTH SCROLL
// ===============================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {

  anchor.addEventListener("click", function (e) {

    const target = document.querySelector(this.getAttribute("href"));

    if (!target) return;

    e.preventDefault();

    target.scrollIntoView({
      behavior: "smooth"
    });

  });

});

// ===============================
// SCROLL REVEAL ANIMATION
// ===============================

const revealElements = document.querySelectorAll(".reveal");

const revealOnScroll = () => {

  const windowHeight = window.innerHeight;

  revealElements.forEach(el => {

    const top = el.getBoundingClientRect().top;

    if (top < windowHeight - 100) {
      el.classList.add("visible");
    }

  });

};

window.addEventListener("scroll", revealOnScroll);

revealOnScroll();

// ===============================
// COUNTER ANIMATION
// ===============================

const counters = document.querySelectorAll(".stat__num");

const counterObserver = new IntersectionObserver((entries) => {

  entries.forEach(entry => {

    if (!entry.isIntersecting) return;

    const counter = entry.target;

    const target = +counter.innerText;

    let current = 0;

    const increment = target / 100;

    const updateCounter = () => {

      current += increment;

      if (current < target) {

        counter.innerText = Math.ceil(current);

        requestAnimationFrame(updateCounter);

      } else {

        counter.innerText = target;

      }

    };

    updateCounter();

    counterObserver.unobserve(counter);

  });

}, {
  threshold: 0.5
});

counters.forEach(counter => {
  counterObserver.observe(counter);
});

// ===============================
// CONTACT FORM
// ===============================

const contactForm = document.getElementById("contactForm");

if (contactForm) {

  contactForm.addEventListener("submit", function (e) {

    e.preventDefault();

    const btn = document.getElementById("contactBtn");

    btn.classList.add("loading");

    btn.innerHTML = `
      <span class="spinner"></span>
      Sending...
    `;

    setTimeout(() => {

      btn.classList.remove("loading");

      btn.innerHTML = `
        <span>Send Message</span>
        <i class="fa-solid fa-arrow-up-right-from-square"></i>
      `;

      showToast("Message sent successfully!", "success");

      contactForm.reset();

    }, 1800);

  });

}

// ===============================
// INTERNSHIP FORM
// ===============================

const internshipForm = document.getElementById("internshipForm");

if (internshipForm) {

  internshipForm.addEventListener("submit", function (e) {

    e.preventDefault();

    const btn = document.getElementById("applyBtn");

    btn.classList.add("loading");

    btn.innerHTML = `
      <span class="spinner"></span>
      Submitting...
    `;

    setTimeout(() => {

      btn.classList.remove("loading");

      btn.innerHTML = `
        <span>Submit Application</span>
        <i class="fa-solid fa-paper-plane"></i>
      `;

      showToast("Application submitted successfully!", "success");

      internshipForm.reset();

    }, 1800);

  });

}

// ===============================
// TOAST NOTIFICATION
// ===============================

const toast = document.getElementById("toast");

function showToast(message, type = "success") {

  toast.innerText = message;

  toast.className = `toast show toast--${type}`;

  setTimeout(() => {

    toast.classList.remove("show");

  }, 3000);

}

// ===============================
// ACTIVE NAV LINK
// ===============================

const sections = document.querySelectorAll("section[id]");

window.addEventListener("scroll", navHighlighter);

function navHighlighter() {

  let scrollY = window.pageYOffset;

  sections.forEach(current => {

    const sectionHeight = current.offsetHeight;

    const sectionTop = current.offsetTop - 120;

    const sectionId = current.getAttribute("id");

    const navItem = document.querySelector(
      `.nav__links a[href*="${sectionId}"]`
    );

    if (
      scrollY > sectionTop &&
      scrollY <= sectionTop + sectionHeight
    ) {

      navItem?.classList.add("active");

    } else {

      navItem?.classList.remove("active");

    }

  });

}

// ===============================
// HERO PARALLAX EFFECT
// ===============================

const hero = document.querySelector(".hero");

window.addEventListener("scroll", () => {

  const scroll = window.pageYOffset;

  hero.style.backgroundPositionY = `${scroll * 0.4}px`;

});

// ===============================
// BUTTON RIPPLE EFFECT
// ===============================

const buttons = document.querySelectorAll(".btn");

buttons.forEach(button => {

  button.addEventListener("click", function (e) {

    const circle = document.createElement("span");

    const diameter = Math.max(
      button.clientWidth,
      button.clientHeight
    );

    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;

    circle.style.left = `${e.clientX - button.offsetLeft - radius}px`;

    circle.style.top = `${e.clientY - button.offsetTop - radius}px`;

    circle.classList.add("ripple");

    const ripple = button.querySelector(".ripple");

    if (ripple) {
      ripple.remove();
    }

    button.appendChild(circle);

  });

});

// ===============================
// PRELOADER (OPTIONAL)
// ===============================

window.addEventListener("load", () => {

  document.body.classList.add("loaded");

});