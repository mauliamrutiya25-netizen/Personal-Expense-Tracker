
function initTheme() {
    const themeBtn = document.getElementById('theme-toggle');
    //  <button id="theme-toggle" class="theme-toggle-btn" title="Toggle Theme">
    //             <i class="fas fa-moon"></i>
    //         </button>
    const savedTheme = localStorage.getItem('theme');
    
    //- localStorage.setItem('theme', ...) writes the theme choice into the browser’s memory.
//- localStorage.getItem('theme') reads it back the next time the page loads.


    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');  //style.css 
        if (themeBtn) themeBtn.querySelector('i').classList.replace('fa-moon', 'fa-sun');
    }

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
            const isLight = document.body.classList.contains('light-mode');
            localStorage.setItem('theme', isLight ? 'light' : 'dark');

            // Icon
            const icon = themeBtn.querySelector('i');
            if (isLight) {
                icon.classList.replace('fa-moon', 'fa-sun');
            } else {
                icon.classList.replace('fa-sun', 'fa-moon');
            }

            // Redraw charts to update colors if needed
            const transactions = getTransactions();
            drawTrendChart(transactions);
            drawChart(transactions);
        });
    }
}
initTheme();


// --- Data Management ---
function getTransactions() {
    const user = auth.getCurrentUser();
    //   getCurrentUser() {
    //     return this.currentUser;    //this.currentUser=user
    // }
    if (!user) return [];

    const key = `expenses_${user.username}`;
    return JSON.parse(localStorage.getItem(key)) || [];  //Stores/reads data as JSON for structured storage.
}

function saveTransactions(transactions) {
    const user = auth.getCurrentUser();
    if (!user) return;

    const key = `expenses_${user.username}`;
    localStorage.setItem(key, JSON.stringify(transactions));
}

function getBudget() {
    const user = auth.getCurrentUser();
    if (!user) return 0;

    const key = `budget_${user.username}`;
    return parseFloat(localStorage.getItem(key)) || 0;
}

function saveBudget(amount) {
    const user = auth.getCurrentUser();
    if (!user) return;

    const key = `budget_${user.username}`;
    localStorage.setItem(key, amount);
}

// --- Page Specific Logic ---
// pathname It detects the current page’s URL so your script can execute page-specific logic automatically. Without it, you’d have to include separate scripts for every page.
const path = window.location.pathname;
const page = path.split('/').pop();

if (page === 'dashboard.html') {
    initDashboard();
} else if (page === 'add.html') {
    initAddPage();
} else if (page === 'transactions.html') {
    initTransactionsPage();
}

//this page => Detects which page is loaded.

// Runs the appropriate page-specific initialization function:

// initDashboard() → dashboard.html

// initAddPage() → add.html

// initTransactionsPage() → transactions.html

// Makes script.js universal across all pages.

// --- Dashboard Functions ---
function initDashboard() {
    const transactions = getTransactions();    
    const budget = getBudget();

    // Calculate Totals
    const totalIncome = transactions  //  const transactions = getTransactions();
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

//         [  for  const totalIncome and  const totalExpense
//   {id:1, type:'income', amount:'5000', category:'Salary', date:'2026-02-18'},
//   {id:2, type:'expense', amount:'1500', category:'Food', date:'2026-02-18'},
//   {id:3, type:'expense', amount:'300', category:'Transport', date:'2026-02-18'},
//   {id:4, type:'income', amount:'2000', category:'Freelance', date:'2026-02-10'}
// ]


    const balance = totalIncome - totalExpense;

    // Update UI Stats
    document.getElementById('total-balance').textContent = `₹${balance.toFixed(2)}`;
    document.getElementById('total-income').textContent = `₹${totalIncome.toFixed(2)}`;
    document.getElementById('total-expense').textContent = `₹${totalExpense.toFixed(2)}`;

    // Update Budget UI
    updateBudgetUI(budget, totalExpense, transactions);

    // Update Charts & Analytics
    drawChart(transactions);
    drawTrendChart(transactions);
    renderCategoryTotals(transactions);
    renderInsights(transactions);

//     Calls analytics functions:

// drawChart() → pie chart of categories

// drawTrendChart() → line chart of income/expense trend

// renderCategoryTotals() → list of category totals

// renderInsights() → highest category, avg daily expense, total transactions

// Handles budget editing UI & form submission

    // Recent Transactions (Last 5)
    renderList(transactions.slice(-5).reverse(), 'recent-list', false);

    // Budget Event Listeners
    const budgetForm = document.getElementById('budget-form');
    if (budgetForm) {
        budgetForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const val = document.getElementById('budget-input').value;
            if (val > 0) {
                saveBudget(val);
                initDashboard(); // Reload UI
            }
        });

        document.getElementById('edit-budget-btn').addEventListener('click', () => {
            document.getElementById('budget-form').classList.remove('hidden');
            document.getElementById('budget-display-area').classList.add('hidden');
        });
    }
}

function updateBudgetUI(budget, totalExpense, transactions) {
    const now = new Date();
    const currentMonthExpenses = transactions
        .filter(t => t.type === 'expense')
        .filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

    const budgetDisplayArea = document.getElementById('budget-display-area');
    const budgetForm = document.getElementById('budget-form');

    if (budget > 0) {
        budgetForm.classList.add('hidden');
        budgetDisplayArea.classList.remove('hidden');

        document.getElementById('budget-amount').textContent = `₹${budget.toFixed(2)}`;
        const left = budget - currentMonthExpenses;
        document.getElementById('budget-left').textContent = `₹${left.toFixed(2)}`;

        const percent = Math.min((currentMonthExpenses / budget) * 100, 100);
        const bar = document.getElementById('budget-progress');
        bar.style.width = `${percent}%`;

       const status = document.getElementById('budget-status');
       if (!status) return;

        if (percent >= 100) {
            bar.style.backgroundColor = 'var(--danger-color)';
            status.textContent = "Warning: Budget Exceeded!";
            status.style.color = 'var(--danger-color)';
            status.style.fontWeight = 'bold';
        } else if (percent >= 80) {
            bar.style.backgroundColor = 'var(--warning-color)';
            status.textContent = "Warning: Nearing Limit";
            status.style.color = 'var(--warning-color)';
        } else {
            bar.style.backgroundColor = 'var(--success-color)';
            status.textContent = "On Track";
            status.style.color = 'var(--text-secondary)';
        }

    } else {
        budgetForm.classList.remove('hidden');
        budgetDisplayArea.classList.add('hidden');
    }
//     Shows progress bar of budget usage for current month.

// Updates status text depending on usage (on track, nearing limit, exceeded).

// Hides/shows budget form based on whether a budget is set.
}



// --- Analytics Functions ---

function renderCategoryTotals(transactions) {
    const list = document.getElementById('category-totals-list');
    if (!list) return;

    // Filter expenses only
    const expenses = transactions.filter(t => t.type === 'expense');

    // Aggregate
    const totals = {};
    expenses.forEach(t => {
        totals[t.category] = (totals[t.category] || 0) + parseFloat(t.amount);
    });

    // Sort by Amount Descending
    const sortedCategories = Object.entries(totals)
        .sort((a, b) => b[1] - a[1]);

    list.innerHTML = '';

    if (sortedCategories.length === 0) {
        list.innerHTML = '<li style="justify-content:center; color: var(--text-secondary);">No data</li>';
        return;
    }

    sortedCategories.forEach(([category, amount]) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span class="cat-name"><i class="fas fa-dot-circle"></i> ${category}</span>
            <span class="cat-amount">₹${amount.toFixed(2)}</span>
        `;
        list.appendChild(li);
    });
//     Shows a list of expenses grouped by category.

// Sorted descending by amount.
}

function renderInsights(transactions) {
    if (!document.getElementById('insight-highest')) return;

    const expenses = transactions.filter(t => t.type === 'expense');

    // 1. Highest Category
    const totals = {};
    expenses.forEach(t => {
        totals[t.category] = (totals[t.category] || 0) + parseFloat(t.amount);
    });
    const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]);
    const highestCat = sorted.length > 0 ? sorted[0][0] : 'N/A';
    document.getElementById('insight-highest').textContent = highestCat;

    // 2. Avg Daily Expense (This Month)
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const currentDay = now.getDate(); // Use current day for "to-date" average, or daysInMonth for simple div?
    // Let's use current day to keep it relevant to "spending pace".

    const thisMonthExpenses = expenses.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((sum, t) => sum + parseFloat(t.amount), 0);

    // Watch out for division by zero on day 1 if we strictly used (currentDay - 1)
    // Simply use currentDay. If it's day 1, divide by 1.
    const avg = currentDay > 0 ? (thisMonthExpenses / currentDay) : 0;
    document.getElementById('insight-avg').textContent = `₹${avg.toFixed(2)}`;

    // 3. Total Transactions
    document.getElementById('insight-count').textContent = transactions.length;
//     Highest spending category
// Average daily expense (current month)
// Total transaction count
}

function drawTrendChart(transactions)
 {
    const canvas = document.getElementById('trend-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Basic layout dimensions
    const padding = 60;
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Prepare Data: Group by Month (Last 6 Months)
    const months = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        months.push({
            name: d.toLocaleString('default', { month: 'short' }),
            year: d.getFullYear(),
            monthIdx: d.getMonth(),
            income: 0,
            expense: 0
        });
    }

    transactions.forEach(t => {
        const d = new Date(t.date);
        const m = months.find(m => m.monthIdx === d.getMonth() && m.year === d.getFullYear());
        if (m) {
            if (t.type === 'income') m.income += parseFloat(t.amount);
            if (t.type === 'expense') m.expense += parseFloat(t.amount);
        }
    });

    const maxVal = Math.max(
        ...months.map(m => m.income),
        ...months.map(m => m.expense),
        100 // Minimum scale
    );

    // Helper: Map value to Y coordinates & X coordinates
    // Y-axis inverted (0 at top, height at bottom)
    const chartHeight = height - 2 * padding;
    const chartWidth = width - 2 * padding;

    const mapY = (val) => (height - padding) - (val / maxVal) * chartHeight;
    const mapX = (idx) => padding + (idx / (months.length - 1)) * chartWidth;

    // --- DRAW GRID LINES & LABELS ---
    ctx.beginPath();
    ctx.strokeStyle = document.body.classList.contains('light-mode') ? '#e2e8f0' : '#334155'; // Adaptive Grid Color
    ctx.lineWidth = 1;
    ctx.font = '10px Outfit';
    ctx.fillStyle = document.body.classList.contains('light-mode') ? '#64748b' : '#94a3b8'; // Adaptive Text Color
    ctx.textAlign = 'right';

    const gridLines = 5;
    for (let i = 0; i <= gridLines; i++) {
        const val = (maxVal / gridLines) * i;
        const y = mapY(val);

        // Grid Line
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);

        // Y-Axis Label
        ctx.fillText(`₹${Math.round(val)}`, padding - 5, y + 3);
    }
    ctx.stroke();

    // X-Axis Labels (Months)
    ctx.textAlign = 'center';
    months.forEach((m, i) => {
        const x = mapX(i);
        ctx.fillText(m.name, x, height - padding + 30);
    });

    // --- DRAW LINES (Helper) ---
    function drawLine(dataKey, color, fillColor) {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        // Start path
        months.forEach((m, i) => {
            const x = mapX(i);
            const y = mapY(m[dataKey]);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Optional: Gradient Fill
        if (fillColor) {
            const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
            gradient.addColorStop(0, fillColor.start);
            gradient.addColorStop(1, fillColor.end);

            ctx.lineTo(mapX(months.length - 1), height - padding); // Bottom Right
            ctx.lineTo(padding, height - padding); // Bottom Left
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.globalAlpha = 0.2; // Transparent fill
            ctx.fill();
            ctx.globalAlpha = 1.0; // Reset
        }

        // Draw Dots
        months.forEach((m, i) => {
            const x = mapX(i);
            const y = mapY(m[dataKey]);
            ctx.beginPath();
            ctx.fillStyle = document.body.classList.contains('light-mode') ? '#fff' : '#0f172a'; // Dot Center (bg color)
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });
    }

    // Draw Income (Green)
    drawLine('income', '#22c55e', { start: 'rgba(34, 197, 94, 0.5)', end: 'rgba(34, 197, 94, 0.0)' });

    // Draw Expense (Red)
    drawLine('expense', '#ef4444', { start: 'rgba(239, 68, 68, 0.5)', end: 'rgba(239, 68, 68, 0.0)' });

    // Charts
// Pie chart (drawChart) → expenses by category.
// Trend chart (drawTrendChart) → income & expense trends over last 6 months.
// Both update dynamically when data changes or theme toggles
}


// --- Add/Edit Page Functions ---
function initAddPage() {
    const typeBtns = document.querySelectorAll('.toggle-btn');
    const categorySelect = document.getElementById('category');
    const typeInput = document.getElementById('type');
    const pageTitle = document.getElementById('page-title');
    const saveBtn = document.getElementById('save-btn');
    const editIdInput = document.getElementById('edit-id');

    // Categories
    const expenseCategories = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Utilities', 'Health', 'Rent', 'Education', 'Other'];
    const incomeCategories = ['Salary', 'Freelance', 'Investment', 'Business', 'Gift', 'Other'];

    function populateCategories(type, selectedCategory = null) {
        categorySelect.innerHTML = '';
        const cats = type === 'expense' ? expenseCategories : incomeCategories;
        cats.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c;
            opt.textContent = c;
            if (c === selectedCategory) opt.selected = true;
            categorySelect.appendChild(opt);
        });
    }


    typeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (editIdInput.value) return; // Disable toggle in edit mode (optional, but simplifies logic)

            typeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const type = btn.dataset.type;
            typeInput.value = type;
            populateCategories(type);
        });
    });

    // Check for Edit Mode (URL params)
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('id');

    if (editId) {
        // Edit Mode
        const transactions = getTransactions();
        const itemToEdit = transactions.find(t => t.id == editId);

        if (itemToEdit) {
            pageTitle.textContent = "Edit Transaction";
            saveBtn.textContent = "Update Transaction";
            editIdInput.value = itemToEdit.id;

            typeInput.value = itemToEdit.type;
            // Set toggle
            typeBtns.forEach(b => {
                b.classList.remove('active');
                if (b.dataset.type === itemToEdit.type) b.classList.add('active');
            });

            populateCategories(itemToEdit.type, itemToEdit.category);

            document.getElementById('amount').value = itemToEdit.amount;
            document.getElementById('description').value = itemToEdit.description;
            document.getElementById('date').value = itemToEdit.date;
        }
    } else {
        // Add Mode
        populateCategories('expense'); // Default
        document.getElementById('date').valueAsDate = new Date();
    }

    // Form Submit
    document.getElementById('transaction-form').addEventListener('submit', (e) => {
        e.preventDefault();

        const id = editIdInput.value ? parseInt(editIdInput.value) : Date.now();
        const type = typeInput.value;
        const amount = document.getElementById('amount').value;
        const description = document.getElementById('description').value;
        const category = document.getElementById('category').value;
        const date = document.getElementById('date').value;

        const transaction = {
            id,
            type,
            amount,
            description,
            category,
            date
        };

        let transactions = getTransactions();

        if (editIdInput.value) {
            // Update existing
            const index = transactions.findIndex(t => t.id == id);
            if (index !== -1) {
                transactions[index] = transaction;
                alert('Transaction Updated!');
            }
        } else {
            // Add new
            transactions.push(transaction);
            alert('Transaction Saved!');
        }

        saveTransactions(transactions);

        // Redirect back if editing, or reset if adding
        if (editIdInput.value) {
            window.location.href = 'transactions.html';
        } else {
            document.getElementById('amount').value = '';
            document.getElementById('description').value = '';
        }
    });
//     Handles adding new transactions or editing existing ones.
// Dynamically populates categories based on type (income or expense).
// Handles form submission:
// New transaction → push to array
// Edit → replace existing transaction
// Uses localStorage per user via saveTransactions.
}

// --- Transactions Page Functions ---
function initTransactionsPage() {
    const listEl = document.getElementById('expense-list');
    const filterType = document.getElementById('filter-type');
    const filterPeriod = document.getElementById('filter-period');
    const searchInput = document.getElementById('search-input');

    function loadAndRender() {
        let transactions = getTransactions();

        // Search Filter
        const query = searchInput.value.toLowerCase();
        if (query) {
            transactions = transactions.filter(t =>
                t.description.toLowerCase().includes(query) ||
                t.category.toLowerCase().includes(query)
            );
        }

        // Filter Type
        if (filterType.value !== 'all') {
            transactions = transactions.filter(t => t.type === filterType.value);
        }

        // Filter Period
        if (filterPeriod.value !== 'all') {
            const now = new Date();
            const currentMonth = now.getMonth();
            const currentYear = now.getFullYear();

            transactions = transactions.filter(t => {
                const d = new Date(t.date);
                if (filterPeriod.value === 'month') {
                    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                } else if (filterPeriod.value === 'week') {
                    const oneWeekAgo = new Date();
                    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                    return d >= oneWeekAgo;
                }
                return true;
            });
        }

        // Render (Reverse to show newest first)
        renderList(transactions.reverse(), 'expense-list', true);
    }

    filterType.addEventListener('change', loadAndRender);
    filterPeriod.addEventListener('change', loadAndRender);
    searchInput.addEventListener('input', loadAndRender); // Search on typing

    loadAndRender();
//     Loads all transactions for current user.
// Allows filtering:
// By type (income/expense)
// By period (week/month/all)
// By search text
// Uses renderList() to display transactions with edit/delete buttons.
}

// --- Shared Helpers ---
function renderList(transactions, elementId, allowActions) {
    const list = document.getElementById(elementId);
    if (!list) return;

    list.innerHTML = '';

    if (transactions.length === 0) {
        list.innerHTML = `
            <li class="empty-state">
                <i class="fas fa-receipt"></i>
                <p>No transactions found.</p>
            </li>
        `;
        return;
    }

    transactions.forEach(t => {
        const li = document.createElement('li');
        li.className = 'expense-item';

        // Sign based on type
        const sign = t.type === 'expense' ? '-' : '+';
        const amountClass = t.type === 'expense' ? 'expense' : 'income';

        li.innerHTML = `
            <div class="expense-info">
                <span class="expense-desc">${t.description}</span>
                <div class="expense-meta">
                    <span><i class="far fa-calendar-alt"></i> ${t.date}</span>
                    <span class="category-tag"><i class="fas fa-tag"></i> ${t.category}</span>
                </div>
            </div>
            <div class="expense-actions">
                <span class="expense-amount ${amountClass}">${sign}₹${parseFloat(t.amount).toFixed(2)}</span>
                ${allowActions ? `
                    <a href="add.html?id=${t.id}" class="btn-action btn-edit" title="Edit"><i class="fas fa-edit"></i></a>
                    <button class="btn-action btn-delete" onclick="deleteTransaction(${t.id})" title="Delete"><i class="fas fa-trash"></i></button>
                ` : ''}
            </div>
        `;
        list.appendChild(li);
    });
//     Dynamically builds HTML list of transactions.

// Shows edit/delete buttons if allowActions is true.
}

window.deleteTransaction = function (id) {
    if (confirm('Delete this transaction?')) {
        let transactions = getTransactions();
        transactions = transactions.filter(t => t.id !== id);
        saveTransactions(transactions);

        // Re-init current page to refresh list
        if (page === 'transactions.html') {
            initTransactionsPage();
        } else if (page === 'dashboard.html') {
            initDashboard();
        }
    }
//     Deletes transaction by ID.

// Re-initializes current page to refresh list.
};

function drawChart(transactions) {
    const canvas = document.getElementById('expense-chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Aggregate by Category (Expenses Only)
    const expenses = transactions.filter(t => t.type === 'expense');

    const categories = {};
    expenses.forEach(e => {
        categories[e.category] = (categories[e.category] || 0) + parseFloat(e.amount);
    });

    const labels = Object.keys(categories);
    const data = Object.values(categories);
    const total = data.reduce((a, b) => a + b, 0);

    // Clear and Redraw
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (total === 0) {
        ctx.font = "14px Outfit";
        ctx.fillStyle = "#94a3b8";
        ctx.textAlign = "center";
        ctx.fillText("No expenses to display", canvas.width / 2, canvas.height / 2);
        return;
    }

    const colors = ['#38bdf8', '#a855f7', '#f472b6', '#22c55e', '#eab308', '#ef4444', '#f97316', '#64748b'];

    let startAngle = 0;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const outerRadius = Math.min(centerX, centerY) - 10;

    const actualInnerRadius = 0;

    labels.forEach((label, i) => {
        const sliceAngle = (data[i] / total) * 2 * Math.PI;
        // Handle single item 100% case
        if (data.length === 1) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, outerRadius, 0, 2 * Math.PI);
            ctx.lineTo(centerX, centerY);
            ctx.fillStyle = colors[0];
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, outerRadius, startAngle, startAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = colors[i % colors.length];
            ctx.fill();
            startAngle += sliceAngle;
        }
    });

    // Legend
    const legendContainer = document.getElementById('chart-legend');
    if (legendContainer) {
        legendContainer.innerHTML = '';
        labels.forEach((label, i) => {
            const div = document.createElement('div');
            div.className = 'legend-item';
            div.innerHTML = `
                <span class="legend-color" style="background-color: ${colors[i % colors.length]}"></span>
                ${label} (${Math.round((data[i] / total) * 100)}%)
            `;
            legendContainer.appendChild(div);
        });
    }
}

// Canvas Resize
function resizeCanvas() {
    const canvas = document.getElementById('expense-chart');
    if (canvas) {
        const container = canvas.parentElement;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        const transactions = getTransactions();
        drawChart(transactions); // Redraw main chart
        drawTrendChart(transactions); // Redraw Trend Chart
    }

    const trendCanvas = document.getElementById('trend-chart');
    if (trendCanvas) {
        const container = trendCanvas.parentElement;
        trendCanvas.width = container.clientWidth;
        trendCanvas.height = container.clientHeight;
        const transactions = getTransactions();
        drawTrendChart(transactions);
    }
}
// Dynamically resizes chart canvas to fit parent container.
// Redraws charts after resizing or theme change.
// Ensures responsive design.
window.addEventListener('resize', resizeCanvas);
setTimeout(resizeCanvas, 100);







// Feature            	Purpose
// Theme toggle	Light/dark mode with persistent storage
// Data helpers	Get/save user transactions & budget
// Page detection (path)	Dynamically run page-specific code
// Dashboard functions	Show totals, charts, budget progress, insights
// Add/Edit page	Add or edit transactions with proper category selection
// Transactions page	Filter, search, list transactions
// Shared helpers	Render transaction lists, delete functionality
// Chart rendering	Visual analytics for user data
// Responsive design	Resize charts dynamically on window resize