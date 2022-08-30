import utils from "./utils.js"
import cu from "./chart-utils.js"

const chartWidth = 325;
const chartHeight = 250;

const xMargin = 45;
const yMargin = chartHeight + 50;

const chartYLegend = 100;
const chartXLegend = chartWidth + xMargin + 25;

const sharedContext = {
    legendElements: {
        price: {},
        change: {},
    },
    priceCtx: {},
    changeCtx: {},
};

const chartOptions = cu.createChartOptions(chartWidth, chartHeight, xMargin, yMargin, chartXLegend, chartYLegend);



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
        cu.xAxis(chartOptions),
        cu.xAxisName(chartOptions),
        cu.yAxis(chartOptions, yTickCount, yTickSpace, yIndexer, "%"),
        cu.horizontalGridLines(chartOptions, yTickCount, yTickSpace),
        // cu.chartLegend(chartOptions, textArray, colors),

        // Background highlight
        gtap.$bars(gtap.$dataWithIncrement(maxHighMinLowData.itemCount(), 1), [
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

                const fillstyle = (index % 2) ? 'transparent' : '#767A8F';
                const label = gtap.text(v.$parentElm);
                label.$x(v.$x() + xIncrement * 0.5);
                label.$y(v.$y() + chartHeight + 15);
                label.$text(weekData[index]);
                label.$textAnchor('middle');
                label.$style(`stroke: none; fill:red; font-size:0.6em;`);
                label.$style(`stroke: none; fill:${fillstyle}; font-size:0.6em;`);

                sharedContext.changeCtx[index] = {
                    context: ctx,
                    priceData,
                    labelNode: label,
                    visualBGNode: v,
                    lineNode: node,
                };

                v.onmouseover = (e) => cu.onShowChartDetails(e, index, sharedContext);
                v.onmouseleave = (e) => cu.onHideChartDetails(e, index, sharedContext);
            }),
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
                e2.$size(2, 2);
                e2.$x(v.$x() - 5);
                e2.$y(v.$y() - 4);
                e2.$style(`stroke: none; fill:${colors[index]};`);
            })
        ])
    ]);
}

function renderPriceData(priceData) {
    const textArray = ["Max_High", "Min_Low", "Mean_High", "Mean_Intra_Day", "Mean_Low", "Week"];
    const colors = ["#ED9FA2", "Green", "transparent", "transparent", "transparent", "transparent"];

    let [minLowData, minValue] = cu.zeroedList(priceData.map(s => s.Min_Low));
    let [maxHighData] = cu.zeroedList(priceData.map(s => s.Max_High), minValue);

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

    const xAxisLabeler = (index) => {
        return weekData[index];
    }

    let ctx = gtap.container("line-1", gtap.$id("line-chart"));
    gtap.renderVisuals(ctx, [
        cu.xAxis(chartOptions),
        cu.xAxisName(chartOptions),
        cu.yAxis(chartOptions, yTickCount, yTickSpace, yIndexer, "$"),
        cu.horizontalGridLines(chartOptions, yTickCount, yTickSpace),

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

                const fillstyle = (index % 2) ? 'transparent' : '#767A8F';
                const label = gtap.text(v.$parentElm);
                label.$x(v.$x() + xIncrement * 0.5);
                label.$y(v.$y() + chartHeight + 15);
                label.$text(xAxisLabeler(index));
                label.$textAnchor('middle');
                label.$style(`stroke: none; fill:red; font-size:0.6em;`);
                label.$style(`stroke: none; fill:${fillstyle}; font-size:0.6em;`);

                sharedContext.priceCtx[index] = {
                    context: ctx,
                    priceData,
                    labelNode: label,
                    visualBGNode: v,
                    lineNode: node,
                };

                v.onmouseover = (e) => cu.onShowChartDetails(e, index, sharedContext);
                v.onmouseleave = (e) => cu.onHideChartDetails(e, index, sharedContext);
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
                e2.$y(v.$y() - 4);
                e2.$size(2, 2);
                e2.$style(`stroke: none; fill:${colors[index]};`);

                const nameNode = gtap.text(v.$parentElm);
                nameNode.$x(v.$x());
                nameNode.$y(v.$y());
                nameNode.$text(textArray[index]);
                nameNode.$style(`stroke: none; fill:#767A8F; font-size:0.7em; font-weight: 100;`);

                const box = nameNode.$textBoundingBox()
                const valNode = gtap.text(v.$parentElm);
                valNode.$x(v.$x() + box.width + 4);
                valNode.$y(v.$y());
                // valNode.$text("xxx");
                valNode.$style(`stroke: none; fill:#767A8F; font-size:0.7em; font-weight: 600;`);

                // console.log(textArray[index])
                sharedContext
                    .legendElements
                    .price[textArray[index]] = {
                    nameNode: nameNode,
                    valueNode: valNode,
                    title: textArray[index],
                };
            })
        ]),
    ]);
}

function loadCharts(symbol) {
    // console.log("[loadCharts] loading:", symbol)
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