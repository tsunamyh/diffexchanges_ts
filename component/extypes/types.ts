export interface OrderBook {
  ask: number[];
  bid: number[];
}

export interface MarketDataCoinex {
  depth: {
    asks: number[][];
    bids: number[][];
  };
  market: string;
}

export interface ResponseData {
  data: MarketDataCoinex;
}

export interface OrderBookNobitex {
  ask: number[];
  bid: number[];
}

export interface MarketDataNobitex {
  lastUpdate: number;
  lastTradePrice: string;
  asks: number[][];
  bids: number[][];
}

export interface ResponseDataNobitex {
  [key: string]: MarketDataNobitex;
}

export interface SortedOrderBooks {
  [key: string]: {
    ask: number[];
    bid: number[];
  };
}

// interface ResponseDataData extends Partial<AxiosResponse> {
//   data : ResponseData
// }
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