import merge from "lodash-es/merge";
import {
  type CheckoutLine,
  LanguageCodeEnum,
  type OrderOrCheckoutLines_Checkout_Fragment,
  type PaymentGatewayInitializeSessionEventFragment,
  type PaymentGatewayRecipientFragment,
  TransactionFlowStrategyEnum,
  type TransactionInitializeSessionEventFragment,
  type TransactionChargeRequestedEventFragment,
  TransactionActionEnum,
  type OrderOrCheckoutLines_Order_Fragment,
  type TransactionRefundRequestedEventFragment,
  type TransactionCancelationRequestedEventFragment,
  type OrderOrCheckoutSourceObject_Checkout_Fragment,
  type OrderOrCheckoutSourceObject_Order_Fragment,
  type OrderLine,
  type TransactionProcessSessionEventFragment,
} from "generated/graphql";
import { type JSONValue } from "@/types";
import { getFilledMetadata } from "@/modules/payment-app-configuration/__tests__/utils";

type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;
type CreateMockFn<T> = (overrides?: DeepPartial<T> | null | undefined) => T;
type CreateMockAsyncFn<T> = (overrides?: DeepPartial<T> | null | undefined) => Promise<T>;

export const createMockApp: CreateMockAsyncFn<PaymentGatewayRecipientFragment> = async (
  overrides,
) => {
  const privateMetadata = await getFilledMetadata();
  return merge(
    {
      __typename: "App",
      id: "app-id",
      privateMetadata,
      metadata: {} as PaymentGatewayRecipientFragment["metadata"],
    } as const,
    overrides,
  );
};

export const createMockPaymentGatewayInitializeSessionEvent: CreateMockAsyncFn<
  PaymentGatewayInitializeSessionEventFragment
> = async (overrides) => {
  return merge(
    {
      __typename: "PaymentGatewayInitializeSession",
      issuingPrincipal: null,
      sourceObject: {
        __typename: "Checkout",
        id: "c29tZS1jaGVja291dC1pZA==",
        languageCode: LanguageCodeEnum.PlPl,
        channel: { id: "1", slug: "default-channel" },
        total: {
          gross: {
            amount: 123.45,
            currency: "PLN",
          },
        },
        billingAddress: {
          country: {
            code: "PL",
          },
        },
      },
      recipient: await createMockApp(overrides?.recipient),
      data: undefined,
    } as const,
    overrides,
  );
};

export const createMockTransactionChargeRequestedEvent: CreateMockAsyncFn<
  TransactionChargeRequestedEventFragment
> = async (overrides) => {
  return merge(
    {
      __typename: "TransactionChargeRequested",
      recipient: await createMockApp(overrides?.recipient),
      action: {
        __typename: "TransactionAction",
        amount: 99.99 + 123.0, // gross delivery cost
        actionType: TransactionActionEnum.Charge,
      },
      transaction: {
        __typename: "TransactionItem",
        id: "555555",
        pspReference: "",
        authorizedAmount: {
          __typename: "Money",
          currency: "PLN",
          amount: 99.99 + 123.0, // gross delivery cost
        },
        sourceObject: {
          __typename: "Order",
          channel: { id: "1", slug: "default-channel" },
          deliveryMethod: {
            __typename: "ShippingMethod",
            id: "some-shipping-id",
            name: "some-shipping-name",
          },
          shippingPrice: {
            gross: {
              currency: "PLN",
              amount: 123.0,
            },
            net: {
              currency: "PLN",
              amount: 100.0,
            },
            tax: {
              currency: "PLN",
              amount: 23.0,
            },
          },
          total: {
            __typename: "TaxedMoney",
            gross: {
              __typename: "Money",
              currency: "PLN",
              amount: 99.99 + 123.0,
            },
          },
          lines: [createMockOrderLine(overrides?.transaction?.sourceObject?.lines?.[0])],
        },
      },
    } as const,
    overrides,
  );
};

export const createMockTransactionRefundRequestedEvent: CreateMockAsyncFn<
  TransactionRefundRequestedEventFragment
> = async (overrides) => {
  return merge(
    {
      __typename: "TransactionRefundRequested",
      recipient: await createMockApp(overrides?.recipient),
      action: {
        amount: 99.99 + 123.0,
        actionType: TransactionActionEnum.Refund,
      },
      issuedAt: new Date().toISOString(),
      transaction: {
        __typename: "TransactionItem",
        id: "55555",
        pspReference: "",
        sourceObject: {
          __typename: "Order",
          channel: { id: "1", slug: "default-channel" },
          deliveryMethod: {
            __typename: "ShippingMethod",
            id: "some-shipping-id",
            name: "some-shipping-name",
          },
          shippingPrice: {
            gross: {
              currency: "PLN",
              amount: 123.0,
            },
            net: {
              currency: "PLN",
              amount: 100.0,
            },
            tax: {
              currency: "PLN",
              amount: 23.0,
            },
          },
          total: {
            __typename: "TaxedMoney",
            gross: {
              __typename: "Money",
              currency: "PLN",
              amount: 99.99 + 123.0,
            },
          },
          lines: [createMockOrderLine(overrides?.transaction?.sourceObject?.lines?.[0])],
        },
      },
    } as const,
    overrides,
  );
};

export const createMockTransactionCancelationRequestedEvent: CreateMockAsyncFn<
  TransactionCancelationRequestedEventFragment
> = async (overrides) => {
  return merge(
    {
      __typename: "TransactionCancelationRequested",
      recipient: await createMockApp(overrides?.recipient),
      action: {
        __typename: "TransactionAction",
        amount: 99.99 + 123.0,
        actionType: TransactionActionEnum.Cancel,
      },
      transaction: {
        __typename: "TransactionItem",
        id: "555555",
        pspReference: "",
        sourceObject: {
          channel: { id: "1", slug: "default-channel" },
        },
      },
    } as const,
    overrides,
  );
};

export const createMockCheckoutLine: CreateMockFn<
  OrderOrCheckoutLines_Checkout_Fragment["lines"][number]
> = (overrides) => {
  return merge(
    {
      __typename: "CheckoutLine",
      id: "1",
      quantity: 1,
      totalPrice: {
        gross: {
          currency: "PLN",
          amount: 99.99,
        },
        net: {
          currency: "PLN",
          amount: 81.29,
        },
        tax: {
          currency: "PLN",
          amount: 18.7,
        },
      },
      checkoutVariant: {
        name: "product variant",
        product: {
          name: "product",
        },
      },
    },
    overrides,
  );
};

export const createMockOrderLine: CreateMockFn<
  OrderOrCheckoutLines_Order_Fragment["lines"][number]
> = (overrides) => {
  return merge(
    {
      __typename: "OrderLine",
      id: "1",
      quantity: 1,
      taxRate: 23,
      totalPrice: {
        gross: {
          currency: "PLN",
          amount: 99.99,
        },
        net: {
          currency: "PLN",
          amount: 81.29,
        },
        tax: {
          currency: "PLN",
          amount: 18.7,
        },
      },
      orderVariant: {
        name: "product variant",
        product: {
          name: "product",
        },
      },
    },
    overrides,
  );
};

export const createMockTransactionInitializeSessionSourceObjectCheckout: CreateMockFn<
  OrderOrCheckoutSourceObject_Checkout_Fragment
> = (overrides) => {
  return merge(
    {
      __typename: "Checkout",
      id: "c29tZS1jaGVja291dC1pZA==",
      channel: { id: "1", slug: "default-channel" },
      languageCode: LanguageCodeEnum.PlPl,
      total: {
        gross: {
          amount: 99.99 + 123.0,
          currency: "PLN",
        },
      },
      deliveryMethod: {
        __typename: "ShippingMethod",
        id: "some-shipping-id",
        name: "some-shipping-name",
      },
      shippingPrice: {
        gross: {
          currency: "PLN",
          amount: 123.0,
        },
        net: {
          currency: "PLN",
          amount: 100.0,
        },
        tax: {
          currency: "PLN",
          amount: 23.0,
        },
      },
      billingAddress: {
        firstName: "John",
        lastName: "Smith",
        phone: "+48123456789",
        city: "Washington",
        code: "",
        streetAddress1: "1600 Ave NW",
        streetAddress2: "",
        postalCode: "20500",
        countryArea: "DC",
        country: {
          code: "US",
        },
        companyName: "",
      },
      shippingAddress: {
        firstName: "Jan",
        lastName: "Kowalski",
        phone: "+48123456789",
        city: "New York",
        code: "",
        streetAddress1: "3111 Broadway",
        streetAddress2: "",
        postalCode: "10027",
        countryArea: "NY",
        country: {
          code: "US",
        },
        companyName: "",
      },
      userEmail: "test@saleor.io",
      lines: [createMockCheckoutLine(overrides?.lines?.[0] as CheckoutLine | undefined)],
    },
    overrides,
  );
};

export const createMockTransactionInitializeSessionSourceObjectOrder: CreateMockFn<
  OrderOrCheckoutSourceObject_Order_Fragment
> = (overrides) => {
  return merge(
    {
      __typename: "Order",
      id: "c29tZS1jaGVja291dC1pZA==",
      channel: { id: "1", slug: "default-channel" },
      languageCodeEnum: LanguageCodeEnum.PlPl,
      total: {
        gross: {
          amount: 99.99 + 123.0,
          currency: "PLN",
        },
      },
      deliveryMethod: {
        __typename: "ShippingMethod",
        id: "some-shipping-id",
        name: "some-shipping-name",
      },
      shippingPrice: {
        gross: {
          currency: "PLN",
          amount: 123.0,
        },
        net: {
          currency: "PLN",
          amount: 100.0,
        },
        tax: {
          currency: "PLN",
          amount: 23.0,
        },
      },
      billingAddress: {
        firstName: "John",
        lastName: "Smith",
        phone: "+48123456789",
        city: "Washington",
        code: "",
        streetAddress1: "1600 Ave NW",
        streetAddress2: "",
        postalCode: "20500",
        countryArea: "DC",
        country: {
          code: "US",
        },
        companyName: "",
      },
      shippingAddress: {
        firstName: "Jan",
        lastName: "Kowalski",
        phone: "+48123456789",
        city: "New York",
        code: "",
        streetAddress1: "3111 Broadway",
        streetAddress2: "",
        postalCode: "10027",
        countryArea: "NY",
        country: {
          code: "US",
        },
        companyName: "",
      },
      userEmail: "test@saleor.io",
      lines: [createMockOrderLine(overrides?.lines?.[0] as OrderLine | undefined)],
    },
    overrides,
  );
};

export const createMockTransactionInitializeSessionEvent: CreateMockAsyncFn<
  TransactionInitializeSessionEventFragment
> = async (overrides) => {
  return merge(
    {
      __typename: "TransactionInitializeSession",
      action: {
        __typename: "TransactionAction",
        amount: 99.99 + 123.0,
        currency: "PLN",
        actionType: TransactionFlowStrategyEnum.Charge,
      },
      merchantReference: "123123123",
      sourceObject: createMockTransactionInitializeSessionSourceObjectCheckout(),
      recipient: await createMockApp(overrides?.recipient),
      transaction: {
        __typename: "TransactionItem",
        id: "555555",
        pspReference: "",
      },
      issuingPrincipal: null,
      data: {
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: "never",
        },
      } as JSONValue,
    } as const,
    overrides,
  );
};

export const createMockTransactionProcessSessionEvent: CreateMockAsyncFn<
  TransactionProcessSessionEventFragment
> = async (overrides) => {
  return merge(
    {
      __typename: "TransactionProcessSession",
      action: {
        __typename: "TransactionAction",
        amount: 99.99 + 123.0,
        currency: "PLN",
        actionType: TransactionFlowStrategyEnum.Charge,
      },
      merchantReference: "123123123",
      sourceObject: createMockTransactionInitializeSessionSourceObjectCheckout(),
      recipient: await createMockApp(overrides?.recipient),
      transaction: {
        __typename: "TransactionItem",
        id: "555555",
        pspReference: "AAAAAAAAAAAAAAAA",
      },
      data: {} as JSONValue,
    } as const,
    overrides,
  );
};

export const createMockStripeDataActionNotRequired = () => {
  return {
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: "never",
    },
  };
};
