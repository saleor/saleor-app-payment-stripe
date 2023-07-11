import { type Money } from "generated/graphql";
import { invariant } from "@/lib/invariant";

const getDecimalsForStripe = (currency: string) => {
  invariant(currency.length === 3, "currency needs to be a 3-letter code");

  const stripeDecimals = stripeCurrencies[currency.toUpperCase()];
  const decimals = stripeDecimals ?? 2;
  return decimals;
};

// Some payment methods expect the amount to be in cents (integers)
// Saleor provides and expects the amount to be in dollars (decimal format / floats)
export const getStripeAmountFromSaleorMoney = ({ amount: major, currency }: Money) => {
  const decimals = getDecimalsForStripe(currency);
  const multiplier = 10 ** decimals;
  return Number.parseInt((major * multiplier).toFixed(0), 10);
};

// Some payment methods expect the amount to be in cents (integers)
// Saleor provides and expects the amount to be in dollars (decimal format / floats)
export const getSaleorAmountFromStripeAmount = ({ amount: minor, currency }: Money) => {
  const decimals = getDecimalsForStripe(currency);
  const multiplier = 10 ** decimals;
  return Number.parseFloat((minor / multiplier).toFixed(decimals));
};

// https://docs.stripe.com/development-resources/currency-codes
const stripeCurrencies: Record<string, number> = {
  BIF: 0,
  CLP: 0,
  DJF: 0,
  GNF: 0,
  JPY: 0,
  KMF: 0,
  KRW: 0,
  MGA: 0,
  PYG: 0,
  RWF: 0,
  UGX: 0,
  VND: 0,
  VUV: 0,
  XAF: 0,
  XOF: 0,
  XPF: 0,

  BHD: 3,
  JOD: 3,
  KWD: 3,
  OMR: 3,
  TND: 3,
};
