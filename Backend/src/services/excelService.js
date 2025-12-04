import XLSX from "xlsx";

export function generateAccountExcel(accountData) {
  const sheet = XLSX.utils.json_to_sheet(accountData.summary);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "Sheet1");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  return buffer;
}
