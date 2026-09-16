/**
 * موقع أبو عز — SPA (معاينة محلية / localStorage)
 * نموذج بيانات نظيف لمستقبل backend — لا ادّعاء أمان إنتاجي.
 */
(function () {
  "use strict";

  const IBAN = "SA7836036036009631393655";
  const ADMIN_PHONE = "502299827";
  const DEMO_OTP = "000000";

  // Demo admin gate — password shown once in login help only (not a production secret)
  function djb2(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h) + str.charCodeAt(i);
    return (h >>> 0).toString(16);
  }
  const ADMIN_PASS_HASH = "922724f9"; // demo gate hash — hint shown once in UI

  const STORAGE_KEY = "abuaz_v1";

  const DEFAULT_PALETTE = [
    "#E42C23", "#111111", "#FFFFFF", "#F5F5F5", "#1E88E5",
    "#43A047", "#FB8C00", "#8E24AA", "#00ACC1", "#FDD835",
    "#6D4C41", "#EC407A", "#5C6BC0", "#26A69A", "#EF5350"
  ];

  const SAMPLE_GALLERY = [
    { id: "g1", title: "شعار سيرفر", tag: "جرافيكس", img: "assets/sample-1.svg" },
    { id: "g2", title: "بانر مجتمع", tag: "جرافيكس", img: "assets/sample-2.svg" },
    { id: "g3", title: "أيقونة مجتمع", tag: "جرافيكس", img: "assets/sample-3.svg" },
    { id: "g4", title: "هوية بصرية", tag: "جرافيكس", img: "assets/sample-4.svg" },
    { id: "g5", title: "غلاف قناة", tag: "جرافيكس", img: "assets/sample-5.svg" },
    { id: "g6", title: "بطاقة ترحيب", tag: "جرافيكس", img: "assets/sample-6.svg" }
  ];

  function uid(prefix) {
    return (prefix || "id") + "_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }

  function nowISO() {
    return new Date().toISOString();
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return null;
  }

  function defaultState() {
    return {
      sessionId: uid("sess"),
      visitorCount: 1,
      activityLog: [{ t: nowISO(), msg: "زيارة جديدة (معاينة)" }],
      prices: {
        base: 50,
        addon: 15,
        rush: 25
      },
      designs: SAMPLE_GALLERY.slice(),
      atelierOrders: [], // سجل الطلبات الكامل (إدارة)
      user: null, // { email, phone, google, name, photo }
      draft: null,
      adminAuthed: false
    };
  }

  let state = loadState() || defaultState();
  if (!state.sessionId) state.sessionId = uid("sess");
  if (!state.visitorCount) state.visitorCount = 1;
  else {
    // bump visitor on fresh load once per tab session
    if (!sessionStorage.getItem("abuaz_visit")) {
      state.visitorCount += 1;
      sessionStorage.setItem("abuaz_visit", "1");
      logActivity("زيارة جديدة (معاينة)");
    }
  }
  if (!state.activityLog) state.activityLog = [];
  if (!state.prices) state.prices = { base: 50, addon: 15, rush: 25 };
  if (!state.designs || !state.designs.length) state.designs = SAMPLE_GALLERY.slice();
  if (!state.atelierOrders) state.atelierOrders = [];

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (_) {}
  }

  function logActivity(msg) {
    state.activityLog = state.activityLog || [];
    state.activityLog.unshift({ t: nowISO(), msg });
    state.activityLog = state.activityLog.slice(0, 40);
    save();
  }

  function toast(msg) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.remove("hidden");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.add("hidden"), 2400);
  }

  function formatMoney(n) {
    const v = Number(n) || 0;
    return v.toLocaleString("ar-SA", { minimumFractionDigits: 0, maximumFractionDigits: 3 }) + " ر.س";
  }

  function calcPrice(draft) {
    const p = state.prices;
    let total = Number(p.base) || 0;
    if (draft && draft.addons) {
      if (draft.addons.includes("إضافات مخصصة")) total += Number(p.addon) || 0;
      if (draft.addons.includes("تسليم سريع")) total += Number(p.rush) || 0;
    }
    return Math.min(1000, Math.max(0.001, total));
  }

  function draftComplete(d) {
    if (!d) return false;
    if (!d.email || !d.phone) return false;
    if (!d.designName) return false;
    if (!d.designType) return false;
    if (!d.colors || !d.colors.length) return false;
    if (!d.idea || !String(d.idea).trim()) return false;
    return true;
  }

  function getRoute() {
    const h = (location.hash || "#/").replace(/^#/, "") || "/";
    const parts = h.split("?").shift().split("/").filter(Boolean);
    return { path: parts[0] || "home", parts };
  }

  function setActiveNav(route) {
    document.querySelectorAll(".bottom-nav .nav-item").forEach((a) => {
      const r = a.getAttribute("data-route");
      a.classList.toggle("active", r === route || (route === "pay" && r === "order") || (route === "home" && r === "home"));
    });
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  // —— Views ——
  function viewHome() {
    const designs = state.designs;
    return `
      <section class="hero-banner">
        <img src="assets/logo-abu-ezz.jpg" alt="أبو عز" />
        <h1 class="page-title">موقع أبو عز</h1>
        <p>تصاميم جرافيكس نظيفة ومنظّمة — اطلب تصميمك بسهولة</p>
      </section>
      <div class="back-row" style="justify-content:space-between">
        <h2 class="page-title" style="font-size:1.1rem;margin:0">المعرض</h2>
        <a href="#/orders" class="link-btn">طلباتي</a>
      </div>
      <div class="gallery-grid">
        ${designs.map((d, i) => `
          <article class="gallery-card" data-open="${escapeHtml(d.id)}">
            <div class="gallery-thumb">
              ${d.img
                ? `<img src="${escapeHtml(d.img)}" alt="${escapeHtml(d.title)}" loading="lazy" />`
                : `<div class="pattern" style="filter:hue-rotate(${d.hue || i * 40}deg)">عز</div>`}
            </div>
            <div class="gallery-meta">
              <strong>${escapeHtml(d.title)}</strong>
              <span>${escapeHtml(d.tag || "جرافيكس")}</span>
            </div>
          </article>
        `).join("")}
      </div>
      <div class="card" style="margin-top:16px;text-align:center">
        <p class="muted" style="margin:0 0 12px">جاهز لطلب تصميم جديد؟</p>
        <a href="#/order" class="btn btn-primary">اطلب تصميم</a>
      </div>
    `;
  }

  function ensureDraft() {
    if (!state.draft) {
      state.draft = {
        step: 1,
        email: (state.user && state.user.email) || "",
        phone: (state.user && state.user.phone) || "",
        google: !!(state.user && state.user.google),
        photo: (state.user && state.user.photo) || null,
        displayName: (state.user && state.user.name) || "",
        serverName: "",
        discord: "",
        designName: "",
        designType: "جرافيكس ديزاين فقط",
        colors: [],
        idea: "",
        addons: [],
        sessionId: state.sessionId
      };
      save();
    }
    return state.draft;
  }

  function viewOrder() {
    const d = ensureDraft();
    const step = Math.min(10, Math.max(1, d.step || 1));
    const dots = Array.from({ length: 10 }, (_, i) =>
      `<div class="step-dot ${i + 1 < step ? "done" : ""} ${i + 1 === step ? "active" : ""}"></div>`
    ).join("");

    const titles = {
      1: "تسجيل الدخول",
      2: "البريد والجوال",
      3: "اسم السيرفر (اختياري)",
      4: "اسم التصميم / السيرفر",
      5: "نوع التصميم",
      6: "الألوان",
      7: "فكرة التصميم",
      8: "إضافات للتصميم",
      9: "إجمالي الحساب",
      10: "الدفع"
    };

    let body = "";
    if (step === 1) {
      body = `
        <div class="notice demo">معاينة: تسجيل الدخول تجريبي عبر الواجهة فقط — بدون خادم حقيقي.</div>
        <div class="form-group">
          <label>البريد الإلكتروني</label>
          <input class="input" type="email" id="f-email" dir="ltr" placeholder="name@email.com" value="${escapeHtml(d.email)}" />
        </div>
        <button type="button" class="btn btn-google" id="btn-google">
          <span class="g-icon"></span> المتابعة مع Google
        </button>
        ${d.google ? `
          <div class="account-chip">
            <div class="avatar">${d.photo ? `<img src="${escapeHtml(d.photo)}" alt="" />` : (d.displayName || "G").slice(0, 1)}</div>
            <div>
              <strong>${escapeHtml(d.displayName || "حساب Google")}</strong>
              <div class="muted">${escapeHtml(d.email || "")}</div>
            </div>
          </div>
        ` : ""}
        <div style="height:12px"></div>
        <button type="button" class="btn btn-primary" id="step-next" ${d.email || d.google ? "" : "disabled"}>التالي</button>
      `;
    } else if (step === 2) {
      body = `
        <div class="form-group">
          <label>البريد الإلكتروني</label>
          <input class="input" type="email" id="f-email" dir="ltr" value="${escapeHtml(d.email)}" />
        </div>
        <div class="form-group">
          <label>رقم الجوال <span class="hint">(سعودي مفضّل)</span></label>
          <input class="input" type="tel" id="f-phone" dir="ltr" placeholder="05xxxxxxxx" value="${escapeHtml(d.phone)}" />
        </div>
        <div class="row-btns">
          <button type="button" class="btn btn-secondary" id="step-prev">رجوع</button>
          <button type="button" class="btn btn-primary" id="step-next">التالي</button>
        </div>
      `;
    } else if (step === 3) {
      body = `
        <div class="form-group">
          <label>اسم السيرفر <span class="hint">(اختياري)</span></label>
          <input class="input" id="f-server" placeholder="مثال: سيرفر أبو عز" value="${escapeHtml(d.serverName || d.discord || "")}" />
        </div>
        <div class="row-btns">
          <button type="button" class="btn btn-secondary" id="step-prev">رجوع</button>
          <button type="button" class="btn btn-primary" id="step-next">التالي</button>
        </div>
      `;
    } else if (step === 4) {
      body = `
        <div class="form-group">
          <label>اسم التصميم / اسم السيرفر</label>
          <input class="input" id="f-design-name" placeholder="مثال: سيرفر أبو عز" value="${escapeHtml(d.designName || "")}" />
        </div>
        <div class="row-btns">
          <button type="button" class="btn btn-secondary" id="step-prev">رجوع</button>
          <button type="button" class="btn btn-primary" id="step-next">التالي</button>
        </div>
      `;
    } else if (step === 5) {
      body = `
        <p class="muted" style="margin-top:0">الخيار المتاح حالياً:</p>
        <div class="type-fixed"><span class="check">✓</span> جرافيكس ديزاين فقط</div>
        <div style="height:14px"></div>
        <div class="row-btns">
          <button type="button" class="btn btn-secondary" id="step-prev">رجوع</button>
          <button type="button" class="btn btn-primary" id="step-next">التالي</button>
        </div>
      `;
    } else if (step === 6) {
      const selected = new Set(d.colors || []);
      body = `
        <p class="muted" style="margin-top:0">اختر حتى 10 ألوان</p>
        <div class="color-grid" id="color-grid">
          ${DEFAULT_PALETTE.map((c) => `
            <button type="button" class="color-swatch ${selected.has(c) ? "selected" : ""}" data-color="${c}" style="background:${c}" aria-label="${c}"></button>
          `).join("")}
        </div>
        <div class="selected-colors" id="selected-colors">
          ${(d.colors || []).map((c) => `<span class="chip-color" style="background:${c}"></span>`).join("")}
        </div>
        <p class="muted">${(d.colors || []).length} / 10</p>
        <div class="row-btns">
          <button type="button" class="btn btn-secondary" id="step-prev">رجوع</button>
          <button type="button" class="btn btn-primary" id="step-next" ${(d.colors || []).length ? "" : "disabled"}>التالي</button>
        </div>
      `;
    } else if (step === 7) {
      body = `
        <div class="form-group">
          <label>فكرة التصميم</label>
          <textarea class="textarea" id="f-idea" placeholder="صف فكرتك بوضوح…">${escapeHtml(d.idea || "")}</textarea>
        </div>
        <div class="row-btns">
          <button type="button" class="btn btn-secondary" id="step-prev">رجوع</button>
          <button type="button" class="btn btn-primary" id="step-next">التالي</button>
        </div>
      `;
    } else if (step === 8) {
      const opts = ["إضافات مخصصة", "تسليم سريع", "مراجعة إضافية"];
      body = `
        <div class="form-group">
          <label>إضافات للتصميم</label>
          ${opts.map((o) => `
            <label style="display:flex;align-items:center;gap:8px;font-weight:500;margin:8px 0">
              <input type="checkbox" class="addon-cb" value="${escapeHtml(o)}" ${(d.addons || []).includes(o) ? "checked" : ""} />
              ${escapeHtml(o)}
            </label>
          `).join("")}
        </div>
        <div class="row-btns">
          <button type="button" class="btn btn-secondary" id="step-prev">رجوع</button>
          <button type="button" class="btn btn-primary" id="step-next">التالي</button>
        </div>
      `;
    } else if (step === 9) {
      const total = calcPrice(d);
      body = `
        <div class="price-box">
          <div class="muted" style="color:#aaa">إجمالي الحساب</div>
          <div class="amount">${formatMoney(total)}</div>
          <div class="currency">يشمل النوع الأساسي${(d.addons || []).length ? " + الإضافات" : ""}</div>
        </div>
        <ul class="muted" style="padding-inline-start:18px;font-size:0.88rem">
          <li>أساسي: ${formatMoney(state.prices.base)}</li>
          ${(d.addons || []).includes("إضافات مخصصة") ? `<li>إضافات مخصصة: ${formatMoney(state.prices.addon)}</li>` : ""}
          ${(d.addons || []).includes("تسليم سريع") ? `<li>تسليم سريع: ${formatMoney(state.prices.rush)}</li>` : ""}
        </ul>
        <div class="row-btns">
          <button type="button" class="btn btn-secondary" id="step-prev">رجوع</button>
          <button type="button" class="btn btn-primary" id="step-next">متابعة للدفع</button>
        </div>
      `;
    } else {
      // step 10 — unlock pay only if complete
      if (!draftComplete(d)) {
        body = `
          <div class="notice">أكمل الحقول المطلوبة أولاً قبل الدفع.</div>
          <button type="button" class="btn btn-secondary" id="step-prev">رجوع</button>
        `;
      } else {
        body = `
          <div class="notice demo">جاهز للدفع — معاينة محلية.</div>
          <div class="price-box" style="margin-bottom:14px">
            <div class="amount">${formatMoney(calcPrice(d))}</div>
          </div>
          <a href="#/pay" class="btn btn-primary">الذهاب للدفع</a>
          <div style="height:10px"></div>
          <button type="button" class="btn btn-secondary" id="step-prev">رجوع</button>
        `;
      }
    }

    return `
      <div class="back-row">
        <button type="button" class="back-btn" id="btn-back-home">← الرئيسية</button>
      </div>
      <h1 class="page-title">الطلب</h1>
      <p class="page-sub step-label">الخطوة ${step} من 10 — ${titles[step]}</p>
      <div class="stepper">${dots}</div>
      <div class="card" id="order-card" data-step="${step}">${body}</div>
    `;
  }

  function viewPay() {
    const d = ensureDraft();
    if (!draftComplete(d)) {
      return `
        <div class="back-row"><button type="button" class="back-btn" onclick="location.hash='#/order'">← الطلب</button></div>
        <div class="card"><p>أكمل بيانات الطلب أولاً.</p><a href="#/order" class="btn btn-primary">العودة للطلب</a></div>
      `;
    }
    const total = calcPrice(d);
    return `
      <div class="back-row"><button type="button" class="back-btn" id="btn-back-order">← الطلب</button></div>
      <h1 class="page-title">الدفع</h1>
      <p class="page-sub">تأكيد بأسلوب مشابه لمتجر التطبيقات</p>
      <div class="card pay-confirm">
        <div class="side-button-metaphor" aria-hidden="true"></div>
        <p class="double-press">اضغط مرتين للدفع<br/><span class="muted">(استعارة زر الجانب — ثم أكّد بالزر أدناه · معاينة بدون خصم حقيقي)</span></p>
        <div class="price-box"><div class="amount">${formatMoney(total)}</div></div>
        <div class="pay-methods" id="pay-methods">
          <label class="pay-method selected"><input type="radio" name="pay" value="apple" checked /> Apple Pay</label>
          <label class="pay-method"><input type="radio" name="pay" value="mada" /> مدى</label>
          <label class="pay-method"><input type="radio" name="pay" value="bank" /> تحويل بنكي</label>
        </div>
        <div id="iban-block">
          <div class="muted" style="text-align:start;font-size:0.85rem">IBAN للتحويل البنكي</div>
          <div class="iban-box">
            <span dir="ltr" id="iban-text">${IBAN}</span>
            <button type="button" class="copy-btn" id="btn-copy-iban">نسخ</button>
          </div>
        </div>
        <div class="notice demo" style="margin-top:14px;text-align:start">معاينة: لا يتم خصم حقيقي. بعد التأكيد يُنشأ الطلب في سجل الأتيليه ويظهر لك فقط تحت «طلباتي».</div>
        <button type="button" class="btn btn-primary" id="btn-confirm-pay" style="margin-top:12px">تأكيد الدفع</button>
      </div>
    `;
  }

  function myOrders() {
    const email = (state.user && state.user.email) || (state.draft && state.draft.email) || "";
    const sid = state.sessionId;
    return (state.atelierOrders || []).filter((o) =>
      o.sessionId === sid || (email && o.email === email)
    );
  }

  function viewOrders() {
    const list = myOrders();
    return `
      <div class="back-row"><button type="button" class="back-btn" id="btn-back-home">← الرئيسية</button></div>
      <h1 class="page-title">قائمة الطلبات</h1>
      <p class="page-sub">طلباتي — جلستك فقط <span class="demo-badge">معاينة</span></p>
      ${list.length === 0 ? `
        <div class="empty-state card">
          <p>لا توجد طلبات بعد.</p>
          <a href="#/order" class="btn btn-primary">اطلب تصميم</a>
        </div>
      ` : list.map((o) => `
        <div class="order-item">
          <div class="top">
            <strong>${escapeHtml(o.designName)}</strong>
            <span class="badge badge-new">${escapeHtml(o.status || "جديد")}</span>
          </div>
          <div class="muted" style="font-size:0.82rem">${escapeHtml(o.designType)} · ${formatMoney(o.total)}</div>
          <div class="muted" style="font-size:0.75rem;margin-top:4px" dir="ltr">${escapeHtml(o.id)} · ${escapeHtml((o.createdAt || "").replace("T", " ").slice(0, 16))}</div>
        </div>
      `).join("")}
    `;
  }

  function viewAdmin() {
    if (!state.adminAuthed) {
      return viewAdminLogin();
    }
    const orders = state.atelierOrders || [];
    return `
      <h1 class="page-title">الإدارة</h1>
      <p class="page-sub">لوحة معاينة محلية</p>
      <div class="admin-grid">
        <button type="button" class="admin-tile" id="admin-manage-design"><span>🎨</span>إدارة تصميم</button>
        <button type="button" class="admin-tile" id="admin-add-design"><span>＋</span>إضافة تصميم</button>
        <button type="button" class="admin-tile" id="admin-orders-focus"><span>📋</span>سجل الطلبات</button>
        <button type="button" class="admin-tile" id="admin-refresh"><span>⟳</span>تحديث</button>
      </div>

      <div class="card" id="admin-designs-panel">
        <h3>إدارة / إضافة تصميم</h3>
        <div class="form-group">
          <label>عنوان تصميم جديد</label>
          <input class="input" id="new-design-title" placeholder="اسم التصميم" />
        </div>
        <button type="button" class="btn btn-primary" id="btn-add-design">إضافة للمعرض</button>
        <div style="margin-top:12px">
          ${(state.designs || []).map((d) => `
            <div class="order-item" style="display:flex;justify-content:space-between;align-items:center">
              <span>${escapeHtml(d.title)}</span>
              <button type="button" class="copy-btn" style="background:#444" data-del-design="${escapeHtml(d.id)}">حذف</button>
            </div>
          `).join("")}
        </div>
      </div>

      <div class="card" id="admin-orders-panel">
        <h3>سجل الطلبات</h3>
        ${orders.length === 0 ? `<p class="muted">لا طلبات بعد.</p>` : orders.map((o) => `
          <div class="order-item">
            <div class="top"><strong>${escapeHtml(o.designName)}</strong><span class="badge badge-pending">${escapeHtml(o.status)}</span></div>
            <div class="muted" style="font-size:0.8rem">${escapeHtml(o.email || "")} · ${escapeHtml(o.phone || "")}</div>
            <div class="muted" style="font-size:0.8rem">${formatMoney(o.total)} · ${escapeHtml(o.payMethod || "")}</div>
          </div>
        `).join("")}

        <h3 style="margin-top:18px">تحكم الأسعار (0.001 – 1000)</h3>
        <div class="price-controls">
          <label>أساسي <input type="number" id="price-base" min="0.001" max="1000" step="0.001" value="${state.prices.base}" /></label>
          <label>إضافات <input type="number" id="price-addon" min="0.001" max="1000" step="0.001" value="${state.prices.addon}" /></label>
          <label>تسليم سريع <input type="number" id="price-rush" min="0.001" max="1000" step="0.001" value="${state.prices.rush}" /></label>
        </div>
        <button type="button" class="btn btn-secondary" id="btn-save-prices">حفظ الأسعار</button>
      </div>

      <div class="security-panel">
        <h3>حالة الأمان <span class="demo-badge">معاينة</span></h3>
        <div class="ok">● ملفات غير مسربة</div>
        <div class="ok">● قاعدة بيانات مؤمّنة <span class="muted">(محاكاة محلية)</span></div>
        <div class="ok">● تسليس للموقع</div>
        <div class="warn">● معاينة: التخزين localStorage — ليس أمان إنتاج</div>
        <div>الزوار (عداد محلي): <strong>${state.visitorCount}</strong> · أحداث: <strong>${(state.activityLog||[]).length}</strong></div>
        <div class="log-list">
          ${(state.activityLog || []).slice(0, 12).map((l) =>
            `<div dir="ltr">${escapeHtml((l.t || "").slice(0, 19))} — ${escapeHtml(l.msg)}</div>`
          ).join("")}
        </div>
        <button type="button" class="btn btn-secondary" id="btn-admin-logout" style="margin-top:12px;background:#334155;color:#fff;border:none">تسجيل خروج الإدارة</button>
      </div>
    `;
  }

  function viewAdminLogin() {
    const phase = state._adminPhase || 1;
    return `
      <h1 class="page-title">دخول الإدارة</h1>
      <p class="page-sub">كلمة مرور ثم الجوال + رمز SMS تجريبي</p>
      <div class="card">
        <div class="notice demo">معاينة: الرمز التجريبي الظاهر أدناه — لا يُرسل SMS حقيقي.</div>
        ${phase === 1 ? `
          <div class="form-group">
            <label>كلمة المرور</label>
            <input class="input" type="password" id="admin-pass" placeholder="••••••••" autocomplete="current-password" />
            ${state._adminHelpShown ? "" : `<p class="notice demo" id="admin-pass-help">للمعاينة: abu-ezz-admin</p>`}
          </div>
          <button type="button" class="btn btn-primary" id="admin-pass-next">التالي</button>
        ` : phase === 2 ? `
          <div class="form-group">
            <label>رقم الجوال</label>
            <input class="input" type="tel" id="admin-phone" dir="ltr" placeholder="502299827" />
          </div>
          <button type="button" class="btn btn-primary" id="admin-phone-next">إرسال رمز (تجريبي)</button>
        ` : `
          <div class="form-group">
            <label>رمز SMS التجريبي</label>
            <p class="muted">استخدم الرمز: <strong dir="ltr">${DEMO_OTP}</strong></p>
            <input class="input" type="text" id="admin-otp" dir="ltr" maxlength="6" placeholder="000000" />
          </div>
          <button type="button" class="btn btn-primary" id="admin-otp-next">دخول</button>
        `}
      </div>
    `;
  }

  function render() {
    const { path } = getRoute();
    const app = document.getElementById("app");
    let routeKey = path === "" || path === "home" ? "home" : path;
    if (routeKey === "admin") setActiveNav("admin");
    else if (routeKey === "orders") setActiveNav("orders");
    else if (routeKey === "order" || routeKey === "pay") setActiveNav("order");
    else setActiveNav("home");

    if (routeKey === "order") app.innerHTML = viewOrder();
    else if (routeKey === "pay") app.innerHTML = viewPay();
    else if (routeKey === "orders") app.innerHTML = viewOrders();
    else if (routeKey === "admin") app.innerHTML = viewAdmin();
    else app.innerHTML = viewHome();

    bindViewEvents(routeKey);
    window.scrollTo(0, 0);
  }

  function clampPrice(v) {
    let n = Number(v);
    if (Number.isNaN(n)) n = 0.001;
    return Math.min(1000, Math.max(0.001, n));
  }

  function bindViewEvents(route) {
    const backHome = document.getElementById("btn-back-home");
    if (backHome) backHome.onclick = () => { location.hash = "#/"; };

    if (route === "home" || route === "" || !route) {
      document.querySelectorAll("[data-open]").forEach((card) => {
        card.onclick = () => {
          const id = card.getAttribute("data-open");
          const d = (state.designs || []).find((x) => x.id === id);
          if (!d) return;
          const app = document.getElementById("app");
          app.innerHTML = `
            <div class="back-row"><button type="button" class="back-btn" id="btn-back-home">← المعرض</button></div>
            <div class="card" style="padding:0;overflow:hidden">
              <div class="gallery-thumb" style="aspect-ratio:16/10;border-radius:0">
                ${d.img ? `<img src="${escapeHtml(d.img)}" alt="${escapeHtml(d.title)}" />` : `<div class="pattern">عز</div>`}
              </div>
              <div style="padding:16px">
                <h2 class="page-title" style="font-size:1.15rem">${escapeHtml(d.title)}</h2>
                <p class="muted">${escapeHtml(d.tag || "جرافيكس ديزاين فقط")}</p>
                <a href="#/order" class="btn btn-primary" style="margin-top:8px">اطلب تصميم مشابه</a>
              </div>
            </div>`;
          document.getElementById("btn-back-home").onclick = () => { location.hash = "#/"; render(); };
        };
      });
    }

    if (route === "order") bindOrderEvents();
    if (route === "pay") bindPayEvents();
    if (route === "admin") bindAdminEvents();
  }

  function bindOrderEvents() {
    const d = ensureDraft();
    const card = document.getElementById("order-card");
    if (!card) return;
    const step = Number(card.getAttribute("data-step"));

    const prev = document.getElementById("step-prev");
    if (prev) prev.onclick = () => { d.step = Math.max(1, step - 1); save(); render(); };

    const google = document.getElementById("btn-google");
    if (google) {
      google.onclick = () => {
        const emailEl = document.getElementById("f-email");
        const email = (emailEl && emailEl.value.trim()) || d.email || "demo.user@gmail.com";
        d.google = true;
        d.email = email;
        d.displayName = email.split("@")[0].replace(/[._]/g, " ") || "مستخدم Google";
        // placeholder avatar (SVG data URI — no external fetch)
        d.photo = "data:image/svg+xml," + encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect fill="#E42C23" width="80" height="80"/><text x="40" y="48" text-anchor="middle" fill="#fff" font-size="28" font-family="sans-serif">${(d.displayName || "G").charAt(0)}</text></svg>`
        );
        state.user = {
          email: d.email,
          phone: d.phone || "",
          google: true,
          name: d.displayName,
          photo: d.photo
        };
        logActivity("تسجيل Google تجريبي: " + d.email);
        save();
        toast("تم ربط حساب Google (معاينة)");
        render();
      };
    }

    if (step === 6) {
      document.querySelectorAll(".color-swatch").forEach((btn) => {
        btn.onclick = () => {
          const c = btn.getAttribute("data-color");
          d.colors = d.colors || [];
          const idx = d.colors.indexOf(c);
          if (idx >= 0) d.colors.splice(idx, 1);
          else if (d.colors.length < 10) d.colors.push(c);
          else toast("الحد الأقصى 10 ألوان");
          save();
          render();
        };
      });
    }

    const next = document.getElementById("step-next");
    if (next) {
      next.onclick = () => {
        if (step === 1) {
          const emailEl = document.getElementById("f-email");
          if (emailEl) d.email = emailEl.value.trim();
          if (!d.email && !d.google) { toast("أدخل البريد أو سجّل عبر Google"); return; }
          if (d.email) {
            state.user = state.user || {};
            state.user.email = d.email;
          }
        }
        if (step === 2) {
          d.email = (document.getElementById("f-email").value || "").trim();
          d.phone = (document.getElementById("f-phone").value || "").trim();
          if (!d.email || !d.phone) { toast("البريد والجوال مطلوبان"); return; }
          state.user = Object.assign({}, state.user || {}, { email: d.email, phone: d.phone, google: d.google, name: d.displayName, photo: d.photo });
        }
        if (step === 3) {
          const el = document.getElementById("f-server") || document.getElementById("f-discord");
          d.serverName = el ? el.value.trim() : "";
          d.discord = d.serverName; // توافق خلفي
        }
        if (step === 4) {
          d.designName = (document.getElementById("f-design-name").value || "").trim();
          if (!d.designName) { toast("أدخل اسم التصميم"); return; }
        }
        if (step === 5) {
          d.designType = "جرافيكس ديزاين فقط";
        }
        if (step === 6) {
          if (!d.colors || !d.colors.length) { toast("اختر لوناً واحداً على الأقل"); return; }
        }
        if (step === 7) {
          d.idea = (document.getElementById("f-idea").value || "").trim();
          if (!d.idea) { toast("اكتب فكرة التصميم"); return; }
        }
        if (step === 8) {
          d.addons = Array.from(document.querySelectorAll(".addon-cb:checked")).map((x) => x.value);
        }
        if (step === 9) {
          // go to step 10 / pay unlock
        }
        d.step = Math.min(10, step + 1);
        save();
        render();
      };
    }
  }

  function bindPayEvents() {
    const back = document.getElementById("btn-back-order");
    if (back) back.onclick = () => { location.hash = "#/order"; };

    function syncIbanVisibility() {
      const method = (document.querySelector('input[name="pay"]:checked') || {}).value;
      const block = document.getElementById("iban-block");
      if (block) block.style.display = method === "bank" ? "block" : "none";
    }
    document.querySelectorAll("#pay-methods .pay-method").forEach((lab) => {
      lab.addEventListener("click", () => {
        document.querySelectorAll("#pay-methods .pay-method").forEach((x) => x.classList.remove("selected"));
        lab.classList.add("selected");
        lab.querySelector("input").checked = true;
        syncIbanVisibility();
      });
    });
    syncIbanVisibility();

    const copy = document.getElementById("btn-copy-iban");
    if (copy) {
      copy.onclick = async () => {
        try {
          await navigator.clipboard.writeText(IBAN);
          toast("تم نسخ الآيبان");
        } catch (_) {
          toast(IBAN);
        }
      };
    }

    const confirm = document.getElementById("btn-confirm-pay");
    if (confirm) {
      confirm.onclick = () => {
        const d = ensureDraft();
        if (!draftComplete(d)) { toast("الطلب غير مكتمل"); return; }
        const method = (document.querySelector('input[name="pay"]:checked') || {}).value || "apple";
        const order = {
          id: uid("ord"),
          sessionId: state.sessionId,
          email: d.email,
          phone: d.phone,
          serverName: d.serverName || d.discord || "",
          discord: d.serverName || d.discord || "",
          designName: d.designName,
          designType: d.designType,
          colors: (d.colors || []).slice(),
          idea: d.idea,
          addons: (d.addons || []).slice(),
          total: calcPrice(d),
          payMethod: method,
          status: "جديد",
          createdAt: nowISO()
        };
        state.atelierOrders.unshift(order);
        state.user = Object.assign({}, state.user || {}, { email: d.email, phone: d.phone });
        logActivity("طلب جديد: " + order.designName + " (" + order.id + ")");
        // reset draft for new order but keep identity
        state.draft = {
          step: 1,
          email: d.email,
          phone: d.phone,
          google: d.google,
          photo: d.photo,
          displayName: d.displayName,
          serverName: "",
          discord: "",
          designName: "",
          designType: "جرافيكس ديزاين فقط",
          colors: [],
          idea: "",
          addons: [],
          sessionId: state.sessionId
        };
        save();
        toast("تم تأكيد الدفع (معاينة) — الطلب في طلباتي");
        location.hash = "#/orders";
      };
    }
  }

  function bindAdminEvents() {
    const passNext = document.getElementById("admin-pass-next");
    if (passNext) {
      passNext.onclick = () => {
        const p = (document.getElementById("admin-pass").value || "").trim();
        if (djb2(p) !== ADMIN_PASS_HASH) { toast("كلمة المرور غير صحيحة"); return; }
        state._adminPhase = 2;
        state._adminHelpShown = true;
        logActivity("محاولة دخول إدارة — خطوة الجوال");
        save();
        render();
      };
    }
    const phoneNext = document.getElementById("admin-phone-next");
    if (phoneNext) {
      phoneNext.onclick = () => {
        const ph = (document.getElementById("admin-phone").value || "").replace(/\D/g, "");
        if (ph !== ADMIN_PHONE && ph !== "0" + ADMIN_PHONE) {
          toast("الجوال يجب أن يكون 502299827");
          return;
        }
        state._adminPhase = 3;
        toast("رمز تجريبي: " + DEMO_OTP);
        save();
        render();
      };
    }
    const otpNext = document.getElementById("admin-otp-next");
    if (otpNext) {
      otpNext.onclick = () => {
        const code = (document.getElementById("admin-otp").value || "").trim();
        if (code !== DEMO_OTP) { toast("رمز غير صحيح — استخدم " + DEMO_OTP); return; }
        state.adminAuthed = true;
        state._adminPhase = 1;
        logActivity("دخول إدارة ناجح (معاينة)");
        save();
        toast("مرحباً بالإدارة");
        render();
      };
    }

    const logout = document.getElementById("btn-admin-logout");
    if (logout) {
      logout.onclick = () => {
        state.adminAuthed = false;
        state._adminPhase = 1;
        save();
        render();
      };
    }

    const add = document.getElementById("btn-add-design");
    if (add) {
      add.onclick = () => {
        const title = (document.getElementById("new-design-title").value || "").trim();
        if (!title) { toast("أدخل عنواناً"); return; }
        const n = (state.designs.length % 6) + 1;
        state.designs.unshift({ id: uid("g"), title, tag: "جرافيكس", img: "assets/sample-" + n + ".svg", hue: Math.floor(Math.random() * 360) });
        logActivity("إضافة تصميم: " + title);
        save();
        toast("تمت الإضافة");
        render();
      };
    }

    document.querySelectorAll("[data-del-design]").forEach((btn) => {
      btn.onclick = () => {
        const id = btn.getAttribute("data-del-design");
        state.designs = state.designs.filter((x) => x.id !== id);
        save();
        render();
      };
    });

    const savePrices = document.getElementById("btn-save-prices");
    if (savePrices) {
      savePrices.onclick = () => {
        state.prices.base = clampPrice(document.getElementById("price-base").value);
        state.prices.addon = clampPrice(document.getElementById("price-addon").value);
        state.prices.rush = clampPrice(document.getElementById("price-rush").value);
        logActivity("تحديث الأسعار");
        save();
        toast("تم حفظ الأسعار");
      };
    }

    const refresh = document.getElementById("admin-refresh");
    if (refresh) {
      refresh.onclick = () => {
        const ov = document.getElementById("maintenance-overlay");
        ov.classList.remove("hidden");
        ov.setAttribute("aria-hidden", "false");
        logActivity("تحديث الموقع — صيانة 5 ثوانٍ");
        save();
        setTimeout(() => {
          ov.classList.add("hidden");
          ov.setAttribute("aria-hidden", "true");
          toast("اكتمل التحديث");
          render();
        }, 5000);
      };
    }

    const focusOrders = document.getElementById("admin-orders-focus");
    if (focusOrders) {
      focusOrders.onclick = () => {
        const el = document.getElementById("admin-orders-panel");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      };
    }
    const manage = document.getElementById("admin-manage-design");
    if (manage) {
      manage.onclick = () => {
        const el = document.getElementById("admin-designs-panel");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      };
    }
    const addTile = document.getElementById("admin-add-design");
    if (addTile) {
      addTile.onclick = () => {
        const el = document.getElementById("new-design-title");
        if (el) { el.focus(); el.scrollIntoView({ behavior: "smooth", block: "center" }); }
      };
    }
  }

  window.addEventListener("hashchange", render);
  if (!location.hash) location.hash = "#/";
  save();
  render();
})();
