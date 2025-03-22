import 'dotenv/config';
import { server } from "../server";
import { intervalFunc } from '../component/pricecontroller';

const port: number = 3000;

server.listen(port, () => {
  intervalFunc()
  console.log("Server coinbin is listening on port: ", port);
});