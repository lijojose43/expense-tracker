// Simple Expense Tracker PWA (localStorage)
// Data: array of {id, amount (number), type: 'expense'|'income', category, date, description}
const STORAGE_KEY = "expense-tracker-data-v1";

const defaultCategories = [
  "Groceries",
  "Dining",
  "Rent",
  "Utilities",
  "Transportation",
  "Shopping",
  "Healthcare",
  "Entertainment",
  "Salary",
  "Other",
];

let data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || [];

const $ = (id) => document.getElementById(id);
const transactionsEl = $("transactions");
const totalIncomeEl = $("totalIncome");
const totalExpensesEl = $("totalExpenses");
const savingsEl = $("savings");
const modal = $("modal");
const addBtn = $("addBtn");
const closeModal = $("closeModal");
const txForm = $("txForm");
const categorySelect = $("category");
const filterCategory = $("filterCategory");
const filterType = $("filterType");
const customDateRange = $("customDateRange");
const startDate = $("startDate");
const endDate = $("endDate");
const searchInput = $("search");
// Date filter buttons
const filterAllTime = $("filterAllTime");
const filterThisMonth = $("filterThisMonth");
const filterPrevMonth = $("filterPrevMonth");
const filterCustom = $("filterCustom");
// Summary page date filter buttons
const summaryFilterAllTime = $("summaryFilterAllTime");
const summaryFilterThisMonth = $("summaryFilterThisMonth");
const summaryFilterPrevMonth = $("summaryFilterPrevMonth");
const summaryFilterCustom = $("summaryFilterCustom");
const summaryCustomDateRange = $("summaryCustomDateRange");
const summaryStartDate = $("summaryStartDate");
const summaryEndDate = $("summaryEndDate");
let currentDateFilter = "all";
let summaryDateFilter = "all";
// Import/Export controls (hidden file input kept)
const importFileInput = $("importFile");
// Options menu controls
const optionsBtn = $("optionsBtn");
const optionsMenu = $("optionsMenu");
const themeOption = $("themeOption");
const exportOption = $("exportOption");
const importOption = $("importOption");
// Tabs and title
const screenTitle = $("screenTitle");
const homeTabEl = $("homeTab");
const summaryTabEl = $("summaryTab");
const tabHome = $("tabHome");
const tabSummary = $("tabSummary");
let donutChart = null;
let editId = null; // track transaction being edited

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function formatMoney(n) {
  const sign = n < 0 ? "-" : "";
  return sign + "₹" + Math.abs(n).toFixed(2);
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---------- Theme handling ----------
const THEME_KEY = "expense-tracker-theme";
function systemPrefersDark() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}
function setThemeMetaColor(theme) {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) return;
  const color = theme === "dark" ? "#0b1220" : "#f1f5f9";
  meta.setAttribute("content", color);
}
function setThemeIcon(theme) {
  const icon = document.getElementById("themeIcon");
  if (!icon) return;
  // Sun (light) vs Moon (dark)
  if (theme === "light") {
    icon.innerHTML = '<circle cx="12" cy="12" r="5"></circle><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path>';
  } else {
    icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 1 0 9.79 9.79z"></path>';
  }
}
function applyTheme(theme) {
  const chosen =
    theme || localStorage.getItem(THEME_KEY) || (systemPrefersDark() ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", chosen);
  setThemeMetaColor(chosen);
  setThemeIcon(chosen);
}

// Date-time helpers
function toLocalInputValue(dt) {
  const d = dt instanceof Date ? dt : new Date(dt);
  if (isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function formatDateTimeDisplay(dt) {
  const d = new Date(dt);
  if (isNaN(d.getTime())) return dt || "";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Date-only helpers
function toDateInputValue(dt) {
  const d = new Date(dt);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  if (typeof dt === "string" && dt.length >= 10) return dt.slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}

function formatDateDisplay(dt) {
  const d = new Date(dt);
  if (!isNaN(d.getTime())) return d.toLocaleDateString();
  if (typeof dt === "string") return dt;
  return "";
}

// Date filtering helper functions
function getThisMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return { start, end };
}

function getPreviousMonthRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return { start, end };
}

function isDateInRange(dateStr, startDate, endDate) {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return false;
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Set time to start/end of day for proper comparison
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  date.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
  
  return date >= start && date <= end;
}

// ---------- Import / Export ----------
function normalizeTx(raw) {
  if (!raw || typeof raw !== "object") return null;
  const t = { ...raw };
  // id
  if (typeof t.id !== "string" || !t.id.trim()) t.id = uid();
  // amount
  const amt = Number(t.amount);
  if (!isFinite(amt)) return null;
  t.amount = Math.abs(amt);
  // type
  t.type = t.type === "income" ? "income" : "expense";
  // category
  if (typeof t.category !== "string" || !t.category.trim()) t.category = "Other";
  // date
  const d = new Date(t.date);
  if (isNaN(d.getTime())) t.date = new Date().toISOString().slice(0, 10);
  // description
  if (typeof t.description !== "string") t.description = "";
  // createdAt
  let ca = t.createdAt;
  let ts = Number(ca);
  if (!isFinite(ts)) {
    const parsed = Date.parse(ca);
    ts = isNaN(parsed) ? Date.now() : parsed;
  }
  t.createdAt = ts;
  return {
    id: t.id,
    amount: t.amount,
    type: t.type,
    category: t.category,
    date: t.date,
    description: t.description,
    createdAt: t.createdAt,
  };
}

function exportData() {
  try {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      items: data,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);
    alert("Export failed");
  }
}

async function importFromFile(file) {
  const text = await file.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    throw new Error("Invalid JSON");
  }
  const items = Array.isArray(json)
    ? json
    : json && Array.isArray(json.items)
    ? json.items
    : null;
  if (!items) throw new Error("Invalid file format: expected an array or {items: []}");
  const cleaned = items.map(normalizeTx).filter(Boolean);
  if (cleaned.length === 0) throw new Error("No valid transactions found");

  const replace = confirm(
    "Replace existing data with imported items?\nOK = Replace, Cancel = Merge"
  );
  if (replace) {
    data = cleaned;
  } else {
    const existing = new Set(data.map((t) => t.id));
    for (const t of cleaned) {
      if (!t.id || existing.has(t.id)) t.id = uid();
      data.push(t);
    }
  }
  save();
  populateCategories();
  computeTotals();
  renderList();
  if (!summaryTabEl.classList.contains("hidden")) renderDonut();
  alert("Import successful");
}

function populateCategories() {
  categorySelect.innerHTML = "";
  filterCategory.innerHTML = '<option value="all">All categories</option>';
  const cats = new Set(
    defaultCategories.concat(data.map((d) => d.category)).filter(Boolean)
  );
  for (const c of cats) {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    categorySelect.appendChild(opt);
    const opt2 = opt.cloneNode(true);
    filterCategory.appendChild(opt2);
  }
}

function computeTotals() {
  let income = 0,
    expense = 0;
  
  // Get current date filter settings
  let dateRange = null;
  if (currentDateFilter === "thisMonth") {
    dateRange = getThisMonthRange();
  } else if (currentDateFilter === "previousMonth") {
    dateRange = getPreviousMonthRange();
  } else if (currentDateFilter === "custom") {
    const start = startDate.value;
    const end = endDate.value;
    if (start && end) {
      dateRange = { start: new Date(start), end: new Date(end) };
    }
  }
  
  for (const t of data) {
    // Apply date filtering to totals as well
    if (dateRange && !isDateInRange(t.date, dateRange.start, dateRange.end)) {
      continue;
    }
    
    if (t.type === "income") income += Number(t.amount);
    else expense += Math.abs(Number(t.amount));
  }
  totalIncomeEl.textContent = formatMoney(income);
  totalExpensesEl.textContent = formatMoney(-Math.abs(expense) || 0);
  const savings = income - expense;
  savingsEl.textContent = formatMoney(savings);
}

// Aggregate expenses by category for the donut chart
function expensesByCategory() {
  const map = new Map();
  
  // Get current date filter settings for summary page
  let dateRange = null;
  if (summaryDateFilter === "thisMonth") {
    dateRange = getThisMonthRange();
  } else if (summaryDateFilter === "previousMonth") {
    dateRange = getPreviousMonthRange();
  } else if (summaryDateFilter === "custom") {
    const start = summaryStartDate.value;
    const end = summaryEndDate.value;
    if (start && end) {
      dateRange = { start: new Date(start), end: new Date(end) };
    }
  }
  
  for (const t of data) {
    if (t.type !== "expense") continue;
    
    // Apply date filtering to chart data as well
    if (dateRange && !isDateInRange(t.date, dateRange.start, dateRange.end)) {
      continue;
    }
    
    const cat = t.category || "Other";
    map.set(cat, (map.get(cat) || 0) + Math.abs(Number(t.amount)));
  }
  const labels = Array.from(map.keys());
  const values = Array.from(map.values());
  return { labels, values };
}

function catSlug(category) {
  return category.toLowerCase().replace(/\s+/g, '');
}

function renderDonut() {
  const canvas = document.getElementById("categoryDonut");
  if (!canvas || typeof Chart === "undefined") return;
  const { labels, values } = expensesByCategory();
  const ctx = canvas.getContext("2d");
  const palette = [
    "#60a5fa",
    "#34d399",
    "#f87171",
    "#fbbf24",
    "#c084fc",
    "#fb7185",
    "#22d3ee",
    "#a3e635",
    "#f97316",
    "#94a3b8",
  ];
  // Category-specific palette to match list badges (light/dark agnostic for chart)
  const categoryColors = {
    groceries: "#22c55e", // green
    dining: "#f97316", // orange
    rent: "#64748b", // slate
    utilities: "#6366f1", // indigo
    transportation: "#ec4899", // pink
    shopping: "#a855f7", // purple
    healthcare: "#10b981", // emerald
    entertainment: "#eab308", // yellow
    salary: "#0ea5e9", // sky
    other: "#9ca3af", // neutral
  };
  const colors = labels.map((label, i) => categoryColors[catSlug(label)] || palette[i % palette.length]);
  if (donutChart) {
    donutChart.destroy();
    donutChart = null;
  }
  donutChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data: values.length ? values : [1],
          backgroundColor: colors.length ? colors : ["#e5e7eb"],
          borderWidth: 0,
        },
      ],
    },
    options: {
      plugins: { legend: { position: "bottom" } },
      cutout: "60%",
      responsive: true,
      maintainAspectRatio: false,
    },
  });
}

function switchTab(name) {
  if (name === "home") {
    homeTabEl.classList.remove("hidden");
    summaryTabEl.classList.add("hidden");
    tabHome.classList.add("active");
    tabSummary.classList.remove("active");
    screenTitle.textContent = "Expense Tracker";
    if (optionsMenu) optionsMenu.classList.remove("open");
  } else {
    homeTabEl.classList.add("hidden");
    summaryTabEl.classList.remove("hidden");
    tabHome.classList.remove("active");
    tabSummary.classList.add("active");
    screenTitle.textContent = "Summary";
    if (optionsMenu) optionsMenu.classList.remove("open");
    // ensure chart reflects latest data
    renderDonut();
  }
}

function renderList() {
  transactionsEl.innerHTML = "";
  const ft = filterType.value;
  const fc = filterCategory.value;
  const q = searchInput.value.trim().toLowerCase();
  
  // Get date range based on filter selection
  let dateRange = null;
  if (currentDateFilter === "thisMonth") {
    dateRange = getThisMonthRange();
  } else if (currentDateFilter === "previousMonth") {
    dateRange = getPreviousMonthRange();
  } else if (currentDateFilter === "custom") {
    const start = startDate.value;
    const end = endDate.value;
    if (start && end) {
      dateRange = { start: new Date(start), end: new Date(end) };
    }
  }
  
  const list = data
    .slice()
    .sort((a, b) => {
      // Primary: by transaction date (day precision) desc
      const da = new Date(a.date);
      const db = new Date(b.date);
      const dayA = isNaN(da.getTime())
        ? 0
        : new Date(da.getFullYear(), da.getMonth(), da.getDate()).getTime();
      const dayB = isNaN(db.getTime())
        ? 0
        : new Date(db.getFullYear(), db.getMonth(), db.getDate()).getTime();
      if (dayB !== dayA) return dayB - dayA;
      // Secondary: by createdAt (time added) desc
      const ca = isFinite(Number(a.createdAt)) ? Number(a.createdAt) : 0;
      const cb = isFinite(Number(b.createdAt)) ? Number(b.createdAt) : 0;
      return cb - ca;
    })
    .filter((t) => {
      if (ft !== "all" && t.type !== ft) return false;
      if (fc !== "all" && t.category !== fc) return false;
      if (
        q &&
        !(t.description || "").toLowerCase().includes(q) &&
        !(t.category || "").toLowerCase().includes(q)
      )
        return false;
      
      // Date filtering
      if (dateRange) {
        if (!isDateInRange(t.date, dateRange.start, dateRange.end)) {
          return false;
        }
      }
      
      return true;
    });
  if (list.length === 0) {
    transactionsEl.innerHTML =
      '<div style="color:var(--muted);padding:12px">No transactions yet</div>';
    return;
  }
  for (const t of list) {
    const el = document.createElement("div");
    el.className = "tx";
    const meta = document.createElement("div");
    meta.className = "meta";
    const box = document.createElement("div");
    box.className = "iconBox";
    box.textContent = t.category ? t.category[0] : "T";
    const info = document.createElement("div");
    const title = document.createElement("div");
    title.className = "title";
    title.textContent = t.description || t.category || "Transaction";
    const cat = document.createElement("div");
    cat.className = "category";
    cat.textContent = t.category + " · " + formatDateDisplay(t.date);
    info.appendChild(title);
    info.appendChild(cat);
    meta.appendChild(box);
    meta.appendChild(info);
    const amt = document.createElement("div");
    amt.className = "amount " + (t.type === "expense" ? "expense" : "income");
    amt.textContent =
      (t.type === "expense" ? "-" : "+") +
      "₹" +
      Math.abs(Number(t.amount)).toFixed(2);
    const actions = document.createElement("div");
    actions.className = "txActions"; // kept for layout spacing; no buttons inside

    el.appendChild(meta);
    el.appendChild(amt);
    el.appendChild(actions);

    // Swipe-to-delete gesture handling
    let startX = 0;
    let dx = 0;
    let swiping = false;
    let moved = false;

    function resetTransform() {
      el.style.transition = "transform 0.2s ease";
      el.style.transform = "translateX(0)";
      setTimeout(() => (el.style.transition = ""), 220);
    }

    el.addEventListener("touchstart", (e) => {
      if (!e.touches || e.touches.length === 0) return;
      startX = e.touches[0].clientX;
      dx = 0;
      swiping = false;
      moved = false;
      el.style.transition = ""; // disable during drag
    }, { passive: true });

    el.addEventListener("touchmove", (e) => {
      if (!e.touches || e.touches.length === 0) return;
      dx = e.touches[0].clientX - startX; // negative when moving left
      if (dx < -10) swiping = true;
      if (Math.abs(dx) > 6) moved = true;
      if (swiping) {
        const limited = Math.max(dx, -120);
        el.style.transform = `translateX(${limited}px)`;
      }
    }, { passive: true });

    el.addEventListener("touchend", () => {
      if (swiping && dx <= -80) {
        if (confirm("Delete this transaction?")) {
          data = data.filter((x) => x.id !== t.id);
          save();
          populateCategories();
          computeTotals();
          renderList();
          if (!summaryTabEl.classList.contains("hidden")) renderDonut();
          return; // element removed; do not animate back
        }
      }
      resetTransform();
    });

    // Open edit on row click (ignore if a swipe occurred)
    el.addEventListener("click", () => {
      if (moved) return; // don't treat swipe as click
      populateCategories();
      editId = t.id;
      const modalTitle = document.getElementById("modalTitle");
      if (modalTitle) modalTitle.textContent = "Edit Transaction";
      const submitBtn = txForm.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.textContent = "Update";
      openModal({
        amount: Math.abs(Number(t.amount)).toFixed(2),
        type: t.type,
        category: t.category,
        date: t.date,
        description: t.description || "",
      });
    });
    el.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      if (confirm("Delete this transaction?")) {
        data = data.filter((x) => x.id !== t.id);
        save();
        populateCategories();
        computeTotals();
        renderList();
      }
    });
    transactionsEl.appendChild(el);
  }
}

function openModal(defaults) {
  modal.classList.remove("hide");
  if (defaults) {
    $("amount").value = defaults.amount;
    $("type").value = defaults.type;
    $("category").value = defaults.category;
    $("date").value = toDateInputValue(defaults.date);
    $("description").value = defaults.description || "";
  } else {
    txForm.reset();
    $("date").value = new Date().toISOString().slice(0, 10);
  }
}

function closeModalFn() {
  modal.classList.add("hide");
}

addBtn.addEventListener("click", () => {
  populateCategories();
  editId = null;
  const modalTitle = document.getElementById("modalTitle");
  if (modalTitle) modalTitle.textContent = "Add Transaction";
  const submitBtn = txForm.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.textContent = "Save";
  openModal();
});
$("backBtn").addEventListener("click", () => {
  alert("Back pressed — integrate with routing if needed.");
});
closeModal.addEventListener("click", closeModalFn);
// Options menu events
function closeMenu() {
  if (optionsMenu) optionsMenu.classList.remove("open");
  if (optionsBtn) optionsBtn.setAttribute("aria-expanded", "false");
}
function toggleMenu() {
  if (!optionsMenu || !optionsBtn) return;
  const open = optionsMenu.classList.toggle("open");
  optionsBtn.setAttribute("aria-expanded", open ? "true" : "false");
}
if (optionsBtn) {
  optionsBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMenu();
  });
}
document.addEventListener("click", (e) => {
  if (!optionsMenu || !optionsBtn) return;
  const menuWrapper = document.getElementById("options");
  if (menuWrapper && !menuWrapper.contains(e.target)) closeMenu();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeMenu();
});
if (themeOption) {
  themeOption.addEventListener("click", () => {
    const current =
      document.documentElement.getAttribute("data-theme") ||
      (systemPrefersDark() ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
    closeMenu();
  });
}
if (exportOption) {
  exportOption.addEventListener("click", () => {
    exportData();
    closeMenu();
  });
}
if (importOption && importFileInput) {
  importOption.addEventListener("click", () => {
    importFileInput.click();
    closeMenu();
  });
  importFileInput.addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      await importFromFile(file);
    } catch (err) {
      console.error(err);
      alert("Import failed: " + err.message);
    } finally {
      e.target.value = ""; // reset so same file can be chosen again
    }
  });
}
// Tab events
if (tabHome && tabSummary) {
  tabHome.addEventListener("click", () => switchTab("home"));
  tabSummary.addEventListener("click", () => switchTab("summary"));
}

txForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const amount = Number($("amount").value) || 0;
  const type = $("type").value;
  const category = $("category").value || "Other";
  const date = $("date").value;
  const description = $("description").value;
  if (editId) {
    const idx = data.findIndex((x) => x.id === editId);
    if (idx !== -1) {
      data[idx] = {
        ...data[idx],
        amount: Math.abs(amount),
        type,
        category,
        date,
        description,
      };
    }
  } else {
    const tx = {
      id: uid(),
      amount: Math.abs(amount),
      type,
      category,
      date,
      description,
      createdAt: Date.now(),
    };
    // if amount negative and type expense, convert accordingly - UI expects positive and type denotes sign
    data.push(tx);
  }
  save();
  populateCategories();
  computeTotals();
  renderList();
  // update chart if on summary tab
  if (!summaryTabEl.classList.contains("hidden")) renderDonut();
  editId = null;
  const modalTitle = document.getElementById("modalTitle");
  if (modalTitle) modalTitle.textContent = "Add Transaction";
  const submitBtn = txForm.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.textContent = "Save";
  closeModalFn();
});

// Handle date filter button changes
function setDateFilter(filter) {
  currentDateFilter = filter;
  
  // Update button states
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
  
  // Show/hide custom date range
  if (filter === "custom") {
    customDateRange.classList.remove("hidden");
  } else {
    customDateRange.classList.add("hidden");
  }
  
  computeTotals();
  renderList();
  if (!summaryTabEl.classList.contains("hidden")) renderDonut();
}

// Add event listeners for date filter buttons
filterAllTime.addEventListener("click", () => setDateFilter("all"));
filterThisMonth.addEventListener("click", () => setDateFilter("thisMonth"));
filterPrevMonth.addEventListener("click", () => setDateFilter("previousMonth"));
filterCustom.addEventListener("click", () => setDateFilter("custom"));

// Handle summary page date filter button changes
function setSummaryDateFilter(filter) {
  summaryDateFilter = filter;
  
  // Update button states for summary page
  document.querySelectorAll('#summaryTab .filter-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`#summaryTab [data-filter="${filter}"]`).classList.add('active');
  
  // Show/hide custom date range for summary
  if (filter === "custom") {
    summaryCustomDateRange.classList.remove("hidden");
  } else {
    summaryCustomDateRange.classList.add("hidden");
  }
  
  // Update chart
  renderDonut();
}

// Add event listeners for summary page date filter buttons
summaryFilterAllTime.addEventListener("click", () => setSummaryDateFilter("all"));
summaryFilterThisMonth.addEventListener("click", () => setSummaryDateFilter("thisMonth"));
summaryFilterPrevMonth.addEventListener("click", () => setSummaryDateFilter("previousMonth"));
summaryFilterCustom.addEventListener("click", () => setSummaryDateFilter("custom"));

// Handle summary custom date range changes
summaryStartDate.addEventListener("change", () => {
  if (summaryDateFilter === "custom") renderDonut();
});
summaryEndDate.addEventListener("change", () => {
  if (summaryDateFilter === "custom") renderDonut();
});

// Handle custom date range changes
startDate.addEventListener("change", () => {
  computeTotals();
  renderList();
  if (!summaryTabEl.classList.contains("hidden")) renderDonut();
});
endDate.addEventListener("change", () => {
  computeTotals();
  renderList();
  if (!summaryTabEl.classList.contains("hidden")) renderDonut();
});

filterType.addEventListener("change", renderList);
filterCategory.addEventListener("change", renderList);
searchInput.addEventListener("input", renderList);

document.addEventListener("DOMContentLoaded", () => {
  // initialize theme
  applyTheme();
  populateCategories();
  computeTotals();
  renderList();
  // initial chart render (will no-op if canvas missing)
  renderDonut();
});
