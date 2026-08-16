function MonthlyReport({ expenses }) {
  return (
    <div className="card mt-4">
      <div className="card-header bg-secondary text-white">
        <h4>Monthly Report</h4>
      </div>

      <div className="card-body">
        <p>Total Transactions: {expenses.length}</p>
      </div>
    </div>
  );
}

export default MonthlyReport;