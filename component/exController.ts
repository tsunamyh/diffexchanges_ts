import { httpGetCoinexOrderBooks } from "./exchanges/coinserver";
import { SortedOrderBooks } from "./exchanges/extypes";
import { SortedOrderBookNobitex } from "./exchanges/extypes";
import { getCurrencyBalanceNob, httpGetNobOrderBooks, nobitexGetInOrder, nobitexTrade } from "./exchanges/nobserver";
import { AllOrderBooks } from "./types";

export async function getAllOrderBooks(pair:"all"|[string,string]|string): Promise<AllOrderBooks[]> {
  let coinOrderBooksPromise: Promise<SortedOrderBooks> 
  let nobOrderBooksPromise: Promise<Record<string, SortedOrderBookNobitex>> 
  if (Array.isArray(pair)) {
    coinOrderBooksPromise = httpGetCoinexOrderBooks(pair[1]);
    nobOrderBooksPromise = httpGetNobOrderBooks(pair[0]);   
  } else {
    coinOrderBooksPromise = httpGetCoinexOrderBooks(pair);
    nobOrderBooksPromise = httpGetNobOrderBooks(pair);
  }

  const promisesArray = [coinOrderBooksPromise, nobOrderBooksPromise];
  const allOrderBooks = await Promise.allSettled(promisesArray);
  return allOrderBooks as AllOrderBooks[];
}

let nobInOrder, nobBalanceRls
let condition
let tradeTime = 0
async function getBalanceAndInOrder(symbol: string = "rls"): Promise<{ nobBalanceRls: number; nobInOrder: boolean } | null> {
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
  nobBuyRls: string,
  symbol: string,
  amount: number,
  amountRls: number,
  percent: number
): Promise<void> {
  console.log("🛒 Starting Nobitex Buy Handler");

  const now = Date.now();
  const diffTime = now - tradeTime;

  if (diffTime <= 6000) {
    console.log("⏱️ Buy skipped - less than 6 seconds since last trade");
    return;
  }

  const newAmount = buyNobitexFindAmount(nobBuyRls, amount);
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

// async function NobitexBuyHandler(
//   nobBuyRls: string, 
//   symbol: string, 
//   amount: number, 
//   amountRls: number, 
//   percent: number
// ): Promise<void> {
//   console.log("buyNobNobitexBuyHandler");
//   const buyInNobitexTime = new Date()
//   let diffTime = buyInNobitexTime.getTime() - tradeTime
//   const newAmount = buyNobitexFindAmount(nobBuyRls,amount);
//   if (diffTime > 6000) {
//     tradeTime = buyInNobitexTime.getTime()

//     nobitexTrade("buy", symbol, newAmount, nobBuyRls)
//       .then(function (params) {
//         console.log("params::>", "Trade Done");
//       }).catch(function (error) {
//         console.log("Tradeha Anjam Nashod yekish:(buyNobSellRam)", error.message);
//       }).finally(async function () {
//         try {
//           await getBalanceAndInOrder(symbol);
//           const obj = {
//             "date": new Date().toLocaleString(),
//             "buyNSellRCndtinArr": { nobInOrder },
//             nobBuyRls,
//             amount, newAmount, amountRls, percent
//           }
//           console.log("🚀 ~ :69 bNsR ~ obj:", obj);
//         } catch (error) {
//           console.error("Error in finally block:", error.message);
//         }
//       })
//   }
// }

function buyNobitexFindAmount(nobBuyRls,amount) {
  const minAmount = Math.min((nobBalanceRls / +nobBuyRls), amount) * 0.94
  return minAmount
}

function getCondition() {
  return condition
}
export { 
  getBalanceAndInOrder,
  NobitexBuyHandler,
  getCondition,
  condition
}