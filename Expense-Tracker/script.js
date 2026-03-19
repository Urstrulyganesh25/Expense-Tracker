let expenses = [];
let currency = "USD";

function init() {
    const expenseForm = document.getElementById("expense-form");
    const currencySelect = document.getElementById("currency");
    const themeToggle = document.getElementById("theme-toggle");

    if (expenseForm) {
        expenseForm.addEventListener("submit", onExpenseSubmit);
    }

    if (currencySelect) {
        currencySelect.addEventListener("change", (e) => {
            currency = e.target.value;
            fetchConversion();
        });
    }

    if (themeToggle) {
        themeToggle.addEventListener("click", toggleTheme);
    }

    // Load saved theme
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
        document.documentElement.setAttribute("data-theme", savedTheme);
        updateThemeButton(savedTheme);
    }

    updateUI();
}

function onExpenseSubmit(e) {
    e.preventDefault();

    const name = document.getElementById("name").value.trim();
    const amount = Number(document.getElementById("amount").value);
    const category = document.getElementById("category").value;

    if (!name || !Number.isFinite(amount) || amount <= 0) return;

    const expense = {
        id: Date.now(),
        name,
        amount,
        category
    };

    expenses.push(expense);
    updateUI();
    e.target.reset();
}

// Delete Expense
function deleteExpense(id) {
    const card = document.querySelector(`#expense-list .card button[onclick*="${id}"]`).parentElement;
    if (card) {
        card.classList.add('fade-out');
        setTimeout(() => {
            expenses = expenses.filter(exp => exp.id !== id);
            card.remove();
            updateSummary();
            fetchConversion();
        }, 500);
    }
}

// Update UI
function updateUI() {
    renderExpenses();
    updateSummary();
    fetchConversion();
}

// Render Expenses
function renderExpenses() {
    const list = document.getElementById("expense-list");
    if (!list) return;

    list.style.display = "block";
    list.innerHTML = "";

    if (expenses.length === 0) {
        list.innerHTML = "<p>No expenses added yet.</p>";
        return;
    }

    expenses.forEach(exp => {
        const div = document.createElement("div");
        const category = (exp.category || "").toString().toLowerCase();
        const amount = Number(exp.amount) || 0;

        div.className = `card card-${category}`;

        div.innerHTML = `
      <span>${exp.name} - ${exp.category} - $${amount.toFixed(2)}</span>
      <button onclick="deleteExpense(${exp.id})">Delete</button>
    `;

        list.appendChild(div);
    });
}

// Update Summary
function updateSummary() {
    const total = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    const totalBadge = document.getElementById("total-badge");
    totalBadge.innerText = `$${total.toFixed(2)}`;
    totalBadge.classList.add('update');
    setTimeout(() => totalBadge.classList.remove('update'), 500);

    const currencySelect = document.getElementById("currency");
    const convertedElement = document.getElementById("converted-badge");
    const convertedText = document.getElementById("converted");

    // Disable conversion control when there are no expenses
    if (currencySelect) {
        currencySelect.disabled = total === 0;
    }

    const breakdown = expenses.reduce((acc, curr) => {
        acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
        return acc;
    }, {});

    const breakdownDiv = document.getElementById("breakdown");
    breakdownDiv.innerHTML = "";
    for (let cat in breakdown) {
        const p = document.createElement("p");
        p.innerText = `${cat}: $${breakdown[cat].toFixed(2)}`;
        p.className = `breakdown-${cat.toLowerCase()}`;
        breakdownDiv.appendChild(p);
    }

    // Update converted badge/content
    if (total === 0) {
        window.convertedValue = undefined;
        if (convertedElement) convertedElement.innerText = `0`;
        if (convertedText) convertedText.innerText = "";
        return;
    }

    if (convertedElement && window.convertedValue != null) {
        convertedElement.innerText = `${window.convertedValue.toFixed(2)} ${currency}`;
        convertedElement.classList.add('update');
        setTimeout(() => convertedElement.classList.remove('update'), 500);
    } else if (convertedElement) {
        convertedElement.innerText = `-`;
    }
}

// Currency Conversion is handled via init() after DOM is ready

async function fetchConversion() {
    const total = expenses.reduce((acc, curr) => acc + curr.amount, 0);
    if (total === 0) {
        document.getElementById("converted-badge").innerText = `0`;
        return;
    }

    const convertedText = document.getElementById("converted");
    convertedText.innerText = "Converting...";

    try {
        const res = await fetch(`https://api.frankfurter.app/latest?amount=${total}&from=USD&to=${currency}`);
        if (!res.ok) throw new Error("API failed");
        const data = await res.json();
        const converted = data.rates[currency];
        window.convertedValue = converted; // store globally for badge
        convertedText.innerText = `Converted: ${converted.toFixed(2)} ${currency}`;
        updateSummary(); // refresh badge
    } catch {
        convertedText.innerText = "Conversion failed";
    }
}

// Initialize UI state on load (ensure conversion controls are disabled when there are no expenses)
window.addEventListener("DOMContentLoaded", init);

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    const newTheme = currentTheme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", newTheme);
    localStorage.setItem("theme", newTheme);
    updateThemeButton(newTheme);
}

function updateThemeButton(theme) {
    const themeToggle = document.getElementById("theme-toggle");
    if (theme === "dark") {
        themeToggle.innerText = "☀️ Light Mode";
    } else {
        themeToggle.innerText = "🌙 Dark Mode";
    }
}
