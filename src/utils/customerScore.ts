import { Customer, TimeEntry, Income } from '../types';
import { CustomerScoreSettings } from './customerScoreSettings';

export const getCustomerMonthlyIncome = (customer: Customer): number => {
  if (customer.billingModel === 'retainer') {
    return customer.monthlyRetainer || 0;
  }
  return 0;
};

export const getCustomerHourlyRate = (customer: Customer): number => {
  if (customer.billingModel === 'hourly') {
    return customer.monthlyRetainer || 0;
  }
  return 0;
};

export const getCustomerSeniority = (customer: Customer): number => {
  if (!customer.joinDate) return 0;
  const joinDate = new Date(customer.joinDate);
  const now = new Date();
  const years = now.getFullYear() - joinDate.getFullYear();
  const months = now.getMonth() - joinDate.getMonth();
  const days = now.getDate() - joinDate.getDate();
  let totalMonths = years * 12 + months;
  if (days >= 0) {
    const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    totalMonths += days / daysInCurrentMonth;
  } else {
    totalMonths -= 1;
    const daysInPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    totalMonths += (daysInPreviousMonth + days) / daysInPreviousMonth;
  }
  return Math.max(0, totalMonths);
};

export const getReferralsCount = (customerId: string, allCustomers: Customer[]): number => {
  return allCustomers.filter(c =>
    c.referralSource?.startsWith('client_referral:') && c.referralSource.split(':')[1] === customerId
  ).length;
};

export const getTotalRevenue = (customerId: string, allTimeEntries: TimeEntry[], allIncomes: Income[]): number => {
  const timeEntryRevenue = allTimeEntries
    .filter(entry => entry.customerId === customerId)
    .reduce((sum, entry) => sum + entry.income, 0);

  const incomeRevenue = allIncomes
    .filter(income => income.customerId === customerId)
    .reduce((sum, income) => sum + income.finalAmount, 0);

  return timeEntryRevenue + incomeRevenue;
};

export const getReferredRevenue = (
  customerId: string,
  allCustomers: Customer[],
  allTimeEntries: TimeEntry[],
  allIncomes: Income[],
): number => {
  const referredCustomers = allCustomers.filter(c =>
    c.referralSource?.startsWith('client_referral:') && c.referralSource.split(':')[1] === customerId
  );
  if (referredCustomers.length === 0) return 0;

  return referredCustomers.reduce((sum, rc) => {
    return sum + getTotalRevenue(rc.id, allTimeEntries, allIncomes);
  }, 0);
};

export const calculateCustomerScore = (
  customer: Customer,
  allCustomers: Customer[],
  allTimeEntries: TimeEntry[],
  allIncomes: Income[],
  scoreSettings: CustomerScoreSettings,
): string => {
  const activeCustomers = allCustomers.filter(c => c.status === 'active');
  if (activeCustomers.length === 0) return 'C';

  const customerMetrics = {
    monthlyIncome: getCustomerMonthlyIncome(customer),
    hourlyRate: getCustomerHourlyRate(customer),
    seniority: getCustomerSeniority(customer),
    referralsCount: getReferralsCount(customer.id, allCustomers),
    totalRevenue: getTotalRevenue(customer.id, allTimeEntries, allIncomes),
    referredRevenue: getReferredRevenue(customer.id, allCustomers, allTimeEntries, allIncomes),
  };

  const computeAverage = (values: number[]): number => {
    const positiveValues = values.filter(v => v > 0);
    if (positiveValues.length === 0) return 0;
    return positiveValues.reduce((sum, v) => sum + v, 0) / positiveValues.length;
  };

  const averages = {
    monthlyIncome: computeAverage(activeCustomers.map(c => getCustomerMonthlyIncome(c))),
    hourlyRate: computeAverage(activeCustomers.map(c => getCustomerHourlyRate(c))),
    seniority: computeAverage(activeCustomers.map(c => getCustomerSeniority(c))),
    referralsCount: computeAverage(activeCustomers.map(c => getReferralsCount(c.id, allCustomers))),
    totalRevenue: computeAverage(activeCustomers.map(c => getTotalRevenue(c.id, allTimeEntries, allIncomes))),
    referredRevenue: computeAverage(activeCustomers.map(c => getReferredRevenue(c.id, allCustomers, allTimeEntries, allIncomes))),
  };

  const metrics: Array<{
    key: keyof typeof customerMetrics;
    value: number;
    average: number;
  }> = [
    { key: 'monthlyIncome', value: customerMetrics.monthlyIncome, average: averages.monthlyIncome },
    { key: 'hourlyRate', value: customerMetrics.hourlyRate, average: averages.hourlyRate },
    { key: 'seniority', value: customerMetrics.seniority, average: averages.seniority },
    { key: 'referralsCount', value: customerMetrics.referralsCount, average: averages.referralsCount },
    { key: 'totalRevenue', value: customerMetrics.totalRevenue, average: averages.totalRevenue },
    { key: 'referredRevenue', value: customerMetrics.referredRevenue, average: averages.referredRevenue },
  ];

  let weightedScoreTotal = 0;
  let totalWeight = 0;

  metrics.forEach((metric) => {
    const weight = scoreSettings.weights[metric.key];
    const isEnabled = scoreSettings.include[metric.key];
    if (!isEnabled || weight <= 0 || metric.average <= 0) return;
    if (metric.value <= 0) return;
    const normalizedScore = Math.min(metric.value / metric.average, 2);
    weightedScoreTotal += normalizedScore * weight;
    totalWeight += weight;
  });

  if (totalWeight === 0) return 'C';

  const finalScore = weightedScoreTotal / totalWeight;
  if (finalScore >= 1.2) return 'A';
  if (finalScore >= 0.8) return 'B';
  return 'C';
};

export const getScoreBadgeColor = (score: string): string => {
  switch (score) {
    case 'A': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'B': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'C': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
};
