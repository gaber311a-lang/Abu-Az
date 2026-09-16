/* ===========================
   Abu Az work — Logic
   =========================== */

const ADMIN_PASSWORD = 'abuaz2026'; // غيّرها لاحقاً
const STORAGE_KEY = 'abuaz_projects';

// بيانات تجريبية أولية (تظهر أول مرة فقط)
const DEMO_PROJECTS = [
  {
    id: '1',
    title: 'هوية بصرية لمقهى هادئ',
    category: 'branding',
    desc: 'تصميم هوية كاملة تشمل الشعار، الألوان، والتطبيقات على العبوات واللافتات بأجواء دافئة ومريحة.',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&q=80',
    year: 2025
  },
  {
    id: '2',
    title: 'واجهة تطبيق تأمل',
    category: 'ui',
    desc: 'تصميم واجهة مستخدم لتطبيق تأمل يومي، بألوان هادئة وتجربة سلسة تساعد على الاسترخاء.',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80',
    year: 2025
  },
  {
    id: '3',
    title: 'سلسلة رسوم توضيحية',
    category: 'illustration',
    desc: 'مجموعة رسوم رقمية مستوحاة من الطبيعة والحياة اليومية بأسلوب بسيط ودافئ.',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80',
    year: 2024
  },
  {
    id: '4',
    title: 'تصميم غلاف كتاب',
    category: 'other',
    desc: 'غلاف كتاب أدبي بلمسة كلاسيكية معاصرة، يركز على الخطوط والمساحات السلبية.',
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&q=80',
    year: 2024
  }
];

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
    } catch {
      projects = [...DEMO_PROJECTS];
      saveProjects();
    }
  } else {
    projects = [...DEMO_PROJECTS];
    saveProjects();
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
    return;
  }
  emptyState.hidden = true;

  filtered.forEach((p, i) => {
    const card = document.createElement('article');
    card.className = 'project-card';
    card.style.animationDelay = `${i * 0.08}s`;
    card.dataset.id = p.id;
    card.innerHTML = `
      <div class="thumb">
        <img src="${p.image}" alt="${escapeHtml(p.title)}" loading="lazy" />
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
  modalBody.innerHTML = `
    <img src="${project.image}" alt="${escapeHtml(project.title)}" />
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
    adminLogin.hidden = false;
    adminDashboard.hidden = true;
    adminPassword.value = '';
    loginError.hidden = true;
  }
}

function closeAdmin() {
  adminPanel.hidden = true;
  document.body.style.overflow = '';
}

function login() {
  if (adminPassword.value === ADMIN_PASSWORD) {
    isAdminLoggedIn = true;
    loginError.hidden = true;
    showDashboard();
  } else {
    loginError.hidden = false;
  }
}

function logout() {
  isAdminLoggedIn = false;
  adminLogin.hidden = false;
  adminDashboard.hidden = true;
  adminPassword.value = '';
}

function showDashboard() {
  adminLogin.hidden = true;
  adminDashboard.hidden = false;
  renderAdminList();
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelector('.tab[data-tab="add"]').classList.add('active');
  document.getElementById('tabAdd').hidden = false;
  document.getElementById('tabList').hidden = true;
}

function renderAdminList() {
  adminList.innerHTML = '';
  if (projects.length === 0) {
    adminList.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:1rem;">لا توجد مشاريع</p>';
    return;
  }
  projects.forEach(p => {
    const item = document.createElement('div');
    item.className = 'admin-item';
    item.innerHTML = `
      <img src="${p.image}" alt="" />
      <div class="admin-item-info">
        <strong>${escapeHtml(p.title)}</strong>
        <span>${categoryLabel(p.category)}</span>
      </div>
      <button class="admin-item-delete" data-id="${p.id}" title="حذف">×</button>
    `;
    adminList.appendChild(item);
  });

  adminList.querySelectorAll('.admin-item-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
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
  const year = document.getElementById('pYear').value;
  const imageUrl = document.getElementById('pImage').value.trim();
  const fileInput = document.getElementById('pImageFile');

  if (!title) return;

  const finish = (image) => {
    const newProject = {
      id: Date.now().toString(),
      title,
      category,
      desc,
      image: image || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80',
      year: year || null
    };
    projects.unshift(newProject);
    saveProjects();
    renderProjects();
    renderAdminList();
    projectForm.reset();
    document.querySelector('.tab[data-tab="list"]').click();
    alert('تم إضافة المشروع بنجاح ✓');
  };

  if (fileInput.files && fileInput.files[0]) {
    const reader = new FileReader();
    reader.onload = (ev) => finish(ev.target.result);
    reader.readAsDataURL(fileInput.files[0]);
  } else if (imageUrl) {
    finish(imageUrl);
  } else {
    finish(null);
  }
}

// ---------- Events ----------
function setupEventListeners() {
  // Filters
  filters.addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-btn')) {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      currentFilter = e.target.dataset.filter;
      renderProjects();
    }
  });

  // Modal close
  projectModal.querySelectorAll('[data-close]').forEach(el => {
    el.addEventListener('click', closeModal);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closeAdmin();
    }
  });

  // Admin
  document.getElementById('adminBtn').addEventListener('click', openAdmin);
  document.getElementById('adminClose').addEventListener('click', closeAdmin);
  document.getElementById('adminBackdrop').addEventListener('click', closeAdmin);
  document.getElementById('loginBtn').addEventListener('click', login);
  adminPassword.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') login();
  });
  document.getElementById('logoutBtn').addEventListener('click', logout);
  projectForm.addEventListener('submit', handleAddProject);

  // Tabs
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

  // Mobile menu
  const menuToggle = document.getElementById('menuToggle');
  const nav = document.getElementById('nav');
  menuToggle.addEventListener('click', () => {
    nav.classList.toggle('open');
  });
  nav.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => nav.classList.remove('open'));
  });

  // Active nav on scroll
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
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Start
init();
