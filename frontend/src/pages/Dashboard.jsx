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

  const [sortOption, setSortOption] = useState("latest");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [type, setType] = useState("Expense");
  const [editId, setEditId] = useState(null);

  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [aiAdvice, setAiAdvice] = useState(null);
  const [showAIChat, setShowAIChat] = useState(false);

  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  /* =========================
     FETCH BUDGET
  ========================= */
  const fetchBudget = async () => {
    try {
      const month = new Date().toISOString().slice(0, 7);

      const res = await API.get(`/budget/${month}`);

      setBudgetData(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  /* =========================
     FETCH EXPENSES
  ========================= */
  const fetchExpenses = async () => {
    try {
      const res = await API.get("/expenses");

      setExpenses(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchBudget();
  }, []);

  /* =========================
     TOTAL CALCULATIONS
  ========================= */
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
      ? ((monthlyExpense / budgetAmount) * 100).toFixed(0)
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

  /* =========================
     CATEGORY ANALYSIS
  ========================= */
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

  /* =========================
     AI CATEGORY
  ========================= */
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

  /* =========================
     FILTER
  ========================= */
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

  /* =========================
     SORT
  ========================= */
  const sortedExpenses = [...filteredExpenses].sort(
    (a, b) => {
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
    }
  );

  /* =========================
     PAGINATION
  ========================= */
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;

  const currentExpenses = sortedExpenses.slice(
    indexOfFirst,
    indexOfLast
  );

  const recentTransactions = [...monthlyExpenses]
    .sort(
      (a, b) =>
        new Date(b.date) - new Date(a.date)
    )
    .slice(0, 5);

  /* =========================
     DELETE
  ========================= */
  const deleteExpense = async (id) => {
    try {
      await API.delete(`/expenses/${id}`);

      toast.success("Expense Deleted Successfully");

      fetchExpenses();
    } catch (error) {
      console.log(error);

      toast.error(
        error.response?.data?.message ||
          "Delete Failed"
      );
    }
  };

  /* =========================
     EDIT
  ========================= */
  const startEdit = (item) => {
    setEditId(item._id);
    setTitle(item.title);
    setAmount(item.amount);
    setCategory(item.category);
    setType(item.type);
    setDate(item.date.split("T")[0]);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  /* =========================
     ADD / UPDATE EXPENSE
  ========================= */
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

        toast.success(
          "Expense Updated Successfully"
        );
      } else {
        await API.post("/expenses", {
          title,
          amount: Number(amount),
          category,
          type,
          date,
        });

        toast.success(
          "Expense Added Successfully"
        );
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

      toast.error(
        error.response?.data?.message ||
          "Failed to add expense"
      );
    }
  };

  /* =========================
     SAVE BUDGET
  ========================= */
  const saveBudget = async () => {
    try {
      const month = new Date()
        .toISOString()
        .slice(0, 7);

      await API.post("/budget", {
        month,
        amount: Number(budget),
      });

      toast.success("Budget Saved Successfully");

      setBudget("");

      fetchBudget();
    } catch (err) {
      console.log(err);

      toast.error("Failed to save budget");
    }
  };

  /* =========================
     EXCEL EXPORT
  ========================= */
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      filteredExpenses.map((item) => ({
        Title: item.title,
        Amount: item.amount,
        Category: item.category,
        Type: item.type,
        Date: new Date(
          item.date
        ).toLocaleDateString(),
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

    const file = new Blob(
      [excelBuffer],
      {
        type: "application/octet-stream",
      }
    );

    saveAs(file, "Expense_Report.xlsx");
  };

  /* =========================
     PDF EXPORT
  ========================= */
  const exportToPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);

    doc.text(
      "Expense Report",
      14,
      15
    );

    autoTable(doc, {
      startY: 25,
      head: [
        [
          "Title",
          "Amount",
          "Category",
          "Type",
          "Date",
        ],
      ],
      body: filteredExpenses.map(
        (item) => [
          item.title,
          item.amount,
          item.category,
          item.type,
          new Date(
            item.date
          ).toLocaleDateString(),
        ]
      ),
    });

    doc.save("Expense_Report.pdf");
  };

  /* =========================
     AI FINANCIAL ADVICE
  ========================= */
  const getAIAdvice = async () => {
    try {
      const res = await API.post(
        "/ai/advice",
        {
          expenses,
        }
      );

      console.log(res.data);

      setAiAdvice(res.data.advice);

      toast.success(
        "AI Financial Analysis Ready"
      );
    } catch (error) {
      console.log(error);

      toast.error(
        "Failed to get AI Advice"
      );
    }
  };

  /* =========================
     LOGOUT
  ========================= */
  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="dashboard-page">

      {/* ==================================================
          HEADER
      ================================================== */}
      <div className="dashboard-header">

        <div>
          <p className="dashboard-eyebrow">
            PERSONAL FINANCE
          </p>

          <h1>
            Expense Tracker
          </h1>

          <p className="dashboard-welcome">
            Welcome back, {user?.name || "User"} 👋
          </p>
        </div>

        <div className="dashboard-header-actions">

          <button
            className="dashboard-ai-button"
            onClick={() =>
              setShowAIChat(!showAIChat)
            }
          >
            🤖
            <span>
              {showAIChat
                ? "Close AI"
                : "AI Assistant"}
            </span>
          </button>

          <div className="dropdown">

            <button
              className="dashboard-profile-button dropdown-toggle"
              type="button"
              data-bs-toggle="dropdown"
            >
              👤
              <span>Profile</span>
            </button>

            <ul className="dropdown-menu dropdown-menu-end">

              <li>
                <button
                  className="dropdown-item"
                  onClick={() =>
                    navigate("/profile")
                  }
                >
                  👤 My Profile
                </button>
              </li>

              <li>
                <button
                  className="dropdown-item"
                  onClick={() =>
                    navigate("/settings")
                  }
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


      {/* ==================================================
          AI CHAT
      ================================================== */}
      {showAIChat && (
        <section className="dashboard-ai-chat-section">

          <div className="dashboard-section-heading">
            <div>
              <span className="section-label">
                AI ASSISTANT
              </span>

              <h2>
                Ask your financial assistant
              </h2>

              <p>
                Get help understanding your
                spending and managing your money.
              </p>
            </div>
          </div>

          <div className="dashboard-ai-chat-card">
            <AIChat />
          </div>

        </section>
      )}


      {/* ==================================================
          TOP SUMMARY CARDS
      ================================================== */}
      <section className="summary-grid">

        {/* Budget */}
        <div className="finance-card budget-card">

          <div className="finance-card-top">
            <div>
              <p className="finance-card-label">
                MONTHLY BUDGET
              </p>

              <h3>
                ₹ {budgetAmount}
              </h3>
            </div>

            <div className="finance-icon">
              🎯
            </div>
          </div>

          <div className="budget-progress">

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(
                    Number(budgetPercentage),
                    100
                  )}%`,
                }}
              />
            </div>

            <div className="budget-progress-text">
              <span>
                Used {budgetPercentage}%
              </span>

              <span>
                ₹{" "}
                {Math.max(
                  budgetAmount -
                    monthlyExpense,
                  0
                )}{" "}
                remaining
              </span>
            </div>

          </div>

          <div className="budget-input-area">

            <input
              type="number"
              className="dashboard-input"
              placeholder="Set monthly budget"
              value={budget}
              onChange={(e) =>
                setBudget(e.target.value)
              }
            />

            <button
              className="primary-button"
              onClick={saveBudget}
            >
              Save Budget
            </button>

          </div>

          {budgetPercentage >= 80 &&
            budgetPercentage < 100 && (
              <div className="budget-warning">
                ⚠️ You have used{" "}
                {budgetPercentage}% of your
                budget.
              </div>
            )}

          {budgetPercentage >= 100 && (
            <div className="budget-danger">
              🚨 Your monthly budget has been
              exceeded.
            </div>
          )}

        </div>


        {/* Income */}
        <div className="finance-card income-card">

          <div className="finance-card-top">

            <div>
              <p className="finance-card-label">
                TOTAL INCOME
              </p>

              <h3>
                ₹ {monthlyIncome}
              </h3>

              <span className="finance-card-subtext">
                This month
              </span>
            </div>

            <div className="finance-icon income-icon">
              ↗
            </div>

          </div>

        </div>


        {/* Expense */}
        <div className="finance-card expense-card">

          <div className="finance-card-top">

            <div>
              <p className="finance-card-label">
                TOTAL EXPENSE
              </p>

              <h3>
                ₹ {monthlyExpense}
              </h3>

              <span className="finance-card-subtext">
                This month
              </span>
            </div>

            <div className="finance-icon expense-icon">
              ↘
            </div>

          </div>

        </div>


        {/* Balance */}
        <div className="finance-card balance-card">

          <div className="finance-card-top">

            <div>
              <p className="finance-card-label">
                BALANCE
              </p>

              <h3>
                ₹ {balance}
              </h3>

              <span className="finance-card-subtext">
                Available balance
              </span>
            </div>

            <div className="finance-icon balance-icon">
              ₹
            </div>

          </div>

        </div>

      </section>


      {/* ==================================================
          VOICE EXPENSE
      ================================================== */}
      <section className="dashboard-section">

        <div className="dashboard-section-heading">

          <div>
            <span className="section-label">
              QUICK ENTRY
            </span>

            <h2>
              Add expense using your voice
            </h2>

            <p>
              Record an expense quickly without
              typing everything manually.
            </p>
          </div>

        </div>

        <div className="voice-expense-card">
          <VoiceExpense
            onTransactionAdded={
              fetchExpenses
            }
          />
        </div>

      </section>


      {/* ==================================================
          MONTHLY OVERVIEW
      ================================================== */}
      <section className="dashboard-section">

        <div className="dashboard-section-heading">

          <div>
            <span className="section-label">
              MONTHLY OVERVIEW
            </span>

            <h2>
              Your financial summary
            </h2>

            <p>
              A quick look at this month's
              financial activity.
            </p>
          </div>

        </div>


        <div className="overview-grid">

          <div className="overview-item">
            <span>Income</span>

            <strong className="income-text">
              ₹ {monthlyIncome}
            </strong>
          </div>

          <div className="overview-item">
            <span>Expenses</span>

            <strong className="expense-text">
              ₹ {monthlyExpense}
            </strong>
          </div>

          <div className="overview-item">
            <span>Balance</span>

            <strong className="primary-text">
              ₹ {monthlyBalance}
            </strong>
          </div>

          <div className="overview-item">
            <span>Transactions</span>

            <strong>
              {monthlyTransactions}
            </strong>
          </div>

        </div>


        <div className="category-highlight">

          <div>
            <span className="section-label">
              TOP SPENDING CATEGORY
            </span>

            {highestCategory ? (
              <>
                <h3>
                  {highestCategory[0]}
                </h3>

                <p>
                  ₹{" "}
                  {highestCategory[1]}
                </p>
              </>
            ) : (
              <h3>
                No expenses this month
              </h3>
            )}
          </div>

          <div className="category-icon">
            📊
          </div>

        </div>

      </section>


      {/* ==================================================
          ADD EXPENSE
      ================================================== */}
      <section className="dashboard-section">

        <div className="dashboard-section-heading">

          <div>
            <span className="section-label">
              TRANSACTIONS
            </span>

            <h2>
              {editId
                ? "Update transaction"
                : "Add a new transaction"}
            </h2>

            <p>
              Track your income and expenses
              in one place.
            </p>
          </div>

        </div>


        <div className="expense-form-card">

          <div className="form-grid">

            <div className="form-group">

              <label>
                🤖 Expense / Income Title
              </label>

              <input
                type="text"
                className="dashboard-input"
                placeholder="Example: Swiggy, Uber, Salary..."
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);

                  if (
                    e.target.value.length >
                    3
                  ) {
                    categorizeExpense();
                  }
                }}
              />

              <small>
                AI will automatically suggest
                a category.
              </small>

            </div>


            <div className="form-group">

              <label>
                Amount
              </label>

              <input
                className="dashboard-input"
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) =>
                  setAmount(
                    e.target.value
                  )
                }
              />

            </div>


            <div className="form-group">

              <label>
                Category
              </label>

              <select
                className="dashboard-input"
                value={category}
                onChange={(e) =>
                  setCategory(
                    e.target.value
                  )
                }
              >
                <option>Food</option>
                <option>Travel</option>
                <option>Shopping</option>
                <option>Salary</option>
                <option>Bills</option>
                <option>Entertainment</option>
              </select>

            </div>


            <div className="form-group">

              <label>
                Transaction Type
              </label>

              <select
                className="dashboard-input"
                value={type}
                onChange={(e) =>
                  setType(e.target.value)
                }
              >
                <option>Expense</option>
                <option>Income</option>
              </select>

            </div>


            <div className="form-group">

              <label>
                Date
              </label>

              <input
                className="dashboard-input"
                type="date"
                value={date}
                onChange={(e) =>
                  setDate(e.target.value)
                }
              />

            </div>

          </div>


          <div className="form-actions">

            <button
              className="primary-button"
              onClick={addExpense}
            >
              {editId
                ? "Update Expense"
                : "Add Expense"}
            </button>

            {editId && (
              <button
                className="secondary-button"
                onClick={() => {
                  setEditId(null);
                  setTitle("");
                  setAmount("");
                  setCategory("Food");
                  setType("Expense");
                  setDate("");
                }}
              >
                Cancel
              </button>
            )}

            <button
              className="secondary-button"
              onClick={exportToExcel}
            >
              📊 Export Excel
            </button>

            <button
              className="secondary-button"
              onClick={exportToPDF}
            >
              📄 Export PDF
            </button>

          </div>

        </div>

      </section>


      {/* ==================================================
          SEARCH / FILTER
      ================================================== */}
      <section className="dashboard-section">

        <div className="dashboard-section-heading">

          <div>
            <span className="section-label">
              FIND TRANSACTIONS
            </span>

            <h2>
              Search & filter
            </h2>
          </div>

        </div>


        <div className="filter-card">

          <div className="filter-grid">

            <div className="form-group">

              <label>
                Search
              </label>

              <input
                className="dashboard-input"
                type="text"
                placeholder="Search title, category or type..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

            </div>


            <div className="form-group">

              <label>
                Sort
              </label>

              <select
                className="dashboard-input"
                value={sortOption}
                onChange={(e) =>
                  setSortOption(
                    e.target.value
                  )
                }
              >
                <option value="latest">
                  Latest First
                </option>

                <option value="oldest">
                  Oldest First
                </option>

                <option value="amountLow">
                  Amount Low → High
                </option>

                <option value="amountHigh">
                  Amount High → Low
                </option>

              </select>

            </div>


            <div className="form-group">

              <label>
                From Date
              </label>

              <input
                className="dashboard-input"
                type="date"
                value={fromDate}
                onChange={(e) =>
                  setFromDate(
                    e.target.value
                  )
                }
              />

            </div>


            <div className="form-group">

              <label>
                To Date
              </label>

              <input
                className="dashboard-input"
                type="date"
                value={toDate}
                onChange={(e) =>
                  setToDate(
                    e.target.value
                  )
                }
              />

            </div>

          </div>

        </div>

      </section>


      {/* ==================================================
          TRANSACTION TABLE
      ================================================== */}
      <section className="dashboard-section">

        <div className="dashboard-section-heading">

          <div>
            <span className="section-label">
              TRANSACTION HISTORY
            </span>

            <h2>
              Your transactions
            </h2>

            <p>
              Showing this month's filtered
              transactions.
            </p>
          </div>

        </div>


        <div className="transactions-card">

          {expenses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                🧾
              </div>

              <h3>
                No transactions found
              </h3>

              <p>
                Add your first transaction
                to start tracking your money.
              </p>
            </div>
          ) : currentExpenses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                🔍
              </div>

              <h3>
                No matching transactions
              </h3>

              <p>
                Try changing your search or
                filter settings.
              </p>
            </div>
          ) : (
            <div className="table-responsive">

              <table className="professional-table">

                <thead>
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

                  {currentExpenses.map(
                    (item) => (
                      <tr key={item._id}>

                        <td>
                          <strong>
                            {item.title}
                          </strong>
                        </td>

                        <td>
                          <strong>
                            ₹ {item.amount}
                          </strong>
                        </td>

                        <td>
                          <span className="category-badge">
                            {item.category}
                          </span>
                        </td>

                        <td>
                          <span
                            className={
                              item.type ===
                              "Income"
                                ? "transaction-income"
                                : "transaction-expense"
                            }
                          >
                            {item.type}
                          </span>
                        </td>

                        <td>
                          {new Date(
                            item.date
                          ).toLocaleDateString()}
                        </td>

                        <td>

                          <div className="table-actions">

                            <button
                              className="small-edit-button"
                              onClick={() =>
                                startEdit(item)
                              }
                            >
                              Edit
                            </button>

                            <button
                              className="small-delete-button"
                              onClick={() =>
                                deleteExpense(
                                  item._id
                                )
                              }
                            >
                              Delete
                            </button>

                          </div>

                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}


          {/* Pagination */}
          <div className="pagination-area">

            <button
              className="pagination-button"
              disabled={
                currentPage === 1
              }
              onClick={() =>
                setCurrentPage(
                  currentPage - 1
                )
              }
            >
              ← Previous
            </button>

            <span>
              Page {currentPage} of{" "}
              {Math.max(
                1,
                Math.ceil(
                  sortedExpenses.length /
                    itemsPerPage
                )
              )}
            </span>

            <button
              className="pagination-button"
              disabled={
                currentPage >=
                Math.ceil(
                  sortedExpenses.length /
                    itemsPerPage
                )
              }
              onClick={() =>
                setCurrentPage(
                  currentPage + 1
                )
              }
            >
              Next →
            </button>

          </div>

        </div>

      </section>


      {/* ==================================================
          STATISTICS
      ================================================== */}
      <section className="dashboard-section">

        <div className="dashboard-section-heading">

          <div>
            <span className="section-label">
              SPENDING INSIGHTS
            </span>

            <h2>
              Your financial statistics
            </h2>
          </div>

        </div>


        <div className="statistics-grid">

          <div className="stat-card">
            <span>
              Total Transactions
            </span>

            <strong>
              {totalTransactions}
            </strong>
          </div>

          <div className="stat-card">
            <span>
              Average Expense
            </span>

            <strong>
              ₹ {averageExpense}
            </strong>
          </div>

          <div className="stat-card">
            <span>
              Highest Expense
            </span>

            <strong>
              ₹ {highestExpense}
            </strong>
          </div>

          <div className="stat-card">
            <span>
              This Month
            </span>

            <strong>
              ₹ {thisMonthExpense}
            </strong>
          </div>

        </div>

      </section>


      {/* ==================================================
          RECENT TRANSACTIONS
      ================================================== */}
      <section className="dashboard-section">

        <div className="dashboard-section-heading">

          <div>
            <span className="section-label">
              RECENT ACTIVITY
            </span>

            <h2>
              Recent transactions
            </h2>
          </div>

        </div>


        <div className="recent-card">

          {recentTransactions.length ===
          0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                🧾
              </div>

              <h3>
                No transactions yet
              </h3>

              <p>
                Your recent transactions
                will appear here.
              </p>
            </div>
          ) : (
            <div className="recent-list">

              {recentTransactions.map(
                (item) => (
                  <div
                    key={item._id}
                    className="recent-item"
                  >

                    <div className="recent-left">

                      <div className="recent-icon">
                        {item.type ===
                        "Income"
                          ? "↗"
                          : "↘"}
                      </div>

                      <div>
                        <strong>
                          {item.title}
                        </strong>

                        <span>
                          {item.category}
                        </span>
                      </div>

                    </div>

                    <strong
                      className={
                        item.type ===
                        "Income"
                          ? "income-text"
                          : "expense-text"
                      }
                    >
                      {item.type ===
                      "Income"
                        ? "+"
                        : "-"}
                      ₹{item.amount}
                    </strong>

                  </div>
                )
              )}

            </div>
          )}

        </div>

      </section>


      {/* ==================================================
          CHARTS
      ================================================== */}
      <section className="dashboard-section">

        <div className="dashboard-section-heading">

          <div>
            <span className="section-label">
              ANALYTICS
            </span>

            <h2>
              Spending analytics
            </h2>

            <p>
              Understand where your money is
              going.
            </p>
          </div>

        </div>


        <div className="charts-grid">

          <div className="chart-card">
            <PieChartComponent
              expenses={monthlyExpenses.filter(
                (item) =>
                  item.type ===
                  "Expense"
              )}
            />
          </div>

          <div className="chart-card">
            <BarChartComponent
              expenses={monthlyExpenses.filter(
                (item) =>
                  item.type ===
                  "Expense"
              )}
            />
          </div>

        </div>


        <div className="chart-full-card">

          <MonthlyTrendChart
            expenses={monthlyExpenses.filter(
              (item) =>
                item.type ===
                "Expense"
            )}
          />

        </div>


        <div className="report-card">

          <MonthlyReport
            expenses={filteredExpenses}
          />

        </div>

      </section>


      {/* ==================================================
          AI FINANCIAL ADVISOR
      ================================================== */}
      <section className="ai-advisor-section">

        <div className="ai-advisor-header">

          <div>

            <span className="ai-badge">
              ✨ AI POWERED
            </span>

            <h2>
              AI Financial Advisor
            </h2>

            <p>
              Get personalized insights into
              your spending, savings and budget.
            </p>

          </div>

          <div className="ai-advisor-icon">
            🤖
          </div>

        </div>


        <div className="ai-advisor-body">

          <button
            className="ai-advice-button"
            onClick={getAIAdvice}
          >
            ✨ Analyze My Finances
          </button>


          {aiAdvice && (
            <div className="ai-advice-result">

              {/* Spending */}
              <div className="ai-insight-card">

                <div className="ai-insight-icon">
                  📊
                </div>

                <div>

                  <h3>
                    Spending Analysis
                  </h3>

                  <p>
                    {aiAdvice.spendingAnalysis}
                  </p>

                </div>

              </div>


              {/* Saving */}
              <div className="ai-insight-card">

                <div className="ai-insight-icon">
                  💰
                </div>

                <div>

                  <h3>
                    Saving Analysis
                  </h3>

                  <p>
                    {aiAdvice.savingAnalysis}
                  </p>

                </div>

              </div>


              {/* Budget */}
              <div className="ai-insight-card">

                <div className="ai-insight-icon">
                  🎯
                </div>

                <div>

                  <h3>
                    Budget Suggestions
                  </h3>

                  {aiAdvice?.budgetSuggestions
                    ?.length > 0 ? (
                    <ul>
                      {aiAdvice.budgetSuggestions.map(
                        (item, index) => (
                          <li key={index}>
                            {item}
                          </li>
                        )
                      )}
                    </ul>
                  ) : (
                    <p>
                      No budget suggestions
                      available.
                    </p>
                  )}

                </div>

              </div>


              {/* Tips */}
              <div className="ai-insight-card">

                <div className="ai-insight-icon">
                  💡
                </div>

                <div>

                  <h3>
                    Smart Tips
                  </h3>

                  {aiAdvice?.tips
                    ?.length > 0 ? (
                    <ul>
                      {aiAdvice.tips.map(
                        (item, index) => (
                          <li key={index}>
                            {item}
                          </li>
                        )
                      )}
                    </ul>
                  ) : (
                    <p>
                      No smart tips available.
                    </p>
                  )}

                </div>

              </div>

            </div>
          )}

        </div>

      </section>


      {/* ==================================================
          BOTTOM PROFILE BUTTON
      ================================================== */}
      <div className="dashboard-bottom-actions">

        <button
          className="secondary-button"
          onClick={() =>
            navigate("/profile")
          }
        >
          👤 View Profile
        </button>

      </div>

    </div>
  );
}

export default Dashboard;