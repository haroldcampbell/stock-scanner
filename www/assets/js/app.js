import utils from "./utils.js"
import stock from "./stock.js"


function onClickSymbol(e$, name) {
    console.log("onClickSymbol e$:", e$, name)
    stock.loadCharts(name)
}

function createButton(container, text, postURL, actionCallback) {
    let child = document.createElement("button");
    child.innerText = text;
    child.onclick = (e) => {
        utils.postJSON(postURL)
            .then(data => {
                if (actionCallback !== undefined) {
                    actionCallback(data)
                }
            });
    }
    container.appendChild(child);
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

    createButton(container, "Refresh all", "/refresh-all-data", data => {
        window.alert(`New Records: '${data.newRecords}'`)
    });
    createButton(container, "Refresh week", "/refresh-week-data", data => {
        window.alert(`New Records: '${data.newRecords}'`)
    });
    createButton(container, "Update analysis", "/update-analysis", data => {
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
