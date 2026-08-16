import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function LineChartComponent({ transactions }) {
  const chartData = transactions.map((item) => ({
    date: item.date,
    amount: item.amount,
  }));

  return (
    <div
      style={{
        width: "100%",
        height: 350,
        marginTop: "40px",
      }}
    >
      <h2>📈 Income & Expense Trend</h2>

      <ResponsiveContainer>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis dataKey="date" />

          <YAxis />

          <Tooltip />

          <Line
            type="monotone"
            dataKey="amount"
            stroke="#2563eb"
            strokeWidth={3}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default LineChartComponent;