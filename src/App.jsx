import { useEffect,useState } from "react";
import "./App.css";

const initialTransactions = [
  {
    id: 1,
    name: "Grocery shopping",
    category: "Food",
    amount: 850,
    day: "Today",
    icon: "🛒",
  },
  {
    id: 2,
    name: "Metro recharge",
    category: "Transport",
    amount: 300,
    day: "Today",
    icon: "🚇",
  },
  {
    id: 3,
    name: "Coffee with friends",
    category: "Lifestyle",
    amount: 180,
    day: "Yesterday",
    icon: "☕",
  },
  {
    id: 4,
    name: "Monthly mobile plan",
    category: "Bills",
    amount: 299,
    day: "Yesterday",
    icon: "📱",
  },
];

const money = (value) =>
  "₹" +
  Math.abs(Number(value) || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

const categoryIcons = {
  Food: "🍲",
  Transport: "🚌",
  Bills: "📱",
  Lifestyle: "✨",
};

function App() {
  const [budget, setBudget] = useState(10000);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [showForm, setShowForm] = useState(false);

  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [formError, setFormError] = useState("");

  const [purchase, setPurchase] = useState("");
  const [purchaseAmount, setPurchaseAmount] = useState("");

  const [goal, setGoal] = useState(2000);
  const [saved, setSaved] = useState(0);
  const [contribution, setContribution] = useState("");
  const [goalMessage, setGoalMessage] = useState("");

  // Always calculate spending from the actual transaction list.
  const spent = transactions.reduce(
    (total, transaction) => total + transaction.amount,
    0
  );

  const remaining = budget - spent;
  const daily = Math.max(0, remaining / 30);
  const percent = budget > 0 ? (spent / budget) * 100 : 0;
  const availablePercent = Math.max(0, 100 - percent);
  const goalPercent =
    goal > 0 ? Math.min(100, (saved / goal) * 100) : 0;

  const purchaseValue = Number(purchaseAmount);
  const validPurchase =
    purchaseAmount.trim() !== "" &&
    Number.isFinite(purchaseValue) &&
    purchaseValue > 0;

  const canAfford =
    validPurchase &&
    purchaseValue <= remaining &&
    remaining >= 0;

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  function addTransaction(event) {
    event.preventDefault();

    const cleanName = name.trim();
    const value = Number(amount);

    if (!cleanName) {
      setFormError("Please enter an expense name.");
      return;
    }

    if (!Number.isFinite(value) || value <= 0) {
      setFormError("Enter a valid amount greater than ₹0.");
      return;
    }

    if (value > 100000000) {
      setFormError("Please enter an amount below ₹10 crore.");
      return;
    }

    const newTransaction = {
      id: `${Date.now()}-${Math.random()}`,
      name: cleanName,
      category,
      amount: value,
      day: "Just now",
      icon: categoryIcons[category] || "💸",
    };

    setTransactions((current) => [newTransaction, ...current]);
    setName("");
    setAmount("");
    setCategory("Food");
    setFormError("");
    setShowForm(false);
  }

  function deleteTransaction(id) {
    setTransactions((current) =>
      current.filter((transaction) => transaction.id !== id)
    );
  }

  function updateBudget(value) {
    if (value === "") {
      setBudget(1);
      return;
    }

    const nextBudget = Number(value);

    if (Number.isFinite(nextBudget) && nextBudget > 0) {
      setBudget(Math.min(nextBudget, 100000000));
    }
  }

  function resetMonth() {
    const confirmed = window.confirm(
      "Reset this month's spending and remove all listed transactions?"
    );

    if (!confirmed) return;

    setTransactions([]);
    setShowForm(false);
    setFormError("");
    setPurchase("");
    setPurchaseAmount("");
  }

  function addSavings(event) {
    event.preventDefault();

    const value = Number(contribution);

    if (
      contribution.trim() === "" ||
      !Number.isFinite(value) ||
      value <= 0
    ) {
      setGoalMessage("Enter a valid savings amount greater than ₹0.");
      return;
    }

    if (value > 100000000) {
      setGoalMessage("Please enter a smaller savings amount.");
      return;
    }

    setSaved((current) => current + value);
    setContribution("");
    setGoalMessage("Great work! Your savings have been updated.");
  }

  function resetSavings() {
    const confirmed = window.confirm(
      "Reset the amount saved toward your goal?"
    );

    if (!confirmed) return;

    setSaved(0);
    setGoalMessage("");
    setContribution("");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">₹</span>
          <span>
            Broke<span className="green">.</span>
          </span>
        </div>

        <div className="side-label">YOUR MONEY</div>

        <a className="nav-item active" href="#overview">
          ▦ <span>Overview</span>
        </a>
        <a className="nav-item" href="#transactions">
          ↕ <span>Transactions</span>
        </a>
        <a className="nav-item" href="#planner">
          ◷ <span>Daily planner</span>
        </a>
        <a className="nav-item" href="#goals">
          ◎ <span>Savings goals</span>
        </a>

        <div className="sidebar-bottom">
          <div className="avatar">B</div>
          <div>
            <strong>Budget buddy</strong>
            <small>Student edition</small>
          </div>
        </div>
      </aside>

      <main className="main-content" id="overview">
        <header className="topbar">
          <div>
            <span className="eyebrow">{today.toUpperCase()}</span>
            <h1>
              Your money, <span className="green">your rules.</span>
            </h1>
          </div>

          <button
            className="outline-btn"
            onClick={() => {
              setShowForm((current) => !current);
              setFormError("");
            }}
          >
            {showForm ? "✕ Close form" : "＋ Add expense"}
          </button>
        </header>

        <section className="welcome-card">
          <div>
            <span className="pill">
              <span className="live-dot"></span> YOUR MONTHLY CHECK-IN
            </span>
            <h2>
              Survive the month.
              <br />
              <span>Thrive anyway.</span>
            </h2>
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
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Lunch"
                  maxLength={100}
                  required
                />
              </label>

              <label>
                Amount (₹)
                <input
                  type="number"
                  min="0.01"
                  max="100000000"
                  step="0.01"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="250"
                  required
                />
              </label>

              <label>
                Category
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  <option>Food</option>
                  <option>Transport</option>
                  <option>Bills</option>
                  <option>Lifestyle</option>
                </select>
              </label>
            </div>

            {formError && (
              <p className="form-message" role="alert">
                {formError}
              </p>
            )}

            <button className="primary-btn" type="submit">
              Save expense ↗
            </button>
          </form>
        )}

        <section className="stats-grid">
          <div className="stat-card featured">
            <div className="stat-top">
              <span>
                {remaining < 0 ? "OVER BUDGET BY" : "LEFT TO SPEND"}
              </span>
              <span className="stat-icon">↗</span>
            </div>

            <div className="stat-number">
              {money(remaining < 0 ? -remaining : remaining)}
            </div>

            <div
              className="progress"
              role="progressbar"
              aria-label="Remaining budget"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(availablePercent)}
            >
              <div
                style={{
                  width: `${availablePercent}%`,
                }}
              />
            </div>

            <small>
              {remaining < 0
                ? "Your spending has exceeded the budget."
                : `${Math.round(availablePercent)}% of your budget is still available`}
            </small>
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span>MONTHLY BUDGET</span>
              <span className="stat-icon">◈</span>
            </div>

            <div className="stat-number">{money(budget)}</div>
            <small>Set your survival limit</small>

            <input
              className="budget-input"
              type="number"
              min="1"
              max="100000000"
              step="1"
              value={budget}
              aria-label="Monthly budget in rupees"
              onChange={(event) => updateBudget(event.target.value)}
            />
          </div>

          <div className="stat-card">
            <div className="stat-top">
              <span>SPENT SO FAR</span>
              <span className="stat-icon">↘</span>
            </div>

            <div className="stat-number">{money(spent)}</div>

            <small>
              <span className="green">●</span>{" "}
              {Math.round(percent)}% of budget used
            </small>

            <div className="mini-bars" aria-hidden="true">
              {[25, 42, 30, 65, 48, 80, 54, 38, 68, 45, 90, 58].map(
                (height, index) => (
                  <span
                    key={index}
                    style={{ height: `${height}%` }}
                  />
                )
              )}
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

              <button
                className="text-btn"
                onClick={() => {
                  setShowForm((current) => !current);
                  setFormError("");
                }}
              >
                + Add new
              </button>
            </div>

            <div className="transaction-list">
              {transactions.length === 0 ? (
                <p className="empty-state">
                  No expenses yet. A fresh start! 🌱
                </p>
              ) : (
                transactions.map((transaction) => (
                  <div className="transaction" key={transaction.id}>
                    <div className="transaction-icon">
                      {transaction.icon}
                    </div>

                    <div className="transaction-info">
                      <strong>{transaction.name}</strong>
                      <small>
                        {transaction.category} · {transaction.day}
                      </small>
                    </div>

                    <strong className="transaction-amount">
                      −{money(transaction.amount)}
                    </strong>

                    <button
                      type="button"
                      className="text-btn"
                      aria-label={`Delete ${transaction.name}`}
                      title={`Delete ${transaction.name}`}
                      onClick={() => deleteTransaction(transaction.id)}
                    >
                      ✕
                    </button>
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

            <label className="field-label" htmlFor="purchase-name">
              What do you want to buy?
            </label>

            <input
              id="purchase-name"
              className="full-input"
              value={purchase}
              maxLength={100}
              onChange={(event) => setPurchase(event.target.value)}
              placeholder="Those new sneakers..."
            />

            <label className="field-label" htmlFor="purchase-amount">
              How much does it cost? (₹)
            </label>

            <input
              id="purchase-amount"
              className="full-input"
              type="number"
              min="0.01"
              max="100000000"
              step="0.01"
              value={purchaseAmount}
              onChange={(event) =>
                setPurchaseAmount(event.target.value)
              }
              placeholder="1999"
            />

            {validPurchase && (
              <div className={`verdict ${canAfford ? "yes" : "no"}`}>
                <strong>
                  {canAfford
                    ? "✓ You can afford it!"
                    : "⚠ Not in the budget yet."}
                </strong>

                <span>
                  {canAfford
                    ? `${money(remaining - purchaseValue)} would remain.`
                    : remaining < 0
                      ? `You are already ${money(-remaining)} over budget.`
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

              <div className="goal-badge">
                {saved >= goal ? "🎉 Goal reached" : "🌱 Growing"}
              </div>
            </div>

            <div className="goal-summary">
              <span>Saved: {money(saved)}</span>
              <span>{Math.round(goalPercent)}% complete</span>
            </div>

            <div
              className="progress"
              role="progressbar"
              aria-label="Savings goal progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(goalPercent)}
            >
              <div style={{ width: `${goalPercent}%` }} />
            </div>

            <label className="field-label" htmlFor="goal-slider">
              Change your savings target
            </label>

            <input
              id="goal-slider"
              className="goal-slider"
              type="range"
              min="500"
              max="10000"
              step="500"
              value={goal}
              onChange={(event) => setGoal(Number(event.target.value))}
            />

            <div className="goal-scale">
              <span>₹500</span>
              <span>₹10,000</span>
            </div>

            <form className="savings-form" onSubmit={addSavings}>
              <label className="field-label" htmlFor="savings-contribution">
                Add money saved (₹)
              </label>

              <input
                id="savings-contribution"
                className="full-input"
                type="number"
                min="0.01"
                max="100000000"
                step="0.01"
                value={contribution}
                onChange={(event) =>
                  setContribution(event.target.value)
                }
                placeholder="e.g. 500"
                required
              />

              <button className="primary-btn" type="submit">
                + Record savings
              </button>

              {goalMessage && (
                <p className="form-message" role="status">
                  {goalMessage}
                </p>
              )}
            </form>

            {saved > 0 && (
              <button
                className="reset-btn"
                type="button"
                onClick={resetSavings}
              >
                ↻ Reset savings tracker
              </button>
            )}
          </section>

          <section className="panel daily-card">
            <span className="eyebrow">YOUR DAILY LIMIT</span>

            <div className="daily-number">
              {money(daily)}
              <span>/ day</span>
            </div>

            <p className="muted">
              Your remaining budget divided across 30 days. Keep it
              steady, you've got this.
            </p>

            <button className="reset-btn" onClick={resetMonth}>
              ↻ Reset spending for a fresh start
            </button>
          </section>
        </div>

        <footer>
          MADE FOR REAL LIFE, NOT RICH PEOPLE.{" "}
          <span>♡ ONE DAY AT A TIME.</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
