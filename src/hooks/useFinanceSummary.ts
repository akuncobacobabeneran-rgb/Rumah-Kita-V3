import { useMemo } from 'react';
import { useFamilyStore } from '../stores/useFamilyStore';
import { getCurrentMonthIso } from '../utils/format';

export function useFinanceSummary(filterMonth?: string, filterWalletId?: string) {
  const wallets = useFamilyStore((s) => s.wallets);
  const transactions = useFamilyStore((s) => s.transactions);
  const assets = useFamilyStore((s) => s.assets);
  const goals = useFamilyStore((s) => s.goals);
  const debts = useFamilyStore((s) => s.debts);
  const budgets = useFamilyStore((s) => s.budgets);

  return useMemo(() => {
    const activeMonth = filterMonth || getCurrentMonthIso();

    const activeBalance = wallets.reduce((sum, w) => sum + (Number(w.balance) || 0), 0);
    const totalPhysicalAssets = assets.reduce((sum, a) => sum + (Number(a.value) || 0), 0);
    const totalGoalSavings = goals.reduce((sum, g) => sum + (Number(g.current_amount) || 0), 0);

    const totalReceivables = debts
      .filter((d) => d.type === 'Piutang' && d.status !== 'Lunas')
      .reduce((sum, d) => sum + Math.max(0, d.total_amount - d.paid_amount), 0);

    const totalDebts = debts
      .filter((d) => d.type === 'Utang' && d.status !== 'Lunas')
      .reduce((sum, d) => sum + Math.max(0, d.total_amount - d.paid_amount), 0);

    const totalHarta = activeBalance + totalPhysicalAssets + totalGoalSavings + totalReceivables;
    const netWorth = totalHarta - totalDebts;

    const filteredTransactions = transactions.filter((tx) => {
      const matchMonth =
        !filterMonth || filterMonth === 'ALL' ? true : tx.date.startsWith(activeMonth);
      const matchWallet =
        !filterWalletId || filterWalletId === 'ALL'
          ? true
          : tx.wallet_id === filterWalletId || tx.to_wallet_id === filterWalletId;
      return matchMonth && matchWallet;
    });

    // Transfers between wallets are NOT counted as family income or expense
    const totalIncome = filteredTransactions
      .filter((tx) => tx.type === 'Pemasukan')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalExpense = filteredTransactions
      .filter((tx) => tx.type === 'Pengeluaran')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const monthBudgets = budgets.filter((b) => b.period_month === activeMonth);
    const totalBudgeted = monthBudgets.reduce((sum, b) => sum + b.amount, 0);

    const savingsRate =
      totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

    return {
      activeBalance,
      totalPhysicalAssets,
      totalGoalSavings,
      totalReceivables,
      totalHarta,
      totalDebts,
      netWorth,
      totalIncome,
      totalExpense,
      netCashflow: totalIncome - totalExpense,
      totalBudgeted,
      savingsRate,
      filteredTransactions,
    };
  }, [wallets, transactions, assets, goals, debts, budgets, filterMonth, filterWalletId]);
}
