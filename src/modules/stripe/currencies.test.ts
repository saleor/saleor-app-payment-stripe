import { describe, it, expect } from "vitest";
import { getStripeAmountFromSaleorMoney, getSaleorAmountFromStripeAmount } from "./currencies";

describe("currencies", () => {
  const testCases = [
    { major: 10, currency: "PLN", minor: 1000 },
    { major: 21.37, currency: "PLN", minor: 2137 },
    { major: 21.37, currency: "EUR", minor: 2137 },
    { major: 21.37, currency: "USD", minor: 2137 },
    { major: 1231231231.23, currency: "PLN", minor: 123123123123 },

    // https://stripe.com/docs/currencies?presentment-currency=US#zero-decimal
    { major: 500, currency: "BIF", minor: 500 },
    { major: 500, currency: "CLP", minor: 500 },
    { major: 500, currency: "DJF", minor: 500 },
    { major: 500, currency: "GNF", minor: 500 },
    { major: 500, currency: "JPY", minor: 500 },
    { major: 500, currency: "KMF", minor: 500 },
    { major: 500, currency: "KRW", minor: 500 },
    { major: 500, currency: "MGA", minor: 500 },
    { major: 500, currency: "PYG", minor: 500 },
    { major: 500, currency: "RWF", minor: 500 },
    { major: 500, currency: "UGX", minor: 500 },
    { major: 500, currency: "VND", minor: 500 },
    { major: 500, currency: "VUV", minor: 500 },
    { major: 500, currency: "XAF", minor: 500 },
    { major: 500, currency: "XOF", minor: 500 },
    { major: 500, currency: "XPF", minor: 500 },

    // https://stripe.com/docs/currencies?presentment-currency=US#three-decimal
    { major: 5.12, currency: "BHD", minor: 5120 },
    { major: 5.12, currency: "JOD", minor: 5120 },
    { major: 5.12, currency: "KWD", minor: 5120 },
    { major: 5.12, currency: "OMR", minor: 5120 },
    { major: 5.12, currency: "TND", minor: 5120 },

    // @todo
    // {major: 5.124, currency: 'BHD', minor: 5120 OR 5130},
    // {major: 5.124, currency: 'JOD', minor: 5120 OR 5130},
    // {major: 5.124, currency: 'KWD', minor: 5120 OR 5130},
    // {major: 5.124, currency: 'OMR', minor: 5120 OR 5130},
    // {major: 5.124, currency: 'TND', minor: 5120 OR 5130},

    { major: 21.37, currency: "XBT", minor: 2137 },
  ];

  it.each(testCases)("getStripeAmountFromSaleorMoney %p", ({ major, minor, currency }) => {
    expect(getStripeAmountFromSaleorMoney({ amount: major, currency })).toEqual(minor);
  });
  it.each(testCases)("getSaleorAmountFromStripeAmount %p", ({ major, minor, currency }) => {
    expect(getSaleorAmountFromStripeAmount({ amount: minor, currency })).toEqual(major);
  });

  it.each(testCases)("identity %p", ({ major, minor, currency }) => {
    expect(
      getStripeAmountFromSaleorMoney({
        amount: getSaleorAmountFromStripeAmount({ amount: minor, currency }),
        currency,
      }),
    ).toEqual(minor);
    expect(
      getSaleorAmountFromStripeAmount({
        amount: getStripeAmountFromSaleorMoney({ amount: major, currency }),
        currency,
      }),
    ).toEqual(major);
  });
});
