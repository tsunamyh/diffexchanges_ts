export interface OrderBook {
  ask: number[];
  bid: number[];
}

export interface RowData {
  symbol: string;
  percent: number;
  nob: [number, number];
  coin: number;
  value: number;
  description: string;
}

export interface RowInfo {
  statusbuy: string;
  rowData: RowData;
}

export interface AllOrderBooks {
  status: string;
  value: { [key: string]: OrderBook };
}
