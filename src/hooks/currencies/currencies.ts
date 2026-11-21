import axios from "axios";
import dotenv from "dotenv";
import {
  CodeCurrenciesType,
  CurrenciesType,
  CurrencyApiType,
  RatesCurrencyType,
} from "./currencies.types";

dotenv.config();
const URL_API_FIXER_CURRENCIES = "https://api.currencybeacon.com/v1/latest/";
const API_KEY_CURRENCY_BEACON = process.env.API_KEY_CURRENCY_BEACON;
const ONE_HOUR = 1000 * 60 * 60;
const ONE_DAY = ONE_HOUR * 24;
const LIST_CURRENCIES = ["UAH", "USD", "EUR"];
export let CURRENCIES: CurrenciesType = {
  UAH: null,
  USD: null,
  EUR: null,
  date: null,
};

export const getPriceCurrency = (
  price: number,
  codeCurrency: CodeCurrenciesType
): RatesCurrencyType & { date: number | null } => {
  const { [codeCurrency]: currentCurrency, ...otherCurrencies } = CURRENCIES;

  if (currentCurrency) {
    const currentPrice = (
      Object.keys(currentCurrency) as CodeCurrenciesType[]
    ).reduce((a, b) => {
      if (currentCurrency && b in currentCurrency) {
        const priceCurrency = currentCurrency[
          b as keyof typeof currentCurrency
        ] as number;
        return { ...a, [b]: priceCurrency * price };
      }
      return a;
    }, {} as RatesCurrencyType);

    return { ...currentPrice, date: CURRENCIES.date };
  }

  const emptyPrice = Object.keys(otherCurrencies).reduce((a, b) => {
    if (b) return { ...a, [b]: null };
    return a;
  }, {} as RatesCurrencyType);
  return { ...emptyPrice, date: CURRENCIES.date };
};

const getCurrency = async () => {
  try {
    const resultCurrencies = await Promise.all(
      LIST_CURRENCIES.map(async (currency) => {
        const symbols = LIST_CURRENCIES.filter(
          (currencyItem) => currencyItem !== currency
        );
        const currentURL = `${URL_API_FIXER_CURRENCIES}?api_key=${API_KEY_CURRENCY_BEACON}&base=${currency}&symbols=${symbols}`;
        const result = await axios.get<CurrencyApiType>(currentURL);
        if (result.data.meta.code === 200)
          return { [currency]: result.data.rates };
        return { [currency]: null };
      })
    );
    CURRENCIES.date = new Date().getTime();
    resultCurrencies.forEach((currency) => {
      if (Object.values(currency)[0] !== null)
        CURRENCIES = { ...CURRENCIES, ...currency };
    });
  } catch (error) {}
};

const checkGetCurrency = () => {
  if (CURRENCIES.date) {
    const timeNow = new Date().getTime();
    const timeFuture = CURRENCIES.date + ONE_DAY;
    if (timeFuture < timeNow) getCurrency();
  }
};

const onIntervalGetCurrency = () => {
  if (CURRENCIES.date === null) getCurrency();
  if (process.env.ENABLE_JOBS !== "true") return () => {};
  const interval = setInterval(checkGetCurrency, ONE_HOUR);
  return () => clearInterval(interval);
};

onIntervalGetCurrency();
