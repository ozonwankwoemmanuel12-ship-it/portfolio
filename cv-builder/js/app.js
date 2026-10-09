/**
 * CV Builder Application
 * A professional CV/Resume builder with live preview, templates, and local storage.
 */

(function () {
  'use strict';

  // ============================================
  // Constants & Configuration
  // ============================================
  const STORAGE_KEY = 'cv-builder-data';
  const THEME_KEY = 'cv-builder-theme';
  const ZOOM_STEP = 0.1;
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 1.5;

  // ============================================
  // State Management
  // ============================================
  const defaultState = {
    template: 'modern',
    personal: {
      fullName: '',
      jobTitle: '',
      email: '',
      phone: '',
      location: '',
      website: '',
      summary: ''
    },
    education: [],
    experience: [],
    skills: [],
    projects: [],
    certifications: []
  };

  let state = loadState();
  let currentZoom = 1;
  let modalCallback = null;

  // ============================================
  // DOM Element References
  // ============================================
  const elements = {
    form: document.getElementById('cv-form'),
    cvPaper: document.getElementById('cv-paper'),
    previewScroll: document.getElementById('preview-scroll'),
    zoomLevel: document.getElementById('zoom-level'),
    toastContainer: document.getElementById('toast-container'),
    modalOverlay: document.getElementById('modal-overlay'),
    modalTitle: document.getElementById('modal-title'),
    modalDesc: document.getElementById('modal-desc'),
    modalConfirm: document.getElementById('modal-confirm'),
    modalCancel: document.getElementById('modal-cancel'),

    // Personal info fields
    fullName: document.getElementById('fullName'),
    jobTitle: document.getElementById('jobTitle'),
    email: document.getElementById('email'),
    phone: document.getElementById('phone'),
    location: document.getElementById('location'),
    website: document.getElementById('website'),
    summary: document.getElementById('summary'),
    summaryCount: document.getElementById('summary-count'),

    // Dynamic lists
    educationList: document.getElementById('education-list'),
    experienceList: document.getElementById('experience-list'),
    projectsList: document.getElementById('projects-list'),
    certificationsList: document.getElementById('certifications-list'),

    // Empty states
    educationEmpty: document.getElementById('education-empty'),
    experienceEmpty: document.getElementById('experience-empty'),
    skillsEmpty: document.getElementById('skills-empty'),
    projectsEmpty: document.getElementById('projects-empty'),
    certificationsEmpty: document.getElementById('certifications-empty'),

    // Skills
    skillInput: document.getElementById('skill-input'),
    btnAddSkill: document.getElementById('btn-add-skill'),
    skillsTags: document.getElementById('skills-tags'),

    // Buttons
    btnReset: document.getElementById('btn-reset'),
    btnExportJson: document.getElementById('btn-export-json'),
    btnPrint: document.getElementById('btn-print'),
    btnZoomIn: document.getElementById('btn-zoom-in'),
    btnZoomOut: document.getElementById('btn-zoom-out'),

    // Template options
    templateOptions: document.querySelectorAll('.template-option')
  };

  // ============================================
  // Utility Functions
  // ============================================

  /**
   * Generate a unique ID
   */
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Escape HTML to prevent XSS
   */
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Debounce function
   */
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  /**
   * Format date for display
   */
  function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  /**
   * Show toast notification
   */
  function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toast.setAttribute('role', 'alert');

    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('hiding');
      toast.addEventListener('animationend', () => {
        toast.remove();
      });
    }, duration);
  }

  /**
   * Show confirmation modal
   */
  function showModal(title, desc, onConfirm) {
    elements.modalTitle.textContent = title;
    elements.modalDesc.textContent = desc;
    elements.modalOverlay.hidden = false;
    modalCallback = onConfirm;

    // Focus the cancel button for accessibility
    elements.modalCancel.focus();

    // Trap focus within modal
    document.addEventListener('keydown', trapFocus);
  }

  /**
   * Close modal
   */
  function closeModal() {
    elements.modalOverlay.hidden = true;
    modalCallback = null;
    document.removeEventListener('keydown', trapFocus);
  }

  /**
   * Trap focus within modal for accessibility
   */
  function trapFocus(e) {
    if (e.key !== 'Tab') return;

    const focusable = elements.modalOverlay.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        last.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === last) {
        first.focus();
        e.preventDefault();
      }
    }
  }

  // ============================================
  // State Persistence
  // ============================================

  /**
   * Load state from localStorage
   */
  function loadState() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...defaultState, ...parsed };
      }
    } catch (e) {
      console.error('Failed to load state:', e);
    }
    return JSON.parse(JSON.stringify(defaultState));
  }

  /**
   * Save state to localStorage
   */
  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state:', e);
      showToast('Failed to save data. Storage may be full.', 'error');
    }
  }

  /**
   * Debounced save
   */
  const debouncedSave = debounce(saveState, 500);

  // ============================================
  // Validation
  // ============================================

  /**
   * Validate email format
   */
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Validate URL format
   */
  function isValidUrl(url) {
    if (!url) return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate a single field
   */
  function validateField(field) {
    const errorEl = document.getElementById(`error-${field.id}`);
    let isValid = true;
    let message = '';

    // Clear previous error
    field.classList.remove('error');
    if (errorEl) errorEl.textContent = '';

    const value = field.value.trim();

    // Required check
    if (field.hasAttribute('required') && !value) {
      isValid = false;
      message = 'This field is required';
    }

    // Email validation
    if (isValid && field.type === 'email' && value && !isValidEmail(value)) {
      isValid = false;
      message = 'Please enter a valid email address';
    }

    // URL validation
    if (isValid && field.type === 'url' && value && !isValidUrl(value)) {
      isValid = false;
      message = 'Please enter a valid URL';
    }

    // Show error
    if (!isValid) {
      field.classList.add('error');
      if (errorEl) errorEl.textContent = message;
    }

    return isValid;
  }

  /**
   * Validate entire form
   */
  function validateForm() {
    const requiredFields = elements.form.querySelectorAll('[required]');
    let isValid = true;

    requiredFields.forEach(field => {
      if (!validateField(field)) {
        isValid = false;
      }
    });

    // Validate email and website even if not required
    if (elements.email.value && !validateField(elements.email)) isValid = false;
    if (elements.website.value && !validateField(elements.website)) isValid = false;

    return isValid;
  }

  // ============================================
  // Dynamic Section Management
  // ============================================

  /**
   * Create education item
   */
  function createEducationItem(data = {}) {
    const id = data.id || generateId();
    const item = document.createElement('div');
    item.className = 'dynamic-item';
    item.dataset.id = id;
    item.innerHTML = `
      <div class="dynamic-item-header">
        <span class="dynamic-item-title">${escapeHtml(data.degree || 'New Education')}</span>
        <div class="dynamic-item-actions">
          <button class="icon-btn" data-action="edit" aria-label="Edit education" title="Edit">
            <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="icon-btn danger" data-action="delete" aria-label="Remove education" title="Remove">
            <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label for="edu-degree-${id}">Degree / Certificate <span class="required">*</span></label>
          <input type="text" id="edu-degree-${id}" data-field="degree" value="${escapeHtml(data.degree || '')}" placeholder="Bachelor of Science in Computer Science" required maxlength="100">
        </div>
        <div class="form-group">
          <label for="edu-school-${id}">Institution <span class="required">*</span></label>
          <input type="text" id="edu-school-${id}" data-field="school" value="${escapeHtml(data.school || '')}" placeholder="University of Example" required maxlength="100">
        </div>
        <div class="form-group">
          <label for="edu-start-${id}">Start Date</label>
          <input type="month" id="edu-start-${id}" data-field="startDate" value="${escapeHtml(data.startDate || '')}">
        </div>
        <div class="form-group">
          <label for="edu-end-${id}">End Date</label>
          <input type="month" id="edu-end-${id}" data-field="endDate" value="${escapeHtml(data.endDate || '')}">
        </div>
        <div class="form-group form-group-full">
          <label for="edu-description-${id}">Description</label>
          <textarea id="edu-description-${id}" data-field="description" rows="2" placeholder="Relevant coursework, honors, activities..." maxlength="500">${escapeHtml(data.description || '')}</textarea>
        </div>
      </div>
    `;
    return item;
  }

  /**
   * Create experience item
   */
  function createExperienceItem(data = {}) {
    const id = data.id || generateId();
    const item = document.createElement('div');
    item.className = 'dynamic-item';
    item.dataset.id = id;
    item.innerHTML = `
      <div class="dynamic-item-header">
        <span class="dynamic-item-title">${escapeHtml(data.position || 'New Position')}</span>
        <div class="dynamic-item-actions">
          <button class="icon-btn" data-action="edit" aria-label="Edit experience" title="Edit">
            <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="icon-btn danger" data-action="delete" aria-label="Remove experience" title="Remove">
            <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label for="exp-position-${id}">Job Title <span class="required">*</span></label>
          <input type="text" id="exp-position-${id}" data-field="position" value="${escapeHtml(data.position || '')}" placeholder="Software Engineer" required maxlength="100">
        </div>
        <div class="form-group">
          <label for="exp-company-${id}">Company <span class="required">*</span></label>
          <input type="text" id="exp-company-${id}" data-field="company" value="${escapeHtml(data.company || '')}" placeholder="Tech Company Inc." required maxlength="100">
        </div>
        <div class="form-group">
          <label for="exp-start-${id}">Start Date</label>
          <input type="month" id="exp-start-${id}" data-field="startDate" value="${escapeHtml(data.startDate || '')}">
        </div>
        <div class="form-group">
          <label for="exp-end-${id}">End Date</label>
          <input type="month" id="exp-end-${id}" data-field="endDate" value="${escapeHtml(data.endDate || '')}">
        </div>
        <div class="form-group form-group-full">
          <label for="exp-description-${id}">Description & Achievements</label>
          <textarea id="exp-description-${id}" data-field="description" rows="3" placeholder="Key responsibilities, achievements, and technologies used..." maxlength="1000">${escapeHtml(data.description || '')}</textarea>
        </div>
      </div>
    `;
    return item;
  }

  /**
   * Create project item
   */
  function createProjectItem(data = {}) {
    const id = data.id || generateId();
    const item = document.createElement('div');
    item.className = 'dynamic-item';
    item.dataset.id = id;
    item.innerHTML = `
      <div class="dynamic-item-header">
        <span class="dynamic-item-title">${escapeHtml(data.name || 'New Project')}</span>
        <div class="dynamic-item-actions">
          <button class="icon-btn" data-action="edit" aria-label="Edit project" title="Edit">
            <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="icon-btn danger" data-action="delete" aria-label="Remove project" title="Remove">
            <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label for="proj-name-${id}">Project Name <span class="required">*</span></label>
          <input type="text" id="proj-name-${id}" data-field="name" value="${escapeHtml(data.name || '')}" placeholder="E-commerce Platform" required maxlength="100">
        </div>
        <div class="form-group">
          <label for="proj-link-${id}">Project URL</label>
          <input type="url" id="proj-link-${id}" data-field="link" value="${escapeHtml(data.link || '')}" placeholder="https://github.com/..." maxlength="200">
        </div>
        <div class="form-group form-group-full">
          <label for="proj-description-${id}">Description</label>
          <textarea id="proj-description-${id}" data-field="description" rows="2" placeholder="What the project does, technologies used, and your role..." maxlength="500">${escapeHtml(data.description || '')}</textarea>
        </div>
        <div class="form-group form-group-full">
          <label for="proj-tech-${id}">Technologies (comma-separated)</label>
          <input type="text" id="proj-tech-${id}" data-field="technologies" value="${escapeHtml(data.technologies || '')}" placeholder="React, Node.js, MongoDB" maxlength="200">
        </div>
      </div>
    `;
    return item;
  }

  /**
   * Create certification item
   */
  function createCertificationItem(data = {}) {
    const id = data.id || generateId();
    const item = document.createElement('div');
    item.className = 'dynamic-item';
    item.dataset.id = id;
    item.innerHTML = `
      <div class="dynamic-item-header">
        <span class="dynamic-item-title">${escapeHtml(data.name || 'New Certification')}</span>
        <div class="dynamic-item-actions">
          <button class="icon-btn" data-action="edit" aria-label="Edit certification" title="Edit">
            <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button class="icon-btn danger" data-action="delete" aria-label="Remove certification" title="Remove">
            <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>
      </div>
      <div class="form-grid">
        <div class="form-group">
          <label for="cert-name-${id}">Certification Name <span class="required">*</span></label>
          <input type="text" id="cert-name-${id}" data-field="name" value="${escapeHtml(data.name || '')}" placeholder="AWS Certified Solutions Architect" required maxlength="100">
        </div>
        <div class="form-group">
          <label for="cert-issuer-${id}">Issuing Organization <span class="required">*</span></label>
          <input type="text" id="cert-issuer-${id}" data-field="issuer" value="${escapeHtml(data.issuer || '')}" placeholder="Amazon Web Services" required maxlength="100">
        </div>
        <div class="form-group">
          <label for="cert-date-${id}">Date Obtained</label>
          <input type="month" id="cert-date-${id}" data-field="date" value="${escapeHtml(data.date || '')}">
        </div>
        <div class="form-group">
          <label for="cert-expiry-${id}">Expiry Date</label>
          <input type="month" id="cert-expiry-${id}" data-field="expiry" value="${escapeHtml(data.expiry || '')}">
        </div>
      </div>
    `;
    return item;
  }

  // ============================================
  // Section Renderers
  // ============================================

  /**
   * Render education section
   */
  function renderEducation() {
    elements.educationList.innerHTML = '';
    elements.educationEmpty.style.display = state.education.length ? 'none' : 'flex';

    state.education.forEach(edu => {
      elements.educationList.appendChild(createEducationItem(edu));
    });
  }

  /**
   * Render experience section
   */
  function renderExperience() {
    elements.experienceList.innerHTML = '';
    elements.experienceEmpty.style.display = state.experience.length ? 'none' : 'flex';

    state.experience.forEach(exp => {
      elements.experienceList.appendChild(createExperienceItem(exp));
    });
  }

  /**
   * Render projects section
   */
  function renderProjects() {
    elements.projectsList.innerHTML = '';
    elements.projectsEmpty.style.display = state.projects.length ? 'none' : 'flex';

    state.projects.forEach(proj => {
      elements.projectsList.appendChild(createProjectItem(proj));
    });
  }

  /**
   * Render certifications section
   */
  function renderCertifications() {
    elements.certificationsList.innerHTML = '';
    elements.certificationsEmpty.style.display = state.certifications.length ? 'none' : 'flex';

    state.certifications.forEach(cert => {
      elements.certificationsList.appendChild(createCertificationItem(cert));
    });
  }

  /**
   * Render skills tags
   */
  function renderSkills() {
    elements.skillsTags.innerHTML = '';
    elements.skillsEmpty.style.display = state.skills.length ? 'none' : 'flex';

    state.skills.forEach((skill, index) => {
      const tag = document.createElement('span');
      tag.className = 'skill-tag';
      tag.innerHTML = `
        ${escapeHtml(skill)}
        <button class="skill-tag-remove" data-index="${index}" aria-label="Remove ${escapeHtml(skill)}" title="Remove skill">&times;</button>
      `;
      elements.skillsTags.appendChild(tag);
    });
  }

  // ============================================
  // CV Preview Rendering
  // ============================================

  /**
   * Render the CV preview based on current state
   */
  function renderCV() {
    const template = state.template;
    const p = state.personal;

    let html = `<div class="cv-${template}">`;

    // Header
    html += '<div class="cv-header">';
    html += `<h1 class="cv-name">${escapeHtml(p.fullName || 'Your Name')}</h1>`;
    html += `<p class="cv-title">${escapeHtml(p.jobTitle || 'Your Job Title')}</p>`;

    // Contact info
    const contacts = [];
    if (p.email) contacts.push(`<span>${escapeHtml(p.email)}</span>`);
    if (p.phone) contacts.push(`<span>${escapeHtml(p.phone)}</span>`);
    if (p.location) contacts.push(`<span>${escapeHtml(p.location)}</span>`);
    if (p.website) contacts.push(`<span>${escapeHtml(p.website)}</span>`);

    if (contacts.length) {
      html += `<div class="cv-contact">${contacts.join('')}</div>`;
    }
    html += '</div>';

    // Summary
    if (p.summary) {
      html += '<div class="cv-section">';
      html += '<h2 class="cv-section-title">Professional Summary</h2>';
      html += `<p class="cv-summary">${escapeHtml(p.summary)}</p>`;
      html += '</div>';
    }

    // Experience
    if (state.experience.length) {
      html += '<div class="cv-section">';
      html += '<h2 class="cv-section-title">Work Experience</h2>';
      state.experience.forEach(exp => {
        html += '<div class="cv-item">';
        html += '<div class="cv-item-header">';
        html += `<span class="cv-item-title">${escapeHtml(exp.position)}</span>`;
        html += `<span class="cv-item-date">${formatDate(exp.startDate)} - ${exp.endDate ? formatDate(exp.endDate) : 'Present'}</span>`;
        html += '</div>';
        if (exp.company) html += `<p class="cv-item-subtitle">${escapeHtml(exp.company)}</p>`;
        if (exp.description) html += `<p class="cv-item-description">${escapeHtml(exp.description)}</p>`;
        html += '</div>';
      });
      html += '</div>';
    }

    // Education
    if (state.education.length) {
      html += '<div class="cv-section">';
      html += '<h2 class="cv-section-title">Education</h2>';
      state.education.forEach(edu => {
        html += '<div class="cv-item">';
        html += '<div class="cv-item-header">';
        html += `<span class="cv-item-title">${escapeHtml(edu.degree)}</span>`;
        html += `<span class="cv-item-date">${formatDate(edu.startDate)} - ${edu.endDate ? formatDate(edu.endDate) : 'Present'}</span>`;
        html += '</div>';
        if (edu.school) html += `<p class="cv-item-subtitle">${escapeHtml(edu.school)}</p>`;
        if (edu.description) html += `<p class="cv-item-description">${escapeHtml(edu.description)}</p>`;
        html += '</div>';
      });
      html += '</div>';
    }

    // Skills
    if (state.skills.length) {
      html += '<div class="cv-section">';
      html += '<h2 class="cv-section-title">Skills</h2>';
      html += '<div class="cv-skills">';
      state.skills.forEach(skill => {
        html += `<span class="cv-skill">${escapeHtml(skill)}</span>`;
      });
      html += '</div>';
      html += '</div>';
    }

    // Projects
    if (state.projects.length) {
      html += '<div class="cv-section">';
      html += '<h2 class="cv-section-title">Projects</h2>';
      state.projects.forEach(proj => {
        html += '<div class="cv-item">';
        html += '<div class="cv-item-header">';
        html += `<span class="cv-item-title">${escapeHtml(proj.name)}</span>`;
        html += '</div>';
        if (proj.link) html += `<p class="cv-item-subtitle">${escapeHtml(proj.link)}</p>`;
        if (proj.description) html += `<p class="cv-item-description">${escapeHtml(proj.description)}</p>`;
        if (proj.technologies) html += `<p class="cv-item-description"><strong>Technologies:</strong> ${escapeHtml(proj.technologies)}</p>`;
        html += '</div>';
      });
      html += '</div>';
    }

    // Certifications
    if (state.certifications.length) {
      html += '<div class="cv-section">';
      html += '<h2 class="cv-section-title">Certifications</h2>';
      state.certifications.forEach(cert => {
        html += '<div class="cv-item">';
        html += '<div class="cv-item-header">';
        html += `<span class="cv-item-title">${escapeHtml(cert.name)}</span>`;
        html += `<span class="cv-item-date">${formatDate(cert.date)}</span>`;
        html += '</div>';
        if (cert.issuer) html += `<p class="cv-item-subtitle">${escapeHtml(cert.issuer)}</p>`;
        html += '</div>';
      });
      html += '</div>';
    }

    html += '</div>';

    elements.cvPaper.innerHTML = html;
  }

  /**
   * Render all components
   */
  function renderAll() {
    renderEducation();
    renderExperience();
    renderProjects();
    renderCertifications();
    renderSkills();
    renderCV();
  }

  // ============================================
  // Event Handlers
  // ============================================

  /**
   * Handle personal info input changes
   */
  function handlePersonalInput(e) {
    const field = e.target;
    const fieldName = field.name;
    if (fieldName && state.personal.hasOwnProperty(fieldName)) {
      state.personal[fieldName] = field.value;
      debouncedSave();
      renderCV();
    }

    // Update character count for summary
    if (field.id === 'summary') {
      elements.summaryCount.textContent = `${field.value.length} / 1000`;
    }
  }

  /**
   * Handle dynamic item changes
   */
  function handleDynamicInput(e) {
    const field = e.target;
    if (!field.dataset.field) return;

    const item = field.closest('.dynamic-item');
    if (!item) return;

    const id = item.dataset.id;
    const section = field.closest('[id$="-list"]');
    if (!section) return;

    const sectionName = section.id.replace('-list', '');
    const dataArray = state[sectionName];
    const dataItem = dataArray.find(item => item.id === id);

    if (dataItem) {
      dataItem[field.dataset.field] = field.value;
      debouncedSave();
      renderCV();
    }
  }

  /**
   * Handle dynamic item actions (edit/delete)
   */
  function handleDynamicAction(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const item = btn.closest('.dynamic-item');
    if (!item) return;

    const id = item.dataset.id;
    const section = item.closest('[id$="-list"]');
    if (!section) return;

    const sectionName = section.id.replace('-list', '');
    const action = btn.dataset.action;

    if (action === 'delete') {
      showModal(
        'Remove Item',
        'Are you sure you want to remove this item? This action cannot be undone.',
        () => {
          state[sectionName] = state[sectionName].filter(item => item.id !== id);
          saveState();
          renderAll();
          showToast('Item removed successfully', 'success');
          closeModal();
        }
      );
    } else if (action === 'edit') {
      // Focus the first input in the item
      const firstInput = item.querySelector('input[data-field]');
      if (firstInput) {
        firstInput.focus();
        firstInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  /**
   * Handle add section buttons
   */
  function handleAddSection(e) {
    const btn = e.target.closest('.add-section-btn');
    if (!btn) return;

    const section = btn.dataset.section;
    const newItem = { id: generateId() };

    switch (section) {
      case 'education':
        state.education.push(newItem);
        renderEducation();
        break;
      case 'experience':
        state.experience.push(newItem);
        renderExperience();
        break;
      case 'projects':
        state.projects.push(newItem);
        renderProjects();
        break;
      case 'certifications':
        state.certifications.push(newItem);
        renderCertifications();
        break;
    }

    saveState();

    // Focus the first input of the new item
    setTimeout(() => {
      const list = document.getElementById(`${section}-list`);
      const lastItem = list.lastElementChild;
      if (lastItem) {
        const firstInput = lastItem.querySelector('input[data-field]');
        if (firstInput) {
          firstInput.focus();
          firstInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, 100);
  }

  /**
   * Handle skill addition
   */
  function handleAddSkill() {
    const skill = elements.skillInput.value.trim();
    if (!skill) return;

    if (state.skills.includes(skill)) {
      showToast('This skill has already been added', 'warning');
      return;
    }

    if (state.skills.length >= 30) {
      showToast('Maximum 30 skills allowed', 'warning');
      return;
    }

    state.skills.push(skill);
    elements.skillInput.value = '';
    saveState();
    renderSkills();
    renderCV();
    elements.skillInput.focus();
  }

  /**
   * Handle skill removal
   */
  function handleRemoveSkill(e) {
    const btn = e.target.closest('.skill-tag-remove');
    if (!btn) return;

    const index = parseInt(btn.dataset.index, 10);
    state.skills.splice(index, 1);
    saveState();
    renderSkills();
    renderCV();
  }

  /**
   * Handle template selection
   */
  function handleTemplateSelect(e) {
    const option = e.target.closest('.template-option');
    if (!option) return;

    const template = option.dataset.template;
    if (template === state.template) return;

    // Update active state
    elements.templateOptions.forEach(opt => {
      opt.classList.remove('active');
      opt.setAttribute('aria-checked', 'false');
    });
    option.classList.add('active');
    option.setAttribute('aria-checked', 'true');

    state.template = template;
    saveState();
    renderCV();
  }

  /**
   * Handle zoom controls
   */
  function handleZoom(delta) {
    currentZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentZoom + delta));
    elements.cvPaper.style.transform = `scale(${currentZoom})`;
    elements.zoomLevel.textContent = `${Math.round(currentZoom * 100)}%`;
  }

  /**
   * Handle print
   */
  function handlePrint() {
    if (!validateForm()) {
      showToast('Please fill in all required fields before printing', 'error');
      // Scroll to first error
      const firstError = elements.form.querySelector('.error');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstError.focus();
      }
      return;
    }
    window.print();
  }

  /**
   * Handle export JSON
   */
  function handleExportJson() {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cv-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('CV data exported successfully', 'success');
  }

  /**
   * Handle reset
   */
  function handleReset() {
    showModal(
      'Reset All Data',
      'This will clear all your CV data and start fresh. This action cannot be undone.',
      () => {
        state = JSON.parse(JSON.stringify(defaultState));
        localStorage.removeItem(STORAGE_KEY);
        populateForm();
        renderAll();
        showToast('All data has been reset', 'success');
        closeModal();
      }
    );
  }

  /**
   * Handle form submission (prevent default)
   */
  function handleFormSubmit(e) {
    e.preventDefault();
  }

  // ============================================
  // Form Population
  // ============================================

  /**
   * Populate form fields from state
   */
  function populateForm() {
    // Personal info
    elements.fullName.value = state.personal.fullName;
    elements.jobTitle.value = state.personal.jobTitle;
    elements.email.value = state.personal.email;
    elements.phone.value = state.personal.phone;
    elements.location.value = state.personal.location;
    elements.website.value = state.personal.website;
    elements.summary.value = state.personal.summary;
    elements.summaryCount.textContent = `${state.personal.summary.length} / 1000`;

    // Template
    elements.templateOptions.forEach(opt => {
      const isActive = opt.dataset.template === state.template;
      opt.classList.toggle('active', isActive);
      opt.setAttribute('aria-checked', isActive ? 'true' : 'false');
    });
  }

  // ============================================
  // Event Listeners
  // ============================================

  function initEventListeners() {
    // Personal info inputs
    elements.form.addEventListener('input', (e) => {
      if (e.target.closest('.dynamic-item')) {
        handleDynamicInput(e);
      } else {
        handlePersonalInput(e);
      }
    });

    // Dynamic item actions
    elements.form.addEventListener('click', (e) => {
      if (e.target.closest('[data-action]')) {
        handleDynamicAction(e);
      } else if (e.target.closest('.add-section-btn')) {
        handleAddSection(e);
      }
    });

    // Skills
    elements.btnAddSkill.addEventListener('click', handleAddSkill);
    elements.skillInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddSkill();
      }
    });
    elements.skillsTags.addEventListener('click', handleRemoveSkill);

    // Template selection
    elements.templateOptions.forEach(opt => {
      opt.addEventListener('click', handleTemplateSelect);
    });

    // Zoom controls
    elements.btnZoomIn.addEventListener('click', () => handleZoom(ZOOM_STEP));
    elements.btnZoomOut.addEventListener('click', () => handleZoom(-ZOOM_STEP));

    // Header buttons
    elements.btnPrint.addEventListener('click', handlePrint);
    elements.btnExportJson.addEventListener('click', handleExportJson);
    elements.btnReset.addEventListener('click', handleReset);

    // Form submission
    elements.form.addEventListener('submit', handleFormSubmit);

    // Modal
    elements.modalConfirm.addEventListener('click', () => {
      if (modalCallback) modalCallback();
    });
    elements.modalCancel.addEventListener('click', closeModal);
    elements.modalOverlay.addEventListener('click', (e) => {
      if (e.target === elements.modalOverlay) closeModal();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl/Cmd + P for print
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        handlePrint();
      }
      // Escape to close modal
      if (e.key === 'Escape' && !elements.modalOverlay.hidden) {
        closeModal();
      }
    });

    // Validate on blur
    elements.form.addEventListener('blur', (e) => {
      if (e.target.hasAttribute('required') || e.target.type === 'email' || e.target.type === 'url') {
        validateField(e.target);
      }
    }, true);
  }

  // ============================================
  // Initialization
  // ============================================

  function init() {
    populateForm();
    renderAll();
    initEventListeners();

    // Set initial zoom
    elements.cvPaper.style.transform = `scale(${currentZoom})`;
    elements.zoomLevel.textContent = `${Math.round(currentZoom * 100)}%`;
  }

  // Start the application
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
