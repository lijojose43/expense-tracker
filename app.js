// Simple Expense Tracker PWA (localStorage)
// Data: array of {id, amount (number), type: 'expense'|'income', category, date, description}

// Version control for cache busting
const APP_VERSION = "10.0";

// Force reload if version mismatch
if (localStorage.getItem("app-version") !== APP_VERSION) {
  localStorage.clear(); // Clear all cached data
  localStorage.setItem("app-version", APP_VERSION);
  console.log("App version updated, cache cleared");
}

// Add meta tags for cache control
document.addEventListener("DOMContentLoaded", () => {
  const meta = document.createElement("meta");
  meta.httpEquiv = "Cache-Control";
  meta.content = "no-cache, no-store, must-revalidate";
  document.head.appendChild(meta);

  const meta2 = document.createElement("meta");
  meta2.httpEquiv = "Pragma";
  meta2.content = "no-cache";
  document.head.appendChild(meta2);

  const meta3 = document.createElement("meta");
  meta3.httpEquiv = "Expires";
  meta3.content = "0";
  document.head.appendChild(meta3);
});

// ---------- Import / Export ----------
function showExportOptions() {
  const formats = [
    {
      name: "JSON (Standard)",
      format: "json",
      extension: "json",
      mimeType: "application/json",
    },
    {
      name: "JSON (WhatsApp)",
      format: "json",
      extension: "json",
      mimeType: "application/json;charset=utf-8",
    },
    {
      name: "CSV (Excel)",
      format: "csv",
      extension: "csv",
      mimeType: "text/csv;charset=utf-8",
    },
  ];

  const formatOptions = formats
    .map((fmt, index) => `<option value="${index}">${fmt.name}</option>`)
    .join("");

  const modal = document.createElement("div");
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0,0,0,0.8); z-index: 1000; display: flex;
    align-items: center; justify-content: center;
  `;

  modal.innerHTML = `
    <div style="background: white; padding: 20px; border-radius: 12px; max-width: 400px; width: 90%;">
      <h3 style="margin: 0 0 15px 0; color: #333;">Export Data</h3>
      <p style="margin: 0 0 15px 0; color: #666;">Choose export format:</p>
      <select id="exportFormatSelect" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
        ${formatOptions}
      </select>
      <div style="display: flex; gap: 10px; margin-top: 20px;">
        <button id="exportConfirmBtn" style="flex: 1; padding: 10px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">Export</button>
        <button id="exportCancelBtn" style="flex: 1; padding: 10px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Handle export confirmation
  document.getElementById("exportConfirmBtn").onclick = () => {
    const selectedIndex = document.getElementById("exportFormatSelect").value;
    const selectedFormat = formats[selectedIndex];
    performExport(selectedFormat);
    document.body.removeChild(modal);
  };

  document.getElementById("exportCancelBtn").onclick = () => {
    document.body.removeChild(modal);
  };

  // Close modal on background click
  modal.onclick = (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  };
}

function performExport(format) {
  try {
    let content, filename, mimeType;

    if (format.format === "csv") {
      content = convertToCSV(data);
      filename = `expense-tracker-${new Date().toISOString().slice(0, 10)}.csv`;
      mimeType = "text/csv;charset=utf-8";
    } else {
      // JSON export
      const payload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        items: data,
        metadata: {
          appName: "Expense Tracker PWA",
          description:
            "Personal expense tracking data with categories, dates, and amounts",
          fileType: format.mimeType,
          encoding: "UTF-8",
          createdWith: "Expense Tracker PWA v1.0",
        },
      };
      content = JSON.stringify(payload, null, 2);
      filename = `expense-tracker-data-${new Date().toISOString().slice(0, 10)}-${new Date().toTimeString().slice(0, 5).replace(/:/g, "-")}.json`;
      mimeType = format.mimeType;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.setAttribute("type", mimeType);
    a.setAttribute("charset", "utf-8");

    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    console.log(`Export completed: ${filename}`);
    alert(`Exported ${data.length} items to ${filename}`);
  } catch (err) {
    console.error(err);
    alert("Export failed");
  }
}

function convertToCSV(data) {
  if (!data || data.length === 0) return "";

  const headers = ["Date", "Description", "Category", "Amount", "Type"];
  const csvContent = [
    headers.join(","),
    ...data.map((item) =>
      [
        `"${item.date}"`,
        `"${item.description || ""}"`,
        `"${item.category || ""}"`,
        `"${item.amount}"`,
        `"${item.type || "expense"}"`,
      ].join(","),
    ),
  ].join("\n");

  return csvContent;
}

// ---------- Purchase Feature ----------
function getPurchaseIconSVG(size = 20) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M6 6h15l-1.5 9h-12z"/>
    <circle cx="9" cy="20" r="1"/>
    <circle cx="18" cy="20" r="1"/>
    <path d="M6 6L5 3H2"/>
  </svg>`;
}

function openPurchaseModal(defaults) {
  if (!purchaseModal) return;
  purchaseModal.classList.remove("hide");
  setTimeout(() => purchaseModal.classList.add("show"), 10);
  editPurchaseId = null;
  const title = document.getElementById("purchaseModalTitle");
  const submitBtn =
    purchaseForm && purchaseForm.querySelector('button[type="submit"]');
  if (defaults) {
    if (title) title.textContent = "Edit Purchase";
    if (submitBtn) submitBtn.textContent = "Update";
    purchaseNameInput && (purchaseNameInput.value = defaults.name || "");
    editPurchaseId = defaults.id;
  } else {
    if (title) title.textContent = "Add Purchase";
    if (submitBtn) submitBtn.textContent = "Save";
    if (purchaseForm) purchaseForm.reset();
  }
}

function closePurchaseModalFn() {
  if (!purchaseModal) return;
  purchaseModal.classList.remove("show");
  purchaseModal.classList.add("hide");
}

function submitPurchaseForm() {
  const name = ((purchaseNameInput && purchaseNameInput.value) || "").trim();
  if (!name) {
    hapticFeedback("error");
    return;
  }
  if (editPurchaseId) {
    const idx = purchaseData.findIndex((x) => x.id === editPurchaseId);
    if (idx !== -1) {
      purchaseData[idx] = { ...purchaseData[idx], name };
    }
  } else {
    purchaseData.push({ id: uid(), name, createdAt: Date.now() });
  }
  savePurchase();
  renderPurchase();
  hapticFeedback("success");
  editPurchaseId = null;
  const title = document.getElementById("purchaseModalTitle");
  if (title) title.textContent = "Add Purchase";
  const submitBtn =
    purchaseForm && purchaseForm.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.textContent = "Save";
  closePurchaseModalFn();
}

function renderPurchase() {
  if (!purchaseListEl) return;
  if (!purchaseData.length) {
    purchaseListEl.innerHTML =
      '<div style="color:var(--muted);padding:12px">No purchases added</div>';
    return;
  }
  const items = purchaseData
    .slice()
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  purchaseListEl.innerHTML = "";
  for (const item of items) {
    const row = document.createElement("div");
    row.className = "tx";
    const meta = document.createElement("div");
    meta.className = "meta";
    const box = document.createElement("div");
    box.className = "iconBox";
    box.innerHTML = getPurchaseIconSVG(20);
    const info = document.createElement("div");
    const title = document.createElement("div");
    title.className = "title";
    title.textContent = item.name || "Product";
    info.appendChild(title);
    meta.appendChild(box);
    meta.appendChild(info);

    row.appendChild(meta);

    // Swipe-to-delete functionality (similar to transaction list)
    let startX = 0;
    let startY = 0;
    let dx = 0;
    let dy = 0;
    let swiping = false;
    let moved = false;

    function resetTransform() {
      row.style.transition = "transform 0.2s ease";
      row.style.transform = "translateX(0)";
      setTimeout(() => (row.style.transition = ""), 220);
    }

    row.addEventListener(
      "touchstart",
      (e) => {
        if (!e.touches || e.touches.length === 0) return;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        dx = 0;
        dy = 0;
        swiping = false;
        moved = false;
        row.style.transition = ""; // disable during drag
      },
      { passive: true },
    );

    row.addEventListener(
      "touchmove",
      (e) => {
        if (!e.touches || e.touches.length === 0) return;
        dx = e.touches[0].clientX - startX;
        dy = e.touches[0].clientY - startY;

        // Only consider it a swipe if horizontal movement is dominant
        if (Math.abs(dx) > Math.abs(dy) && dx < -10) {
          swiping = true;
        }
        if (Math.abs(dx) > 6 || Math.abs(dy) > 6) moved = true;

        if (swiping) {
          e.preventDefault(); // Prevent scrolling when swiping
          const limited = Math.max(dx, -120);
          row.style.transform = `translateX(${limited}px)`;
        }
        // If not swiping (vertical scroll), allow default behavior
      },
      { passive: false },
    );

    row.addEventListener("touchend", () => {
      if (swiping && dx <= -80) {
        hapticFeedback("medium");
        if (confirm("Delete this item?")) {
          hapticFeedback("heavy");
          purchaseData = purchaseData.filter((x) => x.id !== item.id);
          savePurchase();
          renderPurchase();
          return; // element removed; do not animate back
        }
      }
      resetTransform();
    });

    // Click to edit (ignore if a swipe occurred)
    row.addEventListener("click", () => {
      if (moved) return; // don't treat swipe as click
      openPurchaseModal({ id: item.id, name: item.name });
    });

    // Context menu fallback for desktop
    row.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      if (confirm("Delete this item?")) {
        purchaseData = purchaseData.filter((x) => x.id !== item.id);
        savePurchase();
        renderPurchase();
      }
    });

    purchaseListEl.appendChild(row);
  }
}
const STORAGE_KEY = "expense-tracker-data-v1";
const EXPIRY_STORAGE_KEY = "expense-tracker-expiry-v1";
const PURCHASE_STORAGE_KEY = "expense-tracker-purchase-v1";

// Mobile app enhancements
let isRefreshing = false;
let startY = 0;
let pullDistance = 0;

const defaultCategories = [
  "Groceries",
  "Dining",
  "Rent",
  "Transportation",
  "Shopping",
  "Healthcare",
  "Entertainment",
  "Salary",
  "Business",
  "Chit Fund",
  "LIC",
  "Term Insurance",
  "Gold Investment",
  "Land Investment",
  "Property Investment",
  "Mutual Fund",
  "Other",
];

// ... (rest of the code remains the same)
let data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null") || [];
let expiryData =
  JSON.parse(localStorage.getItem(EXPIRY_STORAGE_KEY) || "null") || [];
let purchaseData =
  JSON.parse(localStorage.getItem(PURCHASE_STORAGE_KEY) || "null") || [];

const $ = (id) => document.getElementById(id);
const transactionsEl = $("transactions");
const totalIncomeEl = $("totalIncome");
const totalExpensesEl = $("totalExpenses");
const savingsEl = $("savings");
const investmentsEl = $("investments");
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
// Search input removed
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
const clearOption = $("clearOption");
// Tabs and title
const screenTitle = $("screenTitle");
const homeTabEl = $("homeTab");
const summaryTabEl = $("summaryTab");
const tabHome = $("tabHome");
const tabSummary = $("tabSummary");
const tabExpiry = $("tabExpiry");
const tabPurchase = $("tabPurchase");
const expiryTabEl = $("expiryTab");
const purchaseTabEl = $("purchaseTab");
const expiryTodayEl = $("expiryToday");
const expiryWeekEl = $("expiryWeek");
const expiryMonthEl = $("expiryMonth");
const expiryYearEl = $("expiryYear");
const expiryListEl = $("expiryList");
const addExpiryBtn = $("addExpiryBtn");
const expiryModal = $("expiryModal");
const closeExpiryModal = $("closeExpiryModal");
const expiryForm = $("expiryForm");
const cancelExpiryBtn = $("cancelExpiryBtn");
const expiryNameInput = $("expiryName");
const expiryDateInput = $("expiryDate");
let editExpiryId = null;
// Purchase modal elements
const purchaseListEl = $("purchaseList");
const purchaseModal = $("purchaseModal");
const closePurchaseModal = $("closePurchaseModal");
const purchaseForm = $("purchaseForm");
const cancelPurchaseBtn = $("cancelPurchaseBtn");
const purchaseNameInput = $("purchaseName");
const addPurchaseBtn = $("addPurchaseBtn");
let editPurchaseId = null;
let donutChart = null;
let editId = null; // track transaction being edited

const DATE_INPUT_IDS = [
  "date",
  "startDate",
  "endDate",
  "summaryStartDate",
  "summaryEndDate",
  "expiryDate",
];

const DATE_INPUTS_WITH_MAX_TODAY = new Set([
  "date",
  "startDate",
  "endDate",
  "summaryStartDate",
  "summaryEndDate",
]);

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function resolveDateInput(inputOrId) {
  if (!inputOrId) return null;
  if (typeof inputOrId === "string") return $(inputOrId);
  return inputOrId;
}

function setDateInputValue(inputOrId, value, triggerChange = false) {
  const input = resolveDateInput(inputOrId);
  if (!input) return;
  const picker = input._flatpickr;
  if (!value) {
    if (picker) picker.clear(triggerChange);
    else {
      input.value = "";
      if (triggerChange) {
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
    return;
  }
  if (picker) {
    picker.setDate(value, triggerChange, "Y-m-d");
    return;
  }
  input.value = value;
  if (triggerChange) {
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

function setDateInputMax(inputOrId, maxDate) {
  const input = resolveDateInput(inputOrId);
  if (!input) return;
  input.max = maxDate;
  if (input._flatpickr) {
    input._flatpickr.set("maxDate", maxDate);
    syncFlatpickrYearDropdown(input._flatpickr);
  }
}

function yearFromDateLike(value, fallbackYear) {
  if (!value) return fallbackYear;
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return fallbackYear;
  return d.getFullYear();
}

function getFlatpickrYearBounds(fp) {
  const currentYear = new Date().getFullYear();
  const minYear = yearFromDateLike(
    fp && fp.config && fp.config.minDate,
    currentYear - 50,
  );
  const maxYear = yearFromDateLike(
    fp && fp.config && fp.config.maxDate,
    currentYear + 50,
  );
  return {
    minYear: Math.min(minYear, maxYear),
    maxYear: Math.max(minYear, maxYear),
  };
}

function syncFlatpickrYearDropdown(fp) {
  if (!fp || !fp.calendarContainer) return;
  const currentMonth = fp.calendarContainer.querySelector(
    ".flatpickr-current-month",
  );
  if (!currentMonth) return;

  const yearSelect = currentMonth.querySelector(
    ".flatpickr-yearDropdown-years",
  );
  if (!yearSelect) return;

  const { minYear, maxYear } = getFlatpickrYearBounds(fp);
  const shouldRebuild =
    !yearSelect.options.length ||
    Number(yearSelect.options[0].value) !== minYear ||
    Number(yearSelect.options[yearSelect.options.length - 1].value) !== maxYear;

  if (shouldRebuild) {
    yearSelect.innerHTML = "";
    for (let year = minYear; year <= maxYear; year++) {
      const option = document.createElement("option");
      option.value = String(year);
      option.textContent = String(year);
      yearSelect.appendChild(option);
    }
  }

  const targetYear = String(fp.currentYear);
  if (!yearSelect.querySelector(`option[value="${targetYear}"]`)) {
    const option = document.createElement("option");
    option.value = targetYear;
    option.textContent = targetYear;
    yearSelect.appendChild(option);
  }
  yearSelect.value = targetYear;
}

function ensureFlatpickrYearDropdown(fp) {
  if (!fp || !fp.calendarContainer) return;
  const currentMonth = fp.calendarContainer.querySelector(
    ".flatpickr-current-month",
  );
  if (!currentMonth) return;

  let yearSelect = currentMonth.querySelector(".flatpickr-yearDropdown-years");
  if (!yearSelect) {
    yearSelect = document.createElement("select");
    yearSelect.className = "flatpickr-yearDropdown-years";
    yearSelect.setAttribute("aria-label", "Select year");
    yearSelect.addEventListener("change", (e) => {
      const year = Number(e.target.value);
      if (!isFinite(year)) return;
      fp.changeYear(year);
    });
    currentMonth.appendChild(yearSelect);
  }
  syncFlatpickrYearDropdown(fp);
}

function initDatePickers() {
  if (typeof window === "undefined" || typeof window.flatpickr !== "function") {
    return;
  }
  const today = todayIsoDate();
  DATE_INPUT_IDS.forEach((id) => {
    const input = $(id);
    if (!input) return;
    if (input._flatpickr) {
      input._flatpickr.destroy();
    }
    const options = {
      dateFormat: "Y-m-d",
      allowInput: false,
      disableMobile: true,
      monthSelectorType: "dropdown",
      onReady: (_, __, fp) => {
        ensureFlatpickrYearDropdown(fp);
      },
      onOpen: (_, __, fp) => {
        syncFlatpickrYearDropdown(fp);
      },
      onMonthChange: (_, __, fp) => {
        syncFlatpickrYearDropdown(fp);
      },
      onYearChange: (_, __, fp) => {
        syncFlatpickrYearDropdown(fp);
      },
    };
    if (DATE_INPUTS_WITH_MAX_TODAY.has(id)) {
      options.maxDate = today;
    }
    window.flatpickr(input, options);
  });
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function saveExpiry() {
  localStorage.setItem(EXPIRY_STORAGE_KEY, JSON.stringify(expiryData));
}

function savePurchase() {
  localStorage.setItem(PURCHASE_STORAGE_KEY, JSON.stringify(purchaseData));
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
function hapticFeedback(type = "light") {
  if ("vibrate" in navigator) {
    switch (type) {
      case "light":
        navigator.vibrate(10);
        break;
      case "medium":
        navigator.vibrate(20);
        break;
      case "heavy":
        navigator.vibrate([30, 10, 30]);
        break;
      case "success":
        navigator.vibrate([50, 25, 50]);
        break;
      case "error":
        navigator.vibrate([100, 50, 100, 50, 100]);
        break;
    }
  }
}

function addPullToRefresh() {
  const app = document.querySelector(".app");
  if (!app) return;

  let pullIndicator = document.createElement("div");
  pullIndicator.className = "pull-refresh-indicator";
  pullIndicator.innerHTML = "↓ Pull to refresh";
  app.insertBefore(pullIndicator, app.firstChild);

  app.addEventListener(
    "touchstart",
    (e) => {
      if (app.scrollTop === 0 && !isRefreshing) {
        startY = e.touches[0].clientY;
      }
    },
    { passive: true },
  );

  app.addEventListener(
    "touchmove",
    (e) => {
      if (app.scrollTop === 0 && !isRefreshing && startY > 0) {
        pullDistance = Math.max(0, e.touches[0].clientY - startY);

        if (pullDistance > 0) {
          e.preventDefault();
          const maxPull = 80;
          const normalizedDistance = Math.min(pullDistance, maxPull);

          pullIndicator.style.transform = `translateY(${normalizedDistance}px)`;
          pullIndicator.style.opacity = normalizedDistance / maxPull;

          if (pullDistance > 60) {
            pullIndicator.innerHTML = "↑ Release to refresh";
            pullIndicator.classList.add("ready");
          } else {
            pullIndicator.innerHTML = "↓ Pull to refresh";
            pullIndicator.classList.remove("ready");
          }
        }
      }
    },
    { passive: false },
  );

  app.addEventListener("touchend", () => {
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
    pullIndicator.innerHTML = "⟳ Refreshing...";
    pullIndicator.classList.add("refreshing");
    hapticFeedback("medium");

    // Simulate refresh (recalculate and re-render)
    setTimeout(() => {
      computeTotals();
      renderList();
      if (!summaryTabEl.classList.contains("hidden")) renderChart();

      hapticFeedback("success");
      resetPullIndicator();
      isRefreshing = false;
    }, 1000);
  }

  function resetPullIndicator() {
    pullIndicator.style.transform = "translateY(-100%)";
    pullIndicator.style.opacity = "0";
    pullIndicator.classList.remove("ready", "refreshing");
    setTimeout(() => {
      pullIndicator.innerHTML = "↓ Pull to refresh";
    }, 300);
  }
}

// --- Type (expense/income) radio helpers ---
function getSelectedType() {
  const checked = document.querySelector('input[name="type"]:checked');
  return checked ? checked.value : "expense";
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
  const color = theme === "dark" ? "#000000" : "#f1f5f9";
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
    theme ||
    localStorage.getItem(THEME_KEY) ||
    (systemPrefersDark() ? "dark" : "light");
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
function clearData() {
  if (
    confirm(
      "Are you sure you want to clear all data? This action cannot be undone.\n\nAll transactions, categories, and settings will be permanently deleted.",
    )
  ) {
    // Clear all data from localStorage
    localStorage.clear();

    // Reset data arrays
    data = [];
    expiryData = [];
    purchaseData = [];

    // Reset app version to trigger fresh initialization
    localStorage.setItem("app-version", APP_VERSION);

    // Re-initialize the app
    populateCategories();
    computeTotals();
    renderList();
    if (!summaryTabEl.classList.contains("hidden")) renderChart();
    renderExpiry();
    renderPurchase();

    // Show success message
    alert("All data has been cleared successfully.");

    hapticFeedback("success");
  }
}

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
  if (typeof t.category !== "string" || !t.category.trim())
    t.category = "Other";
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
      metadata: {
        appName: "Expense Tracker PWA",
        description:
          "Personal expense tracking data with categories, dates, and amounts",
        fileType: "application/json",
        encoding: "UTF-8",
        createdWith: "Expense Tracker PWA v1.0",
      },
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    // Create more descriptive filename that WhatsApp can recognize
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10); // YYYY-MM-DD format
    const timeStr = now.toTimeString().slice(0, 5).replace(/:/g, "-"); // HH-MM-SS format

    a.download = `expense-tracker-data-${dateStr}-${timeStr}.json`;
    a.setAttribute("type", "application/json");
    a.setAttribute("charset", "utf-8");

    // Add additional attributes for better compatibility
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    console.log("Export completed:", a.download);
    alert(`Exported ${data.length} expense items to ${a.download}`);
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
  if (!items)
    throw new Error("Invalid file format: expected an array or {items: []}");
  const cleaned = items.map(normalizeTx).filter(Boolean);
  if (cleaned.length === 0) throw new Error("No valid transactions found");

  const replace = confirm(
    "Replace existing data with imported items?\nOK = Replace, Cancel = Merge",
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

  // Get current transaction type for the form
  const currentType = getSelectedType();

  // Get current filter type
  const currentFilterType = filterType.value;

  // Define categories by type
  const categoriesByType = {
    expense: [
      "Groceries",
      "Dining",
      "Rent",
      "Transportation",
      "Shopping",
      "Healthcare",
      "Entertainment",
      "Other",
    ],
    income: ["Salary", "Business", "Other"],
    investment: [
      "Chit Fund",
      "LIC",
      "Term Insurance",
      "Gold Investment",
      "Land Investment",
      "Property Investment",
      "Mutual Fund",
      "Emergency Fund",
      "Other",
    ],
  };

  // Get appropriate categories for form (based on selected transaction type)
  const formCategories =
    categoriesByType[currentType] || categoriesByType.expense;

  // Get appropriate categories for filter (based on filter type)
  const filterCategories =
    currentFilterType === "all"
      ? Object.values(categoriesByType).flat()
      : categoriesByType[currentFilterType] || categoriesByType.expense;

  // Combine with existing data categories for form (filter out invalid categories for investment type)
  const existingFormCategories = data
    .filter((d) => d.type === currentType)
    .map((d) => d.category)
    .filter((cat) => {
      // For investment type, explicitly exclude groceries and other non-investment categories
      if (currentType === "investment") {
        return categoriesByType.investment.includes(cat) || cat === "Other";
      }
      // For other types, only include valid categories for that type
      return categoriesByType[currentType].includes(cat);
    });

  // Combine with existing data categories for filter
  const existingFilterCategories =
    currentFilterType === "all"
      ? data.map((d) => d.category).filter(Boolean)
      : data
          .filter((d) => d.type === currentFilterType)
          .map((d) => d.category)
          .filter(Boolean);

  const formCats = new Set(formCategories.concat(existingFormCategories));
  const filterCats = new Set(filterCategories.concat(existingFilterCategories));

  // Sort categories: put Other at the end
  const sortedFormCats = Array.from(formCats).sort((a, b) => {
    if (a === "Other") return 1;
    if (b === "Other") return -1;
    return a.localeCompare(b);
  });

  const sortedFilterCats = Array.from(filterCats).sort((a, b) => {
    if (a === "Other") return 1;
    if (b === "Other") return -1;
    return a.localeCompare(b);
  });

  // Populate form category dropdown
  for (const c of sortedFormCats) {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    categorySelect.appendChild(opt);
  }

  // Populate filter category dropdown
  for (const c of sortedFilterCats) {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    filterCategory.appendChild(opt);
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
    else if (t.type === "expense") expense += Math.abs(Number(t.amount));
  }
  totalIncomeEl.textContent = formatMoney(income);
  totalExpensesEl.textContent = formatMoney(-Math.abs(expense) || 0);
  const savings = income - expense;
  savingsEl.textContent = formatMoney(savings);

  // Calculate investments (sum of all investment type transactions)
  let investments = 0;
  for (const t of data) {
    // Apply same date filtering to investments
    if (dateRange && !isDateInRange(t.date, dateRange.start, dateRange.end)) {
      continue;
    }
    if (t.type === "investment") {
      investments += Math.abs(Number(t.amount));
    }
  }
  investmentsEl.textContent = formatMoney(investments);
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

function isInvestmentCategory(category) {
  const investmentCategories = [
    "Gold Investment",
    "Land Investment",
    "Property Investment",
  ];
  return investmentCategories.includes(category);
}

function catSlug(category) {
  return category.toLowerCase().replace(/\s+/g, "");
}

// Get modern SVG icon for category
function getCategoryIcon(category) {
  const slug = catSlug(category || "other");
  const iconSize = "20";

  const icons = {
    groceries: `<svg viewBox="0 0 24 24" width="${iconSize}" height="${iconSize}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <!-- Grocery basket with handle -->
      <path d="M7 11l5-7 5 7" />
      <path d="M5 11h14l-1.5 7a2 2 0 0 1-2 2H8.5a2 2 0 0 1-2-2L5 11z" />
      <line x1="8" y1="15" x2="8" y2="19" />
      <line x1="12" y1="15" x2="12" y2="19" />
      <line x1="16" y1="15" x2="16" y2="19" />
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
      <!-- Indian Rupee symbol (₹) in stroke style -->
      <path d="M6 4h12"/>
      <path d="M6 8h12"/>
      <path d="M6 8a6 6 0 0 1 6 6v0H6"/>
      <path d="M12 14L6 21"/>
    </svg>`,

    business: `<svg viewBox="0 0 24 24" width="${iconSize}" height="${iconSize}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
    </svg>`,

    investment: `<svg viewBox="0 0 24 24" width="${iconSize}" height="${iconSize}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
      <path d="M2 17l10 5 10-5"/>
      <path d="M2 12l10 5 10-5"/>
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 9v6"/>
    </svg>`,

    emergencyfund: `<svg viewBox="0 0 24 24" width="${iconSize}" height="${iconSize}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      <path d="M12 8v4"/>
      <path d="M10 12h4"/>
      <circle cx="12" cy="14" r="1"/>
    </svg>`,

    mutualfund: `<svg viewBox="0 0 24 24" width="${iconSize}" height="${iconSize}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 3v18h18"/>
      <path d="M7 12l4-4 4 4"/>
      <path d="M11 8v8"/>
      <path d="M15 12l4-4 4 4"/>
      <path d="M19 8v8"/>
    </svg>`,

    fixeddeposit: `<svg viewBox="0 0 24 24" width="${iconSize}" height="${iconSize}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      <circle cx="12" cy="16" r="1"/>
    </svg>`,

    chitfund: `<svg viewBox="0 0 24 24" width="${iconSize}" height="${iconSize}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 6v6l4 2"/>
      <path d="M8 12h8"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>`,

    lic: `<svg viewBox="0 0 24 24" width="${iconSize}" height="${iconSize}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
      <path d="M12 8v4"/>
      <path d="M12 16h.01"/>
    </svg>`,

    terminsurance: `<svg viewBox="0 0 24 24" width="${iconSize}" height="${iconSize}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 1.5-.37 2.89-.96 4.13-1.72"/>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67"/>
      <path d="M12 5.67l-1.06-1.06a5.5 5.0 0 0 0-7.78 7.78"/>
    </svg>`,

    "land-investment": `<svg viewBox="0 0 24 24" width="${iconSize}" height="${iconSize}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/>
      <path d="M2 12l10 10 10-10"/>
      <path d="M12 2v20"/>
      <rect x="8" y="8" width="8" height="8" rx="1"/>
    </svg>`,

    "property-investment": `<svg viewBox="0 0 24 24" width="${iconSize}" height="${iconSize}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9,22 9,12 15,12 15,22"/>
      <path d="M5 12h14"/>
      <circle cx="12" cy="6" r="1"/>
    </svg>`,

    other: `<svg viewBox="0 0 24 24" width="${iconSize}" height="${iconSize}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="1"/>
      <circle cx="19" cy="12" r="1"/>
      <circle cx="5" cy="12" r="1"/>
    </svg>`,
  };

  // Ensure edit is detected
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
    investment: "#22c55e", // green
    emergencyfund: "#ef4444", // red
    mutualfund: "#8b5cf6", // violet
    fixeddeposit: "#f59e0b", // amber
    chitfund: "#06b6d4", // cyan
    lic: "#10b981", // emerald
    terminsurance: "#6366f1", // indigo
    gold: "#fbbf24", // yellow for Gold Investment
    land: "#84cc16", // lime
    property: "#a855f7", // purple
    other: "#9ca3af", // neutral
  };
  const colors = labels.map(
    (label, i) => categoryColors[catSlug(label)] || palette[i % palette.length],
  );
  // Build dataset depending on availability
  const hasData = values.length > 0;
  const chartLabels = hasData ? labels : ["No data"];
  const chartValues = hasData ? values : [1];
  const chartColors = hasData
    ? colors.length
      ? colors
      : ["#e5e7eb"]
    : ["#e5e7eb"];

  // Ensure canvas is visible
  canvas.style.display = "block";

  if (donutChart) {
    donutChart.destroy();
    donutChart = null;
  }
  donutChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: chartLabels,
      datasets: [
        {
          data: chartValues,
          backgroundColor: chartColors,
          borderWidth: 0,
        },
      ],
    },
    options: {
      plugins: {
        legend: { position: "bottom", display: hasData },
        tooltip: { enabled: hasData },
      },
      events: hasData ? undefined : [],
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
    expiryTabEl && expiryTabEl.classList.add("hidden");
    purchaseTabEl && purchaseTabEl.classList.add("hidden");
    tabHome.classList.add("active");
    tabSummary.classList.remove("active");
    tabExpiry && tabExpiry.classList.remove("active");
    tabPurchase && tabPurchase.classList.remove("active");
    screenTitle.textContent = "Expenses";
    if (optionsMenu) optionsMenu.classList.remove("open");
  } else if (name === "summary") {
    homeTabEl.classList.add("hidden");
    summaryTabEl.classList.remove("hidden");
    expiryTabEl && expiryTabEl.classList.add("hidden");
    purchaseTabEl && purchaseTabEl.classList.add("hidden");
    tabHome.classList.remove("active");
    tabSummary.classList.add("active");
    tabExpiry && tabExpiry.classList.remove("active");
    tabPurchase && tabPurchase.classList.remove("active");
    screenTitle.textContent = "Expense Summary";
    if (optionsMenu) optionsMenu.classList.remove("open");
    // ensure chart reflects latest data
    renderChart();
  } else if (name === "expiry") {
    homeTabEl.classList.add("hidden");
    summaryTabEl.classList.add("hidden");
    expiryTabEl && expiryTabEl.classList.remove("hidden");
    purchaseTabEl && purchaseTabEl.classList.add("hidden");
    tabHome.classList.remove("active");
    tabSummary.classList.remove("active");
    tabExpiry && tabExpiry.classList.add("active");
    tabPurchase && tabPurchase.classList.remove("active");
    screenTitle.textContent = "Expiries";
    if (optionsMenu) optionsMenu.classList.remove("open");
    renderExpiry();
  } else if (name === "purchase") {
    homeTabEl.classList.add("hidden");
    summaryTabEl.classList.add("hidden");
    expiryTabEl && expiryTabEl.classList.add("hidden");
    purchaseTabEl && purchaseTabEl.classList.remove("hidden");
    tabHome.classList.remove("active");
    tabSummary.classList.remove("active");
    tabExpiry && tabExpiry.classList.remove("active");
    tabPurchase && tabPurchase.classList.add("active");
    screenTitle.textContent = "Shopping List";
    if (optionsMenu) optionsMenu.classList.remove("open");
    renderPurchase();
  }

  // Check if PWA install modal should be shown after tab switch
  setTimeout(() => checkPWAInstallPrompt(1000), 500);
}

function renderList() {
  transactionsEl.innerHTML = "";
  const ft = filterType.value;
  const fc = filterCategory.value;
  // Search functionality removed

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
      // Search filter removed

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

  // Group transactions by date
  const groupedByDate = {};
  list.forEach((transaction) => {
    const date = transaction.date;
    if (!groupedByDate[date]) {
      groupedByDate[date] = [];
    }
    groupedByDate[date].push(transaction);
  });

  // Render transactions grouped by date
  Object.keys(groupedByDate).forEach((date) => {
    // Add date header
    const dateHeader = document.createElement("div");
    dateHeader.className = "date-header";

    // Format date header
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .slice(0, 10);

    let displayDate = formatDateDisplay(date);
    if (date === today) {
      displayDate = "Today";
    } else if (date === yesterday) {
      displayDate = "Yesterday";
    } else {
      // Add relative time for older dates
      const transactionDate = new Date(date);
      const daysDiff = Math.floor(
        (new Date() - transactionDate) / (1000 * 60 * 60 * 24),
      );
      if (daysDiff <= 7) {
        displayDate = transactionDate.toLocaleDateString("en-US", {
          weekday: "long",
        });
      }
    }

    dateHeader.textContent = displayDate;
    transactionsEl.appendChild(dateHeader);

    // Add transactions for this date
    groupedByDate[date].forEach((t) => {
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
      cat.textContent = t.category; // Remove date from here since it's now in the header
      info.appendChild(title);
      info.appendChild(cat);
      meta.appendChild(box);
      meta.appendChild(info);
      const amt = document.createElement("div");
      amt.className = "amount " + (t.type === "expense" ? "expense" : "income");
      const amountValue = Math.abs(Number(t.amount)).toFixed(2);
      const formattedAmount = amountValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
      amt.textContent =
        (t.type === "expense" ? "-" : "+") + "₹" + formattedAmount;
      el.appendChild(meta);
      el.appendChild(amt);

      // Swipe-to-delete gesture handling
      let startX = 0;
      let startY = 0;
      let dx = 0;
      let dy = 0;
      let swiping = false;
      let moved = false;

      function resetTransform() {
        el.style.transition = "transform 0.2s ease";
        el.style.transform = "translateX(0)";
        setTimeout(() => (el.style.transition = ""), 220);
      }

      el.addEventListener(
        "touchstart",
        (e) => {
          if (!e.touches || e.touches.length === 0) return;
          startX = e.touches[0].clientX;
          startY = e.touches[0].clientY;
          dx = 0;
          dy = 0;
          swiping = false;
          moved = false;
          el.style.transition = ""; // disable during drag
        },
        { passive: true },
      );

      el.addEventListener(
        "touchmove",
        (e) => {
          if (!e.touches || e.touches.length === 0) return;
          dx = e.touches[0].clientX - startX;
          dy = e.touches[0].clientY - startY;

          // Only consider it a swipe if horizontal movement is dominant
          if (Math.abs(dx) > Math.abs(dy) && dx < -10) {
            swiping = true;
          }
          if (Math.abs(dx) > 6 || Math.abs(dy) > 6) moved = true;

          if (swiping) {
            e.preventDefault(); // Prevent scrolling when swiping
            const limited = Math.max(dx, -120);
            el.style.transform = `translateX(${limited}px)`;
          }
          // If not swiping (vertical scroll), allow default behavior
        },
        { passive: false },
      );

      el.addEventListener("touchend", () => {
        if (swiping && dx <= -80) {
          hapticFeedback("medium");
          if (confirm("Delete this transaction?")) {
            hapticFeedback("heavy");
            data = data.filter((x) => x.id !== t.id);
            save();
            populateCategories();
            computeTotals();
            renderList();
            if (!summaryTabEl.classList.contains("hidden")) renderChart();
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
    });
  });
}

function openModal(defaults) {
  modal.classList.remove("hide");

  // Trigger slide-up animation first
  setTimeout(() => {
    modal.classList.add("show");

    // Enhanced focus handling for amount field - start after modal is visible
    const focusAmountField = () => {
      const amountField = $("amount");
      if (amountField) {
        // Force focus and trigger keyboard on mobile devices
        amountField.focus();

        // For mobile devices, also select text if there's a value
        if (amountField.value) {
          amountField.select();
        }

        // Additional iPhone-specific handling
        const ua = navigator.userAgent || "";
        const isIOS = /iPhone|iPad|iPod/i.test(ua);
        const isMobile =
          isIOS ||
          /Android/i.test(ua) ||
          (window.matchMedia &&
            window.matchMedia("(max-width: 768px)").matches);

        if (isMobile) {
          // More aggressive approach for mobile keyboard activation
          amountField.click();
          amountField.focus();

          // Trigger multiple events to ensure keyboard opens
          const events = [
            "touchstart",
            "touchend",
            "mousedown",
            "mouseup",
            "click",
            "focus",
          ];
          events.forEach((eventType) => {
            const event = new Event(eventType, {
              bubbles: true,
              cancelable: true,
            });
            amountField.dispatchEvent(event);
          });

          // Additional iOS-specific attempts
          if (isIOS) {
            setTimeout(() => {
              amountField.focus();
              amountField.click();
              // Scroll into view to ensure visibility
              amountField.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }, 50);

            setTimeout(() => {
              amountField.focus();
              amountField.select();
            }, 150);
          }
        }
      }
    };

    // Multiple timing attempts to ensure focus works on all devices
    setTimeout(focusAmountField, 100); // After modal animation starts
    setTimeout(focusAmountField, 200); // After modal is fully visible
    setTimeout(focusAmountField, 400); // Additional attempt for slower devices
    setTimeout(focusAmountField, 600); // Final attempt for very slow devices
  }, 10);

  // Clear any existing validation errors
  clearValidationErrors();

  // Keep max date fresh whenever the modal opens.
  setMaxTodayForTxDate();

  if (defaults) {
    $("amount").value = defaults.amount;
    // set radio selection for type
    setSelectedType(defaults.type);

    // Handle special categories with radio buttons
    const investmentRadio = $("typeInvestment");

    if (isInvestmentCategory(defaults.category)) {
      if (investmentRadio) investmentRadio.checked = true;
      $("category").value = defaults.category; // Keep the specific investment category
    } else {
      $("category").value = defaults.category;
    }

    setDateInputValue("date", toDateInputValue(defaults.date));
    $("description").value = defaults.description || "";
  } else {
    txForm.reset();
    setDateInputValue("date", todayIsoDate());
    // default to expense on new entry
    setSelectedType("expense");
  }
}

function closeModalFn() {
  modal.classList.remove("show");
  modal.classList.add("hide");
  // Reset modal transform when closing
  const modalContent = document.querySelector(".modal-content");
  if (modalContent) {
    modalContent.style.transform = "";
    modalContent.style.transition = "";
  }
}

addBtn.addEventListener("click", () => {
  hapticFeedback("light");
  // If Expiry tab is active, open expiry modal instead
  if (expiryTabEl && !expiryTabEl.classList.contains("hidden")) {
    openExpiryModal();
    return;
  }
  // If Purchase tab is active, open purchase modal
  if (purchaseTabEl && !purchaseTabEl.classList.contains("hidden")) {
    openPurchaseModal();
    return;
  }

  // Default: open transaction modal
  populateCategories();
  editId = null;
  const modalTitle = document.getElementById("modalTitle");
  if (modalTitle) modalTitle.textContent = "Create Transaction";
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
  const modalContent = document.querySelector(".modal-content");
  const modalHeader = document.querySelector(".modal-content header");

  if (!modalContent || !modalHeader) return;

  modalHeader.addEventListener(
    "touchstart",
    (e) => {
      modalStartY = e.touches[0].clientY;
      modalCurrentY = modalStartY;
      modalIsDragging = true;
      modalContent.style.transition = "none";
    },
    { passive: true },
  );

  modalHeader.addEventListener(
    "touchmove",
    (e) => {
      if (!modalIsDragging) return;

      modalCurrentY = e.touches[0].clientY;
      const deltaY = modalCurrentY - modalStartY;

      // Only allow downward drag
      if (deltaY > 0) {
        modalContent.style.transform = `translateY(${deltaY}px)`;
      }
    },
    { passive: true },
  );

  modalHeader.addEventListener(
    "touchend",
    () => {
      if (!modalIsDragging) return;

      const deltaY = modalCurrentY - modalStartY;
      modalIsDragging = false;

      // Reset transition
      modalContent.style.transition =
        "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)";

      if (deltaY > modalDragThreshold) {
        // Close modal if dragged far enough
        hapticFeedback("medium");
        closeModalFn();
      } else {
        // Snap back to original position
        modalContent.style.transform = "translateY(0)";
      }
    },
    { passive: true },
  );

  // Also handle mouse events for desktop
  modalHeader.addEventListener("mousedown", (e) => {
    modalStartY = e.clientY;
    modalCurrentY = modalStartY;
    modalIsDragging = true;
    modalContent.style.transition = "none";

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
      modalContent.style.transition =
        "transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)";

      if (deltaY > modalDragThreshold) {
        // Close modal if dragged far enough
        hapticFeedback("medium");
        closeModalFn();
      } else {
        // Snap back to original position
        modalContent.style.transform = "translateY(0)";
      }

      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
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
    hapticFeedback("light");
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
    showExportOptions();
    closeMenu();
  });
}
if (importOption && importFileInput) {
  importOption.addEventListener("click", () => {
    // In PWA mode, programmatic click() may not work due to security restrictions
    const isPWA =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true ||
      document.referrer.includes("android-app://");

    if (isPWA) {
      // For PWA mode, show instructions to use browser
      alert(
        "In PWA mode, please use your browser's import feature or visit the web version to import data.",
      );
      closeMenu();
      return;
    }

    // Regular web mode - use programmatic click
    importFileInput.click();
    closeMenu();
  });
}
if (clearOption) {
  clearOption.addEventListener("click", () => {
    clearData();
    closeMenu();
  });
}
// Tab events
if (tabHome && tabSummary) {
  tabHome.addEventListener("click", () => {
    hapticFeedback("light");
    switchTab("home");
  });
  tabSummary.addEventListener("click", () => {
    hapticFeedback("light");
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
  if (isNaN(selectedDate.getTime())) {
    dateError.textContent = "Enter a valid date";
    dateError.style.display = "block";
    return false;
  }
  const today = new Date();
  today.setHours(23, 59, 59, 999); // Set to end of today

  if (selectedDate > today) {
    // Instead of showing an error, clamp to today and continue
    const todayStr = todayIsoDate();
    try {
      const dateInput = $("date");
      if (dateInput) setDateInputValue(dateInput, todayStr);
    } catch (_) {}
    dateError.style.display = "none";
    return true;
  }

  dateError.style.display = "none";
  return true;
}

txForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const amount = Number($("amount").value) || 0;
  const type = getSelectedType();
  let category = $("category").value || "Other";
  const date = $("date").value;
  const description = $("description").value;

  // Check for special category radio buttons
  const investmentRadio = $("typeInvestment");

  if (investmentRadio && investmentRadio.checked) {
    // Keep the selected category for Investment transactions
    category = $("category").value || "Other";
  }

  // Validate form inputs
  const isAmountValid = validateAmount(amount);
  const isDateValid = validateDate(date);

  if (!isAmountValid || !isDateValid) {
    hapticFeedback("error");
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
  hapticFeedback("success");

  editId = null;
  const modalTitle = document.getElementById("modalTitle");
  if (modalTitle) modalTitle.textContent = "Create Transaction";
  const submitBtn = txForm.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.textContent = "Save";
  closeModalFn();

  // Show PWA install modal after successful transaction
  setTimeout(() => checkPWAInstallPrompt(2000), 1000);
});

// Enhanced mobile focus handling for form fields
function enhanceMobileFocus(inputElement) {
  if (!inputElement) return;

  const ua = navigator.userAgent || "";
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isMobile =
    isIOS ||
    /Android/i.test(ua) ||
    (window.matchMedia && window.matchMedia("(max-width: 768px)").matches);

  if (isMobile) {
    inputElement.addEventListener("focus", () => {
      // Ensure keyboard stays open and field is properly focused
      setTimeout(() => {
        inputElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 100);

      // Additional iOS handling
      if (isIOS) {
        setTimeout(() => {
          inputElement.click();
        }, 50);
      }
    });
  }
}

// Apply enhanced focus to all form inputs (will be called from main DOMContentLoaded)
function setupEnhancedMobileFocus() {
  const formInputs = [
    $("amount"),
    $("category"),
    $("date"),
    $("description"),
  ].filter(Boolean);

  formInputs.forEach(enhanceMobileFocus);
}

// Real-time validation event listeners
$("amount").addEventListener("input", (e) => {
  const amount = Number(e.target.value);
  if (e.target.value) {
    // Only validate if there's a value
    validateAmount(amount);
  } else {
    $("amountError").style.display = "none";
  }
});

$("date").addEventListener("change", (e) => {
  if (e.target.value) {
    // Only validate if there's a value
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
  document
    .querySelectorAll(".filter-btn")
    .forEach((btn) => btn.classList.remove("active"));
  document.querySelector(`[data-filter="${filter}"]`).classList.add("active");

  // Show/hide custom date range
  if (filter === "custom") {
    customDateRange.classList.remove("hidden");
    // if empty, initialize to today's date so range is valid
    const today = todayIsoDate();
    if (startDate && !startDate.value) setDateInputValue(startDate, today);
    if (endDate && !endDate.value) setDateInputValue(endDate, today);
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
  document
    .querySelectorAll("#summaryTab .filter-btn")
    .forEach((btn) => btn.classList.remove("active"));
  document
    .querySelector(`#summaryTab [data-filter="${filter}"]`)
    .classList.add("active");

  // Show/hide custom date range for summary
  if (filter === "custom") {
    summaryCustomDateRange.classList.remove("hidden");
    const today = todayIsoDate();
    if (summaryStartDate && !summaryStartDate.value)
      setDateInputValue(summaryStartDate, today);
    if (summaryEndDate && !summaryEndDate.value)
      setDateInputValue(summaryEndDate, today);
  } else {
    summaryCustomDateRange.classList.add("hidden");
  }

  // Update chart
  renderChart();

  // Show PWA install modal after summary filter change
  setTimeout(() => checkPWAInstallPrompt(1500), 800);
}

// Set today's date as default for all date inputs
function setDefaultDatesToday() {
  const today = todayIsoDate();
  const inputs = [
    $("date"),
    startDate,
    endDate,
    summaryStartDate,
    summaryEndDate,
  ].filter(Boolean);
  inputs.forEach((el) => {
    if (!el.value) {
      setDateInputValue(el, today);
    }
  });
}

// Ensure the add/edit transaction date input disallows future dates
function setMaxTodayForTxDate() {
  const dateInput = $("date");
  if (!dateInput) return;
  setDateInputMax(dateInput, todayIsoDate());
}

// Ensure all filtering date inputs disallow future dates (only up to today)
function setMaxTodayForFilterDates() {
  const today = todayIsoDate();
  const inputs = [startDate, endDate, summaryStartDate, summaryEndDate].filter(
    Boolean,
  );
  inputs.forEach((el) => {
    setDateInputMax(el, today);
    // If an existing value is in the future (e.g., persisted), clamp it.
    if (el.value && el.value > today) {
      setDateInputValue(el, today);
    }
  });
}

// Add event listeners for summary page date filter buttons
summaryFilterAllTime.addEventListener("click", () =>
  setSummaryDateFilter("all"),
);
summaryFilterThisMonth.addEventListener("click", () =>
  setSummaryDateFilter("thisMonth"),
);
summaryFilterPrevMonth.addEventListener("click", () =>
  setSummaryDateFilter("previousMonth"),
);
summaryFilterCustom.addEventListener("click", () =>
  setSummaryDateFilter("custom"),
);

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
// Search input event listener removed

// PWA Install functionality
function isStandalone() {
  // Chrome/Edge PWA and iOS Safari added to home screen
  return (
    (window.matchMedia &&
      window.matchMedia("(display-mode: standalone)").matches) ||
    (typeof navigator !== "undefined" &&
      "standalone" in navigator &&
      navigator.standalone === true)
  );
}

function showPWAInstallPopup() {
  if (pwaInstallPopup) {
    pwaInstallPopup.classList.remove("hide");

    // Reset button state and instructions
    if (pwaInstallBtn) {
      pwaInstallBtn.textContent = "Install App";
      pwaInstallBtn.onclick = null; // Remove any custom onclick handler
    }
    if (pwaInstructions) {
      pwaInstructions.classList.add("hide");
      pwaInstructions.innerHTML = "";
    }
  }
}

function hidePWAInstallPopup(withDelay = false) {
  if (pwaInstallPopup) {
    pwaInstallPopup.classList.add("hide");
  }

  // If dismissed manually, set a 1-minute delay before showing again
  if (withDelay) {
    const dismissTime = Date.now();
    localStorage.setItem("pwa-dismiss-time", dismissTime.toString());
    console.log(
      "PWA install modal dismissed. Next show scheduled in 1 minute.",
    );

    // Schedule next show after 1 minute
    setTimeout(() => {
      console.log(
        "1-minute delay completed. Checking if PWA install modal should show.",
      );
      checkPWAInstallPrompt(0);
    }, 60000); // 60 seconds = 1 minute
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

  // Check if we're still within the 1-minute delay period after dismissal
  const dismissTime = localStorage.getItem("pwa-dismiss-time");
  if (dismissTime) {
    const timeSinceDismiss = Date.now() - parseInt(dismissTime);
    const oneMinute = 60000; // 60 seconds in milliseconds

    if (timeSinceDismiss < oneMinute) {
      // Still within delay period, don't show
      return;
    } else {
      // Delay period has passed, clear the dismiss time
      localStorage.removeItem("pwa-dismiss-time");
    }
  }

  const ua = navigator.userAgent || "";
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
window.addEventListener("beforeinstallprompt", (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Save the event so it can be triggered later
  deferredPrompt = e;
  // Check if we should show our custom install popup
  checkPWAInstallPrompt();
});

// Handle install button click
if (pwaInstallBtn) {
  pwaInstallBtn.addEventListener("click", async () => {
    try {
      if (deferredPrompt) {
        // Use the native install prompt if available
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === "accepted") {
          console.log("User accepted the install prompt");
        } else {
          console.log("User dismissed the install prompt");
        }

        // Clear the deferredPrompt and hide popup
        deferredPrompt = null;
        hidePWAInstallPopup();
      } else {
        // Fallback: show inline guidance for browsers without native prompt
        if (pwaInstructions) {
          const ua = navigator.userAgent || "";
          const isIOS = /iPhone|iPad|iPod/i.test(ua);
          const isAndroid = /Android/i.test(ua);
          const isChrome = /Chrome/i.test(ua);
          const isEdge = /Edge/i.test(ua);

          let html = "";
          if (isIOS) {
            html =
              '📱 <strong>iPhone/iPad:</strong><br>1. Tap the Share button (⬆️)<br>2. Choose "Add to Home Screen"<br>3. Tap "Add" to install';
          } else if (isAndroid && isChrome) {
            html =
              '📱 <strong>Android Chrome:</strong><br>1. Tap the menu (⋮)<br>2. Choose "Install app" or "Add to Home screen"<br>3. Tap "Install"';
          } else if (isChrome || isEdge) {
            html =
              '💻 <strong>Desktop:</strong><br>1. Look for the install icon (⊕) in the address bar<br>2. Or use browser menu → "Install app"<br>3. Click "Install"';
          } else {
            html =
              '🌐 <strong>Install Instructions:</strong><br>1. Use your browser\'s menu<br>2. Look for "Install app" or "Add to Home Screen"<br>3. Follow the prompts to install';
          }

          pwaInstructions.innerHTML = html;
          pwaInstructions.classList.remove("hide");

          // Change button text to indicate instructions are shown
          pwaInstallBtn.textContent = "Got it!";
          pwaInstallBtn.onclick = () => hidePWAInstallPopup();
        }
      }
    } catch (error) {
      console.error("PWA install error:", error);
      hidePWAInstallPopup();
    }
  });
}

// Handle "Maybe Later" button click
if (pwaLaterBtn) {
  pwaLaterBtn.addEventListener("click", () => {
    hidePWAInstallPopup(true); // true = apply 1-minute delay
  });
}

// Handle close button click
if (pwaCloseBtn) {
  pwaCloseBtn.addEventListener("click", () => {
    hidePWAInstallPopup(true); // true = apply 1-minute delay
  });
}

// Listen for successful app installation
window.addEventListener("appinstalled", () => {
  hidePWAInstallPopup();
  deferredPrompt = null;
});

const EXPIRY_NOTIFY_KEY = "expiry-notified-date-v1";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function getExpiringToday() {
  const t = todayStr();
  return (expiryData || []).filter((e) => {
    const d = new Date(e.expiry);
    if (isNaN(d)) return false;
    return d.toISOString().slice(0, 10) === t;
  });
}

async function showExpiryNotification(items) {
  try {
    if (!("Notification" in window)) return;
    if (Notification.permission !== "granted") return;
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) return;
    const count = items.length;
    const title =
      count === 1 ? "1 item expires today" : `${count} items expire today`;
    const names = items
      .slice(0, 3)
      .map((i) => i.name || "Item")
      .join(", ");
    const more = count > 3 ? ` +${count - 3} more` : "";
    const body = names ? `${names}${more}` : "Tap to view";
    await reg.showNotification(title, {
      body,
      tag: "expiry-today",
      renotify: false,
      data: { url: "#expiry" },
      icon: "icons/icon-192.png",
      badge: "icons/icon-192.png",
    });
  } catch (_) {}
}

function shouldNotifyToday(signature) {
  const last = localStorage.getItem(EXPIRY_NOTIFY_KEY) || "";
  return last !== signature;
}

function setNotified(signature) {
  localStorage.setItem(EXPIRY_NOTIFY_KEY, signature);
}

function signatureForToday(items) {
  const t = todayStr();
  const ids = items
    .map((i) => i.id)
    .sort()
    .join("|");
  return `${t}|${items.length}|${ids}`;
}

async function checkAndNotifyExpiringToday() {
  try {
    const items = getExpiringToday();
    if (!items.length) return;
    const sig = signatureForToday(items);
    if (!shouldNotifyToday(sig)) return;
    await showExpiryNotification(items);
    setNotified(sig);
  } catch (_) {}
}

function resetNotificationChoice() {
  localStorage.removeItem("notification-choice");
  // Request permission again immediately
  requestNotificationPermission();
}

function requestNotificationPermission() {
  try {
    if (!("Notification" in window)) return;

    // Check if we've already handled permission for this session
    const sessionHandled = sessionStorage.getItem(
      "notification-permission-handled",
    );
    if (sessionHandled) return;

    // Check if user has already made a choice
    const notificationChoice = localStorage.getItem("notification-choice");
    if (
      notificationChoice === "dismissed" ||
      notificationChoice === "granted"
    ) {
      sessionStorage.setItem("notification-permission-handled", "true");
      return;
    }

    // If permission is already granted or denied, save the choice and mark as handled
    if (Notification.permission === "granted") {
      localStorage.setItem("notification-choice", "granted");
      sessionStorage.setItem("notification-permission-handled", "true");
      return;
    }
    if (Notification.permission === "denied") {
      localStorage.setItem("notification-choice", "dismissed");
      sessionStorage.setItem("notification-permission-handled", "true");
      return;
    }

    // Only request if permission is default and user hasn't dismissed
    if (Notification.permission === "default") {
      Notification.requestPermission()
        .then((permission) => {
          // Save the user's choice
          if (permission === "granted") {
            localStorage.setItem("notification-choice", "granted");
          } else if (permission === "denied") {
            localStorage.setItem("notification-choice", "dismissed");
          }
          // Mark as handled for this session
          sessionStorage.setItem("notification-permission-handled", "true");
        })
        .catch(() => {
          // If request fails, mark as dismissed to avoid repeated prompts
          localStorage.setItem("notification-choice", "dismissed");
          sessionStorage.setItem("notification-permission-handled", "true");
        });
    }
  } catch (_) {}
}

function initExpiryNotifications() {
  requestNotificationPermission();
  checkAndNotifyExpiringToday();
  try {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        checkAndNotifyExpiringToday();
      }
    });
  } catch (_) {}
  setInterval(
    () => {
      checkAndNotifyExpiringToday();
    },
    60 * 60 * 1000,
  );
}

document.addEventListener("DOMContentLoaded", () => {
  // initialize theme
  applyTheme();
  populateCategories();
  // initialize calendar picker for every date input
  initDatePickers();
  // ensure date inputs have today's date by default
  setDefaultDatesToday();
  // ensure filter date inputs cannot be set in the future
  setMaxTodayForFilterDates();
  // ensure transaction date cannot be set in the future
  setMaxTodayForTxDate();

  // Detect PWA/standalone mode and apply appropriate classes
  if (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true ||
    document.referrer.includes("android-app://") ||
    // Also detect mobile viewport for testing
    (window.innerWidth <= 768 && window.innerHeight <= 1024)
  ) {
    document.body.classList.add("pwa-mode");
    document.body.classList.add("standalone");

    // Setup proper scrolling for mouse wheel and touchpad on ALL tabs
    const app = document.querySelector(".app");
    const viewportHeight = window.innerHeight;
    const contentHeight = viewportHeight - 120; // Account for header and nav

    // Apply scrolling setup to all main content tabs
    const allTabs = [
      { id: "#homeTab", name: "Expenses" },
      { id: "#expiryTab", name: "Expiries" },
      { id: "#summaryTab", name: "Summary" },
      { id: "#purchaseTab", name: "Shopping" },
    ];

    allTabs.forEach((tab) => {
      const tabContent = document.querySelector(tab.id);
      if (tabContent) {
        // Make tab content scrollable with proper height
        tabContent.style.setProperty(
          "height",
          contentHeight + 1000 + "px",
          "important",
        );
        tabContent.style.setProperty(
          "max-height",
          contentHeight + "px",
          "important",
        );
        tabContent.style.setProperty("overflow-y", "scroll", "important");
        tabContent.style.setProperty(
          "-webkit-overflow-scrolling",
          "touch",
          "important",
        );
        tabContent.style.setProperty("position", "relative", "important");

        // Add scroll event listeners for debugging
        tabContent.addEventListener("scroll", () => {
          console.log(`${tab.name} tab scrolled to:`, tabContent.scrollTop);
        });

        tabContent.addEventListener(
          "wheel",
          (e) => {
            console.log(
              `Wheel event on ${tab.name} tab:`,
              e.deltaY,
              "target:",
              e.target.className,
            );
          },
          { passive: false },
        );

        // Handle wheel events on items within each tab
        const itemSelector =
          tab.id === "#expiryTab"
            ? ".expiry-item"
            : tab.id === "#purchaseTab"
              ? ".purchase-item"
              : ".tx";
        const items = tabContent.querySelectorAll(itemSelector);

        items.forEach((item, index) => {
          item.addEventListener(
            "wheel",
            (e) => {
              console.log(
                `Wheel event on ${tab.name} item ${index}:`,
                e.deltaY,
              );
              // Allow the event to bubble up to the scrollable container
            },
            { passive: true },
          );

          // Also handle wheel events on child elements
          const children = item.querySelectorAll("*");
          children.forEach((child) => {
            child.addEventListener(
              "wheel",
              (e) => {
                console.log(
                  `Wheel event on ${tab.name} item child:`,
                  child.className,
                  e.deltaY,
                );
                // Let the event bubble up to the scrollable container
              },
              { passive: true },
            );
          });
        });

        console.log(`${tab.name} tab scrolling setup complete`);
      }
    });

    if (app) {
      // Make app container non-scrollable
      app.style.setProperty("height", "auto", "important");
      app.style.setProperty("overflow-y", "visible", "important");
    }
  }

  // Listen for display mode changes (for Dev Tools testing)
  window
    .matchMedia("(display-mode: standalone)")
    .addEventListener("change", (e) => {
      const app = document.querySelector(".app");
      if (e.matches) {
        document.body.classList.add("pwa-mode");
        document.body.classList.add("standalone");
        // Force app height to auto for scrolling
        if (app) {
          app.style.setProperty("height", "auto", "important");
          app.style.setProperty("max-height", "none", "important");
          app.style.setProperty("overflow-y", "auto", "important");
          app.style.setProperty(
            "-webkit-overflow-scrolling",
            "touch",
            "important",
          );
        }
      } else {
        document.body.classList.remove("pwa-mode");
        document.body.classList.remove("standalone");
      }
    });

  computeTotals();
  renderList();
  // initial chart render (will no-op if canvas missing)
  renderChart();
  // initialize enhanced mobile focus for form inputs
  setupEnhancedMobileFocus();
  // initialize mobile app enhancements
  addPullToRefresh();
  // initialize modal drag-to-close functionality
  initModalDragToClose();
  // attempt to show PWA install popup on first load (covers iOS which lacks beforeinstallprompt)
  checkPWAInstallPrompt();
  // start periodic PWA install reminders
  startPWAInstallReminder();

  try {
    if (location.hash === "#expiry") {
      switchTab("expiry");
    } else if (location.hash === "#summary") {
      switchTab("summary");
    } else if (location.hash === "#purchase") {
      switchTab("purchase");
    }
  } catch (_) {}
  initExpiryNotifications();

  // Add scroll indicators for filters
  function initScrollIndicators() {
    const filtersRow = document.querySelector(".filters-row");
    if (!filtersRow) return;

    let scrollTimeout;

    function updateScrollIndicators() {
      const scrollLeft = filtersRow.scrollLeft;
      const maxScroll = filtersRow.scrollWidth - filtersRow.clientWidth;

      // Add scrolling class during scroll
      filtersRow.classList.add("scrolling");

      // Clear existing timeout
      clearTimeout(scrollTimeout);

      // Remove scrolling class after scroll ends
      scrollTimeout = setTimeout(() => {
        filtersRow.classList.remove("scrolling");
      }, 150);

      // Remove existing classes
      filtersRow.classList.remove("scrollable-left", "scrollable-right");

      // Add classes based on scroll position
      if (scrollLeft > 0) {
        filtersRow.classList.add("scrollable-left");
      }
      if (scrollLeft < maxScroll - 1) {
        filtersRow.classList.add("scrollable-right");
      }
    }

    // Initial check
    updateScrollIndicators();

    // Update on scroll
    filtersRow.addEventListener("scroll", updateScrollIndicators);

    // Update on window resize
    window.addEventListener("resize", updateScrollIndicators);
  }

  // Initialize scroll indicators when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initScrollIndicators);
  } else {
    initScrollIndicators();
  }

  // Wire type radio buttons to update categories
  const typeExpense = $("typeExpense");
  const typeIncome = $("typeIncome");
  const typeInvestment = $("typeInvestment");

  if (typeExpense) {
    typeExpense.addEventListener("change", () => {
      populateCategories();
    });
  }

  if (typeIncome) {
    typeIncome.addEventListener("change", () => {
      populateCategories();
    });
  }

  if (typeInvestment) {
    typeInvestment.addEventListener("change", () => {
      populateCategories();
    });
  }

  // Wire bottom nav tabs
  if (tabHome) tabHome.addEventListener("click", () => switchTab("home"));
  if (tabSummary)
    tabSummary.addEventListener("click", () => switchTab("summary"));
  if (tabPurchase)
    tabPurchase.addEventListener("click", () => switchTab("purchase"));
  if (tabExpiry) tabExpiry.addEventListener("click", () => switchTab("expiry"));

  // Expiry modal controls
  if (addExpiryBtn) {
    addExpiryBtn.addEventListener("click", () => openExpiryModal());
  }
  if (closeExpiryModal)
    closeExpiryModal.addEventListener("click", closeExpiryModalFn);
  if (cancelExpiryBtn)
    cancelExpiryBtn.addEventListener("click", closeExpiryModalFn);
  if (expiryForm) {
    expiryForm.addEventListener("submit", (e) => {
      e.preventDefault();
      submitExpiryForm();
    });
  }

  // Purchase modal controls
  if (closePurchaseModal)
    closePurchaseModal.addEventListener("click", closePurchaseModalFn);
  if (cancelPurchaseBtn)
    cancelPurchaseBtn.addEventListener("click", closePurchaseModalFn);
  if (addPurchaseBtn) {
    addPurchaseBtn.addEventListener("click", () => {
      openPurchaseModal();
      // Focus on product name field after modal opens
      setTimeout(() => {
        if (purchaseNameInput) purchaseNameInput.focus();
      }, 100);
    });
  }
  if (purchaseForm) {
    purchaseForm.addEventListener("submit", (e) => {
      e.preventDefault();
      submitPurchaseForm();
    });
  }

  // Initial expiry render if tab is visible (unlikely on load, but safe)
  renderExpiry();
});

// ---------- Expiry Feature ----------
function daysBetween(a, b) {
  const d1 = new Date(a);
  d1.setHours(0, 0, 0, 0);
  const d2 = new Date(b);
  d2.setHours(0, 0, 0, 0);
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
}

function openExpiryModal(defaults) {
  if (!expiryModal) return;
  expiryModal.classList.remove("hide");
  setTimeout(() => expiryModal.classList.add("show"), 10);

  editExpiryId = null;
  const title = document.getElementById("expiryModalTitle");
  const submitBtn =
    expiryForm && expiryForm.querySelector('button[type="submit"]');
  if (defaults) {
    if (title) title.textContent = "Edit Expiry Item";
    if (submitBtn) submitBtn.textContent = "Update";
    expiryNameInput && (expiryNameInput.value = defaults.name || "");
    expiryDateInput &&
      setDateInputValue(expiryDateInput, toDateInputValue(defaults.expiry));
    editExpiryId = defaults.id;
  } else {
    if (title) title.textContent = "Add Expiry Item";
    if (submitBtn) submitBtn.textContent = "Save";
    if (expiryForm) expiryForm.reset();
    if (expiryDateInput) setDateInputValue(expiryDateInput, todayIsoDate());
  }

  // Focus on product name field with enhanced mobile handling
  if (expiryNameInput) {
    // Immediate focus attempt
    setTimeout(() => {
      expiryNameInput.focus();
      enhanceMobileFocus(expiryNameInput);
    }, 100);

    // Additional attempts for slower devices (especially iPhone)
    setTimeout(() => {
      expiryNameInput.focus();
      // Trigger touch events to wake up iOS keyboard
      if (navigator.userAgent.includes("iPhone")) {
        expiryNameInput.click();
        const touchEvent = new TouchEvent("touchstart", {
          bubbles: true,
          cancelable: true,
          view: window,
        });
        expiryNameInput.dispatchEvent(touchEvent);
      }
    }, 300);

    // Final attempt with scroll into view
    setTimeout(() => {
      expiryNameInput.focus();
      expiryNameInput.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 500);
  }
}

function closeExpiryModalFn() {
  if (!expiryModal) return;
  expiryModal.classList.remove("show");
  expiryModal.classList.add("hide");
}

function validateExpiry(name, dateStr) {
  if (!name || !name.trim()) return { ok: false, msg: "Name is required" };
  if (!dateStr) return { ok: false, msg: "Expiry date is required" };
  const d = new Date(dateStr);
  if (isNaN(d.getTime()))
    return { ok: false, msg: "Enter a valid expiry date" };
  return { ok: true };
}

function submitExpiryForm() {
  const name = ((expiryNameInput && expiryNameInput.value) || "").trim();
  const dateStr = expiryDateInput && expiryDateInput.value;
  const v = validateExpiry(name, dateStr);
  if (!v.ok) {
    hapticFeedback("error");
    return;
  }
  if (editExpiryId) {
    const idx = expiryData.findIndex((x) => x.id === editExpiryId);
    if (idx !== -1) {
      expiryData[idx] = { ...expiryData[idx], name, expiry: dateStr };
    }
  } else {
    expiryData.push({
      id: uid(),
      name,
      expiry: dateStr,
      createdAt: Date.now(),
    });
  }
  saveExpiry();
  renderExpiry();
  hapticFeedback("success");
  editExpiryId = null;
  const title = document.getElementById("expiryModalTitle");
  if (title) title.textContent = "Add Expiry Item";
  const submitBtn =
    expiryForm && expiryForm.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.textContent = "Save";
  closeExpiryModalFn();

  // After saving an expiry item, re-check notifications
  setTimeout(checkAndNotifyExpiringToday, 500);
}

function getExpiryIconSVG(size = 20) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="13" r="7"/>
    <path d="M12 10v4l2 2"/>
    <path d="M8 3h8"/>
    <path d="M9 3v2"/>
    <path d="M15 3v2"/>
  </svg>`;
}

function computeExpiryTotals() {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  // Start of week: Monday (or use locale Sunday?). We'll use Monday as start.
  const startOfWeek = new Date(startOfToday);
  const day = startOfWeek.getDay(); // 0 Sun..6 Sat
  const diffToMonday = day === 0 ? -6 : 1 - day; // move back to Monday
  startOfWeek.setDate(startOfWeek.getDate() + diffToMonday);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  // Month boundaries
  const startOfMonth = new Date(
    startOfToday.getFullYear(),
    startOfToday.getMonth(),
    1,
  );
  const endOfMonth = new Date(
    startOfToday.getFullYear(),
    startOfToday.getMonth() + 1,
    0,
  );
  endOfMonth.setHours(23, 59, 59, 999);

  // Year boundaries
  const startOfYear = new Date(startOfToday.getFullYear(), 0, 1);
  const endOfYear = new Date(startOfToday.getFullYear(), 11, 31);
  endOfYear.setHours(23, 59, 59, 999);

  const inRange = (d, a, b) => d >= a && d <= b;

  let today = 0,
    week = 0,
    month = 0,
    year = 0;
  for (const e of expiryData) {
    const d = new Date(e.expiry);
    if (isNaN(d)) continue;
    const dd = new Date(d);
    dd.setHours(0, 0, 0, 0);
    if (inRange(dd, startOfToday, endOfToday)) today++;
    if (inRange(dd, startOfWeek, endOfWeek)) week++;
    if (inRange(dd, startOfMonth, endOfMonth)) month++;
    if (inRange(dd, startOfYear, endOfYear)) year++;
  }

  if (expiryTodayEl) expiryTodayEl.textContent = String(today);
  if (expiryWeekEl) expiryWeekEl.textContent = String(week);
  if (expiryMonthEl) expiryMonthEl.textContent = String(month);
  if (expiryYearEl) expiryYearEl.textContent = String(year);
}

function renderExpiry() {
  if (!expiryListEl) return;
  computeExpiryTotals();

  if (!expiryData.length) {
    expiryListEl.innerHTML =
      '<div style="color:var(--muted);padding:12px">No products added</div>';
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const items = expiryData
    .slice()
    .sort((a, b) => new Date(a.expiry) - new Date(b.expiry));
  expiryListEl.innerHTML = "";
  for (const item of items) {
    const d = new Date(item.expiry);
    d.setHours(0, 0, 0, 0);
    const diff = daysBetween(today, d); // positive = days left, negative = expired
    const statusText =
      diff < 0
        ? `${Math.abs(diff)} day${Math.abs(diff) === 1 ? "" : "s"} ago`
        : diff === 0
          ? "Today"
          : `${diff} day${diff === 1 ? "" : "s"} left`;
    const pct = Math.max(
      0,
      Math.min(
        100,
        Math.round((1 - Math.min(Math.max(diff, 0), 30) / 30) * 100),
      ),
    );

    const row = document.createElement("div");
    row.className = "tx";
    const meta = document.createElement("div");
    meta.className = "meta";
    const box = document.createElement("div");
    box.className = "iconBox";
    box.innerHTML = getExpiryIconSVG(20);
    const info = document.createElement("div");
    const title = document.createElement("div");
    title.className = "title";
    title.textContent = item.name || "Product";
    const subtitle = document.createElement("div");
    subtitle.className = "category";
    subtitle.textContent = `Expires ${formatDateDisplay(
      item.expiry,
    )} · ${statusText}`;
    info.appendChild(title);
    info.appendChild(subtitle);
    meta.appendChild(box);
    meta.appendChild(info);

    const right = document.createElement("div");
    right.style.minWidth = "120px";
    right.style.display = "flex";
    right.style.flexDirection = "column";
    right.style.alignItems = "flex-end";

    const bar = document.createElement("div");
    bar.className = "expiry-progress";
    const barInner = document.createElement("div");
    barInner.className = "expiry-progress-bar";
    barInner.style.width = `${pct}%`;
    if (diff < 0) barInner.classList.add("expired");
    bar.appendChild(barInner);

    const small = document.createElement("div");
    small.className = "expiry-small";
    small.textContent = statusText;

    right.appendChild(bar);
    right.appendChild(small);

    row.appendChild(meta);
    row.appendChild(right);

    // Swipe-to-delete gesture handling
    let startX = 0;
    let startY = 0;
    let dx = 0;
    let dy = 0;
    let swiping = false;
    let moved = false;

    function resetTransform() {
      row.style.transition = "transform 0.2s ease";
      row.style.transform = "translateX(0)";
      setTimeout(() => (row.style.transition = ""), 220);
    }

    row.addEventListener(
      "touchstart",
      (e) => {
        if (!e.touches || e.touches.length === 0) return;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        dx = 0;
        dy = 0;
        swiping = false;
        moved = false;
        row.style.transition = ""; // disable during drag
      },
      { passive: true },
    );

    row.addEventListener(
      "touchmove",
      (e) => {
        if (!e.touches || e.touches.length === 0) return;
        dx = e.touches[0].clientX - startX;
        dy = e.touches[0].clientY - startY;

        // Only consider it a swipe if horizontal movement is dominant
        if (Math.abs(dx) > Math.abs(dy) && dx < -10) {
          swiping = true;
        }
        if (Math.abs(dx) > 6 || Math.abs(dy) > 6) moved = true;

        if (swiping) {
          e.preventDefault(); // Prevent scrolling when swiping
          const limited = Math.max(dx, -120);
          row.style.transform = `translateX(${limited}px)`;
        }
        // If not swiping (vertical scroll), allow default behavior
      },
      { passive: false },
    );

    row.addEventListener("touchend", () => {
      if (swiping && dx <= -80) {
        hapticFeedback("medium");
        if (confirm("Delete this item?")) {
          hapticFeedback("heavy");
          expiryData = expiryData.filter((x) => x.id !== item.id);
          saveExpiry();
          renderExpiry();
          return; // element removed; do not animate back
        }
      }
      resetTransform();
    });

    // Click to edit (ignore if a swipe occurred)
    row.addEventListener("click", () => {
      if (moved) return; // don't treat swipe as click
      openExpiryModal({ id: item.id, name: item.name, expiry: item.expiry });
    });

    // Long press context menu to delete (fallback)
    row.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      if (confirm("Delete this item?")) {
        expiryData = expiryData.filter((x) => x.id !== item.id);
        saveExpiry();
        renderExpiry();
      }
    });

    expiryListEl.appendChild(row);
  }
}

// Add event listeners for clickable navigation areas under add button
const underAddSummary = document.getElementById("underAddSummary");
const underAddExpiry = document.getElementById("underAddExpiry");

if (underAddSummary) {
  underAddSummary.addEventListener("click", () => {
    hapticFeedback("light");
    switchTab("summary");
  });
}

if (underAddExpiry) {
  underAddExpiry.addEventListener("click", () => {
    hapticFeedback("light");
    switchTab("expiry");
  });
}
