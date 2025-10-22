// Simple Expense Tracker PWA (localStorage)
// Data: array of {id, amount (number), type: 'expense'|'income', category, date, description}
const STORAGE_KEY = "expense-tracker-data-v1";

// Mobile app enhancements
let isRefreshing = false;
let startY = 0;
let pullDistance = 0;

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
  "Business",
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
const cancelBtn = $("cancelBtn");
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
// PWA Install
let deferredPrompt;
const pwaInstallPopup = $("pwaInstallPopup");
const pwaInstallBtn = $("pwaInstallBtn");
const pwaLaterBtn = $("pwaLaterBtn");
const pwaCloseBtn = $("pwaCloseBtn");
const pwaInstructions = $("pwaInstructions");
// Import/Export controls (hidden file input kept)
const importFileInput = $("importFile");
// Options menu controls
const optionsBtn = $("optionsBtn");
const optionsMenu = $("optionsMenu");
const themeToggle = $("themeToggle");
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
  const amount = Math.abs(n).toFixed(2);
  // Add comma separation for thousands
  const formattedAmount = amount.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return sign + "₹" + formattedAmount;
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// Mobile app enhancement functions
function hapticFeedback(type = 'light') {
  if ('vibrate' in navigator) {
    switch(type) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(20);
        break;
      case 'heavy':
        navigator.vibrate([30, 10, 30]);
        break;
      case 'success':
        navigator.vibrate([50, 25, 50]);
        break;
      case 'error':
        navigator.vibrate([100, 50, 100, 50, 100]);
        break;
    }
  }
}

function showToast(message, type = 'info') {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  
  // Add to DOM
  document.body.appendChild(toast);
  
  // Animate in
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Remove after delay
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 3000);
}


function addPullToRefresh() {
  const app = document.querySelector('.app');
  if (!app) return;

  let pullIndicator = document.createElement('div');
  pullIndicator.className = 'pull-refresh-indicator';
  pullIndicator.innerHTML = '↓ Pull to refresh';
  app.insertBefore(pullIndicator, app.firstChild);

  app.addEventListener('touchstart', (e) => {
    if (app.scrollTop === 0 && !isRefreshing) {
      startY = e.touches[0].clientY;
    }
  }, { passive: true });

  app.addEventListener('touchmove', (e) => {
    if (app.scrollTop === 0 && !isRefreshing && startY > 0) {
      pullDistance = Math.max(0, e.touches[0].clientY - startY);
      
      if (pullDistance > 0) {
        e.preventDefault();
        const maxPull = 80;
        const normalizedDistance = Math.min(pullDistance, maxPull);
        
        pullIndicator.style.transform = `translateY(${normalizedDistance}px)`;
        pullIndicator.style.opacity = normalizedDistance / maxPull;
        
        if (pullDistance > 60) {
          pullIndicator.innerHTML = '↑ Release to refresh';
          pullIndicator.classList.add('ready');
        } else {
          pullIndicator.innerHTML = '↓ Pull to refresh';
          pullIndicator.classList.remove('ready');
        }
      }
    }
  }, { passive: false });

  app.addEventListener('touchend', () => {
    if (pullDistance > 60 && !isRefreshing) {
      triggerRefresh();
    } else {
      resetPullIndicator();
    }
    startY = 0;
    pullDistance = 0;
  });

  function triggerRefresh() {
    isRefreshing = true;
    pullIndicator.innerHTML = '⟳ Refreshing...';
    pullIndicator.classList.add('refreshing');
    hapticFeedback('medium');
    
    // Simulate refresh (recalculate and re-render)
    setTimeout(() => {
      computeTotals();
      renderList();
      if (!summaryTabEl.classList.contains("hidden")) renderChart();
      
      hapticFeedback('success');
      resetPullIndicator();
      isRefreshing = false;
    }, 1000);
  }

  function resetPullIndicator() {
    pullIndicator.style.transform = 'translateY(-100%)';
    pullIndicator.style.opacity = '0';
    pullIndicator.classList.remove('ready', 'refreshing');
    setTimeout(() => {
      pullIndicator.innerHTML = '↓ Pull to refresh';
    }, 300);
  }
}

// --- Type (expense/income) radio helpers ---
function getSelectedType() {
  const checked = document.querySelector('input[name="type"]:checked');
  return checked ? checked.value : 'expense';
}

function setSelectedType(val) {
  const input = document.querySelector(`input[name="type"][value="${val}"]`);
  if (input) input.checked = true;
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
  const sunIcon = document.getElementById("sunIcon");
  const moonIcon = document.getElementById("moonIcon");
  
  if (!sunIcon || !moonIcon) return;
  
  // The CSS handles the visibility based on data-theme attribute
  // This function can be used for any additional icon logic if needed
  // Icons will automatically show/hide based on the theme via CSS
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
  if (!summaryTabEl.classList.contains("hidden")) renderChart();
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

// Line chart removed

function catSlug(category) {
  return category.toLowerCase().replace(/\s+/g, '');
}

// Get modern SVG icon for category
function getCategoryIcon(category) {
  const slug = catSlug(category || "other");
  const iconSize = "20";
  
  const icons = {
    groceries: `<svg viewBox="0 0 24 24" width="${iconSize}" height="${iconSize}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M7 4V2a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v2"/>
      <path d="M5 4h14l-1 10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 4Z"/>
      <path d="M9 8v4"/>
      <path d="M15 8v4"/>
    </svg>`,
    
    dining: `<svg viewBox="0 0 24 24" width="${iconSize}" height="${iconSize}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
      <path d="M7 2v20"/>
      <path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Z"/>
    </svg>`,
    
    rent: `<svg viewBox="0 0 24 24" width="${iconSize}" height="${iconSize}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9,22 9,12 15,12 15,22"/>
    </svg>`,
    
    utilities: `<svg viewBox="0 0 24 24" width="${iconSize}" height="${iconSize}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>`,
    
    transportation: `<svg viewBox="0 0 24 24" width="${iconSize}" height="${iconSize}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="7" cy="17" r="2"/>
      <circle cx="17" cy="17" r="2"/>
      <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h9l3 6v4h-2"/>
      <path d="M9 17h6"/>
    </svg>`,
    
    shopping: `<svg viewBox="0 0 24 24" width="${iconSize}" height="${iconSize}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="8" cy="21" r="1"/>
      <circle cx="19" cy="21" r="1"/>
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
    </svg>`,
    
    healthcare: `<svg viewBox="0 0 24 24" width="${iconSize}" height="${iconSize}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M9 12h6"/>
      <path d="M12 9v6"/>
      <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"/>
    </svg>`,
    
    entertainment: `<svg viewBox="0 0 24 24" width="${iconSize}" height="${iconSize}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="5,3 19,12 5,21"/>
    </svg>`,
    
    salary: `<svg viewBox="0 0 24 24" width="${iconSize}" height="${iconSize}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>`,
    
    business: `<svg viewBox="0 0 24 24" width="${iconSize}" height="${iconSize}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>`,
    
    other: `<svg viewBox="0 0 24 24" width="${iconSize}" height="${iconSize}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="1"/>
      <circle cx="19" cy="12" r="1"/>
      <circle cx="5" cy="12" r="1"/>
    </svg>`
  };
  
  return icons[slug] || icons.other;
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
    business: "#14b8a6", // teal
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

// Line chart rendering removed

function renderChart() {
  // Always render donut chart; swipe and line chart removed
  renderDonut();
}

// Swipe detection removed

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
    renderChart();
  }
  
  // Check if PWA install modal should be shown after tab switch
  setTimeout(() => checkPWAInstallPrompt(1000), 500);
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
    // Set category icon and data attribute for styling
    box.innerHTML = getCategoryIcon(t.category);
    try {
      const slug = catSlug(t.category || "other");
      box.setAttribute("data-cat", slug);
    } catch (_) {}
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
    const amountValue = Math.abs(Number(t.amount)).toFixed(2);
    const formattedAmount = amountValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    amt.textContent =
      (t.type === "expense" ? "-" : "+") +
      "₹" +
      formattedAmount;
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
        hapticFeedback('medium');
        if (confirm("Delete this transaction?")) {
          hapticFeedback('heavy');
          data = data.filter((x) => x.id !== t.id);
          save();
          populateCategories();
          computeTotals();
          renderList();
          if (!summaryTabEl.classList.contains("hidden")) renderChart();
          showToast('Transaction deleted', 'error');
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
  // Trigger the slide-up animation
  setTimeout(() => {
    modal.classList.add("show");
  }, 10);
  
  // Clear any existing validation errors
  clearValidationErrors();
  
  if (defaults) {
    $("amount").value = defaults.amount;
    // set radio selection for type
    setSelectedType(defaults.type);
    $("category").value = defaults.category;
    $("date").value = toDateInputValue(defaults.date);
    $("description").value = defaults.description || "";
  } else {
    txForm.reset();
    $("date").value = new Date().toISOString().slice(0, 10);
    // default to expense on new entry
    setSelectedType("expense");
  }
  
  // Focus on amount field after modal animation completes
  setTimeout(() => {
    const amountField = $("amount");
    if (amountField) {
      amountField.focus();
      // For mobile devices, also select the text if there's a value
      if (amountField.value) {
        amountField.select();
      }
    }
  }, 300); // Wait for modal animation to complete
}

function closeModalFn() {
  modal.classList.remove("show");
  modal.classList.add("hide");
  // Reset modal transform when closing
  const modalContent = document.querySelector('.modal-content');
  if (modalContent) {
    modalContent.style.transform = '';
    modalContent.style.transition = '';
  }
}

addBtn.addEventListener("click", () => {
  hapticFeedback('light');
  populateCategories();
  editId = null;
  const modalTitle = document.getElementById("modalTitle");
  if (modalTitle) modalTitle.textContent = "Add Transaction";
  const submitBtn = txForm.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.textContent = "Save";
  openModal();
});
closeModal.addEventListener("click", closeModalFn);
if (cancelBtn) cancelBtn.addEventListener("click", closeModalFn);

// Drag to close modal functionality
let modalStartY = 0;
let modalCurrentY = 0;
let modalIsDragging = false;
let modalDragThreshold = 100; // pixels to drag before closing

function initModalDragToClose() {
  const modalContent = document.querySelector('.modal-content');
  const modalHeader = document.querySelector('.modal-content header');
  
  if (!modalContent || !modalHeader) return;
  
  modalHeader.addEventListener('touchstart', (e) => {
    modalStartY = e.touches[0].clientY;
    modalCurrentY = modalStartY;
    modalIsDragging = true;
    modalContent.style.transition = 'none';
  }, { passive: true });
  
  modalHeader.addEventListener('touchmove', (e) => {
    if (!modalIsDragging) return;
    
    modalCurrentY = e.touches[0].clientY;
    const deltaY = modalCurrentY - modalStartY;
    
    // Only allow downward drag
    if (deltaY > 0) {
      modalContent.style.transform = `translateY(${deltaY}px)`;
    }
  }, { passive: true });
  
  modalHeader.addEventListener('touchend', () => {
    if (!modalIsDragging) return;
    
    const deltaY = modalCurrentY - modalStartY;
    modalIsDragging = false;
    
    // Reset transition
    modalContent.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
    
    if (deltaY > modalDragThreshold) {
      // Close modal if dragged far enough
      hapticFeedback('medium');
      closeModalFn();
    } else {
      // Snap back to original position
      modalContent.style.transform = 'translateY(0)';
    }
  }, { passive: true });
  
  // Also handle mouse events for desktop
  modalHeader.addEventListener('mousedown', (e) => {
    modalStartY = e.clientY;
    modalCurrentY = modalStartY;
    modalIsDragging = true;
    modalContent.style.transition = 'none';
    
    const handleMouseMove = (e) => {
      if (!modalIsDragging) return;
      
      modalCurrentY = e.clientY;
      const deltaY = modalCurrentY - modalStartY;
      
      // Only allow downward drag
      if (deltaY > 0) {
        modalContent.style.transform = `translateY(${deltaY}px)`;
      }
    };
    
    const handleMouseUp = () => {
      if (!modalIsDragging) return;
      
      const deltaY = modalCurrentY - modalStartY;
      modalIsDragging = false;
      
      // Reset transition
      modalContent.style.transition = 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      
      if (deltaY > modalDragThreshold) {
        // Close modal if dragged far enough
        hapticFeedback('medium');
        closeModalFn();
      } else {
        // Snap back to original position
        modalContent.style.transform = 'translateY(0)';
      }
      
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  });
}

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
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    hapticFeedback('light');
    const current =
      document.documentElement.getAttribute("data-theme") ||
      (systemPrefersDark() ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
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
  tabHome.addEventListener("click", () => {
    hapticFeedback('light');
    switchTab("home");
  });
  tabSummary.addEventListener("click", () => {
    hapticFeedback('light');
    switchTab("summary");
  });
}

// Validation functions
function validateAmount(amount) {
  const amountError = $("amountError");
  if (!amount || amount <= 0) {
    amountError.textContent = "Amount must be greater than 0";
    amountError.style.display = "block";
    return false;
  }
  if (amount > 9999999.99) {
    amountError.textContent = "Amount cannot exceed ₹99,99,999.99 (7 digits)";
    amountError.style.display = "block";
    return false;
  }
  amountError.style.display = "none";
  return true;
}

function validateDate(dateValue) {
  const dateError = $("dateError");
  if (!dateValue) {
    dateError.textContent = "Date is required";
    dateError.style.display = "block";
    return false;
  }
  
  const selectedDate = new Date(dateValue);
  const today = new Date();
  today.setHours(23, 59, 59, 999); // Set to end of today
  
  if (selectedDate > today) {
    dateError.textContent = "Future dates are not allowed";
    dateError.style.display = "block";
    return false;
  }
  
  dateError.style.display = "none";
  return true;
}

txForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const amount = Number($("amount").value) || 0;
  const type = getSelectedType();
  const category = $("category").value || "Other";
  const date = $("date").value;
  const description = $("description").value;
  
  // Validate form inputs
  const isAmountValid = validateAmount(amount);
  const isDateValid = validateDate(date);
  
  if (!isAmountValid || !isDateValid) {
    hapticFeedback('error');
    return; // Stop form submission if validation fails
  }
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
  if (!summaryTabEl.classList.contains("hidden")) renderChart();
  
  // Enhanced feedback for transaction save
  hapticFeedback('success');
  showToast(editId ? 'Transaction updated' : 'Transaction added', 'success');
  
  editId = null;
  const modalTitle = document.getElementById("modalTitle");
  if (modalTitle) modalTitle.textContent = "Add Transaction";
  const submitBtn = txForm.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.textContent = "Save";
  closeModalFn();
  
  // Show PWA install modal after successful transaction
  setTimeout(() => checkPWAInstallPrompt(2000), 1000);
});

// Real-time validation event listeners
$("amount").addEventListener("input", (e) => {
  const amount = Number(e.target.value);
  if (e.target.value) { // Only validate if there's a value
    validateAmount(amount);
  } else {
    $("amountError").style.display = "none";
  }
});

$("date").addEventListener("change", (e) => {
  if (e.target.value) { // Only validate if there's a value
    validateDate(e.target.value);
  } else {
    $("dateError").style.display = "none";
  }
});

// Clear error messages when modal opens
function clearValidationErrors() {
  $("amountError").style.display = "none";
  $("dateError").style.display = "none";
}

// Handle date filter button changes
function setDateFilter(filter) {
  currentDateFilter = filter;
  
  // Update button states
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
  
  // Show/hide custom date range
  if (filter === "custom") {
    customDateRange.classList.remove("hidden");
    // if empty, initialize to today's date so range is valid
    const today = new Date().toISOString().slice(0, 10);
    if (startDate && !startDate.value) startDate.value = today;
    if (endDate && !endDate.value) endDate.value = today;
  } else {
    customDateRange.classList.add("hidden");
  }
  
  computeTotals();
  renderList();
  if (!summaryTabEl.classList.contains("hidden")) renderChart();
  
  // Show PWA install modal after filter change
  setTimeout(() => checkPWAInstallPrompt(1500), 800);
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
    const today = new Date().toISOString().slice(0, 10);
    if (summaryStartDate && !summaryStartDate.value) summaryStartDate.value = today;
    if (summaryEndDate && !summaryEndDate.value) summaryEndDate.value = today;
  } else {
    summaryCustomDateRange.classList.add("hidden");
  }
  
  // Update chart
  renderChart();
  
  // Show PWA install modal after summary filter change
  setTimeout(() => checkPWAInstallPrompt(1500), 800);
}

// --- Mobile placeholder support for date inputs ---
// On many mobile browsers/PWAs, placeholders on input[type="date"] are hidden until a value is set.
// Workaround: when empty, present as type="text" (placeholder visible). On focus, switch to "date" and open picker.
function enableMobileDatePlaceholder(input) {
  if (!input) return;
  const originalType = "date";
  const ua = navigator.userAgent || "";
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const prefersSmallViewport = typeof window !== "undefined" &&
    (window.matchMedia && window.matchMedia("(max-width: 420px)").matches);
  const isMobile = isIOS || isAndroid || prefersSmallViewport;
  if (!isMobile) return; // do not affect desktop UX

  // Initialize as text if empty so placeholder shows
  if (!input.value) input.type = "text";

  input.addEventListener("focus", () => {
    // Switch to date and try to show native picker
    try {
      input.type = originalType;
      if (typeof input.showPicker === "function") {
        // Give the browser a tick to apply the new type
        setTimeout(() => {
          try { input.showPicker(); } catch (_) {}
        }, 0);
      }
    } catch (_) {
      // no-op
    }
  });

  input.addEventListener("blur", () => {
    // If no value selected, revert to text so placeholder remains visible
    if (!input.value) {
      try { input.type = "text"; } catch (_) {}
    }
  });
}

function setupMobileDatePlaceholders() {
  [startDate, endDate, summaryStartDate, summaryEndDate]
    .filter(Boolean)
    .forEach(enableMobileDatePlaceholder);
}

// Set today's date as default for all date inputs
function setDefaultDatesToday() {
  const today = new Date().toISOString().slice(0, 10);
  const inputs = [
    document.getElementById('date'),
    startDate,
    endDate,
    summaryStartDate,
    summaryEndDate,
  ].filter(Boolean);
  inputs.forEach((el) => {
    if (!el.value) {
      try { el.type = 'date'; } catch (_) {}
      el.value = today;
    }
  });
}

// Add event listeners for summary page date filter buttons
summaryFilterAllTime.addEventListener("click", () => setSummaryDateFilter("all"));
summaryFilterThisMonth.addEventListener("click", () => setSummaryDateFilter("thisMonth"));
summaryFilterPrevMonth.addEventListener("click", () => setSummaryDateFilter("previousMonth"));
summaryFilterCustom.addEventListener("click", () => setSummaryDateFilter("custom"));

// Handle summary custom date range changes
summaryStartDate.addEventListener("change", () => {
  if (summaryDateFilter === "custom") renderChart();
});
summaryEndDate.addEventListener("change", () => {
  if (summaryDateFilter === "custom") renderChart();
});

// Handle custom date range changes
startDate.addEventListener("change", () => {
  computeTotals();
  renderList();
  if (!summaryTabEl.classList.contains("hidden")) renderChart();
});
endDate.addEventListener("change", () => {
  computeTotals();
  renderList();
  if (!summaryTabEl.classList.contains("hidden")) renderChart();
});

filterType.addEventListener("change", () => {
  renderList();
  setTimeout(() => checkPWAInstallPrompt(1000), 500);
});
filterCategory.addEventListener("change", () => {
  renderList();
  setTimeout(() => checkPWAInstallPrompt(1000), 500);
});
searchInput.addEventListener("input", renderList);

// PWA Install functionality
function isStandalone() {
  // Chrome/Edge PWA and iOS Safari added to home screen
  return (
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    (typeof navigator !== 'undefined' && 'standalone' in navigator && navigator.standalone === true)
  );
}

function showPWAInstallPopup() {
  if (pwaInstallPopup) {
    pwaInstallPopup.classList.remove("hide");
    
    // Reset button state and instructions
    if (pwaInstallBtn) {
      pwaInstallBtn.textContent = 'Install App';
      pwaInstallBtn.onclick = null; // Remove any custom onclick handler
    }
    if (pwaInstructions) {
      pwaInstructions.classList.add('hide');
      pwaInstructions.innerHTML = '';
    }
  }
}

function hidePWAInstallPopup() {
  if (pwaInstallPopup) {
    pwaInstallPopup.classList.add("hide");
  }
}

function checkPWAInstallPrompt(delayMs = 2000) {
  // Don't show if already installed
  if (isStandalone()) {
    return;
  }
  
  // Don't show if modal is already visible
  if (pwaInstallPopup && !pwaInstallPopup.classList.contains("hide")) {
    return;
  }
  
  // Show popup with a slight delay for better UX
  const ua = navigator.userAgent || '';
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  if (deferredPrompt || isIOS) {
    setTimeout(showPWAInstallPopup, delayMs);
  }
}

// Show PWA install modal periodically if not installed
function startPWAInstallReminder() {
  // Check every 30 seconds if app is not installed
  setInterval(() => {
    checkPWAInstallPrompt(0);
  }, 30000);
}

// Listen for the beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Save the event so it can be triggered later
  deferredPrompt = e;
  // Check if we should show our custom install popup
  checkPWAInstallPrompt();
});

// Handle install button click
if (pwaInstallBtn) {
  pwaInstallBtn.addEventListener('click', async () => {
    try {
      if (deferredPrompt) {
        // Use the native install prompt if available
        deferredPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          console.log('User accepted the install prompt');
          showToast('App installation started!', 'success');
        } else {
          console.log('User dismissed the install prompt');
          showToast('Installation cancelled', 'info');
        }
        
        // Clear the deferredPrompt and hide popup
        deferredPrompt = null;
        hidePWAInstallPopup();
      } else {
        // Fallback: show inline guidance for browsers without native prompt
        if (pwaInstructions) {
          const ua = navigator.userAgent || '';
          const isIOS = /iPhone|iPad|iPod/i.test(ua);
          const isAndroid = /Android/i.test(ua);
          const isChrome = /Chrome/i.test(ua);
          const isEdge = /Edge/i.test(ua);
          
          let html = '';
          if (isIOS) {
            html = '📱 <strong>iPhone/iPad:</strong><br>1. Tap the Share button (⬆️)<br>2. Choose "Add to Home Screen"<br>3. Tap "Add" to install';
          } else if (isAndroid && isChrome) {
            html = '📱 <strong>Android Chrome:</strong><br>1. Tap the menu (⋮)<br>2. Choose "Install app" or "Add to Home screen"<br>3. Tap "Install"';
          } else if (isChrome || isEdge) {
            html = '💻 <strong>Desktop:</strong><br>1. Look for the install icon (⊕) in the address bar<br>2. Or use browser menu → "Install app"<br>3. Click "Install"';
          } else {
            html = '🌐 <strong>Install Instructions:</strong><br>1. Use your browser\'s menu<br>2. Look for "Install app" or "Add to Home Screen"<br>3. Follow the prompts to install';
          }
          
          pwaInstructions.innerHTML = html;
          pwaInstructions.classList.remove('hide');
          
          // Change button text to indicate instructions are shown
          pwaInstallBtn.textContent = 'Got it!';
          pwaInstallBtn.onclick = () => hidePWAInstallPopup();
        }
      }
    } catch (error) {
      console.error('PWA install error:', error);
      showToast('Installation failed. Try using your browser menu.', 'error');
      hidePWAInstallPopup();
    }
  });
}

// Handle "Maybe Later" button click
if (pwaLaterBtn) {
  pwaLaterBtn.addEventListener('click', () => {
    hidePWAInstallPopup();
  });
}

// Handle close button click
if (pwaCloseBtn) {
  pwaCloseBtn.addEventListener('click', () => {
    hidePWAInstallPopup();
  });
}

// Listen for successful app installation
window.addEventListener('appinstalled', () => {
  console.log('PWA was installed');
  hidePWAInstallPopup();
  deferredPrompt = null;
});

document.addEventListener("DOMContentLoaded", () => {
  // initialize theme
  applyTheme();
  populateCategories();
  // ensure date inputs have today's date by default
  setDefaultDatesToday();
  computeTotals();
  renderList();
  // initial chart render (will no-op if canvas missing)
  renderChart();
  // initialize mobile placeholder workaround for date inputs
  setupMobileDatePlaceholders();
  // initialize mobile app enhancements
  addPullToRefresh();
  // initialize modal drag-to-close functionality
  initModalDragToClose();
  // attempt to show PWA install popup on first load (covers iOS which lacks beforeinstallprompt)
  checkPWAInstallPrompt();
  // start periodic PWA install reminders
  startPWAInstallReminder();
});
