import { EventEmitter } from "stream";
import symbols from "../symbols/symbols";
import { OrderBook, RowInfo, AllOrderBooks, RowData } from "./types";
import { getAllOrderBooks, getBalanceAndInOrder } from "./exController";
import { nobitexTrade } from "./exchanges/nobserver";

const eventEmmiter = new EventEmitter();
eventEmmiter.setMaxListeners(6);
let intervalStatus = true

let maxDiff = [
  { percent: 0 }
];
const myPercent = process.env.MYPERCENT || 1

async function intervalFunc(): Promise<NodeJS.Timeout> {
  return setInterval(async function () {
    if (intervalStatus) {
      try {
        const [coinOrderBooks, nobOrderBooks] = await getAllOrderBooks("all");
        const rowsInfo: RowInfo[] = [];
        let maxDiffObj = {};
        if (coinOrderBooks.status === "fulfilled" && nobOrderBooks.status === "fulfilled") {
          // console.log("coinOrderBooks:",nobOrderBooks);
          
          symbols.nobCoinIRT.forEach(async function (symbol: [string, string]) {
            const rowInfo = await getRowTableAndTrade(
              nobOrderBooks.value[symbol[0]],
              coinOrderBooks.value[symbol[1]],
              symbol
            );

            if (rowInfo !== false) {

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
              // rowsInfo.push(rowInfo[0]);
            }
            // console.log("rowInfi:", rowInfo);
          });
        }
        eventEmmiter.emit("maxDiff", JSON.stringify(maxDiffObj));
        eventEmmiter.emit("diff", JSON.stringify(rowsInfo));

      } catch (error) {
        console.log("orderBooks Gerefteh Nashod: ", error.message);
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
  if (exsistAskBid(nobOrderSymbol, coinOrderSymbol)) {
    //nobOrderSymbol["ask"] = [Tether,tomani,hajm]
    const nobBuyRls = nobOrderSymbol.ask[0]; 
    //coinOrderSymbol["bid"] = [Tether,hajm]
    const coinSellRls = coinOrderSymbol.bid[0];
    // console.log("nobBuyRls:",nobBuyRls);
    // console.log("coinSellRls:",coinSellRls);
    
    // const coinBuyRls = coinOrderSymbol["bid"][0];
    // const nobSellRls = nobOrderSymbol["ask"][0];
    if (buySmallerSell(nobBuyRls, coinSellRls)) {
      const [percent, amount, amountRls] = calcPercentAndAmounts(nobOrderSymbol["ask"], coinOrderSymbol["bid"])
      if (percent > +myPercent && amountRls > 3500000) {
        setTimeout(async () => {
          const [newCoinOrderBooks, newNobOrderBooks] = await getAllOrderBooks(symbol);
          if (newCoinOrderBooks.status == "fulfilled" && newNobOrderBooks.status == "fulfilled") {
            const [newPercent, newAmount, newAmountRls] = calcPercentAndAmounts(
              newCoinOrderBooks.value[symbol[1]].bid,
              newNobOrderBooks.value[symbol[0]].ask
            )
            if (newPercent > myPercent && newAmountRls > 3500000) {
              intervalStatus = false
              const newNobBuyRls = newNobOrderBooks.value[symbol[0]].ask[0];
              nobitexTrade("buy",symbol[0],newAmount,newNobBuyRls)
              .finally(function () {
                let interval = 0
                setTimeout(pauseOrStartInterval, interval);
                async function pauseOrStartInterval() {
                  interval = (interval == 0) ? 1000 : interval * 2
                  try {
                    if (checkCondition(await getBalanceAndInOrder(symbol[0]))) {
                      intervalStatus = true
                    } else {
                      if (interval < 12 * 60 * 60 * 1000) {
                        setTimeout(pauseOrStartInterval, interval)
                      }
                    }
                  } catch (error) {
                    console.log("intervalStat True nashod:", error.message);
                  }
                }
              })
            }
          }

        },1000)
      }

      return [createRowTable(nobOrderSymbol["asks"], coinSellRls, percent, amount, amountRls, symbol)]
    }

    return false
  }
}

function exsistAskBid(nobOrderSymbol: OrderBook, coinOrderSymbol: OrderBook): boolean {
  console.log("nobOrderSymbol:",nobOrderSymbol);
  
  return (
    nobOrderSymbol.bid?.length == 3 &&
    nobOrderSymbol.ask?.length == 3 &&
    coinOrderSymbol.bid?.length == 2 &&
    coinOrderSymbol.ask?.length == 2
  );
}

function buySmallerSell(buy: any, sell: any) {
  return buy < sell;
}

function calcPercentAndAmounts(buyOrder, sellOrder) {
  const percent = calcPercentDiff(buyOrder[0], sellOrder[0]);
  console.log("percwnt 135", percent);
  const amount = buyOrder;
  const amountRls = Math.floor(amount * buyOrder[0]);
  return [percent, amount, amountRls]
}

function calcPercentDiff(a, b) {
  const percent = ((b - a) / a) * 100;
  return Math.floor(percent * 100) / 100;
}

function checkCondition(cond) {
  return (
    cond.nobBalanceRls > 1500000 &&
    cond.nobInOrder == 0
  )
}

function percentDiff(
  nobOrderSymbol: OrderBook,
  coinOrderSymbol: OrderBook,
  symbol: [string, string]
): RowInfo | false {
  if (nobOrderSymbol && coinOrderSymbol) {
    if (nobAskIsSmallerCoinBid()) {
      const rowData: RowData = {
        symbol: symbol[0],
        percent: calcPercentDiff(coinOrderSymbol.bid[0], nobOrderSymbol.ask[0]),
        nob: [nobOrderSymbol.ask[0], (+nobOrderSymbol.ask[1] / 10).toString()],
        coin: coinOrderSymbol.bid[0],
        value:
          Math.floor((Number(coinOrderSymbol.bid[0]) - Number(nobOrderSymbol.ask[0])) * 1000) /
          1000,
        description: maxBuyInNob(),
      };
      return {
        statusbuy: "nob",
        rowData,
      };
    }
    if (coinAskIsSmallerNobBid()) {
      const rowData: RowData = {
        symbol: symbol[0],
        percent: calcPercentDiff(nobOrderSymbol.bid[0], coinOrderSymbol.ask[0]),
        nob: [nobOrderSymbol.bid[0], nobOrderSymbol.bid[1]],
        coin: coinOrderSymbol.ask[0],
        value:
          Math.floor((Number(nobOrderSymbol.bid[0]) - Number(coinOrderSymbol.ask[0])) * 1000) /
          1000,
        description: "",
      };
      return {
        statusbuy: "coin",
        rowData,
      };
    }
  }

  return false;

  function nobAskIsSmallerCoinBid(): boolean {
    return +nobOrderSymbol.ask[0] < +coinOrderSymbol.bid[0];
  }

  function coinAskIsSmallerNobBid(): boolean {
    return +coinOrderSymbol.ask[0] < +nobOrderSymbol.bid[0];
  }

  function calcPercentDiff(bid: string, ask: string): number {
    const percent = ((Number(bid) - Number(ask)) / Number(ask)) * 100;
    return Math.floor(percent * 100) / 100;
  }

  function maxBuyInNob(): string {
    const min = Math.min(Number(nobOrderSymbol.ask[2]), Number(coinOrderSymbol.bid[1]));
    const minTmn = Math.floor((min * Number(nobOrderSymbol.ask[1])) / 10);
    return `ارزی:${min} | تومانی:${minTmn}`;
  }
}

function createRowTable(nobRlsAndTthr, coinTthr, percentDiff, amount, amountRls, symbol) {
  const rowData: RowData = {
    symbol: symbol[0],
    percent: percentDiff,
    nob: nobRlsAndTthr,
    coin: coinTthr.toString(),
    value: Math.floor(Math.abs(coinTthr - nobRlsAndTthr[0])) / 10,
    description: `ارزی:${amount} | تومانی:${amountRls / 10}`,
  };
  console.log("rowData:",rowData);
  
  const statusbuy = nobRlsAndTthr[1] < coinTthr ? "nob" : "coin";
  return {
    statusbuy,
    rowData,
  };
}

export { getAllOrderBooks, eventEmmiter, intervalFunc };
