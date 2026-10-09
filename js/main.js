/* =========================================================================
   PORTFOLIO CONFIG — edit your personal content here (single source of truth)
   ========================================================================= */
const PORTFOLIO_CONFIG = {
  social: [
    {
      name: "GitHub",
      href: "https://github.com/ozonwankwoemmanuel12-ship-it",
      icon: '<svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.15c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.05.78 2.13v3.15c0 .3.2.67.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"/></svg>',
    },
    {
      name: "LinkedIn",
      href: "https://www.linkedin.com/in/your-linkedin-username",
      icon: '<svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45z"/></svg>',
    },
  ],

  skillGroups: [
    {
      title: "Languages",
      description: "The foundations everything else is built on.",
      icon: '<svg aria-hidden="true" viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 17l6-6-6-6M12 19h8"/></svg>',
      skills: ["HTML5", "CSS3", "JavaScript (ES6+)", "JSX"],
    },
    {
      title: "Frameworks & Libraries",
      description: "Modern tooling for scalable, component-driven UIs.",
      icon: '<svg aria-hidden="true" viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l10 6.5v7L12 22 2 15.5v-7L12 2z"/><path d="M12 22V11.5M2 8.5L12 11.5l10-3"/></svg>',
      skills: ["React", "Tailwind CSS", "Fetch API / REST", "Responsive Design"],
    },
    {
      title: "Tools & Workflow",
      description: "How I build, version and ship software.",
      icon: '<svg aria-hidden="true" viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4.5 4.5 0 0 0-6 6L3 18v3h3l5.7-5.7a4.5 4.5 0 0 0 6-6L14 12.6l-2.6-2.6 3.3-3.7z"/></svg>',
      skills: ["Git & GitHub", "VS Code", "npm", "Chrome DevTools", "Windows"],
    },
  ],

  tagCloud: ["Semantic HTML", "CSS Grid", "Flexbox", "Component Design", "Web Accessibility", "E-commerce UI", "Landing Pages", "Dark mode", "Local-first apps", "API integration"],

  projects: [
    {
      name: "Recipe Website",
      repo: "recipe-webstie",
      demo: "https://ozonwankwoemmanuel12-ship-it.github.io/recipe-webstie/",
      description:
        "A recipe discovery app that fetches real meal data from a public API and presents it in a clean, card-based interface with search and a fully responsive Tailwind layout.",
      tech: ["HTML5", "Tailwind CSS", "JavaScript", "Fetch API"],
    },
    {
      name: "Quote Machine",
      repo: "Quote-Machine",
      demo: "https://ozonwankwoemmanuel12-ship-it.github.io/Quote-Machine/",
      description:
        "A minimalist app that generates a random inspirational quote on demand, with clean transitions and a distraction-free reading experience.",
      tech: ["JavaScript", "HTML5", "CSS3"],
    },
    {
      name: "Quote Machines",
      repo: "Quote-Machines",
      demo: "https://quotemachines.netlify.app/",
      description:
        "An upgraded quote generator with themed styling and share-friendly output — built to be opened, used and enjoyed on any device. Live on Netlify.",
      tech: ["JavaScript", "HTML5", "CSS3"],
    },
    {
      name: "Skylark Weather",
      repo: "skylark-weather",
      demo: "https://ozonwankwoemmanuel12-ship-it.github.io/skylark-weather/skylark-weather-app.html",
      description:
        "A weather lookup interface presenting current conditions in a polished, responsive, card-based UI — built for quick reading on any device.",
      tech: ["HTML5", "CSS3", "JavaScript"],
    },
    {
      name: "Calculator App",
      repo: "calculator-app",
      demo: "https://calculatoress.netlify.app/",
      description:
        "A responsive arithmetic calculator supporting addition, subtraction, multiplication and division through a clean, keyboard-friendly interface. Live on Netlify.",
      tech: ["HTML5", "Tailwind CSS", "JavaScript"],
    },
    {
      name: "Mini Store",
      repo: "Mini-Store",
      demo: "https://mini-stor.netlify.app/",
      description:
        "A lightweight e-commerce storefront with product cards, add-to-cart interactions and a compact shopping experience. Live on Netlify.",
      tech: ["JavaScript", "HTML5", "CSS3"],
    },
    {
      name: "User Cards & Profile Modal",
      repo: "User-Cards-and-Profile-Modal",
      demo: "https://ozonwankwoemmanuel12-ship-it.github.io/User-Cards-and-Profile-Modal/",
      description:
        "A React component showcase that renders user cards and an accessible profile modal with smooth open/close interactions.",
      tech: ["React", "JSX", "CSS3"],
    },
    {
      name: "Helyra Landing Page",
      repo: "Helyra-Landing-Page",
      demo: "https://helyralandingpage.netlify.app/",
      description:
        "A polished single-file healthcare landing page demonstrating semantic structure, responsive layout and modern CSS techniques. Live on Netlify.",
      tech: ["HTML5", "CSS3", "JavaScript"],
    },
    {
      name: "Enugu WATCH",
      repo: "Enugu-WATCH",
      demo: "https://ozonwankwoemmanuel12-ship-it.github.io/Enugu-WATCH/",
      description:
        "A community-focused web app built with React and Vite, designed for local awareness and community reporting.",
      tech: ["React", "Vite", "Web App"],
    },
    {
      name: "Login Profile",
      repo: "login-profile",
      demo: "https://ozonwankwoemmanuel12-ship-it.github.io/login-profile/",
      description:
        "A small React project exploring authentication flows and profile views with component-driven structure.",
      tech: ["React", "JSX", "CSS3"],
    },
    {
      name: "Protected Routes",
      repo: "protected-routes",
      demo: "https://ozonwankwoemmanuel12-ship-it.github.io/protected-routes/",
      description:
        "A React practice app demonstrating route guarding — restricting pages to authenticated users with clean redirect handling.",
      tech: ["React", "Routing", "JavaScript"],
    },
    {
      name: "Fashionise Clone",
      repo: "Fashionise-Clone",
      demo: "https://ozonwankwoemmanuel12-ship-it.github.io/Fashionise-Clone/",
      description:
        "A component-based recreation of a fashion storefront, built with JSX components and custom CSS.",
      tech: ["React", "JSX", "CSS3"],
    },
    {
      name: "Hello Bio",
      repo: "Hello-Bio-main",
      demo: "https://phenomenal-crisp-385092.netlify.app/",
      description:
        "A personal developer bio site introducing Ozonwankwo Joseph, a Junior Front-End Developer — with about, skills and projects in a clean, component-driven layout. Live on Netlify.",
      tech: ["React", "JSX", "CSS3"],
    },
    {
      name: "Man Projects",
      repo: "Man-Projects",
      demo: "https://ozonwankwoemmanuel12-ship-it.github.io/Man-Projects/",
      description:
        "A collection of curated JavaScript practice builds — small interactive exercises bundled into one app.",
      tech: ["JavaScript", "Practice"],
    },
    {
      name: "Practice Questions",
      repo: "practice-questions",
      demo: "https://ozonwankwoemmanuel12-ship-it.github.io/practice-questions/",
      description:
        "A growing set of coding practice questions solved in JavaScript, presented through an interactive index.",
      tech: ["JavaScript", "Practice"],
    },
    {
      name: "React useState Practice",
      repo: "React-useState-Practice-Full-Git-GitHub-Workflo-React-project",
      demo: "https://ozonwankwoemmanuel12-ship-it.github.io/React-useState-Practice-Full-Git-GitHub-Workflo-React-project/",
      description:
        "React components built to master the useState hook — counters, forms and dynamic UI with JSX and CSS.",
      tech: ["React", "useState", "JSX"],
    },
    {
      name: "Community Watch",
      repo: "Community-Watch",
      demo: "https://enugcommu.netlify.app/",
      description:
        "A community awareness and reporting web app built with React and Vite — live on Netlify and open-source on GitHub.",
      tech: ["React", "Vite", "Web App"],
    },
    {
      name: "E-Commerce Website",
      repo: "E-Commerce-Website",
      description:
        "An e-commerce frontend project built with HTML, CSS, Tailwind and JavaScript. Repo scaffolded, ready for the next push.",
      tech: ["HTML5", "Tailwind CSS", "JavaScript"],
    },
    {
      name: "Login & Profile",
      repo: "login-and-profile",
      description:
        "A login and profile UI experiment. Repository scaffolded — build in progress.",
      tech: ["Web App"],
    },
    {
      name: "React useState Practice (Workflow)",
      repo: "React-useState-Practice-Full-Git-GitHub-Workflow",
      description:
        "A companion useState practice repo focused on the full Git & GitHub workflow. Scaffolded, build in progress.",
      tech: ["React", "useState"],
    },
    {
      name: "Coding Practice Projects",
      repo: "C-Users-USER-Documents-Tech-week13-Assignment-Practice-Coding-Questions-Man-Projects",
      description:
        "A weekly coding practice collection. Repository scaffolded — exercises being added.",
      tech: ["JavaScript", "Practice"],
    },
    {
      name: "Looping Through Arrays & Objects",
      repo: "C-Users-USER-OneDrive-Documents-Tech-Looping-Through-Arrays-And-Objects",
      description:
        "Algorithm practice focused on array and object iteration patterns in JavaScript. Scaffolded, build in progress.",
      tech: ["JavaScript", "Practice"],
    },
  ],

  services: [
    {
      title: "Responsive Web Development",
      description:
        "HTML5, CSS3 and JavaScript builds that look and work beautifully across every screen size.",
    },
    {
      title: "React Application Development",
      description:
        "Component-driven, reusable interfaces engineered with modern React practices.",
    },
    {
      title: "UI Implementation from Design",
      description:
        "Pixel-faithful conversion of Figma, Sketch, or image mockups into living code.",
    },
    {
      title: "Web Performance & Accessibility",
      description:
        "Fast-loading, keyboard-friendly, screen-reader-friendly pages that work for everyone.",
    },
  ],

  typingRoles: [
    "front-end interfaces",
    "responsive websites",
    "accessible experiences",
    "clean semantic code",
  ],
};

/* =========================================================================
   Render content
   ========================================================================= */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderSkills() {
  const grid = $("#skills-grid");
  if (!grid) return;
  grid.innerHTML = PORTFOLIO_CONFIG.skillGroups
    .map(
      (group, i) => `
      <article class="skill-card">
        <span class="skill-card-icon" aria-hidden="true">${group.icon}</span>
        <h3 class="skill-card-title">${escapeHtml(group.title)}</h3>
        <p class="skill-card-desc">${escapeHtml(group.description)}</p>
        <ul class="skill-list">
          ${group.skills.map((s) => `<li class="skill-chip">${escapeHtml(s)}</li>`).join("")}
        </ul>
      </article>`
    )
    .join("");

  const cloud = $("#tag-cloud");
  if (cloud) {
    cloud.innerHTML = PORTFOLIO_CONFIG.tagCloud
      .map((tag) => `<li>${escapeHtml(tag)}</li>`)
      .join("");
  }
}

function renderProjects() {
  const grid = $("#projects-grid");
  if (!grid) return;
  grid.innerHTML = PORTFOLIO_CONFIG.projects
    .map(
      (p) => `
      <article class="project-card">
        <div class="project-top">
          <span class="project-topbar" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v11a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H9l-2-2H5a2 2 0 0 0-2 2z"/></svg>
          </span>
          <div class="project-links">
            ${p.demo ? `
            <a class="project-link project-link-live" href="${p.demo}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(p.name)} live demo (opens in a new tab)">
              <svg aria-hidden="true" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><path d="M15 3h6v6"></path><path d="M10 14L21 3"></path></svg>
              Live demo
            </a>` : `
            <span class="project-no-demo" aria-hidden="true">No live demo yet</span>`}
            <a class="project-link" href="https://github.com/ozonwankwoemmanuel12-ship-it/${p.repo}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(p.name)} source code on GitHub">
              <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.55v-2.15c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.04-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.23-1.28-5.23-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.05.78 2.13v3.15c0 .3.2.67.8.55A11.51 11.51 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z"/></svg>
              Code
            </a>
          </div>
        </div>
        <h3 class="project-name">${escapeHtml(p.name)}</h3>
        <p class="project-desc">${escapeHtml(p.description)}</p>
        <ul class="project-tech">${p.tech.map((t) => `<li>${escapeHtml(t)}</li>`).join("")}</ul>
      </article>`
    )
    .join("");
}

function renderServices() {
  const grid = $("#services-grid");
  if (!grid) return;
  grid.innerHTML = PORTFOLIO_CONFIG.services
    .map(
      (s, i) => `
      <article class="service-card">
        <span class="service-number" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span>
        <span class="service-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
        </span>
        <h3 class="service-title">${escapeHtml(s.title)}</h3>
        <p class="service-desc">${escapeHtml(s.description)}</p>
      </article>`
    )
    .join("");
}

function renderSocial() {
  const makeLinks = () =>
    PORTFOLIO_CONFIG.social
      .map(
        (s) => `
      <a class="social-link" href="${s.href}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(s.name)} (opens in a new tab)">
        ${s.icon}
      </a>`
      )
      .join("");

  const hero = $("#hero-social");
  const mobile = $("#mobile-menu-social");
  const contact = $("#contact-social");
  const footer = $("#footer-social");
  if (hero) hero.innerHTML = makeLinks();
  if (mobile) mobile.innerHTML = makeLinks();
  if (contact) contact.innerHTML = makeLinks();
  if (footer) footer.innerHTML = makeLinks();
}

/* =========================================================================
   Header / active nav / back-to-top
   ========================================================================= */
const header = $(".site-header");
const backToTop = $("#back-to-top");

function onScroll() {
  const y = window.scrollY;
  header.classList.toggle("scrolled", y > 12);
  if (backToTop) backToTop.classList.toggle("show", y > 600);
}

function initNavHighlight() {
  const sections = $$("main section[id]");
  const links = $$('.nav-link[href^="#"]');
  if (!sections.length || !("IntersectionObserver" in window)) return;
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          links.forEach((link) => {
            link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`);
          });
        }
      });
    },
    { rootMargin: "-40% 0px -55% 0px" }
  );
  sections.forEach((section) => observer.observe(section));
}

/* =========================================================================
   Mobile menu
   ========================================================================= */
const menuToggle = $("#menu-toggle");
const mobileMenu = $("#mobile-menu");
const navLinks = $$("#primary-nav a, #mobile-menu a");

function closeMenu() {
  if (!mobileMenu.hidden) mobileMenu.hidden = true;
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open menu");
  document.body.style.overflow = "";
}

function openMenu() {
  mobileMenu.hidden = false;
  menuToggle.setAttribute("aria-expanded", "true");
  menuToggle.setAttribute("aria-label", "Close menu");
  document.body.style.overflow = "hidden";
}

function toggleMenu() {
  if (mobileMenu.hidden) openMenu();
  else closeMenu();
}

if (menuToggle && mobileMenu) {
  menuToggle.addEventListener("click", toggleMenu);
  navLinks.forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !mobileMenu.hidden) closeMenu();
  });
}

/* =========================================================================
   Theme toggle
   ========================================================================= */
const themeToggle = $("#theme-toggle");

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  if (themeToggle) themeToggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
  try {
    localStorage.setItem("theme", theme);
  } catch (e) {
    /* storage unavailable */
  }
}

if (themeToggle) {
  applyTheme(document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light");
  themeToggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme");
    applyTheme(current === "dark" ? "light" : "dark");
  });
}

/* =========================================================================
   Typing effect
   ========================================================================= */
function initTypewriter() {
  const el = $("#typed-text");
  if (!el) return;
  const roles = PORTFOLIO_CONFIG.typingRoles;
  let roleIndex = 0;
  let charIndex = 0;
  let deleting = false;

  function tick() {
    const word = roles[roleIndex];
    if (deleting) {
      charIndex -= 1;
    } else {
      charIndex += 1;
    }
    el.textContent = word.slice(0, charIndex);
    let delay = deleting ? 45 : 95;
    if (!deleting && charIndex === word.length) {
      delay = 1800;
      deleting = true;
    } else if (deleting && charIndex === 0) {
      deleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
      delay = 400;
    }
    setTimeout(tick, delay);
  }
  tick();
}

/* =========================================================================
   Scroll reveal + animated counters
   ========================================================================= */
function initReveal() {
  const items = $$(".reveal");
  if (!items.length) return;
  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("revealed"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("revealed");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  items.forEach((el) => observer.observe(el));
}

function initCounters() {
  const counters = $$(".stat-value[data-count]");
  if (!counters.length) return;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const animate = (el) => {
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    if (reduced) {
      el.textContent = target + suffix;
      return;
    }
    const duration = 1400;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  if (!("IntersectionObserver" in window)) {
    counters.forEach(animate);
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animate(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );
  counters.forEach((el) => observer.observe(el));
}

/* =========================================================================
   Init
   ========================================================================= */
document.addEventListener("DOMContentLoaded", () => {
  renderSkills();
  renderProjects();
  renderServices();
  renderSocial();

  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  initTypewriter();
  initReveal();
  initCounters();
  initNavHighlight();

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  if (backToTop) {
    backToTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (prefersReduced.addEventListener) {
    prefersReduced.addEventListener("change", () => {
      if (prefersReduced.matches) {
        $$(".reveal").forEach((el) => el.classList.add("revealed"));
      }
    });
  }
});