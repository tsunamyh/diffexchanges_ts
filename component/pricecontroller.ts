import { EventEmitter } from "stream";
import symbols from "../symbols/symbols";

const { httpGetNobOrderBooks } = require("./exchanges/nobserver");
const { httpGetCoinOrderBooks } = require("./exchanges/coinserver");

const eventEmmiter = new EventEmitter();
intervalFunc();
async function intervalFunc() {
  return setInterval(async function () {
    const [coinOrderBooks, nobOrderBooks/* , ...ramzOrderBooks */] = await getAllOrderBooks();
    // console.log(coinOrderBooks);
    const rowsInfo = [];
    if (coinOrderBooks.status == "fulfilled" && nobOrderBooks.status == "fulfilled") {
      
      symbols.nobCoin.forEach(function (symbol) {
        const rowInfo = percentDiff(
          nobOrderBooks.value[symbol[0]],
          coinOrderBooks.value[symbol[1]],
          symbol
        );
        if (rowInfo) {
          rowsInfo.push(rowInfo);
          // console.log(rowInfo.rowData.percent,rowInfo.rowData.symbol);
        }
      })
      // console.log("rowsInfo:>", rowsInfo);
    };
    //  console.log(rowsInfo);
    eventEmmiter.emit("diff", JSON.stringify(rowsInfo));
  }, 5000);
}

async function getAllOrderBooks() {
  const coinOrderBooksPromise = httpGetCoinOrderBooks();
  const nobOrderBooksPromise = httpGetNobOrderBooks("all");
  // const ramzOrderBooksPromise = symbols.ramzCoin.map(function (symbol) {
  //   return httpGetRamzOrderBooks(symbol);
  // });

  const promisesArray = [coinOrderBooksPromise, nobOrderBooksPromise/*, ...ramzOrderBooksPromise */];
  // console.log(promisesArray);
  const allOrderBooks = await Promise.allSettled(promisesArray);
  // console.log(allOrderBooks);
  return allOrderBooks;
}

function percentDiff(nobOrderSymbol, coinOrderSymbol, symbol) {
  // console.log(binOrderSymbol, coinOrderSymbol, symbol);
  if (nobOrderSymbol && coinOrderSymbol) {
    if (nobAskIsSmallerCoinBid()) {
      const rowData = {};
      rowData["symbol"] = symbol[0];
      rowData["percent"] = calcPercentDiff(coinOrderSymbol["bid"][0] , nobOrderSymbol["ask"][0]);
      rowData["nob"] = [nobOrderSymbol["ask"][0], nobOrderSymbol["ask"][1]/10];
      rowData["coin"] = coinOrderSymbol["bid"][0];
      rowData["value"] = Math.floor((coinOrderSymbol["bid"][0] - nobOrderSymbol["ask"][0]) * 1000) / 1000;
      rowData["description"] = maxBuyInNob();
      // console.log(rowData);
      return {
        statusbuy: "nob",
        rowData,
      };
      // tableData.push(diffData);
      // console.log("kharid dar Nob:", symbol, tableData);
    }
    if (coinAskIsSmallerNobBid()) {
      const rowData = {};
      rowData["symbol"] = symbol[1];
      rowData["percent"] = calcPercentDiff(nobOrderSymbol["bid"][0] , coinOrderSymbol["ask"][0]);
      rowData["nob"] = [nobOrderSymbol["bid"][0],nobOrderSymbol["bid"][1]];
      rowData["coin"] = coinOrderSymbol["ask"][0];
      rowData["value"] = Math.floor((nobOrderSymbol["bid"] - coinOrderSymbol["ask"]) * 1000) / 1000;
      rowData["description"] = "";
      return {
        statusbuy: "coin",
        rowData,
      };
      // console.log("kharid dar Ramz:", symbol, percentDiffRamz);
    }
  }

  return false;

  function nobAskIsSmallerCoinBid() {
    return nobOrderSymbol["ask"][0] < coinOrderSymbol["bid"][0];
  }

  function coinAskIsSmallerNobBid() {
    return coinOrderSymbol["ask"][0] < nobOrderSymbol["bid"][0];
  }

  function calcPercentDiff(bid,ask) {
    const percent = ((bid - ask) / ask) * 100;
    return Math.floor(percent * 100) / 100;
  }

  function maxBuyInNob() {
    const min = Math.min(
      nobOrderSymbol["ask"][2],
      coinOrderSymbol["bid"][1]
    );
    const minTmn = Math.floor((min * nobOrderSymbol["ask"][1]) / 10);
    return `ارزی:${min} | تومانی:${minTmn}`;
  }

  function atleastBuyInRamz() {
    const min = Math.min(
      coinOrderSymbol["bids"][0][1],
      nobOrderSymbol["asks"][0][1]
    );
    const minTtr = (min * coinOrderSymbol["bids"][0][0]);
    return `ارزی:${min} | تتری:${minTtr}`;
  }
}

module.exports = {
  percentDiff,
  getAllOrderBooks,
  eventEmmiter,
  intervalFunc,
};
