import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

function ExportExcel({ transactions }) {

  const exportToExcel = () => {

    const worksheet = XLSX.utils.json_to_sheet(
      transactions.map((item) => ({
        Type: item.type,
        Title: item.title,
        Category: item.category,
        Amount: item.amount,
        Date: item.date,
      }))
    );

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Transactions"
    );

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });

    const fileData = new Blob(
      [excelBuffer],
      {
        type:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }
    );

    saveAs(fileData, "Expense_Report.xlsx");
  };

  return (
    <button onClick={exportToExcel}>
      📊 Export Excel
    </button>
  );
}

export default ExportExcel;