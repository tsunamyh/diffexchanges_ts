import axios, { AxiosResponse } from 'axios';
import symbols, { NobCoinSymbol } from '../../symbols/symbols';
import { OrderBookNobitex, ResponseDataNobitex, SortedOrderBookNobitex, SortedOrderBooks, SortedOrderBooksNobitex, NobitexGetInOrderResponse } from '../extypes/types';
import { writeFile } from 'node:fs';

const nobToken = process.env.NOBTOKEN
console.log("process.env.NOBTOKEN : ", nobToken);

const nobCoinex = symbols.nobCoin;

const nobBaseUrl = "https://api.nobitex.ir/";

const nobInstance = axios.create({
  baseURL: nobBaseUrl,
  headers: {
    Authorization: "Token " + nobToken
  }
});

async function httpGetNobOrderBooks(symbol: string): Promise<Record<string, SortedOrderBookNobitex>> {
  // nobInstance.defaults.params = { symbol }
  const response: AxiosResponse<ResponseDataNobitex> = await nobInstance.get(`/v3/orderbook/${symbol}`);
  // console.log("re", response.data);

  const sortedOrderBooks = sortOrderBooks(response.data);
  // writefileOrederbook(sortedOrderBooks)
  return sortedOrderBooks;
}

function sortOrderBooks(data: ResponseDataNobitex): SortedOrderBooksNobitex {
  const ttrAsk = data["USDTIRT"].asks[0][0];
  const ttrBid = data["USDTIRT"].bids[0][0];
  const sortedOrderBooks: SortedOrderBooksNobitex = {};

  nobCoinex.forEach(function (symbol) {
    if (!(data[symbol[0]]?.asks === undefined || data[symbol[0]]?.bids.length === 0)) {
      // console.log("data[symbol[0]].bids[0]",symbol[0],data[symbol[0]]?.bids[0]);
      // array exist or is not empty
      const ask = data[symbol[0]]?.asks[0];
      const bid = data[symbol[0]]?.bids[0];
      if (ask && bid) {
        // [feeRiali,hajm,feettri]
        // Example::
        /* {
          BTCIRT: {
            ask: [ 84886.73301347709, '78732444870', '0.000173' ],
            bid: [ 84857.88404828627, '78731144820', '0.00002' ]
          },
          ETHIRT: {
            ask: [ 2211.32046361186, '2050999730', '0.02111' ],
            bid: [ 2209.52791549903, '2050000000', '0.70537' ]
          },
        } */
        if (symbol[0] === "SHIBIRT") {
          ask[0] = ask[0] / 1000;
          bid[0] = bid[0] / 1000;
        }
        sortedOrderBooks[symbol[0]] = {
          ask: [formatToSixDigitsMath(ask[0] / ttrBid), ask[0].toString(), ask[1].toString()],
          bid: [formatToSixDigitsMath(bid[0] / ttrAsk), bid[0].toString(), bid[1].toString()],
        };
      }
    }
  });

  return sortedOrderBooks;
}

// function formatToSixDigits(value: number): string {
//   const [integerPart, decimalPart = ""] = value.toString().split(".");
//   if (!decimalPart) {
//     return integerPart;
//   }
//   const totalLength = integerPart.length + decimalPart.length;
//   if (totalLength <= 6) {
//     return value.toString();
//   }
//   if (integerPart.length >= 6) {
//     return integerPart.slice(0, 6);
//   }
//   const allowedDecimalLength = 6 - integerPart.length;
//   const formattedDecimal = decimalPart.slice(0, allowedDecimalLength);
//   return `${integerPart}.${formattedDecimal}`;
// }

function formatToSixDigitsMath(value: number): string {
  if (Number.isInteger(value)) {
    return value.toString();
  }
  if (value >= 100000) {
    return Math.floor(value).toString().slice(0, 6);
  }
  const factor = Math.pow(10, 6 - Math.floor(Math.log10(value)) - 1);
  return (Math.floor(value * factor) / factor).toString();
}

async function nobitexTrade(type: "buy" | "sell", symbol: NobCoinSymbol, amount: number, price: number) {
  console.log("symbolnobtrade:", symbol, price);
  let srcCurrency = symbol.toLowerCase();
  let dstCurrency: "rls" | "usdt";
  if (srcCurrency.endsWith("irt")) {
    srcCurrency = srcCurrency.slice(0, -3);
    dstCurrency = "rls";
  } else if (srcCurrency.endsWith("usdt")) {
    srcCurrency = srcCurrency.slice(0, -4);
    dstCurrency = "usdt";
  }

  const axiosConfig = {
    method: "post",
    url: "/market/orders/add",
    data: {
      type,
      execution: "market",
      srcCurrency: srcCurrency,
      dstCurrency: dstCurrency,
      amount,
      price,
    }
  };
  try {
    const response = await nobInstance(axiosConfig);
    console.log("nooooooooooooob:(", type, symbol, ")::", response.data);
    return response.data;
  } catch (error) {
    console.log("nob naTradid:", error.message);
    throw error;
  }
}

async function nobitexGetInOrder(symbol: NobCoinSymbol): Promise<number | false> {
  let srcCurrency = symbol.toLowerCase();
  let dstCurrency: "rls" | "usdt";
  if (srcCurrency.endsWith("irt")) {
    srcCurrency = srcCurrency.slice(0, -3);
    dstCurrency = "rls";
  } else if (srcCurrency.endsWith("usdt")) {
    srcCurrency = srcCurrency.slice(0, -4);
    dstCurrency = "usdt";
  }
  const axiosConfig = {
    url: "/market/orders/list",
    params: {
      srcCurrency,
      dstCurrency,
    }
  }

  try {
    const response: AxiosResponse<NobitexGetInOrderResponse> = await nobInstance(axiosConfig);
    if (response.data.orders.length == 0) {
      return 0;
    } else {
      console.log("inOrderNobitex " + symbol + response.data.orders[0]["amount"]);
      return false;
    }
  } catch (error) {
    console.log("🚀 ~ file: nobserver.js:90 ~ getInOrderNob ~ error:", error.message);
    throw error;
  }
}

async function getCurrencyBalanceNob(symbol : string) {
  let currency = symbol.toLowerCase();
  if (currency.endsWith("irt")) {
    currency = "rls";
  } else if (currency.endsWith("usdt")) {
    currency = "usdt";
  }
  // const currency = symbol == "IRT" ? "rls" : symbol.slice(0, - 3).toLowerCase();
  const axiosConfig = {
    method: "post",
    url: "/users/wallets/balance",
    data: {
      currency
    }
  };
  try {
    const response = await nobInstance(axiosConfig);
    return Number(response.data.balance);
  } catch (error) {
    console.log("🚀 ~ file: nobserver.js:113 ~ getCurrencyBalanceNob ~ error:", error.message)
    throw error
  }
}

// Example usage:
// console.log(formatToSixDigitsMath(8570002)); // Output: "8570002"
// console.log(formatToSixDigitsMath(123.456789)); // Output: "123.456"
// console.log(formatToSixDigitsMath(100001.34)); // Output: "100001"

// httpGetNobOrderBooks("all");  //test
// getAllOrderBooks();
// // console.log("nobOrderBooks:",nobOrderBooks);
// async function getAllOrderBooks(): Promise<any[]> {
//   const nobOrderBooksPromise = httpGetNobOrderBooks("all");

//   const promisesArray = [nobOrderBooksPromise/*, ...ramzOrderBooksPromise */];
//   // console.log(promisesArray);
//   const allOrderBooks = await Promise.allSettled(promisesArray);
//   if (allOrderBooks[0].status === 'fulfilled') {
//     console.log(allOrderBooks);
//   } else {
//     console.error('Failed to fetch order books:', allOrderBooks[0].reason);
//   }
//   return allOrderBooks;
// }
export { httpGetNobOrderBooks };
// exports = {
//   httpGetNobOrderBooks,
// };

// function writefileOrederbook(sortedOrderBooks:any) {
//     writeFile(
//     "./component/exchanges/nobiorderbook.js",
//     "module.exports=" + JSON.stringify(sortedOrderBooks, null, 2),
//     function (err) {
//       if (err) {
//         console.log(err);
//       } else {
//         console.log("nobiorderbook.js Writed!!");
//       }
//     }
//   );
// }
