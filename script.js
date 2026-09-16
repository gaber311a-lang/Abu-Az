/* ===========================
   Abu Az work — Logic
   =========================== */

const ADMIN_PASSWORD = 'abuaz2026';
const STORAGE_KEY = 'abuaz_projects_v2';

// ---------- State ----------
let projects = [];
let isAdminLoggedIn = false;
let currentFilter = 'all';

// ---------- DOM ----------
const projectsGrid = document.getElementById('projectsGrid');
const emptyState = document.getElementById('emptyState');
const filters = document.getElementById('filters');
const projectModal = document.getElementById('projectModal');
const modalBody = document.getElementById('modalBody');
const adminPanel = document.getElementById('adminPanel');
const adminLogin = document.getElementById('adminLogin');
const adminDashboard = document.getElementById('adminDashboard');
const adminPassword = document.getElementById('adminPassword');
const loginError = document.getElementById('loginError');
const projectForm = document.getElementById('projectForm');
const adminList = document.getElementById('adminList');
const statProjects = document.getElementById('statProjects');
const yearEl = document.getElementById('year');

// ---------- Init ----------
function init() {
  yearEl.textContent = new Date().getFullYear();
  loadProjects();
  renderProjects();
  setupEventListeners();
  setupScrollAnimations();
  setupHeaderScroll();
}

function loadProjects() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      projects = JSON.parse(saved);
      if (!Array.isArray(projects)) projects = [];
    } catch {
      projects = [];
    }
  } else {
    projects = [];
  }
}

function saveProjects() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

// ---------- Render ----------
function renderProjects() {
  const filtered = currentFilter === 'all'
    ? projects
    : projects.filter(p => p.category === currentFilter);

  projectsGrid.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.hidden = false;
    if (statProjects) statProjects.textContent = projects.length;
    return;
  }
  emptyState.hidden = true;

  filtered.forEach((p, i) => {
    const card = document.createElement('article');
    card.className = 'project-card';
    card.style.animationDelay = `${i * 0.08}s`;
    card.dataset.id = p.id;

    const imgSrc = p.image || 'https://via.placeholder.com/800x600/efede9/6b6760?text=No+Image';

    card.innerHTML = `
      <div class="thumb">
        <img src="${imgSrc}" alt="${escapeHtml(p.title)}" loading="lazy" onerror="this.src='https://via.placeholder.com/800x600/efede9/6b6760?text=No+Image'" />
        <div class="overlay"></div>
      </div>
      <div class="project-info">
        <div class="project-cat">${categoryLabel(p.category)}</div>
        <h3 class="project-title">${escapeHtml(p.title)}</h3>
        ${p.year ? `<div class="project-year">${p.year}</div>` : ''}
      </div>
    `;
    card.addEventListener('click', () => openModal(p));
    projectsGrid.appendChild(card);
  });

  if (statProjects) {
    statProjects.textContent = projects.length;
  }
}

function categoryLabel(cat) {
  const map = {
    branding: 'هوية بصرية',
    ui: 'واجهات',
    illustration: 'رسوم',
    other: 'أخرى'
  };
  return map[cat] || cat;
}

function openModal(project) {
  const imgSrc = project.image || 'https://via.placeholder.com/800x600/efede9/6b6760?text=No+Image';
  modalBody.innerHTML = `
    <img src="${imgSrc}" alt="${escapeHtml(project.title)}" onerror="this.src='https://via.placeholder.com/800x600/efede9/6b6760?text=No+Image'" />
    <div class="modal-info">
      <div class="project-cat">${categoryLabel(project.category)}</div>
      <h2>${escapeHtml(project.title)}</h2>
      ${project.year ? `<p style="margin-bottom:0.75rem;color:var(--text-muted);font-size:0.95rem;">${project.year}</p>` : ''}
      <p>${escapeHtml(project.desc || 'لا يوجد وصف إضافي.')}</p>
    </div>
  `;
  projectModal.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  projectModal.hidden = true;
  document.body.style.overflow = '';
}

// ---------- Admin ----------
function openAdmin() {
  adminPanel.hidden = false;
  document.body.style.overflow = 'hidden';

  if (isAdminLoggedIn) {
    showDashboard();
  } else {
    adminLogin.style.display = 'flex';
    adminDashboard.style.display = 'none';
    adminLogin.hidden = false;
    adminDashboard.hidden = true;
    adminPassword.value = '';
    loginError.hidden = true;
    adminPassword.focus();
  }
}

function closeAdmin() {
  adminPanel.hidden = true;
  document.body.style.overflow = '';
}

function login() {
  const pass = adminPassword.value.trim();
  if (pass === ADMIN_PASSWORD) {
    isAdminLoggedIn = true;
    loginError.hidden = true;
    showDashboard();
  } else {
    loginError.hidden = false;
    adminPassword.value = '';
    adminPassword.focus();
  }
}

function logout() {
  isAdminLoggedIn = false;
  adminLogin.style.display = 'flex';
  adminDashboard.style.display = 'none';
  adminLogin.hidden = false;
  adminDashboard.hidden = true;
  adminPassword.value = '';
  loginError.hidden = true;
}

function showDashboard() {
  adminLogin.style.display = 'none';
  adminLogin.hidden = true;
  adminDashboard.style.display = 'block';
  adminDashboard.hidden = false;

  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  const addTab = document.querySelector('.tab[data-tab="add"]');
  if (addTab) addTab.classList.add('active');

  document.getElementById('tabAdd').hidden = false;
  document.getElementById('tabList').hidden = true;

  renderAdminList();
}

function renderAdminList() {
  adminList.innerHTML = '';
  if (projects.length === 0) {
    adminList.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:1.5rem;">لا توجد مشاريع بعد</p>';
    return;
  }

  projects.forEach(p => {
    const item = document.createElement('div');
    item.className = 'admin-item';
    const imgSrc = p.image || 'https://via.placeholder.com/100x75/efede9/6b6760?text=-';
    item.innerHTML = `
      <img src="${imgSrc}" alt="" onerror="this.src='https://via.placeholder.com/100x75/efede9/6b6760?text=-'" />
      <div class="admin-item-info">
        <strong>${escapeHtml(p.title)}</strong>
        <span>${categoryLabel(p.category)}</span>
      </div>
      <button type="button" class="admin-item-delete" data-id="${p.id}" title="حذف">×</button>
    `;
    adminList.appendChild(item);
  });

  adminList.querySelectorAll('.admin-item-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.dataset.id;
      if (confirm('هل تريد حذف هذا المشروع؟')) {
        projects = projects.filter(p => p.id !== id);
        saveProjects();
        renderProjects();
        renderAdminList();
      }
    });
  });
}

function handleAddProject(e) {
  e.preventDefault();

  const title = document.getElementById('pTitle').value.trim();
  const category = document.getElementById('pCategory').value;
  const desc = document.getElementById('pDesc').value.trim();
  const yearVal = document.getElementById('pYear').value;
  const imageUrl = document.getElementById('pImage').value.trim();
  const fileInput = document.getElementById('pImageFile');

  if (!title) {
    alert('الرجاء كتابة عنوان المشروع');
    return;
  }

  const finish = (image) => {
    const newProject = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
      title,
      category,
      desc,
      image: image || '',
      year: yearVal || null
    };

    projects.unshift(newProject);
    saveProjects();
    renderProjects();
    renderAdminList();
    projectForm.reset();

    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    const listTab = document.querySelector('.tab[data-tab="list"]');
    if (listTab) listTab.classList.add('active');
    document.getElementById('tabAdd').hidden = true;
    document.getElementById('tabList').hidden = false;

    alert('تم إضافة المشروع بنجاح ✓');
  };

  if (fileInput.files && fileInput.files[0]) {
    const file = fileInput.files[0];
    if (file.size > 5 * 1024 * 1024) {
      alert('حجم الصورة كبير جداً (الحد الأقصى 5 ميجا)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => finish(ev.target.result);
    reader.onerror = () => {
      alert('حدث خطأ أثناء قراءة الصورة');
      finish(imageUrl || '');
    };
    reader.readAsDataURL(file);
  } else {
    finish(imageUrl || '');
  }
}

// ---------- Events ----------
function setupEventListeners() {
  filters.addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-btn')) {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentFilter = e.target.dataset.filter;
      renderProjects();
    }
  });

  projectModal.querySelectorAll('[data-close]').forEach(el => {
    el.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closeAdmin();
    }
  });

  document.getElementById('adminBtn').addEventListener('click', openAdmin);
  document.getElementById('adminClose').addEventListener('click', closeAdmin);
  document.getElementById('adminBackdrop').addEventListener('click', closeAdmin);
  document.getElementById('loginBtn').addEventListener('click', login);
  adminPassword.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      login();
    }
  });
  document.getElementById('logoutBtn').addEventListener('click', logout);
  projectForm.addEventListener('submit', handleAddProject);

  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      document.getElementById('tabAdd').hidden = target !== 'add';
      document.getElementById('tabList').hidden = target !== 'list';
      if (target === 'list') renderAdminList();
    });
  });

  const menuToggle = document.getElementById('menuToggle');
  const nav = document.getElementById('nav');
  menuToggle.addEventListener('click', () => {
    nav.classList.toggle('open');
  });
  nav.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => nav.classList.remove('open'));
  });

  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    const scrollY = window.scrollY + 120;
    sections.forEach(sec => {
      const top = sec.offsetTop;
      const height = sec.offsetHeight;
      const id = sec.getAttribute('id');
      if (scrollY >= top && scrollY < top + height) {
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        const active = document.querySelector(`.nav-link[href="#${id}"]`);
        if (active) active.classList.add('active');
      }
    });
  });
}

function setupHeaderScroll() {
  const header = document.getElementById('header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  });
}

function setupScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.15 });

  document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Start
init();
