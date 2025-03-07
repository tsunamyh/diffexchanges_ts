import { EventEmitter } from "stream";
import symbols from "../symbols/symbols";
import { httpGetCoinexOrderBooks } from "./exchanges/coinserver";
import { httpGetNobOrderBooks } from "./exchanges/nobserver";
import { OrderBook, RowInfo, AllOrderBooks, RowData } from "./types";

const eventEmmiter = new EventEmitter();
intervalFunc();

async function intervalFunc(): Promise<NodeJS.Timeout> {
  return setInterval(async function () {
    const [coinOrderBooks, nobOrderBooks] = await getAllOrderBooks();
    const rowsInfo: RowInfo[] = [];
    if (
      coinOrderBooks.status === "fulfilled" &&
      nobOrderBooks.status === "fulfilled"
    ) {
      symbols.nobCoin.forEach(function (symbol: [string, string]) {
        const rowInfo = percentDiff(
          nobOrderBooks.value[symbol[0]],
          coinOrderBooks.value[symbol[1]],
          symbol
        );
        if (rowInfo) {
          rowsInfo.push(rowInfo);
        }
      });
    }
    eventEmmiter.emit("diff", JSON.stringify(rowsInfo));
  }, 5000);
}

async function getAllOrderBooks(): Promise<AllOrderBooks[]> {
  const coinOrderBooksPromise = httpGetCoinexOrderBooks();
  const nobOrderBooksPromise = httpGetNobOrderBooks("all");

  const promisesArray = [coinOrderBooksPromise, nobOrderBooksPromise];
  const allOrderBooks = await Promise.allSettled(promisesArray);
  return allOrderBooks as AllOrderBooks[];
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
        nob: [nobOrderSymbol.ask[0], nobOrderSymbol.ask[1] / 10],
        coin: coinOrderSymbol.bid[0],
        value:
          Math.floor((coinOrderSymbol.bid[0] - nobOrderSymbol.ask[0]) * 1000) /
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
        symbol: symbol[1],
        percent: calcPercentDiff(nobOrderSymbol.bid[0], coinOrderSymbol.ask[0]),
        nob: [nobOrderSymbol.bid[0], nobOrderSymbol.bid[1]],
        coin: coinOrderSymbol.ask[0],
        value:
          Math.floor((nobOrderSymbol.bid[0] - coinOrderSymbol.ask[0]) * 1000) /
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
    return nobOrderSymbol.ask[0] < coinOrderSymbol.bid[0];
  }

  function coinAskIsSmallerNobBid(): boolean {
    return coinOrderSymbol.ask[0] < nobOrderSymbol.bid[0];
  }

  function calcPercentDiff(bid: number, ask: number): number {
    const percent = ((bid - ask) / ask) * 100;
    return Math.floor(percent * 100) / 100;
  }

  function maxBuyInNob(): string {
    const min = Math.min(nobOrderSymbol.ask[2], coinOrderSymbol.bid[1]);
    const minTmn = Math.floor((min * nobOrderSymbol.ask[1]) / 10);
    return `ارزی:${min} | تومانی:${minTmn}`;
  }
}

export { percentDiff, getAllOrderBooks, eventEmmiter, intervalFunc };
