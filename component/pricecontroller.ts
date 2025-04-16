import { EventEmitter } from "stream";
import symbols from "../symbols/symbols";
import { OrderBook, RowInfo, AllOrderBooks, RowData } from "./types";
import { getAllOrderBooks, getBalanceAndInOrder, NobitexBuyHandler } from "./exController";

const eventEmmiter = new EventEmitter();
eventEmmiter.setMaxListeners(6);
let intervalStatus = true

// let maxDiff = [
//   { percent: 0 }
// ];
const myPercent = process.env.MYPERCENT || 1

async function intervalFunc(): Promise<NodeJS.Timeout> {
  return setInterval(async function () {
    if (intervalStatus) {
      const rowsInfo: RowInfo[] = [];
      let maxDiffObj = {};
      try {
        const [coinOrderBooks, nobOrderBooks] = await getAllOrderBooks("all");
        if (coinOrderBooks.status === "fulfilled" && nobOrderBooks.status === "fulfilled") {
          for (const symbol of symbols.nobCoinIRT) {
            const rowInfo = await getRowTableAndTrade(
              nobOrderBooks.value[symbol[0]],
              coinOrderBooks.value[symbol[1]],
              symbol
            );

            if (rowInfo !== false) {
              // console.log("roeInfo:>",rowInfo);

              // maxDiff[maxDiff.length] = rowInfo[0].rowData;
              // maxDiff[maxDiff.length + 1] = rowInfo[1].rowData;
              // maxDiff.sort(function (a, b) {
              //   return b.percent - a.percent;
              // });
              // maxDiff.pop();

              // maxDiffObj = {
              //   status: "maxDiff",
              //   maxDiff,
              // };
              rowsInfo.push(rowInfo[0]);
            }
          }
        }
      } catch (error) {
        console.log("orderBooks Gerefteh Nashod: ", error.message);
      } finally {
        // console.log("rowInfi:", JSON.stringify(rowsInfo));
        // eventEmmiter.emit("maxDiff", JSON.stringify(maxDiffObj));
        eventEmmiter.emit("diff", JSON.stringify(rowsInfo));
      }
    }
    //   symbols.nobCoin.forEach(function (symbol: [string, string]) {
    //     const rowInfo = percentDiff(
    //       nobOrderBooks.value[symbol[0]],
    //       coinOrderBooks.value[symbol[1]],
    //       symbol
    //     );
    //     if (rowInfo) {
    //       rowsInfo.push(rowInfo);
    //     }
    //   });
    // }
  }, 5000);
}

async function getRowTableAndTrade(nobOrderSymbol: OrderBook, coinOrderSymbol: OrderBook, symbol: [string, string]) {
  // console.log(symbol," symbol:",nobOrderSymbol);
  const exsistAskBidbool = exsistAskBid(nobOrderSymbol, coinOrderSymbol)
  // console.log("exsistAskBidbool1:",exsistAskBidbool);

  if (exsistAskBidbool) {

    //nobOrderSymbol["ask"] = [Tether,hajm,riali]
    const nobBuyTthr = nobOrderSymbol.ask[0];
    //coinOrderSymbol["bid"] = [Tether,hajm]
    const coinSellTthr = coinOrderSymbol.bid[0];
    // console.log("nobBuyRls:",nobBuyRls);
    // console.log("coinSellRls:",coinSellRls);

    // const coinBuyRls = coinOrderSymbol["bid"][0];
    // const nobSellRls = nobOrderSymbol["ask"][0];
    if (buySmallerSell(nobBuyTthr, coinSellTthr)) {
      const [percent, amount, amountRls] = calcPercentAndAmounts(nobOrderSymbol["ask"], coinOrderSymbol["bid"])

      console.log("asd:", percent, "|", myPercent);
      if (percent > +myPercent && amountRls > 3500000) {
        const [newCoinOrderBooks, newNobOrderBooks] = await getAllOrderBooks(symbol);
        // console.log("bbbb:",newNobOrderBooks);

        if (newCoinOrderBooks.status == "fulfilled" && newNobOrderBooks.status == "fulfilled") {
          const [newPercent, newAmount, newAmountRls] = calcPercentAndAmounts(
            newNobOrderBooks.value[symbol[0]].ask,
            newCoinOrderBooks.value[symbol[1]].bid
          )
          if (newPercent > myPercent && newAmountRls > 3500000) {
            intervalStatus = false
            const newNobBuyRls = newNobOrderBooks.value[symbol[0]].ask[2];
            NobitexBuyHandler(newNobBuyRls, symbol[0], newAmount, newAmountRls, newPercent)
              .finally(function () {
                intervalStatus = true
              })
          }
        }


      }

      return [createRowTable(nobOrderSymbol.ask, coinSellTthr, percent, amount, amountRls, symbol)]
    }

    return false
  }
}

function exsistAskBid(nobOrderSymbol: OrderBook, coinOrderSymbol: OrderBook): boolean {
  // console.log("nobOrderSymbol:",nobOrderSymbol);
  return (
    nobOrderSymbol?.bid.length == 3 &&
    nobOrderSymbol?.ask.length == 3 &&
    coinOrderSymbol?.bid.length == 2 &&
    coinOrderSymbol?.ask.length == 2
  );
}

function buySmallerSell(buy: any, sell: any) {
  return buy < sell;
}

function calcPercentAndAmounts(buyOrder, sellOrder) {
  // console.log(buyOrder[0], sellOrder[0]);

  const percent = calculatePercentageDifference(buyOrder[0], sellOrder[0]);
  // console.log("percwnt 135", percent);
  const amount = buyOrder[1];
  const amountRls = Math.floor(amount * buyOrder[2]);
  return [percent, amount, amountRls]
}

function calculatePercentageDifference(buyPrice: number, sellPrice: number): number {
  const priceDifference = sellPrice - buyPrice;
  const percentageDifference = (priceDifference / buyPrice) * 100;

  return Number(percentageDifference.toFixed(2));
}

function checkCondition(cond: any): boolean {
  if (!cond || typeof cond.nobBalanceRls === "undefined") {
    console.error("nobBalanceRls is not defined in cond:", cond);
    return false;
  }
  console.log("cond:", cond);

  return (
    cond.nobBalanceRls > 1500000 &&
    cond.nobInOrder == 0
  );
}

function createRowTable(nobAsk, coinTthr, percentDiff, amount, amountRls, symbol) {
  const rowData: RowData = {
    symbol: symbol[0],
    percent: percentDiff,
    nob: [nobAsk[0].toString() + "|", (nobAsk[2] / 10).toString()],
    coin: coinTthr.toString(),
    value: Math.floor(Math.abs(coinTthr - nobAsk[0])),
    description: `Curr:${amount} | Toomani:${amountRls / 10}`,
  };
  // console.log("rowData:",rowData);

  const statusbuy = nobAsk[0] < coinTthr ? "nob" : "coin";
  return {
    statusbuy,
    rowData,
  };
}

export { getAllOrderBooks, eventEmmiter, intervalFunc, checkCondition };
