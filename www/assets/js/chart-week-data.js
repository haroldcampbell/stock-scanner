import cu from "./chart-utils.js"


function pivotDays(weekData, dow) {
    return weekData.map(w => w[dow])
}

function filterPCTNone(data) {
    let sum = 0;
    let count = 0

    data.forEach(item => {
        if (item.$numberDouble === "NaN") {
            return
        }
        const pct = (item.High - item.Open) / item.Open
        sum += pct
        count++;

        if (item.High === undefined) {
            console.log("found undefined item:", item, item.$numberDouble)
            return
        }
        // console.log("sum:", sum, item.High, item.Open)
    });

    const pct = sum / count

    return pct;
}
function filterPCTFortnight(singleDayData) {
    let sum = 0;
    let count = 0

    singleDayData = [...singleDayData].reverse()
    const subList = singleDayData.slice(0, 2);

    subList.forEach(item => {
        if (item.$numberDouble === "NaN") {
            return
        }
        const pct = (item.High - item.Open) / item.Open
        sum += pct
        count++;

        if (item.High === undefined) {
            console.log("found undefined item:", item, item.$numberDouble)
            return
        }
    });

    const pct = sum / count

    return pct;
}

function filterPCTMonth(singleDayData) {
    let sum = 0;
    let count = 0

    singleDayData = [...singleDayData].reverse()
    const subList = singleDayData.slice(0, 4);

    subList.forEach(item => {
        if (item.$numberDouble === "NaN") {
            return
        }
        const pct = (item.High - item.Open) / item.Open
        sum += pct
        count++;

        if (item.High === undefined) {
            console.log("found undefined item:", item, item.$numberDouble)
            return
        }
        // console.log("sum:", sum, item.High, item.Open)
    });

    const pct = sum / count

    return pct;
}

function filterPCTQuarter(singleDayData) {
    let sum = 0;
    let count = 0

    singleDayData = [...singleDayData].reverse()
    const subList = singleDayData.slice(0, 12);

    subList.forEach(item => {
        if (item.$numberDouble === "NaN") {
            return
        }
        const pct = (item.High - item.Open) / item.Open
        sum += pct
        count++;

        if (item.High === undefined) {
            console.log("found undefined item:", item, item.$numberDouble)
            return
        }
        // console.log("sum:", sum, item.High, item.Open)
    });

    const pct = sum / count

    return pct;
}

function calcPercentages(days, dayIndex, filterInWeeks) {
    const data = days[dayIndex]

    switch (filterInWeeks) {
        case 2: return filterPCTFortnight(data);
        case 4: return filterPCTMonth(data);
        case 12: return filterPCTQuarter(data);
        case -1: return filterPCTNone(data);
    }
}

function generatePercentagesArray(days, filterInWeeks) {
    const pctDays = [
        calcPercentages(days, 0, filterInWeeks),
        calcPercentages(days, 1, filterInWeeks),
        calcPercentages(days, 2, filterInWeeks),
        calcPercentages(days, 3, filterInWeeks),
        calcPercentages(days, 4, filterInWeeks),
    ]

    const weeklyData = gtap.$data(pctDays);

    return weeklyData;
}

function createFilters(days, barsVisual, valueVisual) {
    const container = document.getElementsByClassName("week-chart").item(0);

    const createFilter = (parent, text, ev$) => {
        const child = document.createElement("button");
        child.innerText = text
        child.onclick = (e) => { ev$() }

        parent.appendChild(child);
    }

    const filtersContainer = document.createElement("div");
    filtersContainer.className = "week-filters"
    container.appendChild(filtersContainer);

    const rebuildData = (filter) => {
        const weeklyData = generatePercentagesArray(days, filter)

        barsVisual.withData(weeklyData);
        barsVisual.onDataDidChange();

        valueVisual.withData(weeklyData);
        valueVisual.onDataDidChange();
    }

    createFilter(filtersContainer, "10 days", () => rebuildData(2));
    createFilter(filtersContainer, "1 month", () => rebuildData(4));
    createFilter(filtersContainer, "3 months", () => rebuildData(12));
    createFilter(filtersContainer, "all", () => rebuildData(-1));
}

function weekIndexToDayName(index) {
    switch (index) {
        case 0: return "Mon";
        case 1: return "Tues";
        case 2: return "Wed";
        case 3: return "Thur";
        case 4: return "Fri";
    }
}

export function renderWeekData(chartOptions, data) {
    console.log("renderWeekData data:", data.Week)
    const barWidth = 50;

    const days = {
        "0": pivotDays(data.Week, "Monday"),
        "1": pivotDays(data.Week, "Tuesday"),
        "2": pivotDays(data.Week, "Wednesday"),
        "3": pivotDays(data.Week, "Thursday"),
        "4": pivotDays(data.Week, "Friday"),
    }

    const weeklyData = generatePercentagesArray(days, -1)

    console.log("days:", days)

    let ctx = gtap.container("week-chart-1", gtap.$id("week-chart"));
    const barsVisual = gtap.$bars(weeklyData, [
        gtap.$x(40),
        gtap.$xIncrement(barWidth + 5),
        gtap.$maxHeight(50),
        gtap.$width(barWidth),
        gtap.$alignBottom(100),

        gtap.$lambda((v, index) => {
            const d = weeklyData.itemAtIndex(index)
            const h = 170 + d * 80;
            const l = 70 + (0.7 - d) * 50;

            v.$style(`stroke:none;fill:hsl(${h}, 100%, ${l}%);`);
        }),
    ])
    const valueVisual = gtap.$labels(weeklyData, [
        gtap.$x(50),
        gtap.$xIncrement(barWidth + 5),
        gtap.$maxHeight(50),
        gtap.$width(barWidth),
        gtap.$alignBottom(100),
        gtap.$yMargin(-5),
        gtap.$rawDataValue((val) => {
            return `${(val * 100).toFixed(2)}%`;
        }),
        gtap.$style(`stroke: none; fill:#333; font-size:0.8em;`),
    ])
    gtap.renderVisuals(ctx, [
        barsVisual,
        valueVisual,

        gtap.$labels(gtap.$dataWithIncrement(5, 1), [
            gtap.$x(55),
            gtap.$xIncrement(barWidth + 5),
            // gtap.$maxHeight(50),
            gtap.$width(barWidth),
            gtap.$alignBottom(100),
            gtap.$yMargin(15),
            gtap.$rawDataValue(index => {
                return weekIndexToDayName(index - 1);
            }),
            gtap.$style(`stroke: none; fill:#999; font-size:0.6em;`),
        ])
    ]);

    console.log(barsVisual)
    createFilters(days, barsVisual, valueVisual)
}
