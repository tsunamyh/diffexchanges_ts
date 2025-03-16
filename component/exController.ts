import { httpGetCoinexOrderBooks } from "./exchanges/coinserver";
import { getCurrencyBalanceNob, httpGetNobOrderBooks, nobitexGetInOrder, nobitexTrade } from "./exchanges/nobserver";
import { AllOrderBooks } from "./types";

export async function getAllOrderBooks(): Promise<AllOrderBooks[]> {
  const coinOrderBooksPromise = httpGetCoinexOrderBooks();
  const nobOrderBooksPromise = httpGetNobOrderBooks("all");

  const promisesArray = [coinOrderBooksPromise, nobOrderBooksPromise];
  const allOrderBooks = await Promise.allSettled(promisesArray);
  return allOrderBooks as AllOrderBooks[];
}

let nobInOrder, nobBalanceRls
let condition
let tradeTime = 0
async function getBalanceAndInOrder(symbol: string): Promise<{ nobBalanceRls: number; nobInOrder: boolean } | null> {
  try {
    const promisesConditionArray = [
      nobitexGetInOrder(symbol),
      getCurrencyBalanceNob(symbol)
    ];
    const result = await Promise.all(promisesConditionArray);

    if (result) {
      [
        nobInOrder,
        nobBalanceRls,
      ] = result;
    } else {
      nobInOrder = false;
      nobBalanceRls = 0;
    }
    condition = {
      nobBalanceRls: Math.floor(nobBalanceRls),
      nobInOrder,
    };
    console.log("condition:", condition);
    return condition;
  } catch (err) {
    console.error("Error in getBalanceAndInOrder:", err.message);
    return null; // Return null to handle the error case
  }
}

async function NobitexBuyHandler(
  nobBuyRls: number, 
  symbol: string, 
  amount: number, 
  amountRls: number, 
  percent: number
): Promise<void> {
  console.log("buyNobNobitexBuyHandler");
  const buyInNobitexTime = new Date()
  let diffTime = buyInNobitexTime.getTime() - tradeTime
  const newAmount = bNsRFindAmount();
  if (diffTime > 6000) {
    tradeTime = buyInNobitexTime.getTime()

    nobitexTrade("buy", symbol, newAmount, nobBuyRls)
      .then(function (params) {
        console.log("params::>", "Trade Done");
      }).catch(function (error) {
        console.log("Tradeha Anjam Nashod yekish:(buyNobSellRam)", error.message);
      }).finally(async function () {
        await getBalanceAndInOrder(symbol);
        const obj = {
          "date": new Date().toLocaleString(),
          "buyNSellRCndtinArr": { nobInOrder },
          nobBuyRls,
          amount, newAmount, amountRls, percent
        }
        console.log("🚀 ~ :69 bNsR ~ obj:", obj)
      })
  }

  function bNsRFindAmount() {
    const minAmount = Math.min((nobBalanceRls / nobBuyRls), amount) * 0.94
    return Math.floor(minAmount)
  }
}