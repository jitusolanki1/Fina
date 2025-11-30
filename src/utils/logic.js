// Utility functions to compute running balances and totals for accounts

export function runningBalances(openingBalance = 0, transactions = []) {
  // transactions expected sorted ascending by date
  let bal = Number(openingBalance) || 0;
  return transactions.map((t, idx) => {
    const deposit = Number(t.deposit || 0);
    const otherDeposit = Number(t.otherDeposit || 0);
    const penalWithdrawal = Number(t.penalWithdrawal || 0);
    const otherWithdrawal = Number(t.otherWithdrawal || 0);
    bal = bal + deposit + otherDeposit - penalWithdrawal - otherWithdrawal;
    return {
      ...t,
      balance: bal,
      id: t.id || idx,
      deposit,
      otherDeposit,
      penalWithdrawal,
      otherWithdrawal,
    };
  });
}

export function totalsFor(account = {}, transactions = []) {
  const txs = (transactions || []).filter(
    (t) => String(t.accountId) === String(account.id)
  );
  const opening = Number(account.openingBalance || 0);
  const totals = txs.reduce(
    (acc, t) => {
      acc.totalDeposit += Number(t.deposit || 0);
      acc.totalOtherDeposit += Number(t.otherDeposit || 0);
      acc.totalPenalWithdrawal += Number(t.penalWithdrawal || 0);
      acc.totalOtherWithdrawal += Number(t.otherWithdrawal || 0);
      return acc;
    },
    {
      totalDeposit: 0,
      totalOtherDeposit: 0,
      totalPenalWithdrawal: 0,
      totalOtherWithdrawal: 0,
    }
  );

  const finalBalance =
    opening +
    totals.totalDeposit +
    totals.totalOtherDeposit -
    totals.totalPenalWithdrawal -
    totals.totalOtherWithdrawal;

  return {
    ...totals,
    finalBalance,
  };
}
