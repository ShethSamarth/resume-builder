document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch("data.json");
    if (!response.ok) throw new Error("Failed to load resume data");
    const data = await response.json();

    renderHeader(data.header);
    renderSummary(data.experience);
    renderSkills(data.skills);
    renderExperience(data.experience);
    renderProjects(data.projects);
    renderOpenSource(data.opensource);
    renderEducation(data.education);
  } catch (error) {
    console.error("Error loading resume data:", error);
    document.getElementById("resume-content").innerHTML = `
      <div style="padding: 40px; text-align: center; font-family: sans-serif;">
        <h2>Error loading data.json</h2>
        <p>Because this site uses 'fetch()' to read a local file, you must run it on a local web server (like VS Code Live Server) to view it locally. Otherwise, your browser blocks it due to CORS policy.</p>
        <p>It will work perfectly once hosted on GitHub Pages or Vercel!</p>
      </div>`;
  }
});

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
    (!osData.community || osData.community.length === 0) &&
    (!osData.published || osData.published.length === 0)
  ) {
    container.parentElement.style.display = "none";
    return;
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
  // Convert date strings (e.g., "Dec 2023 - Jun 2024") into absolute month numbers
  const intervals = expData.map((job) => {
    // Split by dash or en-dash
    const dateParts = job.date.split(/\s*[-–—]\s*/);

    const start = new Date(dateParts[0]);
    const end = dateParts[1].toLowerCase().includes("present")
      ? new Date()
      : new Date(dateParts[1]);

    return {
      startMonth: start.getFullYear() * 12 + start.getMonth(),
      endMonth: end.getFullYear() * 12 + end.getMonth(),
    };
  });

  // Sort intervals by the start date
  intervals.sort((a, b) => a.startMonth - b.startMonth);

  // Merge any overlapping intervals (e.g., leaving one job in Dec and starting another in Dec)
  const mergedIntervals = [];
  if (intervals.length > 0) {
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
  }

  // Sum up the total months (+1 makes it inclusive, so May to Oct equals 6 months)
  const totalMonths = mergedIntervals.reduce((sum, interval) => {
    return sum + (interval.endMonth - interval.startMonth + 1);
  }, 0);

  const totalYears = Math.floor(totalMonths / 12);

  document.getElementById("summary-container").innerHTML = `
    Full Stack JavaScript Developer with <strong>${totalYears}+ years</strong> of experience architecting scalable SaaS platforms, enterprise-grade Order Management Systems (OMS), and high-performance CRMs. Expertise in the React and Node.js ecosystems (TypeScript, Next.js, React Native, Hono), delivering secure REST APIs, dynamic data aggregation, and highly responsive frontends. Proven track record of scaling production systems for <strong>1M+ users</strong> and optimizing complex omnichannel workflows. Active open-source contributor with multiple published React and React Native libraries.
  `;
}

function renderEducation(eduData) {
  if (!eduData || eduData.length === 0) return;

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

/* === UI Controls / Utilities === */
function copyEmail() {
  navigator.clipboard
    .writeText("samarth.sheth.29@gmail.com")
    .then(() => alert("Email copied!"));
}

function writeEmail() {
  const subject = encodeURIComponent(
    "Job Opportunity - Full Stack JavaScript Developer",
  );
  const body = encodeURIComponent(
    "Hello Samarth,\n\nI came across your resume and I'm interested in discussing potential opportunities.\n\nPlease let me know your availability for a conversation.\n\nBest regards",
  );
  window.location.href = `mailto:samarth.sheth.29@gmail.com?subject=${subject}&body=${body}`;
}

function callNow() {
  window.location.href = "tel:+919537685650";
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
  document.title = `SAMARTH_SHETH_${String(d.getDate()).padStart(2, "0")}_${m[d.getMonth()]}_${d.getFullYear()}`;
}
