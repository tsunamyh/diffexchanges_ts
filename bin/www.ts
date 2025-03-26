import 'dotenv/config';
import { server } from "../server";
import { checkCondition, intervalFunc } from '../component/pricecontroller';
import { getBalanceAndInOrder } from '../component/exController';

const port: number = 3000;

async function start() {
  server.listen(port, () => {
    console.log("Server is listening on port")
  });
  try {
    let conditionObj = await getBalanceAndInOrder();
    if (checkCondition(conditionObj)) {
      console.log("Done check condition");
      intervalFunc()
    }
  } catch (error) {
    console.log("hanooz shoroo nashode:", error.message);
  }
}

start()