import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

function BarChartComponent({ expenses }) {
  const monthlyData = [];

  expenses.forEach((item) => {
    const month = new Date(item.date).toLocaleString("default", {
      month: "short",
    });

    const existing = monthlyData.find((m) => m.month === month);

    if (existing) {
      existing.amount += item.amount;
    } else {
      monthlyData.push({
        month,
        amount: item.amount,
      });
    }
  });

  return (
    <div className="card p-3 mt-4">
      <h4 className="text-center">Monthly Expenses</h4>

      <BarChart
        width={700}
        height={300}
        data={monthlyData}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="amount" fill="#0d6efd" />
      </BarChart>
    </div>
  );
}

export default BarChartComponent;