import 'dotenv/config';
import { server } from "../server";

const port: number = 3000;

server.listen(port, () => {
  console.log("Server coinbin is listening on port: ", port);
});