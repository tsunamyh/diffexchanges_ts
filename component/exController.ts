import { httpGetCoinexOrderBooks } from "./exchanges/coinserver";
import { SortedOrderBooks } from "./exchanges/extypes";
import { SortedOrderBookNobitex } from "./exchanges/extypes";
import { getCurrencyBalanceNob, httpGetNobOrderBooks, nobitexGetInOrder, nobitexTrade } from "./exchanges/nobserver";
import { AllOrderBooks } from "./types";

export async function getAllOrderBooks(pair: "all" | [string, string] | string): Promise<AllOrderBooks[]> {
  let coinOrderBooksPromise: Promise<SortedOrderBooks>;
  let nobOrderBooksPromise: Promise<Record<string, SortedOrderBookNobitex>>;
  if (Array.isArray(pair)) {
    coinOrderBooksPromise = httpGetCoinexOrderBooks(pair[1]);
    nobOrderBooksPromise = httpGetNobOrderBooks(pair[0]);
  } else {
    coinOrderBooksPromise = httpGetCoinexOrderBooks(pair);
    nobOrderBooksPromise = httpGetNobOrderBooks(pair);
  }

  const promisesArray: Promise<any>[] = [coinOrderBooksPromise, nobOrderBooksPromise];
  const allOrderBooks = await Promise.allSettled(promisesArray);
  return allOrderBooks as AllOrderBooks[];
}

// Explicitly define types for variables
let nobInOrder: boolean | undefined;
let nobBalanceRls: number | undefined;
let condition: { nobBalanceRls: number; nobInOrder: boolean } | undefined;
let tradeTime: number = 0;

async function getBalanceAndInOrder(symbol: string = "rls"): Promise<{ nobBalanceRls: number; nobInOrder: boolean } | null> {
  try {
    const promisesConditionArray: Promise<any>[] = [
      nobitexGetInOrder(symbol),
      getCurrencyBalanceNob(symbol),
    ];
    const result = await Promise.all(promisesConditionArray);

    if (result) {
      [nobInOrder, nobBalanceRls] = result;
    } else {
      nobInOrder = false;
      nobBalanceRls = 0;
    }
    condition = {
      nobBalanceRls: Math.floor(nobBalanceRls || 0),
      nobInOrder: nobInOrder || false,
    };
    console.log("condition:", condition);
    return condition;
  } catch (err) {
    console.error("Error in getBalanceAndInOrder:", err.message);
    return null; // Return null to handle the error case
  }
}

async function NobitexBuyHandler(
  nobBuyRls: string,
  symbol: string,
  amount: number,
  amountRls: number,
  percent: number
): Promise<void> {
  console.log("🛒 Starting Nobitex Buy Handler");

  const now: number = Date.now();
  const diffTime: number = now - tradeTime;

  if (diffTime <= 6000) {
    console.log("⏱️ Buy skipped - less than 6 seconds since last trade");
    return;
  }

  const newAmount: number = buyNobitexFindAmount(nobBuyRls, amount);
  tradeTime = now;

  try {
    await nobitexTrade("buy", symbol, newAmount, nobBuyRls);
    console.log("✅ Trade executed successfully");
  } catch (error) {
    console.error("❌ Trade failed (buyNobSellRam):", error.message);
    return; // در صورت خطا در خرید، ادامه نده
  }

  try {
    await getBalanceAndInOrder(symbol);
    const logObj = {
      date: new Date().toLocaleString(),
      buyNSellRCndtinArr: { nobInOrder },
      nobBuyRls,
      amount,
      newAmount,
      amountRls,
      percent,
    };
    console.log("📊 Trade Log:", logObj);
  } catch (error) {
    console.error("⚠️ Error in post-trade balance fetch:", error.message);
  }
}

function buyNobitexFindAmount(nobBuyRls: string, amount: number): number {
  const minAmount: number = Math.min((nobBalanceRls || 0) / +nobBuyRls, amount) * 0.94;
  return minAmount;
}

function getCondition(): { nobBalanceRls: number; nobInOrder: boolean } | undefined {
  return condition;
}

export {
  getBalanceAndInOrder,
  NobitexBuyHandler,
  getCondition,
  condition,
};