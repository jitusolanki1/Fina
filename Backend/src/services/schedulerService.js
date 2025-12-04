import cron from "node-cron";
import moment from "moment-timezone";
import User from "../models/User.js";
import Account from "../models/Account.js";
import { octokitForToken, ensureRepoExists, createOrUpdateFile } from "./githubService.js";
import { dailyFolderName } from "../utils/date.js";
import { generateAccountXLS } from "../utils/fileGenerator.js";

function isCommitTimeForUser(user) {
  try {
    const now = moment().tz(user.timezone || "Asia/Kolkata");
    const [hh, mm] = (user.commitTime || "00:00").split(":");
    return now.hour() === Number(hh) && now.minute() === Number(mm);
  } catch (e) {
    return false;
  }
}

export function startScheduler() {
  console.log("Scheduler started...");

  // check every minute and run for users whose configured time matches current minute
  cron.schedule("* * * * *", async () => {
    const users = await User.find({ autoCommit: true });

    for (const user of users) {
      if (!user.github || !user.github.accessToken) continue;
      if (!isCommitTimeForUser(user)) continue;

      try {
        console.log("Running scheduled commit for:", user.email);
        const octokit = octokitForToken(user.github.accessToken);
        const { owner, repo } = await ensureRepoExists(octokit, user.github.repo || "Fina");
        const folder = dailyFolderName(user.timezone || "Asia/Kolkata");

        // find accounts created by this user
        const accounts = await Account.find({ createdBy: String(user._id) });

        for (const acc of accounts) {
          const buffer = generateAccountXLS(acc.name, [
            { Account: acc.name, OpeningBalance: acc.openingBalance || 0 },
          ]);
          const path = `${folder}/${acc.name}.xlsx`;
          const message = `Auto daily summary (${acc.name}) - ${folder}`;
          await createOrUpdateFile(octokit, owner, repo, path, buffer, message);
        }
        console.log(`✔ Auto commit finished for ${user.email}`);
      } catch (err) {
        console.error("Scheduler commit error for user", user.email, err && err.message);
      }
    }
  });
}
