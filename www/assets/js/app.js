import utils from "./utils.js"
import stock from "./stock.js"

utils.getJSON('/data/watchlist.json')
    .then(data => {
        createWatchList(data)
    })

function createWatchList(symbolList) {
    const container = document.getElementsByClassName("watchlist-container").item(0);

    const createSymbol = (name, ev$) => {
        const child = document.createElement("div");
        child.innerText = name
        child.className = "symbol"
        child.onclick = (e) => { ev$(e, name) }
        container.appendChild(child);
    }

    let child = document.createElement("button");
    child.innerText = "Refresh all"
    child.onclick = (e) => {
        utils.postJSON("/refresh-data")
            .then(data => {
                window.alert(`New Records: '${data.newRecords}'`)
            })
    }
    container.appendChild(child);

    child = document.createElement("button");
    child.innerText = "Update analysis"
    child.onclick = (e) => {
        utils.postJSON("/update-analysis")
            .then(data => {
                window.alert(`New Records: '${data.newRecords}'`)
            })
    }
    container.appendChild(child);


    createSymbol("--All");
    symbolList.forEach(symbol => {
        createSymbol(symbol.symbol, onClickSymbol);
    });
}

function onClickSymbol(e$, name) {
    console.log("onClickSymbol e$:", e$, name)
    stock.loadCharts(name)
}

stock.loadCharts("AAPL")
