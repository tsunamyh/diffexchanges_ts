export interface OrderBook {
  ask: string[];
  bid: string[];
}

export interface RowData {
  symbol: string;
  percent: number;
  nob: [string, string];
  coin: string;
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
