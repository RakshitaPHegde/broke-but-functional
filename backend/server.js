import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

let expenses = [];
let nextId = 1;

app.get("/", (req, res) => {
  res.json({
    name: "Broke but Functional API",
    status: "running",
    endpoints: ["/api/expenses"]
  });
});

app.get("/api/expenses", (req, res) => {
  res.json(expenses);
});

app.post("/api/expenses", (req, res) => {
  const { name, category, amount } = req.body;

  if (
    typeof name !== "string" ||
    !name.trim() ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    return res.status(400).json({
      error: "Provide an expense name and a positive amount."
    });
  }

  const expense = {
    id: nextId++,
    name: name.trim(),
    category: typeof category === "string" ? category : "Other",
    amount
  };

  expenses.push(expense);
  res.status(201).json(expense);
});

app.delete("/api/expenses/:id", (req, res) => {
  const id = Number(req.params.id);
  const previousLength = expenses.length;

  expenses = expenses.filter((expense) => expense.id !== id);

  if (expenses.length === previousLength) {
    return res.status(404).json({ error: "Expense not found." });
  }

  res.json({ message: "Expense deleted successfully." });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});
