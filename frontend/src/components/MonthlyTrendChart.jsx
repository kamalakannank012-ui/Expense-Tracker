import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

function MonthlyTrendChart({ expenses }) {
  const monthlyData = expenses.reduce((acc, item) => {
    const month = new Date(item.date).toLocaleString("default", {
      month: "short",
    });

    const existing = acc.find((x) => x.month === month);

    if (existing) {
      existing.amount += item.amount;
    } else {
      acc.push({
        month,
        amount: item.amount,
      });
    }

    return acc;
  }, []);

  return (
    <div className="mt-5">
      <h3>Monthly Expense Trend</h3>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={monthlyData}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="month" />

          <YAxis />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="amount"
            stroke="#8884d8"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default MonthlyTrendChart;