import cu from "./chart-utils.js"


function pivotDays(weekData, dow) {
    return weekData.map(w => w[dow])
}

function filterPCTNone(data) {
    let sumHigh = 0;
    let sumLow = 0;
    let count = 0

    data.forEach(item => {
        if (item.$numberDouble === "NaN") {
            return
        }
        const pctHigh = (item.High - item.Open) / item.Open
        const pctLow = (item.Low - item.Open) / item.Open
        sumHigh += pctHigh
        sumLow += pctLow
        count++;

        if (item.High === undefined) {
            console.log("found undefined item:", item, item.$numberDouble)
            return
        }
        // console.log("sum:", sum, item.High, item.Open)
    });

    const pct = {
        high: sumHigh / count,
        low: -1 * sumLow / count,
    }

    return pct;
}
function filterPCTFortnight(singleDayData) {
    singleDayData = [...singleDayData].reverse()
    const subList = singleDayData.slice(0, 2);

    return filterPCTNone(subList)
}

function filterPCTMonth(singleDayData) {
    singleDayData = [...singleDayData].reverse()
    const subList = singleDayData.slice(0, 4);

    return filterPCTNone(subList)
}

function filterPCTQuarter(singleDayData) {
    singleDayData = [...singleDayData].reverse()
    const subList = singleDayData.slice(0, 12);

    return filterPCTNone(subList)
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

    const weeklyData = {
        high: gtap.$data(pctDays.map(i => i.high)),
        low: gtap.$data(pctDays.map(i => i.low)),
    };

    return weeklyData;
}

const filterButtons = [];
function createFilters(days, highVisuals, lowVisuals) {
    const container = document.getElementsByClassName("week-chart").item(0);

    const rebuildData = (active, buttons, filter) => {
        const weeklyData = generatePercentagesArray(days, filter)

        highVisuals.forEach(v => {
            v.withData(weeklyData.high);
            v.onDataDidChange();
        })

        lowVisuals.forEach(v => {
            v.withData(weeklyData.low);
            v.onDataDidChange();
        })
        buttons.forEach(btn => {
            btn.className = ""
        });
        active.className = "active"
    }

    const createFilter = (parent, text, wkIndex) => {
        const child = document.createElement("button");
        child.innerText = text
        child.onclick = (e) => { rebuildData(child, filterButtons, wkIndex) }

        filterButtons.push(child)
        parent.appendChild(child);
    }

    const filtersContainer = document.createElement("div");
    filtersContainer.className = "week-filters"
    container.appendChild(filtersContainer);

    createFilter(filtersContainer, "10 days", 2);
    createFilter(filtersContainer, "1 month", 4);
    createFilter(filtersContainer, "3 months", 12);
    createFilter(filtersContainer, "all", -1);
    // buttons[buttons.length-1].className = "active"
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

function adjustedBarColor(v, darkColor, lightColor) {
    const d = v.getDataValue();
    const l = 70 + (0.7 - d) * 50;

    // console.log("l:", l)
    return l < 70 ? lightColor : darkColor
}
function calHSLStyle(v, hue) {
    const d = v.getDataValue();
    const h = hue + d * 80;
    const l = 70 + (0.7 - d) * 50;

    v.$style(`stroke:none;fill:hsl(${h}, 100%, ${l}%);`);
}

export function renderWeekData(chartOptions, data) {
    const yMargin = 25;
    const barWidth = 50;
    const midMargin = 75;
    const maxHeight = 50;

    const days = {
        "0": pivotDays(data.Week, "Monday"),
        "1": pivotDays(data.Week, "Tuesday"),
        "2": pivotDays(data.Week, "Wednesday"),
        "3": pivotDays(data.Week, "Thursday"),
        "4": pivotDays(data.Week, "Friday"),
    }

    const weeklyData = { low: gtap.$data([]), high: gtap.$data([]) }; // Init with empty set

    const barsVisualLowPrices = gtap.$bars(weeklyData.low, [
        gtap.$x(40),
        gtap.$xIncrement(barWidth + 5),
        gtap.$width(barWidth),
        gtap.$maxHeight(maxHeight - 1),
        gtap.$y(yMargin),

        gtap.$lambda(v => {
            v.$style(calHSLStyle(v, 250));
        }),
    ]);
    const valueLowVisual = gtap.$labels(weeklyData.low, [
        gtap.$x(45),
        gtap.$xIncrement(barWidth + 5),
        gtap.$width(barWidth),
        gtap.$y(yMargin + 15),
        gtap.$rawDataValue((val) => {
            return `${(val * 100).toFixed(2)}%`;
        }),
        gtap.$lambda(v => {
            const width = v.$textBoundingBox().width;
            v.$x(v.$x() + (barWidth - width) / 2.0)
            v.$style(`stroke: none; fill:#333; font-size:0.8em;`);
        }),
    ])

    const barsVisualHighPrices = gtap.$bars(weeklyData.high, [
        gtap.$x(40),
        gtap.$xIncrement(barWidth + 5),
        gtap.$maxHeight(maxHeight - 1),
        gtap.$width(barWidth),
        gtap.$alignBottom(midMargin + 50),

        gtap.$lambda(v => {
            v.$style(calHSLStyle(v, 170));
        }),
    ]);
    const valueHighVisual = gtap.$labels(weeklyData.high, [
        gtap.$x(45),
        gtap.$xIncrement(barWidth + 5),
        gtap.$width(barWidth),
        gtap.$alignBottom(midMargin + maxHeight - 5),
        gtap.$rawDataValue((val) => {
            return `${(val * 100).toFixed(2)}%`;
        }),
        gtap.$lambda(v => {
            const fontColor = adjustedBarColor(v, "#333", "#f0f0f0");
            const width = v.$textBoundingBox().width;
            v.$x(v.$x() + (barWidth - width) / 2.0)
            v.$style(`stroke: none; font-size:0.8em;fill:${fontColor}`);
        }),
    ]);

    let ctx = gtap.container("week-chart-1", gtap.$id("week-chart"));
    gtap.renderVisuals(ctx, [
        barsVisualLowPrices,
        valueLowVisual,

        barsVisualHighPrices,
        valueHighVisual,

        // Day of week
        gtap.$labels(gtap.$dataWithIncrement(5, 1), [
            gtap.$x(55),
            gtap.$xIncrement(barWidth + 5),
            gtap.$width(barWidth),
            gtap.$alignBottom(midMargin + maxHeight + 15),
            gtap.$rawDataValue(index => {
                return weekIndexToDayName(index - 1);
            }),
            gtap.$style(`stroke: none; fill:#999; font-size:0.6em;`),
        ]),

        gtap.$hLine([
            gtap.$x(0),
            gtap.$width(400),
            gtap.$y(midMargin),
            gtap.$style(`stroke: #bbb; stroke-width:0.8px;`),

        ]),

        gtap.$label("Low - Open", [
            gtap.$x(320),
            gtap.$y(yMargin + 15),
            gtap.$style(`stroke: none; fill:#999; font-size:0.8em;`),
        ]),

        gtap.$label("High - Open", [
            gtap.$x(320),
            gtap.$y(midMargin + maxHeight - 5),
            gtap.$style(`stroke: none; fill:#999; font-size:0.8em;`),
        ])
    ]);

    createFilters(days,
        [barsVisualHighPrices, valueHighVisual],
        [barsVisualLowPrices, valueLowVisual])

    filterButtons[filterButtons.length - 1].onclick(); // Select "All" filter
}
