import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "https://broke-but-functional-swart.vercel.app";

const initialTransactions = [
  { id: 1, name: "Grocery shopping", category: "Food", amount: 850, day: "Today", icon: "🛒" },
  { id: 2, name: "Metro recharge", category: "Transport", amount: 300, day: "Today", icon: "🚇" },
  { id: 3, name: "Coffee with friends", category: "Lifestyle", amount: 180, day: "Yesterday", icon: "☕" },
  { id: 4, name: "Monthly mobile plan", category: "Bills", amount: 299, day: "Yesterday", icon: "📱" },
];

const money = (n) =>
  "₹" + Math.abs(Number(n) || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

const categoryIcons = {
  Food: "🍲",
  Transport: "🚌",
  Bills: "📱",
  Lifestyle: "✨",
};

function loadSaved(key, fallback, validate = () => true) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const value = JSON.parse(raw);
    return validate(value) ? value : fallback;
  } catch {
    return fallback;
  }
}

function App() {
  const [budget, setBudget] = useState(() =>
    loadSaved("broke-budget", 10000, (v) =>
      typeof v === "number" && Number.isFinite(v) && v > 0
    )
  );

  const [transactions, setTransactions] = useState(() =>
    loadSaved("broke-transactions", initialTransactions, (v) =>
      Array.isArray(v) &&
      v.every((t) =>
        t &&
        typeof t.id !== "undefined" &&
        typeof t.name === "string" &&
        typeof t.category === "string" &&
        Number.isFinite(t.amount) &&
        t.amount > 0
      )
    )
  );

  const [goal, setGoal] = useState(() =>
    loadSaved("broke-goal", 2000, (v) =>
      typeof v === "number" && Number.isFinite(v) && v >= 500 && v <= 10000
    )
  );

  const [saved, setSaved] = useState(() =>
    loadSaved("broke-savings", 0, (v) =>
      typeof v === "number" && Number.isFinite(v) && v >= 0
    )
  );

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [formError, setFormError] = useState("");
  const [purchase, setPurchase] = useState("");
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [contribution, setContribution] = useState("");
  const [goalMessage, setGoalMessage] = useState("");
  const [apiStatus, setApiStatus] = useState("checking");

  // Check the Node.js backend without replacing locally saved expenses.
  useEffect(() => {
    let active = true;

    fetch(`${API_URL}/api/expenses`)
      .then((response) => {
        if (!response.ok) throw new Error("API unavailable");
        return response.json();
      })
      .then(() => {
        if (active) setApiStatus("connected");
      })
      .catch(() => {
        if (active) setApiStatus("offline");
      });

    return () => {
      active = false;
    };
  }, []);

  // Keep browser storage as a reliable local backup.
  useEffect(() => {
    try {
      localStorage.setItem("broke-budget", JSON.stringify(budget));
    } catch {
      console.warn("Could not save budget locally.");
    }
  }, [budget]);

  useEffect(() => {
    try {
      localStorage.setItem(
        "broke-transactions",
        JSON.stringify(transactions)
      );
    } catch {
      console.warn("Could not save expenses locally.");
    }
  }, [transactions]);

  useEffect(() => {
    try {
      localStorage.setItem("broke-goal", JSON.stringify(goal));
    } catch {
      console.warn("Could not save goal locally.");
    }
  }, [goal]);

  useEffect(() => {
    try {
      localStorage.setItem("broke-savings", JSON.stringify(saved));
    } catch {
      console.warn("Could not save savings locally.");
    }
  }, [saved]);

  const spent = transactions.reduce((sum, t) => sum + t.amount, 0);
  const remaining = budget - spent;
  const percent = budget > 0 ? (spent / budget) * 100 : 0;
  const availablePercent = Math.max(0, 100 - percent);
  const daily = Math.max(0, remaining / 30);
  const goalPercent = goal > 0 ? Math.min(100, (saved / goal) * 100) : 0;

  const purchaseValue = Number(purchaseAmount);
  const validPurchase =
    purchaseAmount.trim() !== "" &&
    Number.isFinite(purchaseValue) &&
    purchaseValue > 0;

  const canAfford =
    validPurchase && remaining >= 0 && purchaseValue <= remaining;

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  async function addTransaction(e) {
    e.preventDefault();

    const cleanName = name.trim();
    const value = Number(amount);

    if (!cleanName) {
      setFormError("Please enter an expense name.");
      return;
    }

    if (!Number.isFinite(value) || value <= 0 || value > 100000000) {
      setFormError("Enter a valid amount greater than ₹0.");
      return;
    }

    const clientId = `local-${Date.now()}-${Math.random()}`;

    const newTransaction = {
      id: clientId,
      name: cleanName,
      category,
      amount: value,
      day: "Just now",
      icon: categoryIcons[category] || "💸",
      synced: false,
    };

    // Save immediately in the browser so the UI still works if the API fails.
    setTransactions((current) => [newTransaction, ...current]);

    setName("");
    setAmount("");
    setCategory("Food");
    setFormError("");
    setShowForm(false);

    try {
      const response = await fetch(`${API_URL}/api/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: cleanName,
          category,
          amount: value,
        }),
      });

      if (!response.ok) throw new Error("API rejected the expense");

      const remoteExpense = await response.json();

      setTransactions((current) =>
        current.map((t) =>
          t.id === clientId
            ? { ...t, serverId: remoteExpense.id, synced: true }
            : t
        )
      );

      setApiStatus("connected");
    } catch {
      setApiStatus("offline");
      setFormError(
        "Expense saved in this browser, but API sync failed. You can try again later."
      );
    }
  }

  async function deleteTransaction(transaction) {
    // Delete from the browser immediately.
    setTransactions((current) =>
      current.filter((t) => t.id !== transaction.id)
    );

    // Only request server deletion if this expense was created there.
    if (transaction.serverId !== undefined) {
      try {
        const response = await fetch(
          `${API_URL}/api/expenses/${transaction.serverId}`,
          { method: "DELETE" }
        );

        if (!response.ok) throw new Error("Could not delete remote expense");
        setApiStatus("connected");
      } catch {
        setApiStatus("offline");
      }
    }
  }

  function updateBudget(value) {
    if (value === "") return;

    const next = Number(value);
    if (Number.isFinite(next) && next > 0 && next <= 100000000) {
      setBudget(next);
    }
  }

  function resetMonth() {
    if (!window.confirm("Remove all transactions for a fresh start?")) return;

    transactions.forEach((t) => {
      if (t.serverId !== undefined) {
        fetch(`${API_URL}/api/expenses/${t.serverId}`, {
          method: "DELETE",
        }).catch(() => {});
      }
    });

    setTransactions([]);
    setShowForm(false);
    setFormError("");
  }

  function addSavings(e) {
    e.preventDefault();
    const value = Number(contribution);

    if (
      contribution.trim() === "" ||
      !Number.isFinite(value) ||
      value <= 0 ||
      value > 100000000
    ) {
      setGoalMessage("Enter a valid savings amount greater than ₹0.");
      return;
    }

    setSaved((current) => current + value);
    setContribution("");
    setGoalMessage("Great work! Your savings have been updated.");
  }

  function resetSavings() {
    if (!window.confirm("Reset your saved amount to ₹0?")) return;
    setSaved(0);
    setContribution("");
    setGoalMessage("");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">₹</span>
          <span>Broke<span className="green">.</span></span>
        </div>

        <div className="side-label">YOUR MONEY</div>
        <a className="nav-item active" href="#overview">▦ <span>Overview</span></a>
        <a className="nav-item" href="#transactions">↕ <span>Transactions</span></a>
        <a className="nav-item" href="#planner">◷ <span>Daily planner</span></a>
        <a className="nav-item" href="#goals">◎ <span>Savings goals</span></a>

        <div className="sidebar-bottom">
          <div className="avatar">B</div>
          <div><strong>Budget buddy</strong><small>Student edition</small></div>
        </div>
      </aside>

      <main className="main-content" id="overview">
        <header className="topbar">
          <div>
            <span className="eyebrow">{today.toUpperCase()}</span>
            <h1>Your money, <span className="green">your rules.</span></h1>
          </div>
          <button className="outline-btn" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "✕ Close form" : "＋ Add expense"}
          </button>
        </header>

        <p
          role="status"
          style={{
            fontSize: "0.85rem",
            margin: "0 0 12px",
            color: apiStatus === "connected" ? "green" : "#777",
          }}
        >
          {apiStatus === "checking" && "Checking Node.js API…"}
          {apiStatus === "connected" && "✓ Node.js API connected"}
          {apiStatus === "offline" &&
            "Local mode active — browser storage is still working"}
        </p>

        <section className="welcome-card">
          <div>
            <span className="pill"><span className="live-dot"></span> YOUR MONTHLY CHECK-IN</span>
            <h2>Survive the month.<br /><span>Thrive anyway.</span></h2>
            <p>Small choices today. More freedom tomorrow.</p>
          </div>
          <div className="welcome-art">
            <div className="art-circle">₹</div>
            <span className="spark spark-one">✳</span>
            <span className="spark spark-two">✦</span>
            <span className="art-caption">MONEY MODE: ON</span>
          </div>
        </section>

        {showForm && (
          <form className="expense-form panel" onSubmit={addTransaction}>
            <h3>Add a new expense</h3>
            <div className="form-grid">
              <label>
                What did you spend on?
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Lunch" maxLength={100} required />
              </label>
              <label>
                Amount (₹)
                <input type="number" min="0.01" max="100000000" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="250" required />
              </label>
              <label>
                Category
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option>Food</option>
                  <option>Transport</option>
                  <option>Bills</option>
                  <option>Lifestyle</option>
                </select>
              </label>
            </div>
            {formError && <p className="form-message" role="alert">{formError}</p>}
            <button className="primary-btn" type="submit">Save expense ↗</button>
          </form>
        )}

        <section className="stats-grid">
          <div className="stat-card featured">
            <div className="stat-top">
              <span>{remaining < 0 ? "OVER BUDGET BY" : "LEFT TO SPEND"}</span>
              <span className="stat-icon">↗</span>
            </div>
            <div className="stat-number">{money(remaining)}</div>
            <div className="progress" role="progressbar" aria-label="Budget remaining" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(availablePercent)}>
              <div style={{ width: `${availablePercent}%` }} />
            </div>
            <small>{remaining < 0 ? "Your spending has exceeded your budget." : `${Math.round(availablePercent)}% of your budget is still available`}</small>
          </div>

          <div className="stat-card">
            <div className="stat-top"><span>MONTHLY BUDGET</span><span className="stat-icon">◈</span></div>
            <div className="stat-number">{money(budget)}</div>
            <small>Set your survival limit</small>
            <input className="budget-input" type="number" min="1" max="100000000" step="1" value={budget} aria-label="Monthly budget" onChange={(e) => updateBudget(e.target.value)} />
          </div>

          <div className="stat-card">
            <div className="stat-top"><span>SPENT SO FAR</span><span className="stat-icon">↘</span></div>
            <div className="stat-number">{money(spent)}</div>
            <small><span className="green">●</span> {Math.round(percent)}% of budget used</small>
            <div className="mini-bars" aria-hidden="true">
              {[25, 42, 30, 65, 48, 80, 54, 38, 68, 45, 90, 58].map((h, i) => (
                <span key={i} style={{ height: `${h}%` }} />
              ))}
            </div>
          </div>
        </section>

        <div className="content-grid">
          <section className="panel" id="transactions">
            <div className="section-heading">
              <div>
                <span className="eyebrow">THE PAPER TRAIL</span>
                <h3>Recent transactions</h3>
              </div>
              <button className="text-btn" onClick={() => setShowForm((v) => !v)}>+ Add new</button>
            </div>
            <div className="transaction-list">
              {transactions.length === 0 ? (
                <p className="empty-state">No expenses yet. A fresh start! 🌱</p>
              ) : (
                transactions.map((t) => (
                  <div className="transaction" key={t.id}>
                    <div className="transaction-icon">{t.icon}</div>
                    <div className="transaction-info">
                      <strong>{t.name}</strong>
                      <small>{t.category} · {t.day}</small>
                    </div>
                    <strong className="transaction-amount">−{money(t.amount)}</strong>
                    <button type="button" className="text-btn" aria-label={`Delete ${t.name}`} onClick={() => deleteTransaction(t)}>✕</button>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="panel planner" id="planner">
            <div className="section-heading">
              <div>
                <span className="eyebrow">SPEND SMARTER</span>
                <h3>Can I afford it?</h3>
              </div>
              <span className="calculator-icon">✳</span>
            </div>
            <p className="muted">A little check before you swipe.</p>
            <label className="field-label" htmlFor="purchase-name">What do you want to buy?</label>
            <input id="purchase-name" className="full-input" value={purchase} maxLength={100} onChange={(e) => setPurchase(e.target.value)} placeholder="Those new sneakers..." />
            <label className="field-label" htmlFor="purchase-amount">How much does it cost? (₹)</label>
            <input id="purchase-amount" className="full-input" type="number" min="0.01" max="100000000" step="0.01" value={purchaseAmount} onChange={(e) => setPurchaseAmount(e.target.value)} placeholder="1999" />
            {validPurchase && (
              <div className={`verdict ${canAfford ? "yes" : "no"}`}>
                <strong>{canAfford ? "✓ You can afford it!" : "⚠ Not in the budget yet."}</strong>
                <span>
                  {canAfford
                    ? `${money(remaining - purchaseValue)} would remain.`
                    : remaining < 0
                      ? `You're already ${money(-remaining)} over budget.`
                      : `You're ${money(purchaseValue - remaining)} short.`}
                </span>
              </div>
            )}
          </section>
        </div>

        <div className="content-grid lower-grid">
          <section className="panel" id="goals">
            <div className="section-heading">
              <div>
                <span className="eyebrow">FUTURE YOU SAYS THANKS</span>
                <h3>Your savings goal</h3>
              </div>
              <span className="goal-icon">✦</span>
            </div>
            <div className="goal-row">
              <div>
                <small>RAINY DAY FUND</small>
                <div className="goal-total">{money(goal)}</div>
                <span className="muted">Target savings</span>
              </div>
              <div className="goal-badge">{saved >= goal ? "🎉 Goal reached" : "🌱 Growing"}</div>
            </div>
            <div className="goal-summary">
              <span>Saved: {money(saved)}</span>
              <span>{Math.round(goalPercent)}% complete</span>
            </div>
            <div className="progress" role="progressbar" aria-label="Savings goal progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(goalPercent)}>
              <div style={{ width: `${goalPercent}%` }} />
            </div>
            <label className="field-label" htmlFor="goal-slider">Change your savings target</label>
            <input id="goal-slider" className="goal-slider" type="range" min="500" max="10000" step="500" value={goal} onChange={(e) => setGoal(Number(e.target.value))} />
            <div className="goal-scale"><span>₹500</span><span>₹10,000</span></div>
            <form className="savings-form" onSubmit={addSavings}>
              <label className="field-label" htmlFor="savings-contribution">Add money saved (₹)</label>
              <input id="savings-contribution" className="full-input" type="number" min="0.01" max="100000000" step="0.01" value={contribution} onChange={(e) => setContribution(e.target.value)} placeholder="e.g. 500" required />
              <button className="primary-btn" type="submit">+ Record savings</button>
              {goalMessage && <p className="form-message" role="status">{goalMessage}</p>}
            </form>
            {saved > 0 && <button className="reset-btn" type="button" onClick={resetSavings}>↻ Reset savings tracker</button>}
          </section>

          <section className="panel daily-card">
            <span className="eyebrow">YOUR DAILY LIMIT</span>
            <div className="daily-number">{money(daily)}<span>/ day</span></div>
            <p className="muted">Your remaining budget divided across 30 days. Keep it steady, you've got this.</p>
            <button className="reset-btn" onClick={resetMonth}>↻ Reset spending for a fresh start</button>
          </section>
        </div>

        <footer>MADE FOR REAL LIFE, NOT RICH PEOPLE. <span>♡ ONE DAY AT A TIME.</span></footer>
      </main>
    </div>
  );
}

export default App;
