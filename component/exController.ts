import { httpGetCoinexOrderBooks } from "./exchanges/coinserver";
import { httpGetNobOrderBooks } from "./exchanges/nobserver";
import { AllOrderBooks } from "./types";

export async function getAllOrderBooks(): Promise<AllOrderBooks[]> {
  const coinOrderBooksPromise = httpGetCoinexOrderBooks();
  const nobOrderBooksPromise = httpGetNobOrderBooks("all");

  const promisesArray = [coinOrderBooksPromise, nobOrderBooksPromise];
  const allOrderBooks = await Promise.allSettled(promisesArray);
  return allOrderBooks as AllOrderBooks[];
}