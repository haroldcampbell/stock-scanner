import utils from "./utils.js"
import stock from "./charts.js"


function onClickSymbol(e$, name) {
    // console.log("onClickSymbol e$:", e$, name)
    stock.loadCharts(name)
}



function createWatchList(symbolList) {
    const container = document.getElementsByClassName("watchlist-container").item(0);

    const createSymbol = (data, ev$) => {
        const child = document.createElement("div");
        child.innerText = data.symbol
        child.className = "symbol"
        child.onclick = (e) => { ev$(e, data.symbol) }

        let h = data.Week_2 + data.Month_1 + data.Month_2 + data.Month_3;
        h = 206 + h / 4 * 100;
        let l = data.Week_2 + data.Month_1 + data.Month_2 + data.Month_3;
        l = (0.75 - l) * 175;
        const fontColor = l < 57 ? "#f0f0f0" : "#777"
        child.style = `background-color:hsl(${h}, 100%, ${l}%); color:${fontColor}`;

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

    // createSymbol("--All");
    symbolList.forEach(symbol => {
        // console.log("symbol:", symbol)
        createSymbol(symbol, onClickSymbol);
    });
}

utils.getJSON('/data/watchlist.json')
    .then(data => {
        createWatchList(data)
    });

stock.loadCharts("AVYA")
