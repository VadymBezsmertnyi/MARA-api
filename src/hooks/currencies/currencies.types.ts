import { z } from "zod";
import {
  codeCurrenciesSchema,
  currenciesSchema,
  currencyApiSchema,
  ratesCurrencySchema,
} from "./currencies.schemas";

export type CodeCurrenciesType = z.infer<typeof codeCurrenciesSchema>;

export type RatesCurrencyType = z.infer<typeof ratesCurrencySchema>;

export type CurrencyApiType = z.infer<typeof currencyApiSchema>;

export type CurrenciesType = z.infer<typeof currenciesSchema>;
