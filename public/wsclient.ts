const HOST: string = location.href.replace(/^http/, "ws"); //'ws://localhost:port/diff'
const ws: WebSocket = new WebSocket(HOST);

export interface RowData {
  symbol: string;
  percent: number;
  nob: [string, string];
  coin: string;
  value: number;
  description: string;
}

interface RowInfo {
  statusbuy: string;
  rowData: { [key: string]: string };
}

interface RowsInfo {
  status?: string;
  maxDiff?: { symbol: string; percent: string }[];
  rowDataBal?: string;
  size?: number;
  forEach?: (callback: (rowInfo: RowInfo) => void) => void;
}

ws.onopen = function (): void {
  setTiltle("connected");
};

ws.onmessage = function ({ data }: MessageEvent): void {
  const rowsInfo: RowsInfo = JSON.parse(data);
  if (rowsInfo.status == "maxDiff") {
    printMaxDiff(rowsInfo.maxDiff)
  } else if (rowsInfo.size) {
    printClientSize(rowsInfo.size);
  } else if (rowsInfo.status == "balance") {
    printDataBal(rowsInfo.rowDataBal)
  } else {
    printData(rowsInfo);
  }
};

ws.onclose = function (): void {
  setTiltle("disconnected");
};

function setTiltle(title: string): void {
  document.querySelector("h4")!.innerHTML = title;
}

function printMaxDiff(maxDiff: { symbol: string; percent: string }[]): void {
  let text = "";
  text = maxDiff[0].symbol + ":=> " + maxDiff[0].percent + " :" + " بهترین درصد ";

  let diffMax = document.querySelector("h3")!;
  diffMax.innerText = text;
  console.log("maxdiff;", maxDiff);
}

function printClientSize(size: number): void {
  document.querySelector("h5")!.innerHTML = "تعداد افراد آنلاین : " + size;
}

function printData(rowsInfo: RowsInfo): void {
  clearTable();
  rowsInfo.forEach(function (rowInfo) {
    const statusbuy = rowInfo.statusbuy;
    const rowData = rowInfo.rowData;
    const tBody = document.querySelector("tbody#order");
    const tRow = document.createElement("tr");
    tRow.setAttribute("class", "row");
    tBody.appendChild(tRow);

    Object.keys(rowData).forEach(function (key) {
      const tCell = document.createElement("td");
      tRow.appendChild(tCell);

      tCell.innerText = rowData[key];
      if (statusbuy == key) {
        tCell.style.backgroundColor = "#8fff4e"
      }
    });
  });
  sortTable();
}

function printDataBal(rowDataBal) {
  // clearTable();
  // rowDataBal.forEach(function (rowDataBal) {
  // const statusbuy = rowDataBal.statusbuy;
  const tBody = document.querySelector("tbody#balance");
  const tRow = document.createElement("tr");
  tRow.setAttribute("class", "balRow");
  tBody.appendChild(tRow);

  Object.keys(rowDataBal).forEach(function (key) {
    const tCell = document.createElement("td");
    tRow.appendChild(tCell);

    tCell.innerText = rowDataBal[key];
  });
  // });
  // sortTable();
}

function clearTable(): void {
  const trows = document.querySelectorAll(".row");
  trows.forEach(function (tRow) {
    tRow.remove();
  });
}

function sortTable(): void {
  let table: HTMLTableElement, rows: HTMLCollectionOf<HTMLTableRowElement>, switching: boolean, i: number, x: HTMLTableCellElement, y: HTMLTableCellElement, shouldSwitch: boolean;
  table = document.getElementById("exchange") as HTMLTableElement;
  switching = true;
  while (switching) {
    switching = false;
    rows = table.rows;
    for (i = 1; i < rows.length - 1; i++) {
      shouldSwitch = false;
      x = rows[i].getElementsByTagName("td")[1];
      y = rows[i + 1].getElementsByTagName("td")[1];
      if (+x.innerHTML < +y.innerHTML) {
        shouldSwitch = true;
        break;
      }
    }
    if (shouldSwitch) {
      rows[i].parentNode!.insertBefore(rows[i + 1], rows[i]);
      switching = true;
    }
  }
}