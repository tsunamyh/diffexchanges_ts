import axios, { AxiosResponse } from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import symbols from "../../symbols/symbols";
import { MarketDataCoinex, OrderBook, ResponseData } from "../extypes/types";

const agent = new HttpsProxyAgent("http://127.0.0.1:10808");

const coinBaseUrl: URL = new URL("https://api.coinex.com/v2/");

const coinInstance = axios.create({
  baseURL: coinBaseUrl.toString(),
  httpsAgent: agent,
});

async function httpGetCoinexOrderBook(
  symbol: [string, string]
): Promise<{ [key: string]: OrderBook }> {
  const response: AxiosResponse<ResponseData> = await coinInstance.get("/spot/depth", {
    params: {
      market: symbol[1],
      limit: 5,
      interval: "0.01",
    },
  });
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

async function httpGetCoinexOrderBooks() {
  const sortedCoinexOrderBooks: Promise<{ [key: string]: OrderBook }>[] =
    symbols.nobCoin.map(async function (symbol: [string, string]) {
      return httpGetCoinexOrderBook(symbol);
    });

  // const allOrderBooks = await Promise.allSettled(sortedCoinexOrderBooks);
  // console.log("allOrderBooks",allOrderBooks);
    
  // sortedCoinexOrderBooks.forEach(async function (coinexob) {
  //   try {
  //     const ob = await coinexob
  //     console.log("ob : ",ob);

  //   } catch (error) {console.log("err");
  //   }
  // });

  // console.log("sortedCoinexOrderBooks:", sortedCoinexOrderBooks);
}

// httpGetCoinexOrderBooks();

export = {
  httpGetCoinexOrderBooks,
};
