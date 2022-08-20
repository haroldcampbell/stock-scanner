import utils from "./utils.js"
import stock from "./stock.js"


function onClickSymbol(e$, name) {
    console.log("onClickSymbol e$:", e$, name)
    stock.loadCharts(name)
}

function createWatchList(symbolList) {
    const container = document.getElementsByClassName("watchlist-container").item(0);

    const createSymbol = (name, ev$) => {
        const child = document.createElement("div");
        child.innerText = name
        child.className = "symbol"
        child.onclick = (e) => { ev$(e, name) }
        container.appendChild(child);
    }

    utils.wireButtonByID("btn-refresh-all", "/refresh-all-data", data => {
        window.alert(`New Records: '${data.newRecords}'`)
    });
    utils.wireButtonByID("btn-refresh-week", "/refresh-week-data", data => {
        window.alert(`New Records: '${data.newRecords}'`)
    });
    utils.wireButtonByID("btn-update-analysis", "/update-analysis", data => {
        window.alert(`New Records: '${data.newRecords}'`)
    });

    createSymbol("--All");
    symbolList.forEach(symbol => {
        createSymbol(symbol.symbol, onClickSymbol);
    });
}

utils.getJSON('/data/watchlist.json')
    .then(data => {
        createWatchList(data)
    });

stock.loadCharts("AAPL")
