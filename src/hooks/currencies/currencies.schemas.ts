import { z } from "zod";

export const codeCurrenciesSchema = z.enum(["UAH", "USD", "EUR"]);

export const ratesCurrencySchema = z.object({
  UAH: z.number(),
  USD: z.number(),
  EUR: z.number(),
});

export const currencyApiSchema = z.object({
  meta: z.object({
    code: z.number(),
    disclaimer: z.string(),
  }),
  response: z.object({
    date: z.string(),
    base: codeCurrenciesSchema,
    rates: ratesCurrencySchema,
  }),
  date: z.string(),
  base: codeCurrenciesSchema,
  rates: ratesCurrencySchema,
});

export const currenciesSchema = z.object({
  UAH: ratesCurrencySchema.omit({ UAH: true }).nullable(),
  USD: ratesCurrencySchema.omit({ USD: true }).nullable(),
  EUR: ratesCurrencySchema.omit({ EUR: true }).nullable(),
  date: z.number().nullable(),
});
