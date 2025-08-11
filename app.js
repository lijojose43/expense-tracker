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
const searchInput = $("search");
// Tabs and title
const screenTitle = $("screenTitle");
const homeTabEl = $("homeTab");
const summaryTabEl = $("summaryTab");
const tabHome = $("tabHome");
const tabSummary = $("tabSummary");
let donutChart = null;

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
  for (const t of data) {
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
  for (const t of data) {
    if (t.type !== "expense") continue;
    const cat = t.category || "Other";
    map.set(cat, (map.get(cat) || 0) + Math.abs(Number(t.amount)));
  }
  const labels = Array.from(map.keys());
  const values = Array.from(map.values());
  return { labels, values };
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
          backgroundColor: labels.map(
            (_, i) => palette[i % palette.length]
          ) || ["#e5e7eb"],
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
    screenTitle.textContent = "Home";
    addBtn.style.display = "";
  } else {
    homeTabEl.classList.add("hidden");
    summaryTabEl.classList.remove("hidden");
    tabHome.classList.remove("active");
    tabSummary.classList.add("active");
    screenTitle.textContent = "Summary";
    addBtn.style.display = "none";
    // ensure chart reflects latest data
    renderDonut();
  }
}

function renderList() {
  transactionsEl.innerHTML = "";
  const ft = filterType.value;
  const fc = filterCategory.value;
  const q = searchInput.value.trim().toLowerCase();
  const list = data
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .filter((t) => {
      if (ft !== "all" && t.type !== ft) return false;
      if (fc !== "all" && t.category !== fc) return false;
      if (
        q &&
        !(t.description || "").toLowerCase().includes(q) &&
        !(t.category || "").toLowerCase().includes(q)
      )
        return false;
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
    cat.textContent = t.category + " · " + t.date;
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
    el.appendChild(meta);
    el.appendChild(amt);
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
    $("date").value = defaults.date;
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
  openModal();
});
$("backBtn").addEventListener("click", () => {
  alert("Back pressed — integrate with routing if needed.");
});
closeModal.addEventListener("click", closeModalFn);
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
  const tx = {
    id: uid(),
    amount: Math.abs(amount),
    type,
    category,
    date,
    description,
  };
  // if amount negative and type expense, convert accordingly - UI expects positive and type denotes sign
  data.push(tx);
  save();
  populateCategories();
  computeTotals();
  renderList();
  // update chart if on summary tab
  if (!summaryTabEl.classList.contains("hidden")) renderDonut();
  closeModalFn();
});

filterType.addEventListener("change", renderList);
filterCategory.addEventListener("change", renderList);
searchInput.addEventListener("input", renderList);

document.addEventListener("DOMContentLoaded", () => {
  populateCategories();
  computeTotals();
  renderList();
  // initial chart render (will no-op if canvas missing)
  renderDonut();
});
