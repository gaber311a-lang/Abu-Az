/* أبو عز — client demo app (localStorage). No real payments. */
(function () {
  "use strict";

  const STORAGE = {
    designs: "abuEzz_designs",
    orders: "abuEzz_orders",
    prices: "abuEzz_prices",
    session: "abuEzz_session",
    analytics: "abuEzz_analytics",
    adminOk: "abuEzz_adminSession",
  };

  const ADMIN_PHONE = "502299827";
  /* Demo password check — documented in README. Not printed to console. */

  const DEFAULT_DESIGNS = [
    { id: "d1", title: "هوية بصرية", desc: "علامة دائرية جريئة على خلفية داكنة", img: "assets/sample-1.svg" },
    { id: "d2", title: "غلاف فني", desc: "خط بياني وإطار أحمر فاخر", img: "assets/sample-2.svg" },
    { id: "d3", title: "علامة بسيطة", desc: "تكوين مربّع أحمر / أبيض", img: "assets/sample-3.svg" },
    { id: "d4", title: "سلسلة بوستر", desc: "مثلث درامي بلمسة العلامة", img: "assets/sample-4.svg" },
    { id: "d5", title: "حزمة علامة", desc: "تراكب دوائر — جرافيكس فقط", img: "assets/sample-5.svg" },
    { id: "d6", title: "نظام تايبو", desc: "شبكة طباعية حديثة", img: "assets/sample-6.svg" },
  ];

  const DEFAULT_PRICES = { base: 150, extra: 25 };
  const COLOR_PALETTE = [
    "#E42C23", "#141414", "#FFFFFF", "#F5E6C8", "#2F5D50",
    "#1B3A6F", "#C9A227", "#6B4C9A", "#E8A0A0", "#4A90A4",
    "#FF6B35", "#2D2D2D", "#E0E0E0", "#8B4513", "#0D7377",
  ];

  const STEP_META = [
    { key: "auth", label: "التسجيل" },
    { key: "contact", label: "البريد والجوال" },
    { key: "server", label: "اسم السيرفر (اختياري)" },
    { key: "names", label: "اسم التصميم / السيرفر" },
    { key: "type", label: "نوع التصميم" },
    { key: "colors", label: "الألوان" },
    { key: "idea", label: "فكرة التصميم" },
    { key: "extras", label: "إضافات" },
    { key: "total", label: "إجمالي الحساب" },
    { key: "payGate", label: "الدفع" },
  ];

  /* ---- utils ---- */
  function uid(prefix) {
    return prefix + "_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }

  function loadJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function saveJSON(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }

  function toast(msg) {
    const el = document.getElementById("toast");
    el.textContent = msg;
    el.classList.remove("hidden");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.add("hidden"), 2600);
  }

  function setText(el, text) {
    if (el) el.textContent = text == null ? "" : String(text);
  }

  function clearChildren(el) {
    while (el && el.firstChild) el.removeChild(el.firstChild);
  }

  /** Simple non-crypto digest for demo password gate (not security-critical). */
  async function demoDigest(str) {
    const enc = new TextEncoder().encode("abu-ezz|" + str);
    if (window.crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest("SHA-256", enc);
      return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    /* fallback */
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return "fallback_" + h.toString(16);
  }

  let DEMO_PASS_DIGEST = null;
  async function initPassDigest() {
    DEMO_PASS_DIGEST = await demoDigest("abu-ezz-admin");
  }

  /* ---- analytics (client mock) ---- */
  function track(event, detail) {
    const a = loadJSON(STORAGE.analytics, { visits: 0, events: [] });
    const entry = {
      t: new Date().toISOString(),
      event: String(event),
      detail: detail ? String(detail).slice(0, 120) : "",
    };
    a.events.unshift(entry);
    a.events = a.events.slice(0, 80);
    saveJSON(STORAGE.analytics, a);
    renderAnalytics();
  }

  function bumpVisit() {
    const a = loadJSON(STORAGE.analytics, { visits: 0, events: [] });
    const flag = sessionStorage.getItem("abuEzz_visited");
    if (!flag) {
      a.visits = (a.visits || 0) + 1;
      sessionStorage.setItem("abuEzz_visited", "1");
      saveJSON(STORAGE.analytics, a);
      track("visit", "دخول الموقع");
    } else {
      renderAnalytics();
    }
  }

  function renderAnalytics() {
    const a = loadJSON(STORAGE.analytics, { visits: 0, events: [] });
    const sv = document.getElementById("statVisits");
    const se = document.getElementById("statEvents");
    if (sv) setText(sv, a.visits || 0);
    if (se) setText(se, (a.events || []).length);
    const log = document.getElementById("eventLog");
    if (!log) return;
    clearChildren(log);
    (a.events || []).slice(0, 40).forEach((e) => {
      const row = document.createElement("div");
      const ts = e.t ? new Date(e.t).toLocaleString("ar-SA") : "";
      row.textContent = ts + " · " + e.event + (e.detail ? " — " + e.detail : "");
      log.appendChild(row);
    });
  }

  /* ---- session / data ---- */
  function getSession() {
    let s = loadJSON(STORAGE.session, null);
    if (!s || !s.id) {
      s = { id: uid("sess"), email: "", phone: "", google: false, name: "" };
      saveJSON(STORAGE.session, s);
    }
    return s;
  }

  function setSession(patch) {
    const s = Object.assign(getSession(), patch);
    saveJSON(STORAGE.session, s);
    updateHeaderChrome();
    return s;
  }

  function getDesigns() {
    let d = loadJSON(STORAGE.designs, null);
    if (!d || !d.length) {
      d = DEFAULT_DESIGNS.slice();
      saveJSON(STORAGE.designs, d);
    }
    return d;
  }

  function getPrices() {
    return Object.assign({}, DEFAULT_PRICES, loadJSON(STORAGE.prices, {}));
  }

  function getOrders() {
    return loadJSON(STORAGE.orders, []);
  }

  function saveOrder(order) {
    const all = getOrders();
    all.unshift(order);
    saveJSON(STORAGE.orders, all);
  }

  /* ---- views ---- */
  let currentView = "gallery";
  let viewStack = [];
  let orderStep = 0;
  let orderDraft = emptyDraft();
  let adminStep = "pass";
  let mockSmsCode = "";
  let selectedPayMethod = null;
  let lastTap = 0;
  let pendingPayOrder = null;

  function emptyDraft() {
    return {
      email: "",
      phone: "",
      google: false,
      serverName: "",
      designName: "",
      designType: "جرافيكس ديزاين فقط",
      colors: [],
      idea: "",
      extras: "",
      extrasCount: 0,
    };
  }

  function showView(name, opts) {
    opts = opts || {};
    document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
    const el = document.getElementById("view-" + name);
    if (el) el.classList.add("active");
    if (!opts.replace && currentView && currentView !== name) {
      viewStack.push(currentView);
    }
    if (opts.resetStack) viewStack = [];
    currentView = name;
    updateHeaderChrome();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    if (currentView === "order" && orderStep > 0) {
      orderStep--;
      renderOrderStep();
      return;
    }
    const prev = viewStack.pop() || "gallery";
    showView(prev, { replace: true });
  }

  function updateHeaderChrome() {
    const back = document.getElementById("btnBack");
    const my = document.getElementById("btnMyOrders");
    const cta = document.getElementById("btnOrder");
    const sess = getSession();
    const logged = !!(sess.email || sess.google);

    const needBack = currentView !== "gallery" && currentView !== "pay";
    back.classList.toggle("hidden", !needBack);

    my.classList.toggle("hidden", !logged || currentView === "admin" || currentView === "admin-login");
    cta.classList.toggle("hidden", currentView === "order" || currentView === "pay" || currentView === "admin" || currentView === "admin-login");
  }

  /* ---- gallery ---- */
  function renderGallery() {
    const grid = document.getElementById("galleryGrid");
    clearChildren(grid);
    getDesigns().forEach((d) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "gallery-item";
      btn.setAttribute("role", "listitem");
      const img = document.createElement("img");
      img.src = d.img;
      img.alt = d.title;
      img.loading = "lazy";
      const cap = document.createElement("div");
      cap.className = "cap";
      cap.textContent = d.title;
      btn.appendChild(img);
      btn.appendChild(cap);
      btn.addEventListener("click", () => openDetail(d.id));
      grid.appendChild(btn);
    });
  }

  function openDetail(id) {
    const d = getDesigns().find((x) => x.id === id);
    if (!d) return;
    const img = document.getElementById("detailImg");
    img.src = d.img;
    img.alt = d.title;
    setText(document.getElementById("detailTitle"), d.title);
    setText(document.getElementById("detailDesc"), d.desc || "");
    document.getElementById("btnOrderFromDetail").onclick = () => startOrder(d.title);
    showView("detail");
    track("view_design", d.title);
  }

  /* ---- order flow ---- */
  function startOrder(prefillName) {
    const sess = getSession();
    orderDraft = emptyDraft();
    orderDraft.email = sess.email || "";
    orderDraft.phone = sess.phone || "";
    orderDraft.google = !!sess.google;
    if (prefillName) orderDraft.designName = prefillName;
    orderStep = sess.email || sess.google ? 1 : 0;
    showView("order", { resetStack: false });
    renderOrderStep();
    track("order_start");
  }

  function calcTotal() {
    const p = getPrices();
    const extras = Math.max(0, Number(orderDraft.extrasCount) || 0);
    return Number(p.base) + extras * Number(p.extra);
  }

  function requiredComplete() {
    return !!(
      (orderDraft.email || orderDraft.google) &&
      orderDraft.phone &&
      orderDraft.designName &&
      orderDraft.designType &&
      orderDraft.colors.length > 0 &&
      orderDraft.idea.trim()
    );
  }

  function renderStepsBar() {
    const bar = document.getElementById("stepsBar");
    clearChildren(bar);
    STEP_META.forEach((_, i) => {
      const s = document.createElement("span");
      if (i <= orderStep) s.classList.add("on");
      bar.appendChild(s);
    });
    setText(document.getElementById("stepLabel"), STEP_META[orderStep].label);
  }

  function renderOrderStep() {
    renderStepsBar();
    const body = document.getElementById("orderSteps");
    clearChildren(body);
    const prev = document.getElementById("btnStepPrev");
    const next = document.getElementById("btnStepNext");
    prev.disabled = orderStep === 0;
    next.textContent = orderStep === STEP_META.length - 1 ? "إلى الدفع" : "التالي";

    const step = STEP_META[orderStep].key;

    if (step === "auth") {
      body.appendChild(fieldBlock("البريد الإلكتروني", "email", orderDraft.email, "email"));
      const g = document.createElement("button");
      g.type = "button";
      g.className = "google-btn";
      const icon = document.createElement("span");
      icon.className = "g";
      g.appendChild(icon);
      g.appendChild(document.createTextNode("المتابعة مع Google (معاينة)"));
      g.addEventListener("click", () => {
        orderDraft.google = true;
        if (!orderDraft.email) orderDraft.email = "demo.user@gmail.com";
        setSession({ email: orderDraft.email, google: true, name: "مستخدم Google" });
        toast("تم تسجيل الدخول عبر Google (محاكاة)");
        track("google_mock");
        renderOrderStep();
      });
      body.appendChild(g);
      if (orderDraft.google) {
        const row = document.createElement("div");
        row.className = "avatar-row";
        const av = document.createElement("div");
        av.className = "avatar-ph";
        av.textContent = "G";
        const info = document.createElement("div");
        const t = document.createElement("div");
        t.style.fontWeight = "600";
        t.textContent = "مستخدم Google";
        const sub = document.createElement("div");
        sub.className = "muted tiny";
        sub.textContent = orderDraft.email || "demo.user@gmail.com";
        info.appendChild(t);
        info.appendChild(sub);
        row.appendChild(av);
        row.appendChild(info);
        body.appendChild(row);
      }
    }

    if (step === "contact") {
      body.appendChild(fieldBlock("البريد الإلكتروني", "email2", orderDraft.email, "email"));
      body.appendChild(fieldBlock("رقم الجوال", "phone", orderDraft.phone, "tel"));
    }

    if (step === "server") {
      body.appendChild(fieldBlock("اسم السيرفر (اختياري)", "server", orderDraft.serverName, "text"));
      const hint = document.createElement("p");
      hint.className = "muted tiny";
      hint.textContent = "كان سابقاً مستخدم Discord — الآن اسم السيرفر.";
      body.appendChild(hint);
    }

    if (step === "names") {
      body.appendChild(fieldBlock("اسم التصميم", "designName", orderDraft.designName, "text"));
      body.appendChild(fieldBlock("اسم السيرفر (إن وجد)", "designServer", orderDraft.serverName, "text"));
    }

    if (step === "type") {
      const wrap = document.createElement("div");
      const lab = document.createElement("label");
      lab.textContent = "نوع التصميم";
      wrap.appendChild(lab);
      const fixed = document.createElement("div");
      fixed.className = "fixed-type";
      fixed.textContent = "✦  جرافيكس ديزاين فقط";
      wrap.appendChild(fixed);
      const note = document.createElement("p");
      note.className = "muted tiny";
      note.style.marginTop = "10px";
      note.textContent = "الخدمة ثابتة — لا خيارات متعددة.";
      wrap.appendChild(note);
      body.appendChild(wrap);
      orderDraft.designType = "جرافيكس ديزاين فقط";
    }

    if (step === "colors") {
      const grid = document.createElement("div");
      grid.className = "colors-grid";
      COLOR_PALETTE.forEach((c) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "color-swatch" + (orderDraft.colors.includes(c) ? " selected" : "");
        b.style.background = c;
        b.setAttribute("aria-label", c);
        b.addEventListener("click", () => {
          const i = orderDraft.colors.indexOf(c);
          if (i >= 0) orderDraft.colors.splice(i, 1);
          else if (orderDraft.colors.length < 10) orderDraft.colors.push(c);
          else toast("الحد الأقصى 10 ألوان");
          renderOrderStep();
        });
        grid.appendChild(b);
      });
      body.appendChild(grid);
      const cnt = document.createElement("p");
      cnt.className = "color-count";
      cnt.textContent = "المحدد: " + orderDraft.colors.length + " / 10";
      body.appendChild(cnt);
    }

    if (step === "idea") {
      const f = document.createElement("div");
      f.className = "field";
      const lab = document.createElement("label");
      lab.setAttribute("for", "ideaTa");
      lab.textContent = "فكرة التصميم";
      const ta = document.createElement("textarea");
      ta.id = "ideaTa";
      ta.rows = 5;
      ta.value = orderDraft.idea;
      ta.addEventListener("input", () => { orderDraft.idea = ta.value; });
      f.appendChild(lab);
      f.appendChild(ta);
      body.appendChild(f);
    }

    if (step === "extras") {
      body.appendChild(fieldBlock("إضافات للتصميم (نص)", "extras", orderDraft.extras, "text"));
      body.appendChild(fieldBlock("عدد الإضافات المدفوعة", "extrasCount", String(orderDraft.extrasCount || 0), "number"));
    }

    if (step === "total") {
      const box = document.createElement("div");
      box.className = "total-box";
      const h = document.createElement("p");
      h.className = "muted";
      h.textContent = "إجمالي الحساب حسب قائمة الأسعار";
      const sum = document.createElement("p");
      sum.className = "sum";
      sum.textContent = formatMoney(calcTotal());
      const br = document.createElement("p");
      br.className = "breakdown";
      const p = getPrices();
      br.textContent =
        "أساسي " + formatMoney(p.base) +
        " + إضافات (" + (orderDraft.extrasCount || 0) + " × " + formatMoney(p.extra) + ")";
      box.appendChild(h);
      box.appendChild(sum);
      box.appendChild(br);
      body.appendChild(box);
    }

    if (step === "payGate") {
      const ok = requiredComplete();
      const msg = document.createElement("p");
      msg.className = "muted";
      msg.style.textAlign = "center";
      msg.textContent = ok
        ? "كل الحقول المطلوبة مكتملة. يمكنك المتابعة للدفع (محاكاة)."
        : "أكمل الحقول المطلوبة أولاً: بريد/Google، جوال، اسم التصميم، ألوان، وفكرة.";
      body.appendChild(msg);
      const total = document.createElement("p");
      total.className = "sum";
      total.style.textAlign = "center";
      total.style.color = "var(--brand)";
      total.style.fontWeight = "700";
      total.style.fontSize = "1.6rem";
      total.textContent = formatMoney(calcTotal());
      body.appendChild(total);
      next.disabled = !ok;
      next.textContent = "فتح الدفع";
    } else {
      next.disabled = false;
    }
  }

  function fieldBlock(label, key, value, type) {
    const f = document.createElement("div");
    f.className = "field";
    const lab = document.createElement("label");
    const id = "f_" + key;
    lab.setAttribute("for", id);
    lab.textContent = label;
    const input = document.createElement("input");
    input.id = id;
    input.type = type || "text";
    if (type === "tel" || type === "email" || type === "number") input.dir = "ltr";
    if (type === "number") {
      input.min = "0";
      input.max = "20";
      input.step = "1";
    }
    input.value = value || "";
    input.addEventListener("input", () => {
      const v = input.value;
      if (key === "email" || key === "email2") orderDraft.email = v.trim();
      if (key === "phone") orderDraft.phone = v.trim();
      if (key === "server" || key === "designServer") orderDraft.serverName = v;
      if (key === "designName") orderDraft.designName = v;
      if (key === "extras") orderDraft.extras = v;
      if (key === "extrasCount") orderDraft.extrasCount = Math.max(0, parseInt(v, 10) || 0);
    });
    f.appendChild(lab);
    f.appendChild(input);
    return f;
  }

  function formatMoney(n) {
    const x = Number(n);
    if (!isFinite(x)) return "0 ر.س";
    return x.toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 3 }) + " ر.س";
  }

  function validateStep() {
    const key = STEP_META[orderStep].key;
    if (key === "auth") {
      if (!orderDraft.email && !orderDraft.google) {
        toast("سجّل بالبريد أو Google");
        return false;
      }
      setSession({ email: orderDraft.email, google: orderDraft.google });
    }
    if (key === "contact") {
      if (!orderDraft.email) { toast("أدخل البريد"); return false; }
      if (!orderDraft.phone || orderDraft.phone.replace(/\D/g, "").length < 9) {
        toast("أدخل رقم جوال صالح");
        return false;
      }
      setSession({ email: orderDraft.email, phone: orderDraft.phone });
    }
    if (key === "names") {
      if (!orderDraft.designName.trim()) { toast("أدخل اسم التصميم"); return false; }
    }
    if (key === "colors") {
      if (!orderDraft.colors.length) { toast("اختر لوناً واحداً على الأقل"); return false; }
    }
    if (key === "idea") {
      if (!orderDraft.idea.trim()) { toast("اكتب فكرة التصميم"); return false; }
    }
    return true;
  }

  function advanceOrder() {
    if (!validateStep()) return;
    if (orderStep >= STEP_META.length - 1) {
      if (!requiredComplete()) {
        toast("أكمل الحقول المطلوبة");
        return;
      }
      openPayment();
      return;
    }
    orderStep++;
    renderOrderStep();
  }

  /* ---- payment (mock) ---- */
  function openPayment() {
    pendingPayOrder = {
      id: uid("ord"),
      sessionId: getSession().id,
      email: orderDraft.email,
      phone: orderDraft.phone,
      serverName: orderDraft.serverName,
      designName: orderDraft.designName,
      designType: orderDraft.designType,
      colors: orderDraft.colors.slice(),
      idea: orderDraft.idea,
      extras: orderDraft.extras,
      extrasCount: orderDraft.extrasCount || 0,
      total: calcTotal(),
      method: null,
      status: "pending_payment",
      createdAt: new Date().toISOString(),
    };
    selectedPayMethod = null;
    setText(document.getElementById("payAmount"), formatMoney(pendingPayOrder.total));
    document.getElementById("bankBox").classList.add("hidden");
    document.querySelectorAll(".pay-method").forEach((b) => b.setAttribute("aria-pressed", "false"));
    document.getElementById("doubleTapZone").classList.remove("ready");
    showView("pay");
    track("pay_open", String(pendingPayOrder.total));
  }

  function completeMockPayment() {
    if (!pendingPayOrder || !selectedPayMethod) {
      toast("اختر طريقة الدفع أولاً");
      return;
    }
    pendingPayOrder.method = selectedPayMethod;
    pendingPayOrder.status = "paid_mock";
    pendingPayOrder.paidAt = new Date().toISOString();
    saveOrder(pendingPayOrder);
    track("pay_success_mock", pendingPayOrder.id);
    toast("تم الدفع بنجاح (محاكاة) — الطلب في طلباتي وسجل الأتولييه");
    pendingPayOrder = null;
    orderDraft = emptyDraft();
    orderStep = 0;
    showView("myorders", { resetStack: true });
    renderMyOrders();
  }

  /* ---- my orders ---- */
  function renderMyOrders() {
    const list = document.getElementById("myOrdersList");
    clearChildren(list);
    const sid = getSession().id;
    const mine = getOrders().filter((o) => o.sessionId === sid);
    if (!mine.length) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = "لا توجد طلبات بعد.";
      list.appendChild(empty);
      return;
    }
    mine.forEach((o) => list.appendChild(orderCard(o)));
  }

  function orderCard(o) {
    const card = document.createElement("article");
    card.className = "order-card";
    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = o.status === "paid_mock" ? "مدفوع (معاينة)" : o.status || "قيد الانتظار";
    const h = document.createElement("h3");
    h.textContent = o.designName || "تصميم";
    const meta = document.createElement("div");
    meta.className = "order-meta";
    const lines = [
      "المبلغ: " + formatMoney(o.total),
      o.method ? "الدفع: " + methodLabel(o.method) : "",
      o.phone ? "الجوال: " + o.phone : "",
      o.createdAt ? "التاريخ: " + new Date(o.createdAt).toLocaleString("ar-SA") : "",
    ].filter(Boolean);
    meta.textContent = lines.join(" · ");
    card.appendChild(badge);
    card.appendChild(h);
    card.appendChild(meta);
    return card;
  }

  function methodLabel(m) {
    if (m === "apple") return "Apple Pay";
    if (m === "mada") return "مدى";
    if (m === "bank") return "تحويل بنكي";
    return m;
  }

  /* ---- admin ---- */
  function isAdmin() {
    return sessionStorage.getItem(STORAGE.adminOk) === "1";
  }

  function openAdminGate() {
    if (isAdmin()) {
      showView("admin");
      renderAdminHome();
      return;
    }
    adminStep = "pass";
    mockSmsCode = "";
    document.getElementById("adminPass").value = "";
    document.getElementById("adminPhone").value = "";
    document.getElementById("adminSms").value = "";
    const help = document.getElementById("adminPassHelp");
    if (help) help.classList.remove("hidden");
    updateAdminLoginUI();
    showView("admin-login");
  }

  function updateAdminLoginUI() {
    document.querySelectorAll("[data-admin-step]").forEach((el) => {
      el.classList.toggle("hidden", el.getAttribute("data-admin-step") !== adminStep);
    });
  }

  async function adminNext() {
    if (adminStep === "pass") {
      const pass = document.getElementById("adminPass").value;
      const dig = await demoDigest(pass);
      if (!DEMO_PASS_DIGEST) await initPassDigest();
      if (dig !== DEMO_PASS_DIGEST) {
        toast("كلمة المرور غير صحيحة");
        track("admin_fail", "password");
        return;
      }
      const help = document.getElementById("adminPassHelp");
      if (help) help.classList.add("hidden");
      adminStep = "phone";
      updateAdminLoginUI();
      return;
    }
    if (adminStep === "phone") {
      const phone = document.getElementById("adminPhone").value.replace(/\D/g, "");
      if (phone !== ADMIN_PHONE) {
        toast("الرقم غير مصرّح");
        track("admin_fail", "phone");
        return;
      }
      mockSmsCode = String(100000 + Math.floor(Math.random() * 900000));
      setText(document.getElementById("smsHint"), "رمز المعاينة: " + mockSmsCode);
      adminStep = "sms";
      updateAdminLoginUI();
      track("admin_sms_mock");
      return;
    }
    if (adminStep === "sms") {
      const code = document.getElementById("adminSms").value.trim();
      if (code !== mockSmsCode) {
        toast("رمز التحقق غير صحيح");
        return;
      }
      sessionStorage.setItem(STORAGE.adminOk, "1");
      track("admin_login");
      showView("admin", { resetStack: true });
      renderAdminHome();
    }
  }

  function renderAdminHome() {
    renderAnalytics();
    const prices = getPrices();
    document.getElementById("priceBase").value = prices.base;
    document.getElementById("priceExtra").value = prices.extra;
    renderAdminDesigns();
    renderAdminOrders();
  }

  function showAdminPanel(name) {
    document.querySelectorAll(".admin-tile").forEach((t) => {
      t.classList.toggle("active-tile", t.getAttribute("data-admin-panel") === name);
    });
    document.querySelectorAll(".admin-panel .panel").forEach((p) => p.classList.add("hidden"));
    const panel = document.getElementById("panel-" + name);
    if (panel) panel.classList.remove("hidden");
  }

  function renderAdminDesigns() {
    const list = document.getElementById("adminDesignsList");
    clearChildren(list);
    getDesigns().forEach((d) => {
      const row = document.createElement("div");
      row.className = "admin-design-row";
      const img = document.createElement("img");
      img.src = d.img;
      img.alt = "";
      const grow = document.createElement("div");
      grow.className = "grow";
      grow.textContent = d.title;
      const del = document.createElement("button");
      del.type = "button";
      del.className = "danger-btn";
      del.textContent = "حذف";
      del.addEventListener("click", () => {
        const next = getDesigns().filter((x) => x.id !== d.id);
        saveJSON(STORAGE.designs, next);
        renderAdminDesigns();
        renderGallery();
        track("design_delete", d.id);
      });
      row.appendChild(img);
      row.appendChild(grow);
      row.appendChild(del);
      list.appendChild(row);
    });
  }

  function renderAdminOrders() {
    const list = document.getElementById("adminOrdersList");
    clearChildren(list);
    const all = getOrders();
    if (!all.length) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = "لا طلبات في السجل.";
      list.appendChild(empty);
      return;
    }
    all.forEach((o) => {
      const card = orderCard(o);
      const extra = document.createElement("div");
      extra.className = "order-meta";
      extra.style.marginTop = "8px";
      extra.textContent =
        "جلسة: " + (o.sessionId || "—") +
        " · بريد: " + (o.email || "—") +
        (o.idea ? " · فكرة: " + o.idea.slice(0, 60) : "");
      card.appendChild(extra);
      list.appendChild(card);
    });
  }

  function siteRefreshLock() {
    const overlay = document.getElementById("maintenanceOverlay");
    overlay.classList.remove("hidden");
    track("maintenance", "5s");
    setTimeout(() => {
      overlay.classList.add("hidden");
      toast("اكتمل التحديث");
    }, 5000);
  }

  /* ---- wire events ---- */
  function bind() {
    document.getElementById("btnOrder").addEventListener("click", () => startOrder());
    document.getElementById("btnBack").addEventListener("click", goBack);
    document.getElementById("brandLink").addEventListener("click", (e) => {
      e.preventDefault();
      showView("gallery", { resetStack: true });
    });
    document.getElementById("btnMyOrders").addEventListener("click", () => {
      showView("myorders");
      renderMyOrders();
      track("my_orders");
    });
    document.getElementById("btnAdminGate").addEventListener("click", openAdminGate);
    document.getElementById("btnStepPrev").addEventListener("click", () => {
      if (orderStep > 0) { orderStep--; renderOrderStep(); }
    });
    document.getElementById("btnStepNext").addEventListener("click", advanceOrder);

    document.querySelectorAll(".pay-method").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedPayMethod = btn.getAttribute("data-method");
        document.querySelectorAll(".pay-method").forEach((b) => {
          b.setAttribute("aria-pressed", b === btn ? "true" : "false");
        });
        document.getElementById("bankBox").classList.toggle("hidden", selectedPayMethod !== "bank");
        document.getElementById("doubleTapZone").classList.add("ready");
      });
    });

    document.getElementById("btnCopyIban").addEventListener("click", async () => {
      const iban = "SA7836036036009631393655";
      try {
        await navigator.clipboard.writeText(iban);
        toast("تم نسخ الآيبان");
      } catch {
        toast(iban);
      }
      track("iban_copy");
    });

    document.getElementById("doubleTapZone").addEventListener("click", () => {
      if (!selectedPayMethod) {
        toast("اختر طريقة الدفع");
        return;
      }
      const now = Date.now();
      if (now - lastTap < 450) {
        lastTap = 0;
        completeMockPayment();
      } else {
        lastTap = now;
        toast("اضغط مرة أخرى للتأكيد");
      }
    });

    document.getElementById("btnCancelPay").addEventListener("click", () => {
      showView("order", { replace: true });
      orderStep = STEP_META.length - 1;
      renderOrderStep();
    });

    document.getElementById("btnAdminNext").addEventListener("click", () => { adminNext(); });

    document.querySelectorAll(".admin-tile").forEach((tile) => {
      tile.addEventListener("click", () => {
        const name = tile.getAttribute("data-admin-panel");
        if (name === "refresh") {
          siteRefreshLock();
          return;
        }
        showAdminPanel(name);
        if (name === "orders") renderAdminOrders();
        if (name === "designs") renderAdminDesigns();
      });
    });

    document.getElementById("btnAddDesign").addEventListener("click", () => {
      const title = document.getElementById("newDesignTitle").value.trim();
      const desc = document.getElementById("newDesignDesc").value.trim();
      const img = document.getElementById("newDesignImg").value.trim() || "assets/sample-1.svg";
      if (!title) { toast("أدخل عنواناً"); return; }
      const designs = getDesigns();
      designs.unshift({ id: uid("d"), title, desc, img });
      saveJSON(STORAGE.designs, designs);
      document.getElementById("newDesignTitle").value = "";
      document.getElementById("newDesignDesc").value = "";
      document.getElementById("newDesignImg").value = "";
      renderAdminDesigns();
      renderGallery();
      toast("تمت الإضافة");
      track("design_add", title);
    });

    document.getElementById("btnSavePrices").addEventListener("click", () => {
      let base = parseFloat(document.getElementById("priceBase").value);
      let extra = parseFloat(document.getElementById("priceExtra").value);
      const clamp = (n) => Math.min(1000, Math.max(0.001, isFinite(n) ? n : 0.001));
      base = clamp(base);
      extra = clamp(extra);
      saveJSON(STORAGE.prices, { base, extra });
      document.getElementById("priceBase").value = base;
      document.getElementById("priceExtra").value = extra;
      toast("تم حفظ الأسعار");
      track("prices_save");
    });

    document.getElementById("btnLogoutAdmin").addEventListener("click", () => {
      sessionStorage.removeItem(STORAGE.adminOk);
      showView("gallery", { resetStack: true });
      track("admin_logout");
    });
  }

  async function boot() {
    await initPassDigest();
    getSession();
    getDesigns();
    bind();
    renderGallery();
    bumpVisit();
    updateHeaderChrome();
    showView("gallery", { resetStack: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
