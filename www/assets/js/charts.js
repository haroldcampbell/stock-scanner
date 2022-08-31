import utils from "./utils.js"
import cu from "./chart-utils.js"
import { renderChangeData } from "./chart-pct-change.js"
import { renderWeekData } from "./chart-week-data.js"

const chartWidth = 325;
const chartHeight = 250;

const xMargin = 45;
const yMargin = chartHeight + 50;

const chartYLegend = 100;
const chartXLegend = chartWidth + xMargin + 25;

const chartOptions = cu.createChartOptions(chartWidth, chartHeight, xMargin, yMargin, chartXLegend, chartYLegend);

const sharedContext = {
    legendElements: {
        price: {},
        change: {},
    },
    priceCtx: {},
    changeCtx: {},
};

function renderPriceData(stockPriceData) {
    const textArray = ["Max_High", "Min_Low", "Mean_High", "Mean_Intra_Day", "Mean_Low", "Week"];
    const colors = ["#ED9FA2", "Green", "transparent", "transparent", "transparent", "transparent"];

    let [minLowData, minValue] = cu.zeroedList(stockPriceData.map(s => s.Min_Low));
    let [maxHighData] = cu.zeroedList(stockPriceData.map(s => s.Max_High), minValue);

    let weekData = stockPriceData.map(s => s.Week);

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
                    priceData: stockPriceData,
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
            console.log("[loadCharts] stockData:", data)
            elm.innerHTML =
                `<div class="stock-info"><h1>${symbol}</h1> stock</div>`
                + '<div id="week-chart" class="week-chart" ></div>'
                + '<div id="change-chart" class="change-chart" ></div>'
                + '<div id="line-chart" class="line-chart"></div>';

            renderWeekData(chartOptions, data);
            renderPriceData(data.Price);
            renderChangeData(chartOptions, sharedContext, data.Change);
        })
        .catch(err => {
            console.log("[loadCharts] err:", err)
        })
}

export default {
    loadCharts,
}