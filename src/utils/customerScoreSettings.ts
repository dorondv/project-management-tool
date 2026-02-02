export type CustomerScoreMetric =
  | 'monthlyIncome'
  | 'hourlyRate'
  | 'seniority'
  | 'referralsCount'
  | 'totalRevenue'
  | 'referredRevenue';

export interface CustomerScoreSettings {
  weights: Record<CustomerScoreMetric, number>;
  include: Record<CustomerScoreMetric, boolean>;
}

const DEFAULT_WEIGHT = 1;
const MIN_WEIGHT = 0;
const MAX_WEIGHT = 2;

export const defaultCustomerScoreSettings: CustomerScoreSettings = {
  weights: {
    monthlyIncome: DEFAULT_WEIGHT,
    hourlyRate: DEFAULT_WEIGHT,
    seniority: DEFAULT_WEIGHT,
    referralsCount: DEFAULT_WEIGHT,
    totalRevenue: DEFAULT_WEIGHT,
    referredRevenue: DEFAULT_WEIGHT,
  },
  include: {
    monthlyIncome: true,
    hourlyRate: true,
    seniority: true,
    referralsCount: true,
    totalRevenue: true,
    referredRevenue: true,
  },
};

const clampWeight = (value: number) => Math.min(MAX_WEIGHT, Math.max(MIN_WEIGHT, value));

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

export const sanitizeCustomerScoreSettings = (
  input?: Partial<CustomerScoreSettings> | null,
): CustomerScoreSettings => {
  const weights = defaultCustomerScoreSettings.weights;
  const include = defaultCustomerScoreSettings.include;

  return {
    weights: {
      monthlyIncome: isFiniteNumber(input?.weights?.monthlyIncome)
        ? clampWeight(input.weights!.monthlyIncome)
        : weights.monthlyIncome,
      hourlyRate: isFiniteNumber(input?.weights?.hourlyRate)
        ? clampWeight(input.weights!.hourlyRate)
        : weights.hourlyRate,
      seniority: isFiniteNumber(input?.weights?.seniority)
        ? clampWeight(input.weights!.seniority)
        : weights.seniority,
      referralsCount: isFiniteNumber(input?.weights?.referralsCount)
        ? clampWeight(input.weights!.referralsCount)
        : weights.referralsCount,
      totalRevenue: isFiniteNumber(input?.weights?.totalRevenue)
        ? clampWeight(input.weights!.totalRevenue)
        : weights.totalRevenue,
      referredRevenue: isFiniteNumber(input?.weights?.referredRevenue)
        ? clampWeight(input.weights!.referredRevenue)
        : weights.referredRevenue,
    },
    include: {
      monthlyIncome: typeof input?.include?.monthlyIncome === 'boolean'
        ? input.include!.monthlyIncome
        : include.monthlyIncome,
      hourlyRate: typeof input?.include?.hourlyRate === 'boolean'
        ? input.include!.hourlyRate
        : include.hourlyRate,
      seniority: typeof input?.include?.seniority === 'boolean'
        ? input.include!.seniority
        : include.seniority,
      referralsCount: typeof input?.include?.referralsCount === 'boolean'
        ? input.include!.referralsCount
        : include.referralsCount,
      totalRevenue: typeof input?.include?.totalRevenue === 'boolean'
        ? input.include!.totalRevenue
        : include.totalRevenue,
      referredRevenue: typeof input?.include?.referredRevenue === 'boolean'
        ? input.include!.referredRevenue
        : include.referredRevenue,
    },
  };
};
