import utils from "./utils.js"
import stock from "./charts.js"


function onClickSymbol(e$, name) {
    stock.loadCharts(name)
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
    // utils.wireButtonByID("btn-update-week",
    //     utils.postURLAction("/update-week", data => {
    //         window.alert(`New Records: '${data.newRecords}'`)
    //     })
    // );
}

function createWatchList(symbolList) {
    let childElements = [];

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
        childElements = createSymbols(symbolList);
    });

    utils.wireButtonByID("btn-sort-pct", (btn, $e) => {
        drainElementList(childElements);
        childElements = createSymbols(rankByVariability(symbolList));
    });

    childElements = createSymbols(rankByVariability(symbolList));
}

utils.getJSON('/data/watchlist.json')
    .then(data => {
        initNavActions();
        createWatchList(data);
    });

stock.loadCharts("AVYA")
