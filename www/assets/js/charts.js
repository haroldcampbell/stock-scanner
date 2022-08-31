import utils from "./utils.js"
import cu from "./chart-utils.js"
import { renderChangeData } from "./chart-pct-change.js"
import { renderPriceData } from "./chart-price.js"
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

function loadCharts(symbol) {
    // console.log("[loadCharts] loading:", symbol)
    const elm = document.getElementsByClassName("chart-outer-container").item(0);
    elm.innerHTML = "Loading..."
    utils.getPriceData(symbol)
        .then(data => {
            console.log("[loadCharts] stockData:", data)
            elm.innerHTML =
                `<div class="stock-info"><h1>${symbol}</h1> stock</div>`
                + '<div id="week-chart" class="week-chart"></div>'
                + '<div id="change-chart" class="change-chart" ></div>'
                + '<div id="line-chart" class="line-chart"></div>';

            renderWeekData(chartOptions, data);
            renderPriceData(chartOptions, sharedContext, data.Price);
            renderChangeData(chartOptions, sharedContext, data.Change);
        })
        .catch(err => {
            console.log("[loadCharts] err:", err)
        })
}

export default {
    loadCharts,
}