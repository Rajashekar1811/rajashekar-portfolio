
// ========================================
// RAJASHEKAR BARAPATI PORTFOLIO
// JAVASCRIPT FUNCTIONALITY
// ========================================


// 1. MOBILE NAVIGATION

const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

if (menuToggle && navLinks) {

  menuToggle.addEventListener("click", () => {

    navLinks.classList.toggle("show");

    const icon = menuToggle.querySelector("i");

    if (icon) {
      icon.classList.toggle("fa-bars");
      icon.classList.toggle("fa-xmark");
    }

  });

  // Close menu after clicking a navigation link

  navLinks.querySelectorAll("a").forEach(link => {

    link.addEventListener("click", () => {

      navLinks.classList.remove("show");

      const icon = menuToggle.querySelector("i");

      if (icon) {
        icon.classList.remove("fa-xmark");
        icon.classList.add("fa-bars");
      }

    });

  });

}


// 2. DYNAMIC FOOTER YEAR

const currentYear = document.getElementById("currentYear");

if (currentYear) {
  currentYear.textContent = new Date().getFullYear();
}


// 3. SCROLL REVEAL ANIMATION

const revealElements = document.querySelectorAll(
  ".section-heading, .about-card, .skill-card, .project-card, .education-card, .cert-card, .experience-card, .contact-card"
);

if ("IntersectionObserver" in window) {

  const observer = new IntersectionObserver((entries) => {

    entries.forEach(entry => {

      if (entry.isIntersecting) {

        entry.target.classList.add("revealed");

        observer.unobserve(entry.target);

      }

    });

  }, {
    threshold: 0.12
  });

  revealElements.forEach(element => {

    element.classList.add("reveal");

    observer.observe(element);

  });

}


// 4. ACTIVE NAVIGATION LINK

const sections = document.querySelectorAll("main section[id]");
const navigationLinks = document.querySelectorAll(".nav-links a");

if ("IntersectionObserver" in window) {

  const sectionObserver = new IntersectionObserver((entries) => {

    entries.forEach(entry => {

      if (entry.isIntersecting) {

        navigationLinks.forEach(link => {

          link.classList.remove("active");

          if (link.getAttribute("href") === "#" + entry.target.id) {
            link.classList.add("active");
          }

        });

      }

    });

  }, {
    rootMargin: "-25% 0px -65% 0px"
  });

  sections.forEach(section => {
    sectionObserver.observe(section);
  });

}


// 5. NAVBAR SCROLL EFFECT

const navbar = document.querySelector(".navbar");

window.addEventListener("scroll", () => {

  if (!navbar) return;

  if (window.scrollY > 50) {

    navbar.classList.add("scrolled");

  } else {

    navbar.classList.remove("scrolled");

  }

}, { passive: true });


// 6. HERO PROFILE MOUSE EFFECT

const heroVisual = document.querySelector(".hero-visual");
const profileCard = document.querySelector(".profile-card");

if (
  heroVisual &&
  profileCard &&
  window.matchMedia("(hover: hover) and (pointer: fine)").matches
) {

  heroVisual.addEventListener("mousemove", (event) => {

    const rect = heroVisual.getBoundingClientRect();

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = (centerY - y) / 35;
    const rotateY = (x - centerX) / 35;

    profileCard.style.transform =
      `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

  });

  heroVisual.addEventListener("mouseleave", () => {

    profileCard.style.transform = "";

  });

}


// 7. SMOOTH ANCHOR SCROLL

document.querySelectorAll('a[href^="#"]').forEach(link => {

  link.addEventListener("click", event => {

    const targetId = link.getAttribute("href");

    if (!targetId || targetId === "#") return;

    const target = document.querySelector(targetId);

    if (target) {

      event.preventDefault();

      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    }

  });

});


console.log("RAJASHEKAR BARAPATI PORTFOLIO INITIALIZED");
            
// ========================================
// PROJECT TITLE BASED DYNAMIC ICONS
// ========================================

function getProjectIcon(title = "") {

  const name = title.toLowerCase();

  const projectIcons = [
    {
      keywords: ["railway", "lighting", "intelligent lighting"],
      icon: "fa-lightbulb"
    },
    {
      keywords: ["sign detection", "voice conversion", "gesture"],
      icon: "fa-hands"
    },
    {
      keywords: ["spirometer", "lungs", "respiratory"],
      icon: "fa-lungs"
    },
    {
      keywords: ["shinchan", "typing game", "typing"],
      icon: "fa-gamepad"
    },
    {
      keywords: ["r.r. designers", "rr designers", "tailoring", "embroidery"],
      icon: "fa-scissors"
    },
    {
      keywords: ["android app", "mobile app"],
      icon: "fa-mobile-screen-button"
    },
    {
      keywords: ["website", "web application"],
      icon: "fa-globe"
    }
  ];

  const matched = projectIcons.find(item =>
    item.keywords.some(keyword => name.includes(keyword))
  );

  return matched ? matched.icon : "fa-code";
}

// ========================================
// 8. SUPABASE DYNAMIC PUBLIC PROJECTS
// ========================================

document.addEventListener("DOMContentLoaded", async () => {

  const projectContainer = document.getElementById("publicProjectList");

  if (!projectContainer) return;

  const db = window.supabaseClient;

  if (!db) {
    projectContainer.textContent = "Unable to connect to projects.";
    console.error("Supabase client not found.");
    return;
  }

  projectContainer.textContent = "Loading projects...";

  try {

    const { data: projects, error } = await db
      .from("portfolio_projects")
      .select("*")
      .eq("is_published", true)
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });

    if (error) throw error;

    projectContainer.replaceChildren();

            
        if (!projects || projects.length === 0) {

        const emptyState = document.createElement("div");
        emptyState.className = "projects-empty-state";

        emptyState.innerHTML = `
            <div class="empty-icon">
            <i class="fa-solid fa-folder-open"></i>
            </div>

            <span class="empty-label">PORTFOLIO UPDATE</span>

            <h3>Something Amazing Is Coming!</h3>

            <p>
            I'm currently working on exciting projects.
            Stay tuned to explore my latest work.
            </p>

            <div class="empty-decoration">
            <span></span>
            <span></span>
            <span></span>
            </div>
          `;

          projectContainer.appendChild(emptyState);
          return;
          }


      projects.forEach(project => {

      const card = document.createElement("article");
      card.className = "public-project-card";

      const iconBox = document.createElement("div");
      iconBox.className = "public-project-icon";

      const icon = document.createElement("i");
      icon.className = `fa-solid ${getProjectIcon(project.title)}`;
      iconBox.appendChild(icon);

      const category = document.createElement("span");
      category.className = "public-project-category";
      category.textContent = project.category || "Development";

      const title = document.createElement("h3");
      title.textContent = project.title || "";

      const description = document.createElement("p");
      description.textContent = project.description || "";

      card.append(iconBox, category, title, description);

      if (project.project_url) {

        try {
          const url = new URL(project.project_url);

          if (url.protocol === "https:" || url.protocol === "http:") {

            const link = document.createElement("a");
            link.href = url.href;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.className = "project-view-link";
            link.textContent = "View Project";

            card.appendChild(link);
          }

        } catch {
          console.warn("Invalid project URL:", project.project_url);
        }

      }

      projectContainer.appendChild(card);

    });

  } catch (error) {

    console.error("Projects loading error:", error);

    projectContainer.textContent =
      "Unable to load projects. Please try again later.";

  }

});

// ========================================
// 9. SUPABASE DYNAMIC PUBLIC SKILLS
// ========================================

document.addEventListener("DOMContentLoaded", async () => {

  const skillContainer = document.getElementById("publicSkillsList");

  if (!skillContainer) {
    console.warn("Public skills container not found.");
    return;
  }

  const db = window.supabaseClient;

  if (!db) {
    skillContainer.textContent = "Unable to connect to skills.";
    console.error("Supabase client not found.");
    return;
  }

  skillContainer.textContent = "Loading skills...";

  try {

    const { data: skills, error } = await db
      .from("portfolio_skills")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true });

    if (error) throw error;

    skillContainer.replaceChildren();

    if (!skills || skills.length === 0) {
      const emptyMessage = document.createElement("p");
      emptyMessage.className = "skills-empty";
      emptyMessage.textContent = "Skills will appear here soon.";
      skillContainer.appendChild(emptyMessage);
      return;
    }

    // Category ఆధారంగా Skills విభజించడం
    const categories = {};

    skills.forEach(skill => {
      const category = skill.category || "Other Skills";

      if (!categories[category]) {
        categories[category] = [];
      }

      categories[category].push(skill);
    });




function getPublicSkillIcon(category, categorySkills = []) {

  const value = category.toLowerCase();

            // Category keywords
            const categoryIcons = [
                { words: ["frontend", "web development", "web design"], icon: "fa-code" },
                { words: ["backend", "server"], icon: "fa-server" },
                { words: ["programming", "coding", "languages"], icon: "fa-laptop-code" },
                { words: ["database", "db"], icon: "fa-database" },
                { words: ["embedded", "iot", "electronics"], icon: "fa-microchip" },
                { words: ["artificial intelligence", "machine learning", "ai"], icon: "fa-brain" },
                { words: ["tools", "technologies", "software"], icon: "fa-screwdriver-wrench" },
                { words: ["productivity", "office"], icon: "fa-file-lines" },
                { words: ["cloud", "hosting"], icon: "fa-cloud" },
                { words: ["design", "graphics", "ui", "ux"], icon: "fa-palette" },
                { words: ["mobile", "android", "app development"], icon: "fa-mobile-screen-button" },
                { words: ["network", "networking"], icon: "fa-network-wired" },
                { words: ["security", "cybersecurity"], icon: "fa-shield-halved" },
                { words: ["testing", "quality assurance"], icon: "fa-vial" },
                { words: ["version control", "git"], icon: "fa-code-branch" }
            ];

            for (const item of categoryIcons) {
                if (item.words.some(word => value.includes(word))) {
                return item.icon;
                }
            }

            // Category match కాకపోతే Skills పేర్లను పరిశీలించు
            const skillNames = categorySkills
                .map(skill => skill.name.toLowerCase())
                .join(" ");

            const skillIcons = [
                { words: ["html", "css", "javascript", "bootstrap"], icon: "fa-code" },
                { words: ["python", "java", "c++", "programming", "c language"], icon: "fa-laptop-code" },
                { words: ["sql", "mongodb", "mysql", "database"], icon: "fa-database" },
                { words: ["arduino", "embedded", "sensor"], icon: "fa-microchip" },
                { words: ["ai", "machine learning", "nlp"], icon: "fa-brain" },
                { words: ["git", "github"], icon: "fa-code-branch" },
                { words: ["vscode", "vs code", "android studio"], icon: "fa-screwdriver-wrench" },
                { words: ["excel", "word", "powerpoint", "office"], icon: "fa-file-excel" }
            ];

            for (const item of skillIcons) {
                if (item.words.some(word => skillNames.includes(word))) {
                return item.icon;
                }
            }

            return "fa-layer-group";
            }


    Object.entries(categories).forEach(([category, categorySkills]) => {

      const categoryBox = document.createElement("div");
      categoryBox.className = "skill-category-box";

      const iconBox = document.createElement("div");
      iconBox.className = "skill-category-icon";

      const icon = document.createElement("i");
      icon.className = `fa-solid ${getPublicSkillIcon(category, categorySkills)}`;

      iconBox.appendChild(icon);

      const content = document.createElement("div");
      content.className = "skill-category-content";

      const heading = document.createElement("h3");
      heading.className = "skill-category-title";
      heading.textContent = category;

      const skillsText = document.createElement("p");
      skillsText.className = "skill-category-names";

      skillsText.textContent = categorySkills
        .map(skill => skill.name)
        .join("  ·  ");

      content.append(heading, skillsText);
      categoryBox.append(iconBox, content);

      skillContainer.appendChild(categoryBox);

    });



    console.log("Public skills loaded:", skills);

  } catch (error) {

    console.error("Skills loading error:", error);

    skillContainer.textContent =
      "Unable to load skills. Please try again later.";

  }

});

// ========================================
// 10. SUPABASE DYNAMIC PUBLIC EDUCATION
// ========================================

document.addEventListener("DOMContentLoaded", async () => {

  const educationContainer =
    document.getElementById("publicEducationList");

  if (!educationContainer) {
    console.warn("Public education container not found.");
    return;
  }

  const db = window.supabaseClient;

  if (!db) {
    educationContainer.textContent =
      "Unable to connect to education.";

    console.error("Supabase client not found.");
    return;
  }

  educationContainer.textContent = "Loading education...";

  try {

    const { data: education, error } = await db
      .from("portfolio_education")
      .select("*")
      .eq("is_published", true)
      .order("start_year", { ascending: false });

    if (error) throw error;

    educationContainer.replaceChildren();

    if (!education || education.length === 0) {

      const emptyMessage = document.createElement("p");
      emptyMessage.className = "education-empty";
      emptyMessage.textContent =
        "Education details will appear here soon.";

      educationContainer.appendChild(emptyMessage);
      return;
    }

    function getEducationIcon(qualification = "") {

      const value = qualification.toLowerCase();

      if (value.includes("b.tech") || value.includes("bachelor")) {
        return "fa-graduation-cap";
      }

      if (value.includes("diploma")) {
        return "fa-book-open";
      }

      if (
        value.includes("10th") ||
        value.includes("secondary") ||
        value.includes("school")
      ) {
        return "fa-school";
      }

      if (
        value.includes("m.tech") ||
        value.includes("master") ||
        value.includes("m.sc")
      ) {
        return "fa-user-graduate";
      }

      return "fa-graduation-cap";
    }

    education.forEach(item => {

      const card = document.createElement("div");
      card.className = "education-card revealed";

      const year = document.createElement("span");
      year.className = "education-year";

      year.textContent = [
        item.start_year,
        item.end_year
      ].filter(Boolean).join(" - ");

      const details = document.createElement("div");

      const title = document.createElement("h3");
      title.textContent = item.qualification || "";

      const institution = document.createElement("p");
      institution.textContent = item.institution || "";

      details.append(title, institution);

      if (item.grade) {
        const grade = document.createElement("span");
        grade.textContent = item.grade;
        details.appendChild(grade);
      }

      if (item.description) {
        const description = document.createElement("p");
        description.textContent = item.description;
        details.appendChild(description);
      }

      const icon = document.createElement("i");
      icon.className =
        `fa-solid ${getEducationIcon(item.qualification)}`;

      card.append(year, details, icon);

      educationContainer.appendChild(card);

    });

    console.log("Public education loaded:", education);

  } catch (error) {

    console.error("Education loading error:", error);

    educationContainer.textContent =
      "Unable to load education. Please try again later.";

  }

});
// ========================================
// 11. SUPABASE DYNAMIC PUBLIC ABOUT
// ========================================

document.addEventListener("DOMContentLoaded", async () => {

  const aboutDescription = document.getElementById(
    "publicAboutDescription"
  );

  if (!aboutDescription) {
    console.error("About description element not found.");
    return;
  }

  const db = window.supabaseClient;

  if (!db) {
    console.error("Supabase client not found.");
    return;
  }

  try {
    const { data, error } = await db
      .from("portfolio_about")
      .select("description")
      .eq("id", 1)
      .maybeSingle();

    if (error) throw error;

    aboutDescription.textContent =
      data?.description || "About description is not available.";

    console.log("Public About loaded:", data);

  } catch (error) {
    console.error("About loading error:", error);
    aboutDescription.textContent =
      "Unable to load About description.";
  }

});
// PUBLIC PROFILE PICTURE
document.addEventListener("DOMContentLoaded", () => {

  const profileImage = document.getElementById("publicProfileImage");
  const fallbackIcon = document.getElementById("profileFallbackIcon");

  if (!profileImage || !fallbackIcon || !window.supabaseClient) {
    return;
  }

  const { data } = window.supabaseClient.storage
    .from("portfolio-assets")
    .getPublicUrl("profile/profile.jpg");

  profileImage.onload = () => {
    profileImage.style.display = "block";
    fallbackIcon.style.display = "none";
  };

  profileImage.onerror = () => {
    profileImage.style.display = "none";
    fallbackIcon.style.display = "grid";
  };

  profileImage.src = data.publicUrl + "?t=" + Date.now();

});

/* VIEWPORT BASED TYPEWRITER ANIMATION */

document.addEventListener("DOMContentLoaded", () => {

  const excludedSelectors = [
    "h1",
    "#home h2",
    "script",
    "style",
    "noscript",
    "i",
    "svg",
    "input",
    "textarea",
    "select",
    "option"
  ];

  const typedElements = new WeakSet();

  const observer = new IntersectionObserver((entries) => {

    entries.forEach(entry => {

      if (!entry.isIntersecting) return;

      const element = entry.target;

      if (typedElements.has(element)) return;

      typedElements.add(element);
      observer.unobserve(element);

      const originalText = element.dataset.typewriterText || "";

      if (!originalText.trim()) return;

      element.textContent = "";

      const cursor = document.createElement("span");
      cursor.className = "typing-cursor";

      element.appendChild(cursor);

      let index = 0;

      const typing = setInterval(() => {

        cursor.before(
          document.createTextNode(originalText.charAt(index))
        );

        index++;

        if (index >= originalText.length) {
          clearInterval(typing);
          cursor.remove();
        }

      }, 22);

    });

  }, {
    threshold: 0.15
  });

  function observeText(root) {

    if (!root) return;

    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT
    );

    const textNodes = [];

    while (walker.nextNode()) {

      const node = walker.currentNode;
      const parent = node.parentElement;

      if (!parent || !node.textContent.trim()) continue;

      if (excludedSelectors.some(selector => parent.closest(selector))) {
        continue;
      }

      textNodes.push(node);
    }

    textNodes.forEach(node => {

      const span = document.createElement("span");

      span.dataset.typewriterText = node.textContent;

      node.parentNode.replaceChild(span, node);

      observer.observe(span);

    });

  }

  observeText(document.body);

  // Observe dynamically loaded content
  const mutationObserver = new MutationObserver(mutations => {

    mutations.forEach(mutation => {

      mutation.addedNodes.forEach(node => {

        if (node.nodeType === Node.ELEMENT_NODE) {
          observeText(node);
        }

      });

    });

  });

  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true
  });

});

// ========================================
// PUBLIC RESUME DOWNLOAD
// ========================================

document.addEventListener("DOMContentLoaded", () => {

  const resumeButton = document.getElementById("downloadResumeBtn");

  if (!resumeButton) {
    console.warn("Resume download button not found.");
    return;
  }

  const db = window.supabaseClient;

  if (!db) {
    console.error("Supabase client not found.");
    resumeButton.style.display = "none";
    return;
  }

  // Resume file location in Supabase Storage
  const { data } = db.storage
    .from("portfolio-assets")
    .getPublicUrl("resume/resume.pdf");

  const resumeUrl =
    data.publicUrl + "?download=Rajashekar-Barapati-Resume.pdf";

  resumeButton.href = resumeUrl;

  console.log("Resume download link initialized.");

});