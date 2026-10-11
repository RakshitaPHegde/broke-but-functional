
import { useState } from "react";
import "./App.css";

const initialTransactions = [
  { id: 1, name: "Grocery shopping", category: "Food", amount: 850, day: "Today", icon: "🛒" },
  { id: 2, name: "Metro recharge", category: "Transport", amount: 300, day: "Today", icon: "🚇" },
  { id: 3, name: "Coffee with friends", category: "Lifestyle", amount: 180, day: "Yesterday", icon: "☕" },
  { id: 4, name: "Monthly mobile plan", category: "Bills", amount: 299, day: "Yesterday", icon: "📱" },
];

const money = (n) =>
  "₹" + Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });

function App() {
  const [budget, setBudget] = useState(10000);
  const [spent, setSpent] = useState(3850);
  const [transactions, setTransactions] = useState(initialTransactions);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [purchase, setPurchase] = useState("");
  const [purchaseAmount, setPurchaseAmount] = useState("");
  const [goal, setGoal] = useState(2000);

  const remaining = budget - spent;
  const daily = Math.max(0, remaining / 30);
  const percent = Math.min(100, (spent / budget) * 100);
  const canAfford = Number(purchaseAmount) <= remaining;

  function addTransaction(e) {
    e.preventDefault();
    const value = Number(amount);
    if (!name.trim() || value <= 0) return;

    setTransactions([
      { id: Date.now(), name, category, amount: value, day: "Just now", icon: category === "Food" ? "🍲" : category === "Transport" ? "🚌" : category === "Bills" ? "📱" : "✨" },
      ...transactions,
    ]);
    setSpent(spent + value);
    setName("");
    setAmount("");
    setShowForm(false);
  }

  function resetMonth() {
    setSpent(0);
    setTransactions([]);
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-icon">₹</span><span>Broke<span className="green">.</span></span></div>
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
          <div><span className="eyebrow">SUNDAY, OCTOBER 11</span><h1>Your money, <span className="green">your rules.</span></h1></div>
          <button className="outline-btn" onClick={() => setShowForm(!showForm)}>＋ Add expense</button>
        </header>

        <section className="welcome-card">
          <div><span className="pill"><span className="live-dot"></span> YOUR MONTHLY CHECK-IN</span><h2>Survive the month.<br/><span>Thrive anyway.</span></h2><p>Small choices today. More freedom tomorrow.</p></div>
          <div className="welcome-art"><div className="art-circle">₹</div><span className="spark spark-one">✳</span><span className="spark spark-two">✦</span><span className="art-caption">MONEY MODE: ON</span></div>
        </section>

        {showForm && <form className="expense-form panel" onSubmit={addTransaction}>
          <h3>Add a new expense</h3>
          <div className="form-grid">
            <label>What did you spend on?<input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Lunch" required /></label>
            <label>Amount (₹)<input type="number" min="1" value={amount} onChange={e => setAmount(e.target.value)} placeholder="250" required /></label>
            <label>Category<select value={category} onChange={e => setCategory(e.target.value)}><option>Food</option><option>Transport</option><option>Bills</option><option>Lifestyle</option></select></label>
          </div>
          <button className="primary-btn" type="submit">Save expense ↗</button>
        </form>}

        <section className="stats-grid">
          <div className="stat-card featured"><div className="stat-top"><span>LEFT TO SPEND</span><span className="stat-icon">↗</span></div><div className="stat-number">{money(remaining)}</div><div className="progress"><div style={{width: `${100-percent}%`}} /></div><small>{Math.round(100-percent)}% of your budget is still available</small></div>
          <div className="stat-card"><div className="stat-top"><span>MONTHLY BUDGET</span><span className="stat-icon">◈</span></div><div className="stat-number">{money(budget)}</div><small>Set your survival limit</small><input className="budget-input" type="number" value={budget} min="1" onChange={e => setBudget(Number(e.target.value))}/></div>
          <div className="stat-card"><div className="stat-top"><span>SPENT SO FAR</span><span className="stat-icon">↘</span></div><div className="stat-number">{money(spent)}</div><small><span className="green">●</span> {Math.round(percent)}% of budget used</small><div className="mini-bars">{[25,42,30,65,48,80,54,38,68,45,90,58].map((h,i)=><span key={i} style={{height: `${h}%`}} />)}</div></div>
        </section>

        <div className="content-grid">
          <section className="panel" id="transactions">
            <div className="section-heading"><div><span className="eyebrow">THE PAPER TRAIL</span><h3>Recent transactions</h3></div><button className="text-btn" onClick={() => setShowForm(!showForm)}>+ Add new</button></div>
            <div className="transaction-list">{transactions.length === 0 ? <p className="empty-state">No expenses yet. A fresh start! 🌱</p> : transactions.map(t=><div className="transaction" key={t.id}><div className="transaction-icon">{t.icon}</div><div className="transaction-info"><strong>{t.name}</strong><small>{t.category} · {t.day}</small></div><strong className="transaction-amount">−{money(t.amount)}</strong></div>)}</div>
          </section>

          <section className="panel planner" id="planner">
            <div className="section-heading"><div><span className="eyebrow">SPEND SMARTER</span><h3>Can I afford it?</h3></div><span className="calculator-icon">✳</span></div>
            <p className="muted">A little check before you swipe.</p>
            <label className="field-label">What do you want to buy?</label><input className="full-input" value={purchase} onChange={e=>setPurchase(e.target.value)} placeholder="Those new sneakers..." />
            <label className="field-label">How much does it cost? (₹)</label><input className="full-input" type="number" min="0" value={purchaseAmount} onChange={e=>setPurchaseAmount(e.target.value)} placeholder="1999" />
            {purchaseAmount !== "" && Number(purchaseAmount) > 0 && <div className={`verdict ${canAfford ? "yes" : "no"}`}><strong>{canAfford ? "✓ You can afford it!" : "⚠ Not in the budget yet."}</strong><span>{canAfford ? `${money(remaining-Number(purchaseAmount))} would remain.` : `You're ${money(Number(purchaseAmount)-remaining)} short.`}</span></div>}
          </section>
        </div>

        <div className="content-grid lower-grid">
          <section className="panel" id="goals"><div className="section-heading"><div><span className="eyebrow">FUTURE YOU SAYS THANKS</span><h3>Your savings goal</h3></div><span className="goal-icon">✦</span></div><div className="goal-row"><div><small>RAINY DAY FUND</small><div className="goal-total">{money(goal)}</div><span className="muted">Target savings</span></div><div className="goal-badge">🌱 Growing</div></div><input className="goal-slider" type="range" min="500" max="10000" step="500" value={goal} onChange={e=>setGoal(Number(e.target.value))}/><div className="goal-scale"><span>₹500</span><span>₹10,000</span></div></section>
          <section className="panel daily-card"><span className="eyebrow">YOUR DAILY LIMIT</span><div className="daily-number">{money(daily)}<span>/ day</span></div><p className="muted">Your remaining budget divided across 30 days. Keep it steady, you've got this.</p><button className="reset-btn" onClick={resetMonth}>↻ Reset spending for a fresh start</button></section>
        </div>
        <footer>MADE FOR REAL LIFE, NOT RICH PEOPLE. <span>♡ ONE DAY AT A TIME.</span></footer>
      </main>
    </div>
  );
}

export default App;
