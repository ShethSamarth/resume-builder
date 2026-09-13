let resumeData = null;
let defaultData = null; // Store loaded default to reset to if needed

document.addEventListener("DOMContentLoaded", async () => {
  try {
    let response;
    try {
      response = await fetch("data.json");
    } catch (e) {
      // Catch network errors (like CORS block when opening via file:// protocol)
      throw new Error("CORS or Network error");
    }

    if (!response.ok) throw new Error("Failed to load resume data");
    const data = await response.json();
    resumeData = data;
    defaultData = JSON.parse(JSON.stringify(data)); // Deep clone

    initializeResumeBuilder();
  } catch (error) {
    console.warn(
      "Could not fetch data.json directly, falling back to local storage or embedded default template:",
      error,
    );

    // Display fallback warning
    const fallbackNotif = document.getElementById("fallback-notification");
    if (fallbackNotif) fallbackNotif.style.display = "block";

    // Embed the default data directly inside the script so the application is fully offline-capable and CORS-resilient
    const fallbackData = getFallbackData();
    resumeData = fallbackData;
    defaultData = JSON.parse(JSON.stringify(fallbackData));

    initializeResumeBuilder();
  }
});

function initializeResumeBuilder() {
  // Check local storage for existing customizations
  const savedData = localStorage.getItem("resume_builder_data");
  if (savedData) {
    try {
      resumeData = JSON.parse(savedData);
    } catch (e) {
      console.error("Failed to parse saved local storage data", e);
    }
  }

  // Check saved theme preferences from local storage
  loadSavedPreferences();

  // Render Resume View
  renderResumeView();

  // Render Sidebar Editor Controls
  renderSidebarEditors();

  // Synchronize raw JSON editor textarea
  updateRawJsonTextarea();
}

function renderResumeView() {
  if (!resumeData) return;
  renderHeader(resumeData.header);
  renderSummary(resumeData.experience);
  renderSkills(resumeData.skills);
  renderExperience(resumeData.experience);
  renderProjects(resumeData.projects);
  renderOpenSource(resumeData.opensource);
  renderEducation(resumeData.education);
}

function saveToLocalStorage() {
  if (resumeData) {
    localStorage.setItem("resume_builder_data", JSON.stringify(resumeData));
    updateRawJsonTextarea();
  }
}
function renderHeader(headerData) {
  document.getElementById("header-container").innerHTML = `
    <h1>${headerData.name}</h1>
    <div class="subtitle">${headerData.title}</div>
    <div class="contact-row">
      <a href="tel:${headerData.phone.replace(/\s+/g, "")}">${headerData.phone}</a>
      <span class="sep">|</span>
      <a href="mailto:${headerData.email}">${headerData.email}</a>
      <span class="sep">|</span>
      ${headerData.location}
    </div>
    <div class="contact-row">
      <a href="${headerData.linkedin}" target="_blank">${headerData.linkedin.replace("https://", "")}</a>
      <span class="sep">|</span>
      <a href="${headerData.github}" target="_blank">${headerData.github.replace("https://", "")}</a>
    </div>
  `;
}

function renderSkills(skillsData) {
  document.getElementById("skills-container").innerHTML = skillsData
    .map(
      (skill) => `
    <div class="skill-group">
      <span class="skill-label">${skill.label}: </span>
      <span class="skill-values">${skill.values}</span>
    </div>
  `,
    )
    .join("");
}

function renderExperience(expData) {
  document.getElementById("experience-container").innerHTML = expData
    .map(
      (job) => `
    <div class="job">
      <div class="job-header">
        <span class="job-company">${job.company}</span>
        <span class="job-location">${job.location}</span>
      </div>
      <div class="job-role-row">
        <span class="job-role">${job.role}</span>
        <span class="job-date">${job.date}</span>
      </div>
      <ul>
        ${job.bullets.map((bullet) => `<li>${bullet}</li>`).join("")}
      </ul>
    </div>
  `,
    )
    .join("");
}

function renderProjects(projectsData) {
  document.getElementById("projects-container").innerHTML = projectsData
    .map(
      (project) => `
    <div class="project-card">
      <div class="project-name">${project.name}</div>
      <div class="project-meta">${project.meta}</div>
      <div class="project-desc">${project.desc}</div>
    </div>
  `,
    )
    .join("");
}

function renderOpenSource(osData) {
  const container = document.getElementById("opensource-container");

  // If there's no open source data, hide the entire section
  if (
    !osData ||
    ((!osData.community || osData.community.length === 0) &&
      (!osData.published || osData.published.length === 0))
  ) {
    container.parentElement.style.display = "none";
    return;
  } else {
    // Check toggle state for visibility
    const isChecked = document.getElementById("toggle-opensource")?.checked;
    if (isChecked !== false) {
      container.parentElement.style.display = "block";
    }
  }

  let html = "";
  if (osData.community && osData.community.length > 0) {
    html += `
      <p style="font-size: 9px; margin-bottom: 4px; color: var(--dark)">Community Contributions:</p>
      <ul class="os-list" style="margin-bottom: 8px;">
        ${osData.community.map((item) => `<li><a href="${item.link}" target="_blank">${item.name}</a> &mdash; ${item.desc}</li>`).join("")}
      </ul>`;
  }

  if (osData.published && osData.published.length > 0) {
    html += `
      <p style="font-size: 9px; margin-bottom: 4px; color: var(--dark)">Published Libraries:</p>
      <ul class="os-list">
        ${osData.published.map((item) => `<li><a href="${item.link}" target="_blank">${item.name}</a> &mdash; ${item.desc}</li>`).join("")}
      </ul>`;
  }

  container.innerHTML = html;
}

function renderSummary(expData) {
  if (!expData || expData.length === 0) {
    document.getElementById("summary-container").innerHTML =
      "Full Stack Developer specializing in building modern web and mobile applications.";
    return;
  }

  // Convert date strings (e.g., "Dec 2023 - Jun 2024") into absolute month numbers
  const intervals = [];
  expData.forEach((job) => {
    if (!job.date) return;
    // Split by dash or en-dash
    const dateParts = job.date.split(/\s*[-–—]\s*/);
    if (dateParts.length < 2) return;

    try {
      const start = new Date(dateParts[0]);
      const end = dateParts[1].toLowerCase().includes("present")
        ? new Date()
        : new Date(dateParts[1]);

      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        intervals.push({
          startMonth: start.getFullYear() * 12 + start.getMonth(),
          endMonth: end.getFullYear() * 12 + end.getMonth(),
        });
      }
    } catch (e) {
      console.warn("Could not calculate dates for job:", job);
    }
  });

  let totalYears = 2; // default fallback if parser fails or returns 0
  if (intervals.length > 0) {
    // Sort intervals by the start date
    intervals.sort((a, b) => a.startMonth - b.startMonth);

    // Merge any overlapping intervals (e.g., leaving one job in Dec and starting another in Dec)
    const mergedIntervals = [];
    let current = intervals[0];
    for (let i = 1; i < intervals.length; i++) {
      if (intervals[i].startMonth <= current.endMonth) {
        // Overlapping jobs: extend the end date if the new job ends later
        current.endMonth = Math.max(current.endMonth, intervals[i].endMonth);
      } else {
        mergedIntervals.push(current);
        current = intervals[i];
      }
    }
    mergedIntervals.push(current);

    // Sum up the total months (+1 makes it inclusive, so May to Oct equals 6 months)
    const totalMonths = mergedIntervals.reduce((sum, interval) => {
      return sum + (interval.endMonth - interval.startMonth + 1);
    }, 0);

    totalYears = Math.floor(totalMonths / 12);
    if (totalYears < 1) totalYears = 1;
  }

  const name = resumeData.header.name || "Samarth Sheth";
  const title = resumeData.header.title || "Full Stack JavaScript Developer";
  document.getElementById("summary-container").innerHTML = `
    Highly motivated <strong>${title}</strong> with over <strong>${totalYears}+ years</strong> of experience designing and engineering responsive full-stack applications, scalable SaaS systems, enterprise-grade Order Management Systems (OMS), and high-performance CRMs. Proficient in TypeScript, React, Next.js, React Native, Node.js, and popular database technologies. Recognized for streamlining development pipelines, accelerating product releases, and delivering seamless user experiences across web and mobile platforms.
  `;
}

function renderEducation(eduData) {
  if (!eduData || eduData.length === 0) {
    document.getElementById("education-container").innerHTML = "";
    return;
  }

  document.getElementById("education-container").innerHTML = eduData
    .map(
      (edu) => `
    <div class="edu-item">
      <div class="edu-header">
        <span class="edu-institution">${edu.institution}</span>
        <span class="edu-date">${edu.date}</span>
      </div>
      <div class="edu-degree">${edu.degree}</div>
    </div>
  `,
    )
    .join("");
}

/* === INTERACTIVE SIDEBAR EDITORS === */

function renderSidebarEditors() {
  if (!resumeData) return;

  // Render Header Editor
  const headerEditor = document.getElementById("header-editor-container");
  headerEditor.innerHTML = `
    <div class="form-group">
      <label for="input-name">Full Name</label>
      <input type="text" id="input-name" class="form-control" value="${resumeData.header.name}" oninput="updateHeaderField('name', this.value)" />
    </div>
    <div class="form-group">
      <label for="input-title">Job Title</label>
      <input type="text" id="input-title" class="form-control" value="${resumeData.header.title}" oninput="updateHeaderField('title', this.value)" />
    </div>
    <div class="form-group">
      <label for="input-phone">Phone Number</label>
      <input type="text" id="input-phone" class="form-control" value="${resumeData.header.phone}" oninput="updateHeaderField('phone', this.value)" />
    </div>
    <div class="form-group">
      <label for="input-email">Email Address</label>
      <input type="email" id="input-email" class="form-control" value="${resumeData.header.email}" oninput="updateHeaderField('email', this.value)" />
    </div>
    <div class="form-group">
      <label for="input-location">Location</label>
      <input type="text" id="input-location" class="form-control" value="${resumeData.header.location}" oninput="updateHeaderField('location', this.value)" />
    </div>
    <div class="form-group">
      <label for="input-linkedin">LinkedIn URL</label>
      <input type="text" id="input-linkedin" class="form-control" value="${resumeData.header.linkedin}" oninput="updateHeaderField('linkedin', this.value)" />
    </div>
    <div class="form-group">
      <label for="input-github">GitHub URL</label>
      <input type="text" id="input-github" class="form-control" value="${resumeData.header.github}" oninput="updateHeaderField('github', this.value)" />
    </div>
  `;

  // Render Skills Editor
  renderSkillsEditor();

  // Render Work Experience Editor
  renderExperienceEditor();

  // Render Projects Editor
  renderProjectsEditor();

  // Render Open Source Editor
  renderOpenSourceEditor();

  // Render Education Editor
  renderEducationEditor();
}

function renderSkillsEditor() {
  const container = document.getElementById("skills-editor-list");
  container.innerHTML = resumeData.skills
    .map(
      (skill, index) => `
    <div class="editor-item" data-index="${index}">
      <div class="editor-item-header">
        <span class="editor-item-title">${skill.label || "Skill Group"}</span>
        <div class="editor-item-actions">
          <button class="icon-btn" onclick="moveItem('skills', ${index}, -1)" title="Move Up">▲</button>
          <button class="icon-btn" onclick="moveItem('skills', ${index}, 1)" title="Move Down">▼</button>
          <button class="icon-btn delete-btn" onclick="deleteItem('skills', ${index})" title="Delete">🗑️</button>
        </div>
      </div>
      <div class="form-group">
        <label>Group Label</label>
        <input type="text" class="form-control" value="${skill.label}" oninput="updateListField('skills', ${index}, 'label', this.value)" />
      </div>
      <div class="form-group">
        <label>Skills (Comma-separated)</label>
        <textarea class="form-control" style="min-height: 40px;" oninput="updateListField('skills', ${index}, 'values', this.value)">${skill.values}</textarea>
      </div>
    </div>
  `,
    )
    .join("");
}

function renderExperienceEditor() {
  const container = document.getElementById("experience-editor-list");
  container.innerHTML = resumeData.experience
    .map(
      (job, index) => `
    <div class="editor-item" data-index="${index}">
      <div class="editor-item-header">
        <span class="editor-item-title">${job.company || "Job Experience"}</span>
        <div class="editor-item-actions">
          <button class="icon-btn" onclick="moveItem('experience', ${index}, -1)" title="Move Up">▲</button>
          <button class="icon-btn" onclick="moveItem('experience', ${index}, 1)" title="Move Down">▼</button>
          <button class="icon-btn delete-btn" onclick="deleteItem('experience', ${index})" title="Delete">🗑️</button>
        </div>
      </div>
      <div class="form-group-row">
        <div class="form-group">
          <label>Company</label>
          <input type="text" class="form-control" value="${job.company}" oninput="updateListField('experience', ${index}, 'company', this.value)" />
        </div>
        <div class="form-group">
          <label>Location</label>
          <input type="text" class="form-control" value="${job.location}" oninput="updateListField('experience', ${index}, 'location', this.value)" />
        </div>
      </div>
      <div class="form-group-row">
        <div class="form-group">
          <label>Role</label>
          <input type="text" class="form-control" value="${job.role}" oninput="updateListField('experience', ${index}, 'role', this.value)" />
        </div>
        <div class="form-group">
          <label>Dates Worked</label>
          <input type="text" class="form-control" value="${job.date}" oninput="updateListField('experience', ${index}, 'date', this.value)" placeholder="e.g. Dec 2023 - Present" />
        </div>
      </div>
      <div class="form-group">
        <label>Bullet Points (One per line)</label>
        <textarea class="form-control" style="min-height: 100px;" oninput="updateBulletsField(${index}, this.value)">${job.bullets.join("\n")}</textarea>
      </div>
    </div>
  `,
    )
    .join("");
}

function renderProjectsEditor() {
  const container = document.getElementById("projects-editor-list");
  container.innerHTML = resumeData.projects
    .map(
      (project, index) => `
    <div class="editor-item" data-index="${index}">
      <div class="editor-item-header">
        <span class="editor-item-title">${project.name || "Project"}</span>
        <div class="editor-item-actions">
          <button class="icon-btn" onclick="moveItem('projects', ${index}, -1)" title="Move Up">▲</button>
          <button class="icon-btn" onclick="moveItem('projects', ${index}, 1)" title="Move Down">▼</button>
          <button class="icon-btn delete-btn" onclick="deleteItem('projects', ${index})" title="Delete">🗑️</button>
        </div>
      </div>
      <div class="form-group">
        <label>Project Name</label>
        <input type="text" class="form-control" value="${project.name}" oninput="updateListField('projects', ${index}, 'name', this.value)" />
      </div>
      <div class="form-group">
        <label>Meta Description</label>
        <input type="text" class="form-control" value="${project.meta}" oninput="updateListField('projects', ${index}, 'meta', this.value)" placeholder="e.g. Technology Stack | Role" />
      </div>
      <div class="form-group">
        <label>Short Description</label>
        <textarea class="form-control" style="min-height: 60px;" oninput="updateListField('projects', ${index}, 'desc', this.value)">${project.desc}</textarea>
      </div>
    </div>
  `,
    )
    .join("");
}

function renderOpenSourceEditor() {
  const container = document.getElementById("opensource-editor-list");
  const published = resumeData.opensource?.published || [];

  container.innerHTML = published
    .map(
      (item, index) => `
    <div class="editor-item" data-index="${index}">
      <div class="editor-item-header">
        <span class="editor-item-title">${item.name || "Repository"}</span>
        <div class="editor-item-actions">
          <button class="icon-btn" onclick="moveItem('opensource', ${index}, -1)" title="Move Up">▲</button>
          <button class="icon-btn" onclick="moveItem('opensource', ${index}, 1)" title="Move Down">▼</button>
          <button class="icon-btn delete-btn" onclick="deleteItem('opensource', ${index})" title="Delete">🗑️</button>
        </div>
      </div>
      <div class="form-group-row">
        <div class="form-group">
          <label>Repository Name</label>
          <input type="text" class="form-control" value="${item.name}" oninput="updateOpenSourceField(${index}, 'name', this.value)" />
        </div>
        <div class="form-group">
          <label>URL / Link</label>
          <input type="text" class="form-control" value="${item.link}" oninput="updateOpenSourceField(${index}, 'link', this.value)" />
        </div>
      </div>
      <div class="form-group">
        <label>Description</label>
        <input type="text" class="form-control" value="${item.desc}" oninput="updateOpenSourceField(${index}, 'desc', this.value)" />
      </div>
    </div>
  `,
    )
    .join("");
}

function renderEducationEditor() {
  const container = document.getElementById("education-editor-list");
  container.innerHTML = resumeData.education
    .map(
      (edu, index) => `
    <div class="editor-item" data-index="${index}">
      <div class="editor-item-header">
        <span class="editor-item-title">${edu.institution || "School"}</span>
        <div class="editor-item-actions">
          <button class="icon-btn" onclick="moveItem('education', ${index}, -1)" title="Move Up">▲</button>
          <button class="icon-btn" onclick="moveItem('education', ${index}, 1)" title="Move Down">▼</button>
          <button class="icon-btn delete-btn" onclick="deleteItem('education', ${index})" title="Delete">🗑️</button>
        </div>
      </div>
      <div class="form-group">
        <label>Institution</label>
        <input type="text" class="form-control" value="${edu.institution}" oninput="updateListField('education', ${index}, 'institution', this.value)" />
      </div>
      <div class="form-group-row">
        <div class="form-group">
          <label>Degree / Program</label>
          <input type="text" class="form-control" value="${edu.degree}" oninput="updateListField('education', ${index}, 'degree', this.value)" />
        </div>
        <div class="form-group">
          <label>Dates</label>
          <input type="text" class="form-control" value="${edu.date}" oninput="updateListField('education', ${index}, 'date', this.value)" />
        </div>
      </div>
    </div>
  `,
    )
    .join("");
}

/* === STATE UPDATES & EVENT HANDLERS === */

function updateHeaderField(field, value) {
  resumeData.header[field] = value;
  renderResumeView();
  saveToLocalStorage();
}

function updateListField(section, index, field, value) {
  resumeData[section][index][field] = value;
  renderResumeView();
  saveToLocalStorage();
}

function updateBulletsField(index, value) {
  // Split bullets by line break and remove empty lines
  resumeData.experience[index].bullets = value
    .split("\n")
    .filter((line) => line.trim() !== "");
  renderResumeView();
  saveToLocalStorage();
}

function updateOpenSourceField(index, field, value) {
  if (!resumeData.opensource)
    resumeData.opensource = { community: [], published: [] };
  if (!resumeData.opensource.published) resumeData.opensource.published = [];

  resumeData.opensource.published[index][field] = value;
  renderResumeView();
  saveToLocalStorage();
}

function moveItem(section, index, direction) {
  let targetArray;
  if (section === "opensource") {
    if (!resumeData.opensource || !resumeData.opensource.published) return;
    targetArray = resumeData.opensource.published;
  } else {
    targetArray = resumeData[section];
  }

  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= targetArray.length) return;

  // Swap
  const temp = targetArray[index];
  targetArray[index] = targetArray[targetIndex];
  targetArray[targetIndex] = temp;

  renderResumeView();
  renderSidebarEditors();
  saveToLocalStorage();
}

function deleteItem(section, index) {
  if (!confirm("Are you sure you want to delete this item?")) return;

  if (section === "opensource") {
    if (resumeData.opensource && resumeData.opensource.published) {
      resumeData.opensource.published.splice(index, 1);
    }
  } else {
    resumeData[section].splice(index, 1);
  }

  renderResumeView();
  renderSidebarEditors();
  saveToLocalStorage();
}

function addNewListItem(section) {
  if (section === "skills") {
    resumeData.skills.push({
      label: "New Tech Skills",
      values: "Skill A, Skill B, Skill C",
    });
  } else if (section === "experience") {
    resumeData.experience.push({
      company: "New Company",
      location: "City, Country",
      role: "Software Developer",
      date: "Month Year - Present",
      bullets: ["Accomplished task A", "Optimized process B"],
    });
  } else if (section === "projects") {
    resumeData.projects.push({
      name: "New Enterprise Project",
      meta: "Technology Stack",
      desc: "Detailed description of your beautiful project, what problem it solved, and the final results achieved.",
    });
  } else if (section === "opensource") {
    if (!resumeData.opensource)
      resumeData.opensource = { community: [], published: [] };
    if (!resumeData.opensource.published) resumeData.opensource.published = [];
    resumeData.opensource.published.push({
      name: "awesome-new-library",
      link: "https://github.com/yourusername/awesome-new-library",
      desc: "A performant library utility built to solve complex challenges.",
    });
  } else if (section === "education") {
    resumeData.education.push({
      institution: "New University / School",
      degree: "Degree / Specialization",
      date: "Year - Year",
    });
  }

  renderResumeView();
  renderSidebarEditors();
  saveToLocalStorage();
}

/* === ACCORDION PANEL TOGGLES === */
function toggleAccordion(button) {
  const currentContent = button.nextElementSibling;
  const chevron = button.querySelector(".chevron");
  const isOpen = currentContent.classList.contains("open");

  // Close other accordions
  document.querySelectorAll(".accordion-content").forEach((content) => {
    content.classList.remove("open");
    const prevButton = content.previousElementSibling;
    if (prevButton) {
      prevButton.classList.remove("active");
      const prevChevron = prevButton.querySelector(".chevron");
      if (prevChevron) prevChevron.textContent = "▼";
    }
  });

  if (!isOpen) {
    currentContent.classList.add("open");
    button.classList.add("active");
    if (chevron) chevron.textContent = "▲";
  } else {
    currentContent.classList.remove("open");
    button.classList.remove("active");
    if (chevron) chevron.textContent = "▼";
  }
}

/* === CUSTOMIZATION UTILITIES & PREFERENCES === */

function updatePrimaryColor(color) {
  document.documentElement.style.setProperty("--primary", color);
  document.getElementById("primary-color").value = color;
  document.getElementById("color-hex").textContent = color.toUpperCase();

  // Mark matching preset as active
  document.querySelectorAll(".color-preset").forEach((p) => {
    const bg = p.style.backgroundColor;
    // Simple RGB/Hex equality check or set color
    if (
      rgbToHex(bg) === color.toLowerCase() ||
      p.style.backgroundColor === color
    ) {
      p.classList.add("active");
    } else {
      p.classList.remove("active");
    }
  });

  localStorage.setItem("resume_primary_color", color);
}

function rgbToHex(rgb) {
  if (!rgb || !rgb.startsWith("rgb")) return rgb;
  const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (!match) return rgb;
  return (
    "#" +
    ("0" + parseInt(match[1], 10).toString(16)).slice(-2) +
    ("0" + parseInt(match[2], 10).toString(16)).slice(-2) +
    ("0" + parseInt(match[3], 10).toString(16)).slice(-2)
  );
}

function updateFontPreset(preset) {
  const body = document.body;
  body.classList.remove(
    "font-serif-headings",
    "font-sans-serif",
    "font-serif",
    "font-mono",
  );

  if (preset === "serif-headings") body.classList.add("font-serif-headings");
  else if (preset === "sans-serif") body.classList.add("font-sans-serif");
  else if (preset === "serif") body.classList.add("font-serif");
  else if (preset === "mono") body.classList.add("font-mono");

  localStorage.setItem("resume_font_preset", preset);
}

function updateLayoutProperty(cssVar, val, indicatorId, displayVal) {
  document.documentElement.style.setProperty("--" + cssVar, val);
  const slider = document.getElementById(
    "slider-" + cssVar.replace("base-", ""),
  );
  if (slider) slider.value = parseFloat(val);

  if (indicatorId) {
    document.getElementById(indicatorId).textContent = displayVal;
  }
  localStorage.setItem("resume_layout_" + cssVar, val);
}

function toggleSection(sectionId, show) {
  const section = document.getElementById(sectionId);
  if (section) {
    section.style.display = show ? "block" : "none";
  }
  localStorage.setItem(
    "resume_visibility_" + sectionId,
    show ? "true" : "false",
  );
}

// ... existing code ...
/* === UI Controls / Utilities === */
function copyEmail() {
  const email =
    resumeData && resumeData.header && resumeData.header.email
      ? resumeData.header.email
      : "samarth.sheth.29@gmail.com";
  navigator.clipboard
    .writeText(email)
    .then(() => alert(`Email (${email}) copied to clipboard!`));
}

function writeEmail() {
  const email =
    resumeData && resumeData.header && resumeData.header.email
      ? resumeData.header.email
      : "samarth.sheth.29@gmail.com";
  const title =
    resumeData && resumeData.header && resumeData.header.title
      ? resumeData.header.title
      : "Full Stack JavaScript Developer";
  const name =
    resumeData && resumeData.header && resumeData.header.name
      ? resumeData.header.name
      : "Samarth";

  const subject = encodeURIComponent(`Job Opportunity - ${title}`);
  const body = encodeURIComponent(
    `Hello ${name},\n\nI came across your resume and I'm interested in discussing potential opportunities.\n\nPlease let me know your availability for a conversation.\n\nBest regards`,
  );
  window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
}

function callNow() {
  const phone =
    resumeData && resumeData.header && resumeData.header.phone
      ? resumeData.header.phone.replace(/\s+/g, "")
      : "+919537685650";
  window.location.href = `tel:${phone}`;
}

function setPrintTitle() {
  const d = new Date();
  const m = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  const name =
    resumeData && resumeData.header && resumeData.header.name
      ? resumeData.header.name.toUpperCase().replace(/\s+/g, "_")
      : "SAMARTH_SHETH";
  document.title = `${name}_${String(d.getDate()).padStart(2, "0")}_${m[d.getMonth()]}_${d.getFullYear()}`;
}

function loadSavedPreferences() {
  // Theme Color
  const savedColor = localStorage.getItem("resume_primary_color");
  if (savedColor) updatePrimaryColor(savedColor);

  // Typography
  const savedFont = localStorage.getItem("resume_font_preset");
  if (savedFont) {
    document.getElementById("font-preset").value = savedFont;
    updateFontPreset(savedFont);
  }

  // Sliders
  const layoutProps = [
    {
      key: "base-font-size",
      slider: "slider-font-size",
      ind: "val-font-size",
      suffix: "px",
    },
    {
      key: "line-height",
      slider: "slider-line-height",
      ind: "val-line-height",
      suffix: "",
    },
    {
      key: "page-padding",
      slider: "slider-page-margin",
      ind: "val-page-margin",
      suffix: "mm",
    },
    {
      key: "section-gap",
      slider: "slider-section-gap",
      ind: "val-section-gap",
      suffix: "px",
    },
    {
      key: "job-gap",
      slider: "slider-job-gap",
      ind: "val-job-gap",
      suffix: "px",
    },
  ];

  layoutProps.forEach((prop) => {
    const val = localStorage.getItem("resume_layout_" + prop.key);
    if (val) {
      document.documentElement.style.setProperty("--" + prop.key, val);
      const s = document.getElementById(prop.slider);
      if (s) s.value = parseFloat(val);
      const ind = document.getElementById(prop.ind);
      if (ind) ind.textContent = val;
    }
  });

  // Toggles / Visibility
  const toggles = [
    { id: "section-profile", toggle: "toggle-profile" },
    { id: "section-skills", toggle: "toggle-skills" },
    { id: "section-experience", toggle: "toggle-experience" },
    { id: "section-projects", toggle: "toggle-projects" },
    { id: "section-opensource", toggle: "toggle-opensource" },
    { id: "section-education", toggle: "toggle-education" },
  ];

  toggles.forEach((t) => {
    const show = localStorage.getItem("resume_visibility_" + t.id);
    if (show !== null) {
      const checked = show === "true";
      const cb = document.getElementById(t.toggle);
      if (cb) cb.checked = checked;
      toggleSection(t.id, checked);
    }
  });
}

/* === RAW JSON EDITOR & FILE LOADS === */

function updateRawJsonTextarea() {
  const textarea = document.getElementById("raw-json-editor");
  if (textarea && resumeData) {
    textarea.value = JSON.stringify(resumeData, null, 2);
    document.getElementById("json-error").style.display = "none";
  }
}

function handleRawJsonInput(jsonStr) {
  const errorSpan = document.getElementById("json-error");
  try {
    const parsed = JSON.parse(jsonStr);
    resumeData = parsed;
    errorSpan.style.display = "none";
    renderResumeView();
    renderSidebarEditors();
    localStorage.setItem("resume_builder_data", JSON.stringify(resumeData));
  } catch (e) {
    errorSpan.style.display = "block";
    errorSpan.textContent = "JSON Parsing Error: " + e.message;
  }
}

function importJSONFile(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    handleRawJsonInput(e.target.result);
    updateRawJsonTextarea();
  };
  reader.readAsText(file);
}

function exportJSON() {
  if (!resumeData) return;
  const jsonString =
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(resumeData, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", jsonString);
  downloadAnchor.setAttribute("download", "resume_custom.json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function copyJSONToClipboard() {
  const jsonStr = JSON.stringify(resumeData, null, 2);
  navigator.clipboard.writeText(jsonStr).then(() => {
    alert("Resume JSON successfully copied to clipboard!");
  });
}

function resetToDefault() {
  if (confirm("Reset all custom edits back to the default data template?")) {
    resumeData = JSON.parse(JSON.stringify(defaultData));
    localStorage.removeItem("resume_builder_data");

    // Reset inputs & style preferences
    localStorage.removeItem("resume_primary_color");
    localStorage.removeItem("resume_font_preset");
    localStorage.removeItem("resume_layout_base-font-size");
    localStorage.removeItem("resume_layout_line-height");
    localStorage.removeItem("resume_layout_page-padding");
    localStorage.removeItem("resume_layout_section-gap");
    localStorage.removeItem("resume_layout_job-gap");

    const toggles = [
      "resume_visibility_section-profile",
      "resume_visibility_section-skills",
      "resume_visibility_section-experience",
      "resume_visibility_section-projects",
      "resume_visibility_section-opensource",
      "resume_visibility_section-education",
    ];
    toggles.forEach((t) => localStorage.removeItem(t));

    // Reload Everything
    location.reload();
  }
}

/* === OFFLINE FALLBACK TEMPLATE DATA === */
function getFallbackData() {
  return {
    header: {
      name: "Samarth Sheth",
      title: "Full Stack JavaScript Developer",
      phone: "+91-9537685650",
      email: "samarth.sheth.29@gmail.com",
      location: "Surat, Gujarat, India",
      linkedin: "https://linkedin.com/in/sheth-samarth",
      github: "https://github.com/shethsamarth",
    },
    skills: [
      {
        label: "Languages",
        values: "TypeScript, JavaScript (ES6+), HTML5, CSS3, GraphQL",
      },
      {
        label: "Frameworks",
        values:
          "React, Next.js, React Native, Express.js, Hono, Expo, Tailwind",
      },
      {
        label: "Backend & APIs",
        values: "Node.js, REST APIs, GraphQL, WebSockets, JWT Authentication",
      },
      {
        label: "Databases & ORMs",
        values: "PostgreSQL, MongoDB, MySQL, Redis, Prisma, Drizzle",
      },
    ],
    experience: [
      {
        company: "Bilipatra",
        location: "Surat, Gujarat",
        role: "JavaScript Developer",
        date: "Dec 2025 - Present",
        bullets: [
          "Architected 'Profit Sheet,' a centralized real-time financial dashboard aggregating live revenue, margins, and profit metrics seamlessly across Amazon, Flipkart, Shopify, Meesho, Tata 1mg, and internal telesales.",
          "Engineered a comprehensive Order Management System (OMS) akin to Unicommerce, centralizing multi-channel order processing, real-time inventory synchronization, and automated fulfillment tracking.",
        ],
      },
      {
        company: "Logicwind Technologies LLP",
        location: "Surat, Gujarat",
        role: "JavaScript Developer",
        date: "Sep 2024 - Dec 2025",
        bullets: [
          "Engineered high-performance cross-platform mobile interfaces for ThinQ Media, a large-scale streaming application, utilizing React Native to deliver seamless viewing experiences for over 1M+ iOS and Android users.",
          "Developed core distribution and file management workflows for AppsOnAir, an OTA platform serving 50,000+ developers, heavily optimizing the upload, parsing, and deployment processes for APK and IPA files.",
        ],
      },
    ],
    projects: [
      {
        name: "Profit Sheet (Omnichannel Dashboard)",
        meta: "Financial Intelligence | Real-Time Data",
        desc: "Engineered a high-performance analytics dashboard providing live visibility into cross-platform profitability. Aggregated and standardized disparate financial data streams from Amazon, Flipkart, Shopify, Meesho, Tata 1mg, and internal Telesales CRM via API webhooks, utilizing Redis caching to deliver sub-second rendering of complex margin calculations.",
      },
      {
        name: "Omnichannel OMS",
        meta: "Enterprise E-commerce | Logistics Integration",
        desc: "Architected an Order Management System analogous to Unicommerce for centralized multi-channel fulfillment. Seamlessly integrated 7+ major logistics partners enabling automated airway bill generation, multi-warehouse inventory sync, and live tracking.",
      },
    ],
    opensource: {
      published: [
        {
          name: "react-native-exit-app",
          link: "https://github.com/logicwind/react-native-exit-app",
          desc: "Programmatic app exit utility for iOS, Android and tvOS",
        },
        {
          name: "react-native-fold-detection",
          link: "https://github.com/logicwind/react-native-fold-detection",
          desc: "Foldable device state detection for adaptive UI",
        },
      ],
    },
    education: [
      {
        institution: "Uka Tarsadia University",
        degree:
          "Bachelor of Technology — B. Tech, Computer Science & Engineering (Cloud Computing)",
        date: "2021 - 2025",
      },
    ],
  };
}
