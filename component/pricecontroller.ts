import { EventEmitter } from "stream";
import symbols from "../symbols/symbols";
import { OrderBook, RowInfo, AllOrderBooks, RowData } from "./types";
import { getAllOrderBooks } from "./exController";

const eventEmmiter = new EventEmitter();
eventEmmiter.setMaxListeners(6);
let intervalStatus = true

let maxDiff = [
  { percent: 0 }
];
const myPercent = process.env.MYPERCENT || 1

async function intervalFunc(): Promise<NodeJS.Timeout> {
  return setInterval(async function () {
    if(intervalStatus){
      try {
        const [coinOrderBooks, nobOrderBooks] = await getAllOrderBooks("all");
        const rowsInfo: RowInfo[] = [];
        let maxDiffObj = {};
        if (coinOrderBooks.status === "fulfilled" && nobOrderBooks.status === "fulfilled") {
          
          symbols.nobCoinIRT.forEach(function (symbol: [string, string]) {
            const rowInfo = getRowTableAndTrade(
              nobOrderBooks.value[symbol[0]],
              coinOrderBooks.value[symbol[1]],
              symbol
            );
            if (rowInfo !== false) {
              maxDiff[maxDiff.length] = rowInfo[0].rowData;
              maxDiff[maxDiff.length + 1] = rowInfo[1].rowData;
              maxDiff.sort(function (a, b) {
                return b.percent - a.percent;
              });
              maxDiff.pop();
  
              maxDiffObj = {
                status: "maxDiff",
                maxDiff,
              };
              rowsInfo.push(rowInfo);
            }
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

function getRowTableAndTrade(nobOrderSymbol: OrderBook, coinOrderSymbol: OrderBook, symbol: [string, string]): RowInfo | false {
  if (exsistAskBid(nobOrderSymbol, coinOrderSymbol)) {
    const nobBuyRls = nobOrderSymbol["asks"][0];
    const coinSellRls = coinOrderSymbol["bids"][0];
    // const coinBuyRls = coinOrderSymbol["bids"][0];
    // const nobSellRls = nobOrderSymbol["asks"][0];
    if (buySmallerSell(nobBuyRls, coinSellRls)) {
      const [percent, amount, amountRls] = calcPercentAndAmounts(nobOrderSymbol["asks"], coinOrderSymbol["bids"])
      if (percent > +myPercent && amountRls > 3500000) {
        setTimeout(async () => {
          const [newCoinOrderBooks, newNobOrderBooks] = await getAllOrderBooks(symbol);

        },1000)
      }
    }

    return false
  }
}

function exsistAskBid(nobOrderSymbol: OrderBook, coinOrderSymbol: OrderBook): boolean {
  return (
    nobOrderSymbol["bids"]?.length == 2 &&
    nobOrderSymbol["asks"]?.length == 2 &&
    coinOrderSymbol["bids"]?.length == 2 &&
    coinOrderSymbol["asks"]?.length == 2
  );
}

function buySmallerSell(buy: any, sell: any) {
  return buy < sell;
}

function calcPercentAndAmounts(buyOrder, sellOrder) {
  const percent = calcPercentDiff(buyOrder[0], sellOrder[0]);
  const amount = buyOrder;
  const amountRls = Math.floor(amount * buyOrder[0]);
  return [percent, amount, amountRls]
}

function calcPercentDiff(a, b) {
  const percent = ((b - a) / a) * 100;
  return Math.floor(percent * 100) / 100;
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

export { getAllOrderBooks, eventEmmiter, intervalFunc };
