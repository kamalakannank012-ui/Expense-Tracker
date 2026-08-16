import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#A020F0",
  "#FF4560",
];

function PieChartComponent({ expenses }) {
  const categoryData = [];

  expenses.forEach((item) => {
    const existing = categoryData.find(
      (c) => c.name === item.category
    );

    if (existing) {
      existing.value += item.amount;
    } else {
      categoryData.push({
        name: item.category,
        value: item.amount,
      });
    }
  });

  return (
    <div className="card p-3 mt-4">
      <h4 className="text-center">Expense by Category</h4>

      <PieChart width={500} height={350}>
        <Pie
          data={categoryData}
          cx="50%"
          cy="50%"
          outerRadius={120}
          dataKey="value"
          label
        >
          {categoryData.map((entry, index) => (
            <Cell
              key={index}
              fill={COLORS[index % COLORS.length]}
            />
          ))}
        </Pie>

        <Tooltip />
        <Legend />
      </PieChart>
    </div>
  );
}

export default PieChartComponent;