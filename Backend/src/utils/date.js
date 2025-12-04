import moment from "moment-timezone";

export function dailyFolderName(timezone = "Asia/Kolkata") {
  return moment().tz(timezone).format("DD-MM-YYYY");
}

export function todayDate(timezone = "Asia/Kolkata") {
  return moment().tz(timezone).format("YYYY-MM-DD");
}

export function currentTimeISO(timezone = "Asia/Kolkata") {
  return moment().tz(timezone).toISOString();
}

export function formatDateToISO(dateString, timezone = "Asia/Kolkata") {
  return moment.tz(dateString, "DD-MM-YYYY", timezone).toISOString();
}
