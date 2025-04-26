import axios, { AxiosResponse } from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import symbols from "../../symbols/symbols";
import {
  MarketDataCoinex,
  OrderBook,
  ResponseData,
  SortedOrderBooks,
} from "./extypes";
import { writeFile } from "fs/promises";

const proxyUrl = process.env.PROXYURL

const agent = new HttpsProxyAgent(proxyUrl)

const coinBaseUrl: URL = new URL("https://api.coinex.com/v2/");

const coinInstance = axios.create({
  baseURL: coinBaseUrl.toString(),
  httpsAgent: agent,
});

async function httpGetCoinexOrderBook(
  pair: string
): Promise<{ [key: string]: OrderBook }> {
  const response: AxiosResponse<ResponseData> = await coinInstance.get(
    "/spot/depth",
    {
      params: {
        market: pair,
        limit: 5,
        interval: "0.01",
      },
    }
  );
  // response.data.data = {
  // depth: {
  //   asks: [ [fee,vol], [fee,vol], [fee,vol], [fee,vol], [fee,vol] ],
  //   bids: [ [fee,vol], [fee,vol], [fee,vol], [fee,vol], [fee,vol] ],
  //   checksum: 2262935607,
  //   last: '89427.12',
  //   updated_at: 1741182214097
  // },
  // is_full: true,
  // market: 'BTCUSDT'
  // }
  const coinexOrderBooks = sortCoinexOrderBooks(response.data.data);
  // coinexGetDepthArr.forEach(async function (coinexGetDepth) {
  //   const response = await coinexGetDepth
  //   coinOrderBook.push = sortOrderBooks(response.data.data/* .ticker */);
  // })
  // console.log(coinOrderBook);
  return coinexOrderBooks;
}

function sortCoinexOrderBooks(data: MarketDataCoinex): {
  [key: string]: OrderBook;
} {
  const ask: number[] = data.depth.asks[0];
  const bid: number[] = data.depth.bids[0];
  return {
    [data.market]: { ask, bid },
  };
}

async function httpGetCoinexOrderBooks(pair : string) {
  let sortedCoinexOrderBooksPromise: Promise<{ [key: string]: OrderBook }>[]
  if (pair == "all") {
    sortedCoinexOrderBooksPromise =
    symbols.nobCoinIRT.map(async function (symbol: [string, string]) {
      return httpGetCoinexOrderBook(symbol[1]);
    });
  } else {
    sortedCoinexOrderBooksPromise = [httpGetCoinexOrderBook(pair)];
  }

  const sortedCoinexOrderBooksArray = await Promise.allSettled(
    sortedCoinexOrderBooksPromise
  );

  // تبدیل اوردرهای تکی کوینکس شبیه به تایپ اوردربوک نوبیتکس
  const sortedCoinexOrderBooks: SortedOrderBooks = {};
  sortedCoinexOrderBooksArray.forEach(function (orderbook) {
    if (orderbook.status == "fulfilled") {
      Object.assign(sortedCoinexOrderBooks, orderbook.value);
    }
  });

  // try {
  //   await writeFile("./component/exchanges/coinexorderbook.js", "module.exports=" + JSON.stringify(sortedCoinexOrderBooks, null, 2));
  //   console.log("sameNobBin.js Writed!!");
  // } catch (err) {
  //   console.log(err);
  // }
  // console.log("allOrderBooks",allOrderBooks);

  // sortedCoinexOrderBooks.forEach(async function (coinexob) {
  //   try {
  //     const ob = await coinexob
  //     console.log("ob : ",ob);

  //   } catch (error) {console.log("err");
  //   }
  // });

  // console.log("sortedCoinexOrderBooks:", sortedCoinexOrderBooks);
  return sortedCoinexOrderBooks;
}

// httpGetCoinexOrderBooks();
export { httpGetCoinexOrderBooks };
// module.exports = {
//   httpGetCoinexOrderBooks,
// };
