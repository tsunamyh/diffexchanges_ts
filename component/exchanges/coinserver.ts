import axios from "axios";
import { HttpsProxyAgent } from "https-proxy-agent";
import symbols from "../../symbols/symbols";

const agent = new HttpsProxyAgent("http://127.0.0.1:10808");

const coinBaseUrl: string = "https://api.coinex.com/v2";

const coinInstance = axios.create({
  baseURL: coinBaseUrl,
  httpsAgent: agent,
});

async function httpGetCoinexOrderBook(symbol) {
  // const response = await coinInstance.get("/spot/depth");
  const response = await coinInstance.get("/spot/depth", {
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

function sortCoinexOrderBooks(data) {
  const ask = data.depth.asks[0];
  const bid = data.depth.bids[0];
  return  {
    [data.market]: { ask,bid },
  }
}

function httpGetCoinexOrderBooks() {
  const sortedCoinexOrderBooks = symbols.nobCoin.map(async function (symbol) {
    return await httpGetCoinexOrderBook(symbol);
  });
  console.log("sortedCoinexOrderBooks:",sortedCoinexOrderBooks );
  
}
httpGetCoinexOrderBooks()
export = {
  httpGetCoinexOrderBooks,
};
