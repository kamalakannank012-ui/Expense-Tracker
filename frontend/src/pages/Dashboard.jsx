import { toast } from "react-toastify";
import MonthlyReport from "../components/MonthlyReport";
import MonthlyTrendChart from "../components/MonthlyTrendChart";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import PieChartComponent from "../components/PieChartComponent";
import BarChartComponent from "../components/BarChartComponent";
import AIChat from "../components/AIChat";
import VoiceExpense from "../components/VoiceExpense";

function Dashboard() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [expenses, setExpenses] = useState([]);
  const [date, setDate] = useState("");
  const [budget, setBudget] = useState("");
  const [budgetData, setBudgetData] = useState(null);
  const fetchBudget = async () => {
  try {
    const month = new Date().toISOString().slice(0, 7);

    const res = await API.get(`/budget/${month}`);

    setBudgetData(res.data);

  } catch (err) {
    console.log(err);
  }
};

const totalIncome = expenses
  .filter((item) => item.type === "Income")
  .reduce((sum, item) => sum + item.amount, 0);

const totalExpense = expenses
  .filter((item) => item.type === "Expense")
  .reduce((sum, item) => sum + item.amount, 0);

const balance = totalIncome - totalExpense;
const currentMonth = new Date().getMonth();
const currentYear = new Date().getFullYear();

const monthlyExpenses = expenses.filter((item) => {
  const expenseDate = new Date(item.date);

  return (
    expenseDate.getMonth() === currentMonth &&
    expenseDate.getFullYear() === currentYear
  );
});

const monthlyIncome = monthlyExpenses
  .filter((item) => item.type === "Income")
  .reduce((sum, item) => sum + item.amount, 0);

const monthlyExpense = monthlyExpenses
  .filter((item) => item.type === "Expense")
  .reduce((sum, item) => sum + item.amount, 0);

const monthlyBalance = monthlyIncome - monthlyExpense;

const monthlyTransactions = monthlyExpenses.length;
const budgetAmount = budgetData?.amount || 0;

const budgetPercentage =
  budgetAmount > 0
    ? ((totalExpense / budgetAmount) * 100).toFixed(0)
    : 0;
  const totalTransactions = expenses.length;

const expenseOnly = expenses.filter(
  (item) => item.type === "Expense"
);

const averageExpense =
  expenseOnly.length > 0
    ? (
        expenseOnly.reduce(
          (sum, item) => sum + item.amount,
          0
        ) / expenseOnly.length
      ).toFixed(2)
    : 0;

const highestExpense =
  expenseOnly.length > 0
    ? Math.max(...expenseOnly.map((item) => item.amount))
    : 0;

const thisMonthExpense = monthlyExpense;
const categoryTotals = {};

monthlyExpenses
  .filter((item) => item.type === "Expense")
  .forEach((item) => {
    if (categoryTotals[item.category]) {
      categoryTotals[item.category] += item.amount;
    } else {
      categoryTotals[item.category] = item.amount;
    }
  });

const highestCategory =
  Object.entries(categoryTotals).sort(
    (a, b) => b[1] - a[1]
  )[0];
  const [sortOption, setSortOption] = useState("latest");
  const [title, setTitle] = useState("");
  const categorizeExpense = async () => {
  if (!title.trim()) return;

  try {
    const res = await API.post(
      "/ai/categorize",
      { title },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    setCategory(res.data.category);

  } catch (err) {
    console.log(err);
  }
};
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [type, setType] = useState("Expense");
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const navigate = useNavigate();
  const [aiAdvice, setAiAdvice] = useState("null");
  const user = JSON.parse(localStorage.getItem("user"));
  const [showAIChat, setShowAIChat] = useState(false);
  const fetchExpenses = async () => {
    try {
      const res = await API.get("/expenses");

      setExpenses(res.data);
    } catch (error) {
      console.log(error);
    }
  };
  const saveBudget = async () => {
  try {
    const month = new Date().toISOString().slice(0, 7);

    await API.post("/budget", {
      month,
      amount: Number(budget),
    });

    alert("Budget Saved");

    fetchBudget();
  } catch (err) {
    console.log(err);
  }
};
useEffect(() => {
  fetchExpenses();
  fetchBudget();
}, []);
const filteredExpenses = expenses.filter((item) => {
  const query = search.toLowerCase();

  const searchMatch =
    item.title.toLowerCase().includes(query) ||
    item.category.toLowerCase().includes(query) ||
    item.type.toLowerCase().includes(query);

  const expenseDate = new Date(item.date);

  const fromMatch =
    !fromDate || expenseDate >= new Date(fromDate);

  const toMatch =
    !toDate || expenseDate <= new Date(toDate);

  const monthMatch =
    expenseDate.getMonth() === currentMonth &&
    expenseDate.getFullYear() === currentYear;

  return (
    searchMatch &&
    fromMatch &&
    toMatch &&
    monthMatch
  );
});
  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
  switch (sortOption) {
    case "amountLow":
      return a.amount - b.amount;

    case "amountHigh":
      return b.amount - a.amount;

    case "oldest":
      return new Date(a.date) - new Date(b.date);

    case "latest":
    default:
      return new Date(b.date) - new Date(a.date);
  }
});

const indexOfLast = currentPage * itemsPerPage;
const indexOfFirst = indexOfLast - itemsPerPage;

const currentExpenses = sortedExpenses.slice(
  indexOfFirst,
  indexOfLast
);
const recentTransactions = [...monthlyExpenses]
  .sort((a, b) => new Date(b.date) - new Date(a.date))
  .slice(0, 5);
  const deleteExpense = async (id) => {
  try {
    await API.delete(`/expenses/${id}`);

    toast.success("Expense Deleted Successfully");

    fetchExpenses();
  } catch (error) {
    console.log(error);
    toast.error(error.response?.data?.message || "Delete Failed");
  }
};
const startEdit = (item) => {
  setEditId(item._id);

  setTitle(item.title);
  setAmount(item.amount);
  setCategory(item.category);
  setType(item.type);

  setDate(item.date.split("T")[0]);
};
  const addExpense = async () => {

  if (!title || !amount) {
    toast.error("Please fill all fields");
    return;
  }

  try {
    if (editId) {
  await API.put(`/expenses/${editId}`, {
    title,
    amount: Number(amount),
    category,
    type,
    date,
  });

  toast.success("Expense Updated Successfully");
} else {
  await API.post("/expenses", {
    title,
    amount: Number(amount),
    category,
    type,
    date,
  });
toast.success("Expense Added Successfully");
}

    setTitle("");
    setAmount("");
    setCategory("Food");
    setType("Expense");
    setEditId(null);
    setDate("");

    fetchExpenses();
  } catch (error) {
    console.log(error);
    toast.error(error.response?.data?.message || "Failed to add expense");
  }
};
const exportToExcel = () => {
  const worksheet = XLSX.utils.json_to_sheet(
    filteredExpenses.map((item) => ({
      Title: item.title,
      Amount: item.amount,
      Category: item.category,
      Type: item.type,
      Date: new Date(item.date).toLocaleDateString(),
    }))
  );

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Expenses"
  );

  const excelBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  });

  const file = new Blob([excelBuffer], {
    type: "application/octet-stream",
  });

  saveAs(file, "Expense_Report.xlsx");
};
const exportToPDF = () => {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.text("Expense Report", 14, 15);

  autoTable(doc, {
    startY: 25,
    head: [["Title", "Amount", "Category", "Type", "Date"]],
    body: filteredExpenses.map((item) => [
      item.title,
      item.amount,
      item.category,
      item.type,
      new Date(item.date).toLocaleDateString(),
    ]),
  });

  doc.save("Expense_Report.pdf");
};
const getAIAdvice = async () => {
  try {
    const res = await API.post("/ai/advice", {
      expenses,
    });
    console.log(res.data);

    setAiAdvice(res.data.advice);

  } catch (error) {
    console.log(error);

    alert("Failed to get AI Advice");
  }
};
const logout = () => {
  localStorage.removeItem("token");
  navigate("/");
};
  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">

  <div className="d-flex justify-content-between align-items-center mb-4">
    {/* RIGHT SIDE */}
    <div className="d-flex align-items-center gap-2">

      {/* AI ASSISTANT BUTTON */}
      <button
        className="btn btn-primary"
        onClick={() => setShowAIChat(!showAIChat)}
      >
        🤖 AI Assistant
      </button>

      {/* PROFILE BUTTON */}
      <div className="dropdown">

        <button
          className="btn btn-outline-dark dropdown-toggle"
          type="button"
          data-bs-toggle="dropdown"
        >
          👤 Profile
        </button>

        <ul className="dropdown-menu dropdown-menu-end">

          <li>
            <button
              className="dropdown-item"
              onClick={() => navigate("/profile")}
            >
              👤 My Profile
            </button>
          </li>

          <li>
            <button
              className="dropdown-item"
              onClick={() => navigate("/settings")}
            >
              ⚙️ Settings
            </button>
          </li>

          <li>
            <hr className="dropdown-divider" />
          </li>

          <li>
            <button
              className="dropdown-item text-danger"
              onClick={logout}
            >
              🚪 Logout
            </button>
          </li>

        </ul>

      </div>

    </div>

  </div>
  <div>
  <h2>Expense Tracker Dashboard</h2>

{showAIChat && (
  <div className="mb-4">
    <AIChat />
  </div>
)}
  <p>Welcome, {user?.name} 👋</p>
  </div>


  </div>
  <div className="row mb-4">
  <div className="card p-3 mb-3">

  <h4>Monthly Budget</h4>

  <input
    type="number"
    className="form-control"
    placeholder="Enter Budget"
    value={budget}
    onChange={(e) => setBudget(e.target.value)}
  />

  <br />

  <button
    className="btn btn-success"
    onClick={saveBudget}
  >
    Save Budget
  </button>

</div>
<VoiceExpense onTransactionAdded={fetchExpenses} />
<div className="card bg-warning text-dark mt-3">
  <div className="card-body">
    <h4>Budget</h4>

    <h5>₹ {budgetData?.amount || 0}</h5>

    <h5>Spent : ₹ {monthlyExpense}</h5>

    <h5>
      Remaining : ₹ {(budgetData?.amount || 0) - monthlyExpense}
    </h5>
    <h6 className="mt-3">
Used: {budgetPercentage}%
</h6>

    {budgetPercentage >= 80 && budgetPercentage < 100 && (
  <div className="alert alert-warning mt-3">
    ⚠ Warning! You have used {budgetPercentage}% of your budget.
  </div>
)}

{budgetPercentage >= 100 && (
  <div className="alert alert-danger mt-3">
    🚨 Budget Exceeded!
  </div>
)}
  </div>
</div>
  <div className="col-md-4">
    <div className="card text-white bg-success">
      <div className="card-body">
        <h5>Total Income</h5>
        <h3>₹ {monthlyIncome}</h3>
      </div>
    </div>
  </div>

  <div className="col-md-4">
    <div className="card text-white bg-danger">
      <div className="card-body">
        <h5>Total Expense</h5>
        <h3>₹ {totalExpense}</h3>
      </div>
    </div>
  </div>

  <div className="col-md-4">
    <div className="card text-white bg-info">
      <div className="card-body">
        <h5>Balance</h5>
        <h3>₹ {balance}</h3>
      </div>
    </div>
  </div>

</div>
<div className="card mt-4 border-primary">
  <div className="card-header bg-primary text-white">
    <h4>Current Month Summary</h4>
  </div>
  <div className="card mt-4 border-warning">

  <div className="card-header bg-warning">

    <h4>Highest Spending Category</h4>

  </div>

  <div className="card-body text-center">

    {highestCategory ? (
      <>
        <h2>{highestCategory[0]}</h2>

        <h3 className="text-danger">
          ₹ {highestCategory[1]}
        </h3>
      </>
    ) : (
      <h4>No Expenses This Month</h4>
    )}

  </div>

</div>

  <div className="card-body">
    <div className="row text-center">

      <div className="col-md-3">
        <h5>Income</h5>
        <h3 className="text-success">
          ₹ {monthlyIncome}
        </h3>
      </div>

      <div className="col-md-3">
        <h5>Expense</h5>
        <h3 className="text-danger">
          ₹ {monthlyExpense}
        </h3>
      </div>

      <div className="col-md-3">
        <h5>Balance</h5>
        <h3 className="text-primary">
          ₹ {monthlyBalance}
        </h3>
      </div>

      <div className="col-md-3">
        <h5>Transactions</h5>
        <h3>
          {monthlyTransactions}
        </h3>
      </div>

    </div>
  </div>
</div>
      <div className="card p-4 mb-4">
  <div className="mb-3">
  <label className="form-label fw-bold">
    🤖 Expense Title
  </label>

  <input
    type="text"
    className="form-control"
    placeholder="Example: Swiggy, Uber, Amazon Mouse..."
    value={title}
    onChange={(e) => {
      setTitle(e.target.value);

      if (e.target.value.length > 3) {
        categorizeExpense();
      }
    }}
  />

  <small className="text-muted">
    AI will automatically suggest the category.
  </small>
</div>
  <br /><br />

  <input
    className="form-control"
    type="number"
    placeholder="Amount"
    value={amount}
    onChange={(e) => setAmount(e.target.value)}
  />

  <br /><br />

  <select
  className="form-select"
    value={category}
    onChange={(e) => setCategory(e.target.value)}
  >
    <option>Food</option>
    <option>Travel</option>
    <option>Shopping</option>
    <option>Salary</option>
    <option>Bills</option>
    <option>Entertainment</option>
  </select>

  <br /><br />

  <select
  className="form-select"
    value={type}
    onChange={(e) => setType(e.target.value)}
  >
    <option>Expense</option>
    <option>Income</option>
  </select>

  <br /><br />

  <input
  className="form-control"
  type="date"
  value={date}
  onChange={(e) => setDate(e.target.value)}
/>
<br /><br />
  <div className="d-flex gap-2">

  <button
    className="btn btn-info"
    onClick={addExpense}
  >
    {editId ? "Update Expense" : "Add Expense"}
  </button>

  <button
    className="btn btn-success me-2"
    onClick={exportToExcel}
  >
    Export Excel
  </button>

  <button
  className="btn btn-primary me-2"
  onClick={exportToPDF}
>
  Export PDF
</button>

</div>
</div>

      <hr />

<div className="row mb-3">

  <div className="col-md-4">
    <input
      className="form-control"
      type="text"
      placeholder="Search..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
    />
  </div>
  <div className="col-md-4">
  <select
    className="form-select"
    value={sortOption}
    onChange={(e) => setSortOption(e.target.value)}
  >
    <option value="latest">Latest First</option>
    <option value="oldest">Oldest First</option>
    <option value="amountLow">Amount Low → High</option>
    <option value="amountHigh">Amount High → Low</option>
  </select>
</div>

  <div className="col-md-4">
    <input
      className="form-control"
      type="date"
      value={fromDate}
      onChange={(e) => setFromDate(e.target.value)}
    />
  </div>

  <div className="col-md-4">
    <input
      className="form-control"
      type="date"
      value={toDate}
      onChange={(e) => setToDate(e.target.value)}
    />
  </div>

</div>
      {expenses.length === 0 ? (
        <h3>No Expenses Found</h3>
      ) : (
        <table className="table table-bordered table-hover">
  <thead className="table-dark">
    <tr>
      <th>Title</th>
      <th>Amount</th>
      <th>Category</th>
      <th>Type</th>
      <th>Date</th>
      <th>Actions</th>
    </tr>
  </thead>

  <tbody>
  {currentExpenses.map((item) => (
      <tr key={item._id}>
        <td>{item.title}</td>
        <td>₹ {item.amount}</td>
        <td>{item.category}</td>
        <td>{item.type}</td>
        <td>{new Date(item.date).toLocaleDateString()}</td>

        <td>
          <button
            className="btn btn-warning btn-sm me-2"
            onClick={() => startEdit(item)}
          >
            Edit
          </button>

          <button
            className="btn btn-danger btn-sm"
            onClick={() => deleteExpense(item._id)}
          >
            Delete
          </button>
        </td>
      </tr>
    ))}
  </tbody>
</table>
)}
<div className="d-flex justify-content-center mt-3">

  <button
    className="btn btn-secondary me-2"
    disabled={currentPage === 1}
    onClick={() => setCurrentPage(currentPage - 1)}
  >
    Previous
  </button>

  <button
    className="btn btn-secondary"
    disabled={
      currentPage >= Math.ceil(sortedExpenses.length / itemsPerPage)
    }
    onClick={() => setCurrentPage(currentPage + 1)}
  >
    Next
  </button>
  <button
  className="btn btn-primary me-2"
  onClick={() => navigate("/profile")}
>
  Profile
</button>

</div>
<div className="row mt-4">

  <div className="col-md-3">
    <div className="card bg-primary text-white">
      <div className="card-body text-center">
        <h5>Total Transactions</h5>
        <h3>{totalTransactions}</h3>
      </div>
    </div>
  </div>

  <div className="col-md-3">
    <div className="card bg-success text-white">
      <div className="card-body text-center">
        <h5>Average Expense</h5>
        <h3>₹ {averageExpense}</h3>
      </div>
    </div>
  </div>

  <div className="col-md-3">
    <div className="card bg-danger text-white">
      <div className="card-body text-center">
        <h5>Highest Expense</h5>
        <h3>₹ {highestExpense}</h3>
      </div>
    </div>
  </div>

  <div className="col-md-3">
    <div className="card bg-warning text-dark">
      <div className="card-body text-center">
        <h5>This Month</h5>
        <h3>₹ {thisMonthExpense}</h3>
      </div>
    </div>
  </div>

</div>
<div className="card mt-4">

  <div className="card-header bg-dark text-white">
    <h4>Recent Transactions</h4>
  </div>

  <div className="card-body">

    {recentTransactions.length === 0 ? (
      <p>No Transactions</p>
    ) : (
      <ul className="list-group">

        {recentTransactions.map((item) => (

          <li
            key={item._id}
            className="list-group-item d-flex justify-content-between align-items-center"
          >

            <div>
              <strong>{item.title}</strong>
              <br />
              <small>{item.category}</small>
            </div>

            <span
              className={
                item.type === "Income"
                  ? "text-success fw-bold"
                  : "text-danger fw-bold"
              }
            >
              {item.type === "Income" ? "+" : "-"}₹{item.amount}
            </span>

          </li>

        ))}

      </ul>
    )}

  </div>

</div>
<PieChartComponent
  expenses={monthlyExpenses.filter(
    (item) => item.type === "Expense"
  )}
/>
<BarChartComponent
  expenses={monthlyExpenses.filter(
    (item) => item.type === "Expense"
  )}
/>
<MonthlyReport expenses={filteredExpenses} />
<MonthlyTrendChart
  expenses={monthlyExpenses.filter(
    (item) => item.type === "Expense"
  )}
/>
<div className="card mt-4 shadow">
  <div className="card-header bg-dark text-white">
    <h4>🤖 AI Financial Advisor</h4>
  </div>

  <div className="card-body">

    <button
      className="btn btn-primary"
      onClick={getAIAdvice}
    >
      Get AI Advice
    </button>

   {aiAdvice && (
  <div className="card mt-3">
    <div className="card-body">

      <h4>🤖 AI Financial Advisor</h4>

      <hr />

      <h5>📊 Spending Analysis</h5>
      <p>{aiAdvice.spendingAnalysis}</p>

      <h5>💰 Saving Analysis</h5>
      <p>{aiAdvice.savingAnalysis}</p>

      <h5>🎯 Budget Suggestions</h5>
      <ul>
        {aiAdvice?.budgetSuggestions?.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>

      <h5>💡 Smart Tips</h5>
      <ul>
        {aiAdvice?.tips?.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>

    </div>
  </div>
)}
  </div>
</div>
</div>
  );
}

export default Dashboard;