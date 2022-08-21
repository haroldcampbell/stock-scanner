import utils from "./utils.js"

const chartWidth = 325;
const chartHeight = 250;

const xMargin = 45;
const yMargin = chartHeight + 50;

const chartYLegend = 100;
const chartXLegend = chartWidth + xMargin + 25;

function xAxis(xIncrement, itemCount, weekData) {
    return gtap.$hLine([
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
    ])
}

function xAxisName() {
    return gtap.$label("Weeks", [
        gtap.$xMargin(chartWidth + xMargin - 17),
        gtap.$y(yMargin + 28),
        gtap.$style(`stroke: none; fill:#767A8F; font-size:0.5em;`),
    ])
}

function yAxis(yTickCount, yTickSpace, yIndexer, axisName) {
    return gtap.$vLine([
        gtap.$xMargin(xMargin),
        gtap.$height(chartHeight),
        gtap.$alignBottom(yMargin),
        gtap.$tickMarkText(yTickCount, yTickSpace, index => `${yIndexer(index)}`, tick => {
            tick.label.$style(`stroke: none; fill:#767A8F; font-size:0.6em;`);
            tick.label.$textAnchor('end');
            tick.alignWithAngle(270);

            if (tick.tickIndex == (yTickCount - 1)) {
                tick.label.$text(`${axisName}${tick.label.$text()}`);
            }
        }, { xMargin: -5, yMargin: chartHeight + 4 })
    ])
}

function horizontalGridLines(yTickCount, yTickSpace) {
    return gtap.$bars(gtap.$dataWithIncrement(yTickCount, yTickSpace), [
        gtap.$xMargin(xMargin + 1),
        gtap.$width(chartWidth - 2),
        gtap.$css("none"),
        gtap.$maxY(-chartHeight),
        gtap.$yMargin(yMargin),
        gtap.$height(1),
        gtap.$lambda((v, index) => {
            const fillColor = (index % 2 == 0) ? "#f0f0f0" : "#f7f7f7";
            v.$style(`fill: ${fillColor}; stroke:1;`);
        })
    ])
}

function chartLegend(textArray, colors) {
    return gtap.$wrappedShape(gtap.pointNode, gtap.$dataWithIncrement(textArray.length, 1), [
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
            e2.$size(2, 2);
            e2.$x(v.$x() - 5);
            e2.$y(v.$y() - 4);
            e2.$style(`stroke: none; fill:${colors[index]};`);
        })
    ])
}

function renderChangeData(priceData) {
    const colors = ["#7EADB9", "#FFD797"];
    const textArray = ["MaxHigh_MinLow", "MeanHigh_MeanLow"];

    let weekData = priceData.map(s => s.Week);
    let maxHighMinLowData = gtap.$data(priceData.map(s => s.MaxHigh_MinLow));
    let meanHighMeanLowData = gtap.$data(priceData.map(s => s.MeanHigh_MeanLow));

    let maxData = maxHighMinLowData.max();

    maxData = maxData > 1 ? maxData : 1;
    maxHighMinLowData.forcedMax(maxData);
    meanHighMeanLowData.forcedMax(maxData);

    const xIncrement = chartWidth / maxHighMinLowData.itemCount();
    const max_high = Math.ceil(maxHighMinLowData.max());
    const itemCount = maxHighMinLowData.itemCount();

    const yTickCount = 10;
    const yTickSpace = chartHeight / yTickCount;
    const yIndexer = (index) => { return 100 * (index + 1) * yTickSpace * max_high / chartHeight };

    let ctx = gtap.container("change-1", gtap.$id("change-chart"));
    gtap.renderVisuals(ctx, [
        xAxis(xIncrement, itemCount, weekData),
        xAxisName(),
        yAxis(yTickCount, yTickSpace, yIndexer, "%"),
        horizontalGridLines(yTickCount, yTickSpace),
        chartLegend(textArray, colors),

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
                    node.$text(val);
                    node.$x(v.$x());
                    node.$y(v.$y());
                    node.$textAnchor("middle");
                    node.$vAlign("middle");
                    node.$style("fill:#777; font-size:0.6em;");
                })
            ]
        }).withPostActions([
            gtap.$style(`stroke:${colors[textArray.indexOf("MeanHigh_MeanLow")]};stroke-width:2`),
        ]),

    ]);
}

function zeroedList(initialList, minValue) {
    let currentMinValue = minValue
    if (currentMinValue === undefined) {
        currentMinValue = Math.min(...initialList, [Number.POSITIVE_INFINITY]);
    }
    const list = initialList.map(i => i - currentMinValue);

    return [gtap.$data(list), currentMinValue];
}

function formatDate(pyDate) {
    const jsDate = new Date(Date.parse(pyDate))
    return `${jsDate.getDate()}/${jsDate.getUTCMonth() + 1}`
}

function renderPriceData(priceData) {
    const textArray = ["Max_High", "Min_Low", "Mean_High", "Mean_Intra_Day", "Mean_Low", "Week"];
    const colors = ["#ED9FA2", "Green", "transparent", "transparent", "transparent", "transparent"];

    let [minLowData, minValue] = zeroedList(priceData.map(s => s.Min_Low))
    let [maxHighData] = zeroedList(priceData.map(s => s.Max_High), minValue)

    let weekData = priceData.map(s => s.Week);

    minLowData.forcedMax(maxHighData.max());

    const xIncrement = chartWidth / maxHighData.itemCount();
    const maxHigh = maxHighData.max();
    const itemCount = maxHighData.itemCount();

    const yTickCount = 10;
    const yTickSpace = chartHeight / yTickCount;

    const yIndexer = (index) => {
        const val = minValue + maxHigh / (yTickCount - 2) * (index + 0);
        return (val).toFixed(2);
    };

    const pricLegendElements = {};

    const setLegend = (name, value, decimal = 2) => {
        let item = pricLegendElements[name];
        if (value != null || value != undefined) {
            item.node.$text(`${item.title}: ${value.toFixed(decimal)}`);
        } else {
            item.node.$text(item.title);
        }
    };

    // const d = new Date(Date.parse(priceData[23].Week_Start.$date))
    // console.log("priceData:", priceData[23].Week_Start.$date, `${d.getDate()}/${d.getUTCMonth() + 1}`)

    const onShowPriceDetails = (e, context) => {
        gtap.$stopMouseDefaults(e);

        const dataPoint = context.priceData[context.dataIndex];

        setLegend("Max_High", dataPoint.Max_High);
        setLegend("Mean_High", dataPoint.Mean_High);
        setLegend("Mean_Intra_Day", dataPoint.Mean_Intra_Day);
        setLegend("Mean_Low", dataPoint.Mean_Low);
        setLegend("Min_Low", dataPoint.Min_Low);
        setLegend("Week", dataPoint.Week, 0);

        context.node.$style(`stroke: #777; fill:none;stroke-width:0.5`);

        const start = formatDate(dataPoint.Week_Start.$date);
        const end = formatDate(dataPoint.Week_End.$date);
        const labelText = `${start} - ${end}`;

        priceLabelNodes.forEach(tick => {
            tick.label.$style(`stroke: none; fill:transparent; font-size:0.6em;`);
        });

        const tick = priceLabelNodes[context.dataIndex];
        tick.label.$text(labelText);
        tick.label.$style(`stroke: none; fill:#767A8F; font-size:0.6em;`);

        context.v.$style(`stroke: none; fill:#f0f0f0;`);
    }

    const onHidePriceDetails = (e, context) => {
        gtap.$stopMouseDefaults(e);

        setLegend("Max_High");
        setLegend("Mean_High");
        setLegend("Mean_Intra_Day");
        setLegend("Mean_Low");
        setLegend("Min_Low");
        setLegend("Week");

        context.node.$style(`stroke: transparent; fill:none;stroke-width:0.5`);

        const dataPoint = context.priceData[context.dataIndex];
        const labelText = dataPoint.Week;//formatDate(dataPoint.Week);

        const tick = priceLabelNodes[context.dataIndex]
        tick.label.$text(labelText);

        priceLabelNodes.forEach(tick => {
            const fillstyle = (tick.tickIndex % 2) ? 'transparent' : '#767A8F';
            tick.label.$style(`stroke: none; fill:${fillstyle}; font-size:0.6em;`);
        });

        // tick.label.$style(`stroke: none; fill:transparent; font-size:0.6em;`);
        context.v.$style(`stroke: none; fill:#767A8F00;`);
    }

    const xAxisLabeler = (index) => {
        return weekData[index];
    }
    const priceLabelNodes = [];

    let ctx = gtap.container("line-1", gtap.$id("line-chart"));
    gtap.renderVisuals(ctx, [
        // xAxis(xIncrement, itemCount, weekData),
        xAxisName(),
        gtap.$hLine([
            gtap.$xMargin(xMargin),
            gtap.$width(chartWidth),
            gtap.$y(yMargin),
            // gtap.$tickMarks(itemCount, xIncrement, gtap.ellipseTicks("fill: #EB395A;"),
            //     { xMargin: 0 }),
            gtap.$tickMarkText(itemCount, xIncrement, xAxisLabeler, tick => {
                tick.alignWithAngle(0);
                tick.label.$textAnchor('middle');

                const fillstyle = (tick.tickIndex % 2) ? 'transparent' : '#767A8F';
                tick.label.$style(`stroke: none; fill:${fillstyle}; font-size:0.6em;`);

                priceLabelNodes.push(tick);
            }, { xMargin: 0, yMargin: 15 })
        ]),
        yAxis(yTickCount, yTickSpace, yIndexer, "$"),
        horizontalGridLines(yTickCount, yTickSpace),

        // Background highlight
        gtap.$bars(gtap.$dataWithIncrement(maxHighData.itemCount(), 1), [
            gtap.$width(xIncrement),
            gtap.$x((xIncrement) * .5),
            gtap.$xMargin(xMargin),
            gtap.$xIncrement(xIncrement),
            gtap.$height(chartHeight),
            gtap.$alignBottom(yMargin - 0.5),
            gtap.$style(`stroke: none; fill:#767A8F00;`),
            gtap.$lambda((v, index) => {
                const node = gtap.vLine(v.$parentElm);
                node.$x(v.$x() + xIncrement * 0.5);
                node.$y(v.$y());
                node.$height(chartHeight)
                // node.$style(`stroke: #777; fill:none;stroke-width:0.5`);

                const sharedContext = {
                    v,
                    context: ctx,
                    dataIndex: index,
                    priceData,
                    node: node,

                };

                v.onmouseover = (e) => onShowPriceDetails(e, sharedContext);
                v.onmouseleave = (e) => onHidePriceDetails(e, sharedContext);
            }),
        ]),

        // Max_High
        gtap.$polygon(maxHighData, [
            gtap.$x(xIncrement),
            gtap.$xMargin(xMargin),
            gtap.$xIncrement(xIncrement),
            gtap.$lambda((v, index, d) => {
                const yOffset = chartHeight * .2
                v.$y((1 - v.getDataValue()) * chartHeight * .8 + 50 + yOffset / 2.0);
            }),
        ], {
            curveLength: 3,

        }).withPostActions([
            gtap.$style(`stroke-linecap:round;fill:none;stroke:${colors[textArray.indexOf("Max_High")]};stroke-width:1`),
        ]),

        // Min_Low
        gtap.$polygon(minLowData, [
            gtap.$x(xIncrement),
            gtap.$xMargin(xMargin),
            gtap.$xIncrement(xIncrement),
            gtap.$lambda((v, index, d) => {
                const yOffset = chartHeight * .2
                v.$y((1 - v.getDataValue()) * chartHeight * .8 + 50 + yOffset / 2.0);
            })
        ], {
            curveLength: 3,

        }).withPostActions([
            gtap.$style(`stroke-linecap:round;fill:none;stroke:${colors[textArray.indexOf("Min_Low")]};stroke-width:1`),
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
                };;
            })
        ]),
    ]);
}

function loadCharts(symbol) {
    console.log("[loadCharts] loading:", symbol)
    const elm = document.getElementsByClassName("chart-outer-container").item(0);
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