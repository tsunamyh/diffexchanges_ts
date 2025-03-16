import { NobCoinSymbol } from "symbols/symbols";

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

export interface NobitexBuyHandlerParams {
  nobBuyRls: number;
  symbol: NobCoinSymbol;
  amount: number;
  amountRls: number;
  percent: number;
}

export interface NobitexBuyHandlerResponse {
  success: boolean;
  message: string;
  data?: any;
}