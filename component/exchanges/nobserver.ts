import axios, { AxiosResponse } from 'axios';
import symbols from '../../symbols/symbols';
import { OrderBookNobitex,ResponseDataNobitex } from '../extypes/types';

const nobCoinex = symbols.nobCoin;

const nobBaseUrl = "https://api.nobitex.ir/v2/";

const nobInstance = axios.create({
  baseURL: nobBaseUrl,
});

async function httpGetNobOrderBooks(symbol: string): Promise<Record<string, OrderBookNobitex>> {
  // nobInstance.defaults.params = { symbol }
  const response: AxiosResponse<ResponseDataNobitex> = await nobInstance.get(`/orderbook/${symbol}`);
  console.log("re", response.data);
  
  const orderBooks = sortOrderBooks(response.data);
  // console.log("nobOrderBooks:>", orderBooks);
  return orderBooks;
}

function sortOrderBooks(data: ResponseDataNobitex): Record<string, OrderBookNobitex> {
  const ttrAsk = data["USDTIRT"].bids[0][0];
  const ttrBid = data["USDTIRT"].asks[0][0];
  const orderBooks: Record<string, OrderBookNobitex> = {};

  nobCoinex.forEach(function (symbol) {
    if (!(data[symbol[0]]?.bids === undefined || data[symbol[0]]?.bids.length === 0)) {
      // console.log("data[symbol[0]].bids[0]",symbol[0],data[symbol[0]]?.bids[0]);
      // array exist or is not empty
      const ask = data[symbol[0]]?.bids[0];
      const bid = data[symbol[0]]?.asks[0];
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
        orderBooks[symbol[0]] = {
          ask: [(ask[0] / ttrBid), ...ask],
          bid: [(bid[0] / ttrAsk), ...bid]
        };
      }
    }
  });

  return orderBooks;
}

httpGetNobOrderBooks("all");  //test
// getAllOrderBooks();
// // console.log("nobOrderBooks:",nobOrderBooks);
// async function getAllOrderBooks(): Promise<any[]> {
//   const nobOrderBooksPromise = httpGetNobOrderBooks("all");

//   const promisesArray = [nobOrderBooksPromise/*, ...ramzOrderBooksPromise */];
//   // console.log(promisesArray);
//   const allOrderBooks = await Promise.allSettled(promisesArray);
//   if (allOrderBooks[0].status === 'fulfilled') {
//     console.log(allOrderBooks[0].value);
//   } else {
//     console.error('Failed to fetch order books:', allOrderBooks[0].reason);
//   }
//   return allOrderBooks;
// }

module.exports = {
  httpGetNobOrderBooks,
};