import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function ExportPDF({ transactions }) {
  const exportPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Expense Tracker Report", 14, 20);

    autoTable(doc, {
      startY: 30,
      head: [["Type", "Title", "Category", "Amount", "Date"]],
      body: transactions.map((item) => [
        item.type,
        item.title,
        item.category,
        item.amount.toString(),
        item.date,
      ]),
    });

    doc.save("Expense_Report.pdf");
  };

  return (
    <button onClick={exportPDF}>
      📄 Export PDF
    </button>
  );
}

export default ExportPDF;