function SummaryCards({ totalIncome, totalExpense, balance }) {
  return (
    <div className="summary">
      <div className="card income">
        <h2>Income</h2>
        <h3>₹{totalIncome}</h3>
      </div>

      <div className="card expense">
        <h2>Expense</h2>
        <h3>₹{totalExpense}</h3>
      </div>

      <div className="card balance">
        <h2>Balance</h2>
        <h3>₹{balance}</h3>
      </div>
    </div>
  );
}

export default SummaryCards;