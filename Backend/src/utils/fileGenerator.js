import XLSX from "xlsx";

export function generateAccountXLS(accountName, data = []) {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

  // Return Buffer
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}
