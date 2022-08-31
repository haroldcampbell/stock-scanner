function createChartOptions(chartWidth, chartHeight, xMargin, yMargin, chartXLegend, chartYLegend) {
    return {
        chartWidth,
        chartHeight,
        xMargin,
        yMargin,
        chartXLegend,
        chartYLegend
    }
}
function xAxis(chartOptions) {
    return gtap.$hLine([
        gtap.$xMargin(chartOptions.xMargin),
        gtap.$width(chartOptions.chartWidth),
        gtap.$y(chartOptions.yMargin),
    ])
}

function xAxisName(chartOptions) {
    return gtap.$label("Weeks", [
        gtap.$xMargin(chartOptions.chartWidth + chartOptions.xMargin - 17),
        gtap.$y(chartOptions.yMargin + 28),
        gtap.$style(`stroke: none; fill:#767A8F; font-size:0.5em;`),
    ])
}

function yAxis(chartOptions, yTickCount, yTickSpace, yIndexer, axisName) {
    return gtap.$vLine([
        gtap.$xMargin(chartOptions.xMargin),
        gtap.$height(chartOptions.chartHeight),
        gtap.$alignBottom(chartOptions.yMargin),
        gtap.$tickMarkText(yTickCount, yTickSpace, index => `${yIndexer(index)}`, tick => {
            tick.label.$style(`stroke: none; fill:#767A8F; font-size:0.6em;`);
            tick.label.$textAnchor('end');
            tick.alignWithAngle(270);

            if (tick.tickIndex == (yTickCount - 1)) {
                tick.label.$text(`${axisName}${tick.label.$text()}`);
            }
        }, { xMargin: -5, yMargin: chartOptions.chartHeight + 4 })
    ])
}

function horizontalGridLines(chartOptions, yTickCount, yTickSpace) {
    return gtap.$bars(gtap.$dataWithIncrement(yTickCount, yTickSpace), [
        gtap.$xMargin(chartOptions.xMargin + 1),
        gtap.$width(chartOptions.chartWidth - 2),
        gtap.$css("none"),
        gtap.$maxY(-chartOptions.chartHeight),
        gtap.$yMargin(chartOptions.yMargin),
        gtap.$height(1),
        gtap.$lambda((v, index) => {
            const fillColor = (index % 2 == 0) ? "#f0f0f0" : "#f7f7f7";
            v.$style(`fill: ${fillColor}; stroke:1;`);
        })
    ])
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

function setLegend(sharedContext, name, value, decimal = 2) {
    let item = sharedContext
        .legendElements
        .price[name];

    if (value != null || value != undefined) {
        item.valueNode.$text(`${value.toFixed(decimal)}`);
    } else {
        item.valueNode.$text("");
    }
};

function onShowChartDetails(e, dataIndex, context) {
    gtap.$stopMouseDefaults(e);

    const priceCtx = context.priceCtx[dataIndex];
    const changeCtx = context.changeCtx[dataIndex];
    const dataPoint = priceCtx.priceData[dataIndex];

    // Show price
    setLegend(context, "Max_High", dataPoint.Max_High);
    setLegend(context, "Mean_High", dataPoint.Mean_High);
    setLegend(context, "Mean_Intra_Day", dataPoint.Mean_Intra_Day);
    setLegend(context, "Mean_Low", dataPoint.Mean_Low);
    setLegend(context, "Min_Low", dataPoint.Min_Low);
    setLegend(context, "Week", dataPoint.Week, 0);

    const start = formatDate(dataPoint.Week_Start.$date);
    const end = formatDate(dataPoint.Week_End.$date);
    const labelText = `${start} - ${end}`;

    Object.entries(context.priceCtx).forEach((index, _) => {
        index = parseInt(index)

        const style = `stroke: none; fill:transparent; font-size:0.6em;`
        context.priceCtx[index].labelNode.$style(style);
        context.changeCtx[index].labelNode.$style(style);
    });

    priceCtx.labelNode.$text(labelText);
    priceCtx.labelNode.$style(`stroke: none; fill:#767A8F; font-size:0.6em;`);
    priceCtx.lineNode.$style(`stroke: #777; fill:none;stroke-width:0.5`);
    priceCtx.visualBGNode.$style(`stroke: none; fill:#f0f0f0;`);

    changeCtx.labelNode.$text(labelText);
    changeCtx.labelNode.$style(`stroke: none; fill:#767A8F; font-size:0.6em;`);
    changeCtx.lineNode.$style(`stroke: #777; fill:none;stroke-width:0.5`);
    changeCtx.visualBGNode.$style(`stroke: none; fill:#f0f0f0;`);
}

function onHideChartDetails(e, dataIndex, context) {
    gtap.$stopMouseDefaults(e);

    // Hide price details
    setLegend(context, "Max_High");
    setLegend(context, "Mean_High");
    setLegend(context, "Mean_Intra_Day");
    setLegend(context, "Mean_Low");
    setLegend(context, "Min_Low");
    setLegend(context, "Week");

    const priceCtx = context.priceCtx[dataIndex];
    const changeCtx = context.changeCtx[dataIndex];
    const dataPoint = priceCtx.priceData[dataIndex];
    const labelText = dataPoint.Week;

    Object.entries(context.priceCtx).forEach(index => {
        index = parseInt(index);

        const fillstyle = (index % 2) ? 'transparent' : '#767A8F';
        const style = `stroke: none; fill:${fillstyle}; font-size:0.6em;`;

        context.priceCtx[index].labelNode.$style(style);
        context.changeCtx[index].labelNode.$style(style);
    });

    priceCtx.labelNode.$text(labelText);
    priceCtx.lineNode.$style(`stroke: transparent; fill:none;stroke-width:0.5`);
    priceCtx.visualBGNode.$style(`stroke: none; fill:#767A8F00;`);

    changeCtx.labelNode.$text(labelText);
    changeCtx.lineNode.$style(`stroke: transparent; fill:none;stroke-width:0.5`);
    changeCtx.visualBGNode.$style(`stroke: none; fill:#767A8F00;`);
}

export default {
    createChartOptions,
    xAxis,
    xAxisName,
    yAxis,
    horizontalGridLines,
    zeroedList,
    formatDate,
    // chartLegend,
    setLegend,
    onShowChartDetails,
    onHideChartDetails
}