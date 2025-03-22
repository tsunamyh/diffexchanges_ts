const { EventEmitter } = require("events");
const { getAllOrderBooks, buyNobSellRamHandler, buyRamSellNobHandler, getBalanceAndInOrder } = require("./exController");

const eventEmmiter = new EventEmitter();
eventEmmiter.setMaxListeners(6);
let intervalStatus = true

let maxDiff = [
  { percent: 0 }
];
const myPercent = process.env.MYPERCENT || 2
console.log("myPercent;", myPercent);
function intervalFunc() {
  return setInterval(async function () {
    if (intervalStatus) {
      try {
        const [nobOrderBooks, ramzOrderBooks] = await getAllOrderBooks();
        // console.log([nobOrderBooks, ramzOrderBooks]);
        const rowsInfo = [];
        let maxDiffObj = {};
        if (nobOrderBooks.status == "fulfilled" && ramzOrderBooks.status == "fulfilled") {
          const rowInfo = await getRowTableAndTrade(
            nobOrderBooks.value["DOGEIRT"],
            ramzOrderBooks.value["DOGEIRT"],
            "DOGEIRT"
          );

          if (rowInfo.valueOf()) {
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
          // console.log("rowsInfo,", rowsInfo);
          eventEmmiter.emit("maxDiff", JSON.stringify(maxDiffObj));
          eventEmmiter.emit("diff", JSON.stringify(rowsInfo[0]));
          eventEmmiter.emit("diff", JSON.stringify(rowsInfo[1]));
        }
      } catch (error) {
        console.log("orderBookGerefteh Nashod: ", error.message);
      }
    }
  }, 5000);
}

function exsistAskBid(nobOrderSymbol, coinOrderSymbol) {
  return (
    nobOrderSymbol["bids"]?.length == 2 &&
    nobOrderSymbol["asks"]?.length == 2 &&
    coinOrderSymbol["bids"]?.length == 2 &&
    coinOrderSymbol["asks"]?.length == 2
  );
}

async function getRowTableAndTrade(nobOrderSymbol, coinOrderSymbol, symbol) {
  if (exsistAskBid(nobOrderSymbol, coinOrderSymbol)) {
    const nobBuyRls = nobOrderSymbol["bids"][0];
    const ramSellRls = coinOrderSymbol["asks"][0];
    const ramBuyRls = coinOrderSymbol["bids"][0];
    const nobSellRls = nobOrderSymbol["asks"][0];
    if (buySmallerSell(nobBuyRls, ramSellRls)) {
      const [percent, amount, amountRls] = calcPercentAmounts(nobOrderSymbol["bids"], coinOrderSymbol["asks"])
      if (percent > myPercent && amountRls > 3500000) {
        setTimeout(async () => {
          const [newNobOrderBooks, newRamOrderBooks] = await getAllOrderBooks();
          if (newNobOrderBooks.status == "fulfilled" && newRamOrderBooks.status == "fulfilled") {
            const [newPercent, newAmount, newAmountRls] = calcPercentAmounts(
              newNobOrderBooks.value["DOGEIRT"]["bids"],
              newRamOrderBooks.value["DOGEIRT"]["asks"]
            )
            console.log('bNsR', 'newPercent:', newPercent, 'myPercent:', myPercent, 'newAmountRls:', newAmountRls);
            if (newPercent > myPercent && newAmountRls > 3500000) {
              intervalStatus = false
              const newNobBuyRls = newNobOrderBooks.value["DOGEIRT"]["bids"][0];
              const newRamSellRls = newRamOrderBooks.value["DOGEIRT"]["asks"][0];
              buyNobSellRamHandler(newNobBuyRls, newRamSellRls, symbol, newAmount, newAmountRls, newPercent)
                .finally(function () {
                  let interval = 0
                  async function pauseStartInterval() {
                    interval = (interval == 0) ? 1000 : interval * 2
                    console.log("intervalStat True nashodbNsR:", interval);
                    try {
                      cond = await getBalanceAndInOrder();
                      console.log("🚀 ~priceController.js:85 ~ pauseStartInterval ~ cond:", cond)
                      if (checkCondition(cond)) {
                        intervalStatus = true
                      } else {
                        if (interval < 12 * 60 * 60 * 1000) {
                          setTimeout(pauseStartInterval, interval)
                        }
                      }
                    } catch (error) {
                      console.log("intervalStat True nashod:", error.message);
                    }
                  }
                  setTimeout(pauseStartInterval, interval);
                })
              // eventEmmiter.emit("trade","tradeDone")
            }
          }
        }, 1000);
      };
    } else {
      if (buySmallerSell(ramBuyRls, nobSellRls)) {
        const [percent,  , amountRls] = calcPercentAmounts(coinOrderSymbol["bids"], nobOrderSymbol["asks"])
        if (percent > myPercent && amountRls > 3500000) {
          setTimeout(async () => {
            const [newNobOrderBooks, newRamOrderBooks] = await getAllOrderBooks();
            if (newNobOrderBooks.status == "fulfilled" && newRamOrderBooks.status == "fulfilled") {
              const [newPercent, newAmount, newAmountRls] = calcPercentAmounts(
                newRamOrderBooks.value["DOGEIRT"]["bids"],
                newNobOrderBooks.value["DOGEIRT"]["asks"]
              )
              console.log('bRsN', 'newPercent:', newPercent, 'myPercent:', myPercent, 'newAmountRls:', newAmountRls);
              if (newPercent > myPercent && newAmountRls > 3500000) {
                intervalStatus = false
                const newRamBuyRls = newRamOrderBooks.value["DOGEIRT"]["bids"][0];
                const newNobSellRls = newNobOrderBooks.value["DOGEIRT"]["asks"][0];
                buyRamSellNobHandler(newRamBuyRls, newNobSellRls, symbol, newAmount, newAmountRls, newPercent)
                  .finally(function () {
                    let interval = 0;
                    async function pauseStartInterval() {
                      interval = (interval == 0) ? 1000 : interval * 2
                      console.log("intervalStat True nashod:bRsN", interval);
                      try {
                        cond = await getBalanceAndInOrder();
                        console.log("🚀 ~priceController.js:127 ~ pauseStartInterval ~ cond:", cond)
                        if (checkCondition(cond)) {
                          intervalStatus = true;
                        } else {
                          if (interval < 12 * 60 * 60 * 1000) {
                            setTimeout(pauseStartInterval, interval)
                          }
                        };
                      } catch (error) {
                        console.log("intervalStat True nashod:", error.message);
                      }
                    }
                    setTimeout(pauseStartInterval, interval);
                  })
              }
            }
          }, 1000);
        }
      }
    }

    return [
      createRowTable(nobBuyRls, ramSellRls, ...calcPercentAmounts(nobOrderSymbol["bids"], coinOrderSymbol["asks"])),
      createRowTable(nobSellRls, ramBuyRls, ...calcPercentAmounts(coinOrderSymbol["bids"], nobOrderSymbol["asks"]))
    ]
  }

  return false;

  function buySmallerSell(buy, sell) {
    return buy < sell;
  }

  function createRowTable(nobRls, ramRls, percentDiff, amount, amountRls) {
    const rowData = {};
    rowData["symbol"] = symbol;
    rowData["percent"] = percentDiff;
    rowData["nob"] = nobRls / 10;
    rowData["ram"] = ramRls / 10;
    rowData["value"] = Math.floor(Math.abs(ramRls - nobRls)) / 10;
    rowData["description"] = `ارزی:${amount} | تومانی:${amountRls / 10}`;
    const statusbuy = nobRls < ramRls ? "nob" : "ram";
    return {
      statusbuy,
      rowData,
    };
  }
}

function calcPercentAmounts(buyOrder, sellOrder) {
  const percent = calcPercentDiff(buyOrder[0], sellOrder[0]);
  const amount = Math.min(buyOrder[1], sellOrder[1]);
  const amountRls = Math.floor(amount * buyOrder[0]);
  return [percent, amount, amountRls]
}

function calcPercentDiff(a, b) {
  const percent = ((b - a) / a) * 100;
  return Math.floor(percent * 100) / 100;
}

function checkCondition(cond) {
  return (
    cond.nobInOrder == 0 &&
    cond.ramInOrder == 0 &&
    (cond.ramBalanceRls > 3200000 ||
      cond.nobBalanceRls > 3200000) &&
    (cond.nobBalanceCurr > 80 ||
      cond.ramBalanceCurr > 80)
  )
}

module.exports = {
  intervalFunc,
  checkCondition,
  eventEmmiter
};