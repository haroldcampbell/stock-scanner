import utils from "./utils.js"
import stock from "./charts.js"


/**
 * Adds the chart actions at the bottom of the charts.
 * @param {*} actionContainer
 * @param {*} symbol
 */
function chartActions(parentContainer, actionContainer, symbol) {
    utils.createButton(actionContainer,
        "Remove from watchlist",
        "/remove-watchlist-symbol",
        data => {
            window.alert(`New Records: '${data.newRecords}'`)
            getWatchlist();
            parentContainer.innerHTML = "Select new symbol."
        },
        () => symbol);
}

function onClickSymbol(e$, name) {
    stock.loadCharts(name, chartActions)
}
function rankByName(list) {
    return list.sort((a, b) => a.symbol.localeCompare(b.symbol));
}
function rankByVariability(list) {
    const calcWeight = (data) => {
        const h = data.Week_2 + data.Month_1 + data.Month_2 + data.Month_3
        return h / 4;
    }

    const sortDes = (rList) => {
        return rList.sort((a, b) => {
            if (a.rank < b.rank) return 1;
            if (a.rank > b.rank) return -1;
            return 0;
        })
    }
    const sortAsc = (rList) => {
        return rList.sort((a, b) => {
            if (a.rank < b.rank) return -1;
            if (a.rank > b.rank) return 1;
            return 0;
        })
    }
    const rankedList = list.map((item, index) => {
        return {
            index,
            item,
            rank: calcWeight(item)
        }
    })

    const sortedList = sortDes(rankedList)

    return sortedList.map(i => i.item)
}

function initNavActions() {
    utils.wireButtonByID("btn-refresh-all",
        utils.postURLAction("/refresh-all-data", data => {
            window.alert(`New Records: '${data.newRecords}'`)
        })
    );
    utils.wireButtonByID("btn-refresh-week",
        utils.postURLAction("/refresh-week-data", data => {
            window.alert(`New Records: '${data.newRecords}'`)
        })
    );
    utils.wireButtonByID("btn-update-analysis",
        utils.postURLAction("/update-analysis", data => {
            window.alert(`New Records: '${data.newRecords}'`)
        })
    );

    const watchlistCallback = utils.postURLAction("add-watchlist-symbol",
        data => {
            window.alert(`New Records: '${data.newRecords}'`)
            getWatchlist(false);

            const element = document.getElementById('watchlist-new-symbol');
            element.value = "";
        },
        () => {
            const element = document.getElementById('watchlist-new-symbol');
            return element.value
        }
    );

    utils.wireButtonByID("btn-add-watchlist-symbol", watchlistCallback);
}

function createWatchList(symbolList) {
    let childElements = [];

    const container = document.getElementsByClassName("watchlist-container").item(0);
    container.innerHTML = "";

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

        return child
    }

    const createSymbols = (list) => {
        const childElements = []
        list.forEach(symbol => {
            const childElm = createSymbol(symbol, onClickSymbol);
            childElements.push(childElm)
        });
        return childElements;
    }

    const drainElementList = (list) => {
        list.forEach(elm => {
            container.removeChild(elm);
        })
    }

    utils.wireButtonByID("btn-sort-name", (btn, $e) => {
        drainElementList(childElements);
        childElements = createSymbols(rankByName(symbolList));
    });

    utils.wireButtonByID("btn-sort-pct", (btn, $e) => {
        drainElementList(childElements);
        childElements = createSymbols(rankByVariability(symbolList));
    });

    childElements = createSymbols(rankByVariability(symbolList));
}

function getWatchlist(wireActions = true) {
    utils.getJSON('/data/watchlist.json')
        .then(data => {
            if (wireActions) {
                initNavActions();
            }
            createWatchList(data);
        });
}


getWatchlist();

stock.loadCharts("DMS", chartActions)
