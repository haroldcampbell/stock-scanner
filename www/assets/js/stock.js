import utils from "./utils.js"

const chartHeight = 250;
const chartWidth = 350;
const xMargin = 35;
const yMargin = chartHeight + 50;

const chartXLegend = chartWidth + xMargin + 25
const chartYLegend = 100

function renderChangeData(priceData) {
    const colors = ["#7EADB9", "#FFD797"];
    const textArray = ["MaxHigh_MinLow", "MeanHigh_MeanLow"];

    let weekData = priceData.map(s => s.Week);
    let maxHighMinLowData = gtap.$data(priceData.map(s => s.MaxHigh_MinLow));
    let meanHighMeanLowData = gtap.$data(priceData.map(s => s.MeanHigh_MeanLow));

    maxHighMinLowData.forcedMax(1)
    meanHighMeanLowData.forcedMax(1)

    const xIncrement = chartWidth / maxHighMinLowData.itemCount();
    const max_high = Math.ceil(maxHighMinLowData.max());
    const itemCount = maxHighMinLowData.itemCount();

    const yTickCount = 10
    const yTickSpace = chartHeight / yTickCount
    const yIndexer = (index) => { return (index + 1) * yTickSpace * max_high / chartHeight };

    let ctx = gtap.container("change-1", gtap.$id("change-chart"));
    gtap.renderVisuals(ctx, [
        // X-Axis
        gtap.$hLine([
            gtap.$xMargin(xMargin),
            gtap.$width(chartWidth),
            gtap.$y(yMargin),
            gtap.$tickMarks(itemCount, xIncrement, gtap.ellipseTicks("fill: #EB395A;"),
                { xMargin: 0 }),
            gtap.$tickMarkText(itemCount, xIncrement, index => `${weekData[index]}`, tick => {
                tick.alignWithAngle(0);
                tick.label.$style(`stroke: none; fill:#767A8F; font-size:0.6em;`);
                tick.label.$textAnchor('middle');
            }, { xMargin: 0, yMargin: 15 })
        ]),

        // X-axis name
        gtap.$label("Weeks", [
            gtap.$xMargin(chartWidth + xMargin - 17),
            gtap.$y(yMargin + 28),
            gtap.$style(`stroke: none; fill:#767A8F; font-size:0.5em;`),
        ]),

        // Y-Axis
        gtap.$vLine([
            gtap.$xMargin(xMargin),
            gtap.$height(chartHeight),
            gtap.$alignBottom(yMargin),
            gtap.$tickMarkText(yTickCount, yTickSpace, index => `${yIndexer(index) * 100}`, tick => {
                tick.label.$style(`stroke: none; fill:#767A8F; font-size:0.6em;`);
                tick.label.$textAnchor('end');
                tick.alignWithAngle(270);
            }, { xMargin: -10, yMargin: chartHeight + 4 })
        ]),

        // Y-axis name
        gtap.$label("%", [
            gtap.$xMargin(xMargin - 9),
            gtap.$height(chartHeight),
            gtap.$alignBottom(yMargin + 3),
            gtap.$style(`stroke: none; fill:#767A8F; font-size:0.5em;`),
        ]),

        // horizontal grid lines
        gtap.$bars(gtap.$dataWithIncrement(yTickCount, yTickSpace), [
            gtap.$xMargin(xMargin + 1),
            gtap.$width(chartWidth - 2),
            gtap.$css("none"),
            gtap.$maxY(-chartHeight),
            gtap.$yMargin(yMargin),
            gtap.$height(1),
            gtap.$lambda((v, index) => {
                if (index % 2 == 0) {
                    v.$style("fill: #f0f0f0; stroke:1;")
                } else {
                    v.$style("fill: #f7f7f7; stroke:1;")
                }
            })
        ]),

        // MaxHigh_MinLow
        gtap.$polygon(maxHighMinLowData, [
            gtap.$x(xIncrement),
            gtap.$xMargin(xMargin),
            gtap.$xIncrement(xIncrement),
            gtap.$maxY(-chartHeight),
            gtap.$yMargin(yMargin),
        ], {
            curveLength: 5,
        }).withPostActions([
            gtap.$style(`stroke-linecap:round;fill: none;stroke:${colors[textArray.indexOf("MaxHigh_MinLow")]};stroke-width:2`),
        ]),

        // MeanHigh_MeanLow
        gtap.$lines(meanHighMeanLowData, [
            gtap.$x(xIncrement),
            gtap.$xMargin(xMargin),
            gtap.$xIncrement(xIncrement),
            gtap.$maxY(-chartHeight),
            gtap.$yMargin(yMargin),
        ], {
            isConnected: true,
            pointActions: [
                gtap.$lambda((v, index) => {
                    const val = parseInt(meanHighMeanLowData.rawItemAtIndex(index) * 1000) / 10
                    const node = gtap.text(v.$parentElm)
                    node.$x(v.$x());
                    node.$y(v.$y());
                    node.$textAnchor("middle");
                    node.$vAlign("middle");
                    node.$style("fill:#777; font-size:0.6em;")
                    node.$text(val);
                })
            ]
        }).withPostActions([
            gtap.$style(`stroke:${colors[textArray.indexOf("MeanHigh_MeanLow")]};stroke-width:2`),
        ]),

        // Legend
        gtap.$wrappedShape(gtap.pointNode, gtap.$dataWithIncrement(textArray.length, 1), [
            gtap.$x(chartXLegend),
            gtap.$y(chartYLegend),
            gtap.$yIncrement(15),
            gtap.$lambda((v, index) => {
                const e = gtap.text(v.$parentElm);
                e.$x(v.$x());
                e.$y(v.$y());
                e.$text(textArray[index]);
                e.$style(`stroke: none; fill:#767A8F; font-size:0.7em; font-weight: 600;`);

                const e2 = gtap.ellipse(v.$parentElm);
                e2.$x(v.$x() - 5);
                e2.$y(v.$y() - 5);
                e2.$size(2, 2);
                e2.$style(`stroke: none; fill:${colors[index]};`);
            })
        ]),
    ]);
}

function renderPriceData(priceData) {
    const textArray = ["Max_High", "Mean_High", "Mean_Intra_Day", "Mean_Low", "Min_Low"];
    const colors = ["#ED9FA2", "Purple", "Red", "Orange", "#ED9FA2"];

    console.log("[renderPriceData] priceData:", priceData)
    let weekData = priceData.map(s => s.Week);
    let maxHighData = gtap.$data(priceData.map(s => s.Max_High));
    let meanHighData = gtap.$data(priceData.map(s => s.Mean_High));
    let meanIntraDayData = gtap.$data(priceData.map(s => s.Mean_Intra_Day));
    let meanLowData = gtap.$data(priceData.map(s => s.Mean_Low));
    let minLowData = gtap.$data(priceData.map(s => s.Min_Low));

    meanHighData.forcedMax(maxHighData.max())
    meanIntraDayData.forcedMax(maxHighData.max())
    meanLowData.forcedMax(maxHighData.max())
    minLowData.forcedMax(maxHighData.max())

    const xIncrement = chartWidth / maxHighData.itemCount();
    // const max_high = Math.ceil(maxHighData.max());
    const max_high = maxHighData.max();

    const yTickCount = 10
    const yTickSpace = chartHeight / yTickCount
    const yIndexer = (index) => {
        const val = (max_high / yTickCount) * (index + 1);

        return val.toFixed(2)
    };

    let ctx = gtap.container("line-1", gtap.$id("line-chart"));
    gtap.renderVisuals(ctx, [
        // X-Axis
        gtap.$hLine([
            gtap.$y(yMargin),
            gtap.$xMargin(xMargin),
            gtap.$width(chartWidth),
            gtap.$tickMarks(maxHighData.itemCount(), xIncrement, gtap.ellipseTicks("fill: #EB395A;"),
                { xMargin: 0 }),
            gtap.$tickMarkText(maxHighData.itemCount(), xIncrement, index => `${weekData[index]}`, tick => {
                tick.alignWithAngle(0);
                tick.label.$textAnchor('middle');
                tick.label.$style(`stroke: none; fill:#767A8F; font-size:0.6em;`);
            }, { xMargin: 0, yMargin: 15 })
        ]),

        // X-axis name
        gtap.$label("Weeks", [
            gtap.$xMargin(chartWidth + xMargin - 17),
            gtap.$y(yMargin + 28),
            gtap.$style(`stroke: none; fill:#767A8F; font-size:0.5em;`),
        ]),


        // Y-Axis
        gtap.$vLine([
            gtap.$xMargin(xMargin),
            gtap.$y(yMargin),
            gtap.$height(chartHeight),
            gtap.$alignBottom(yMargin),
            gtap.$tickMarkText(yTickCount, yTickSpace, index => `${yIndexer(index)}`, tick => {
                tick.alignWithAngle(270);
                tick.label.$textAnchor('end');
                tick.label.$style(`stroke: none; fill:#767A8F; font-size:0.6em;`);
            }, { xMargin: -5, yMargin: chartHeight })
        ]),

        // horizontal grid lines
        gtap.$bars(gtap.$dataWithIncrement(yTickCount, yTickSpace), [
            gtap.$xMargin(xMargin + 1),
            gtap.$width(chartWidth - 2),
            gtap.$css("none"),
            gtap.$maxY(-chartHeight),
            gtap.$yMargin(yMargin),
            gtap.$height(1),
            gtap.$lambda((v, index) => {
                if (index % 2 == 0) {
                    v.$style("fill: #f0f0f0; stroke:1;")
                } else {
                    v.$style("fill: #f7f7f7; stroke:1;")
                }
            })
        ]),

        // Background highlight
        gtap.$bars(gtap.$dataWithIncrement(maxHighData.itemCount(), 1), [
            gtap.$width(xIncrement - 2),
            gtap.$x((xIncrement - 2) * .5),
            gtap.$xMargin(xMargin),
            gtap.$xIncrement(xIncrement),
            gtap.$height(chartHeight),
            gtap.$alignBottom(yMargin - 0.5),
            gtap.$style(`stroke: none; fill:#767A8F00;`),
            gtap.$lambda((v, index) => {
                const sharedContext = {
                    v,
                    context: ctx,
                    dataIndex: index,
                    priceData,
                };

                v.onmouseover = (e) => showPriceDetails(e, sharedContext);
                v.onmouseleave = (e) => hidePriceDetails(e, sharedContext);
            }),
        ]),


        // Max_High
        gtap.$lines(maxHighData, [
            gtap.$x(xIncrement),
            gtap.$xMargin(xMargin),
            gtap.$xIncrement(xIncrement),
            gtap.$maxY(-chartHeight),
            gtap.$yMargin(yMargin),
        ], {
            isConnected: true,
        }).withPostActions([
            gtap.$style(`stroke-linecap:round;stroke:${colors[textArray.indexOf("Max_High")]};stroke-width:2`),
        ]),

        // Mean_High
        gtap.$lines(meanHighData, [
            gtap.$x(xIncrement),
            gtap.$xMargin(xMargin),
            gtap.$xIncrement(xIncrement),
            gtap.$maxY(-chartHeight),
            gtap.$yMargin(yMargin),
        ], {
            isConnected: true,
        }).withPostActions([
            gtap.$style(`stroke-linecap:round;stroke:${colors[textArray.indexOf("Mean_High")]};stroke-width:2`),
        ]),

        // Mean_Intra_Day
        gtap.$lines(meanIntraDayData, [
            gtap.$x(xIncrement),
            gtap.$xMargin(xMargin),
            gtap.$xIncrement(xIncrement),
            gtap.$maxY(-chartHeight),
            gtap.$yMargin(yMargin),
        ], {
            isConnected: true,
        }).withPostActions([
            gtap.$style(`stroke-linecap:round;stroke:${colors[textArray.indexOf("Mean_Intra_Day")]};stroke-width:2`),
        ]),

        // Mean_Low
        gtap.$lines(meanLowData, [
            gtap.$x(xIncrement),
            gtap.$xMargin(xMargin),
            gtap.$xIncrement(xIncrement),
            gtap.$maxY(-chartHeight),
            gtap.$yMargin(yMargin),
        ], {
            isConnected: true,
        }).withPostActions([
            gtap.$style(`stroke-linecap:round;stroke:${colors[textArray.indexOf("Mean_Low")]};stroke-width:2`),
        ]),

        // Min_Low
        gtap.$lines(minLowData, [
            gtap.$x(xIncrement),
            gtap.$xMargin(xMargin),
            gtap.$xIncrement(xIncrement),
            gtap.$maxY(-chartHeight),
            gtap.$yMargin(yMargin),
        ], {
            isConnected: true,
            // pointActions: [
            //     gtap.$lambda((v, index) => {
            //         // const val = parseInt(minLowData.rawItemAtIndex(index))
            //         const val = minLowData.rawItemAtIndex(index)
            //         const node = gtap.text(v.$parentElm)
            //         node.$x(v.$x());
            //         node.$y(v.$y());
            //         node.$textAnchor("middle");
            //         node.$vAlign("middle");
            //         node.$style("fill:#777; font-size:0.6em;")
            //         node.$text(val);
            //     })
            // ]
        }).withPostActions([
            gtap.$style(`stroke-linecap:round;stroke:${colors[textArray.indexOf("Min_Low")]};stroke-width:2`),
        ]),

        // Legend
        gtap.$wrappedShape(gtap.pointNode, gtap.$dataWithIncrement(textArray.length, 1), [
            gtap.$x(chartXLegend),
            gtap.$y(chartYLegend),
            gtap.$yIncrement(15),
            gtap.$lambda((v, index) => {
                const e2 = gtap.ellipse(v.$parentElm);
                e2.$x(v.$x() - 5);
                e2.$y(v.$y() - 5);
                e2.$size(2, 2);
                e2.$style(`stroke: none; fill:${colors[index]};`);

                const e = gtap.text(v.$parentElm);
                e.$x(v.$x());
                e.$y(v.$y());
                e.$text(textArray[index]);
                e.$style(`stroke: none; fill:#767A8F; font-size:0.7em; font-weight: 600;`);

                pricLegendElements[textArray[index]] = {
                    node: e,
                    title: textArray[index],
                }
            })
        ]),
    ]);
}

const pricLegendElements = {}

function setLegend(name, value) {
    let item = pricLegendElements[name];
    if (value != null || value != undefined) {
        item.node.$text(`${item.title}: ${value.toFixed(2)}`);
    } else {
        item.node.$text(item.title);
    }
}

function showPriceDetails(e, context) {
    gtap.$stopMouseDefaults(e);

    const dataPoint = context.priceData[context.dataIndex];

    setLegend("Max_High", dataPoint.Max_High);
    setLegend("Mean_High", dataPoint.Mean_High);
    setLegend("Mean_Intra_Day", dataPoint.Mean_Intra_Day);
    setLegend("Mean_Low", dataPoint.Mean_Low);
    setLegend("Min_Low", dataPoint.Min_Low);

    context.v.$style(`stroke: none; fill:#f0f0f0;`);
}

function hidePriceDetails(e, context) {
    gtap.$stopMouseDefaults(e);

    setLegend("Max_High");
    setLegend("Mean_High");
    setLegend("Mean_Intra_Day");
    setLegend("Mean_Low");
    setLegend("Min_Low");

    context.v.$style(`stroke: none; fill:#767A8F00;`);
}

function loadCharts(symbol) {
    console.log("[loadCharts] loading:", symbol)
    const elm = document.getElementsByClassName("chart-container").item(0);
    elm.innerHTML = "Loading..."
    utils.getPriceData(symbol)
        .then(data => {
            console.log("[loadCharts] priceData:", data)
            elm.innerHTML =
                `<div class="stock-info"><h1>${symbol}</h1> stock</div>`
                + '<div id="line-chart" class="line-chart"></div>'
                + '<div id = "change-chart" class="change-chart" ></div>';
            renderPriceData(data.Price)
            renderChangeData(data.Change);
        })
        .catch(err => {
            console.log("[loadCharts] err:", err)
        })
}

export default {
    loadCharts,
}