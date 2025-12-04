import moment from "moment-timezone";

export function getUserLocalDate(userTimezone) {
  return moment().tz(userTimezone).format("DD-MM-YYYY");
}

export function getUserLocalTime(userTimezone) {
  return moment().tz(userTimezone).format("HH:mm");
}

export function isUserCommitTime(userTimezone, userSetTime) {
  const now = moment().tz(userTimezone).format("HH:mm");
  return now === userSetTime;
}
