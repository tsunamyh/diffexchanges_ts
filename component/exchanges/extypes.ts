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

///////////////////////////////////////
export interface OrderBookNobitex {
  ask: number[];
  bid: number[];
}

export interface SortedOrderBookNobitex {
  ask: string[];
  bid: string[];
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
    ask: string[];
    bid: string[];
  };
}

export interface SortedOrderBooksNobitex {
  [key: string]: {
    ask: string[];
    bid: string[];
  };
}

export interface NobitexGetInOrderResponse {
  status: string;
  orders: {
    id: number;
    type: string;
    execution: string;
    srcCurrency: string;
    dstCurrency: string;
    price: string;
    param1: string;
    amount: string;
    status: string;
    user: string;
    totalPrice: string;
    totalOrderPrice: string;
    matchedAmount: string;
    unmatchedAmount: string;
    partial: boolean;
    fee: string | number;
    created_at: string;
    market: string;
    averagePrice: string;
  }[];
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