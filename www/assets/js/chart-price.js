import cu from "./chart-utils.js"

export function renderPriceData(chartOptions, sharedContext, stockPriceData) {
    const textArray = ["Max_High", "Min_Low", "Mean_High", "Mean_Intra_Day", "Mean_Low", "Week"];
    const colors = ["#ED9FA2", "Green", "transparent", "transparent", "transparent", "transparent"];

    let weekData = stockPriceData.map(s => s.Week);

    let [minLowData, minValue] = cu.zeroedList(stockPriceData.map(s => s.Min_Low));
    let [maxHighData] = cu.zeroedList(stockPriceData.map(s => s.Max_High), minValue);

    minLowData.forcedMax(maxHighData.max());


    const maxHigh = maxHighData.max();
    const xIncrement = chartOptions.chartWidth / maxHighData.itemCount();

    const yTickCount = 10;
    const yTickSpace = chartOptions.chartHeight / yTickCount;

    const yIndexer = (index) => {
        const val = minValue + maxHigh / (yTickCount - 2) * (index);
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
            gtap.$xMargin(chartOptions.xMargin),
            gtap.$xIncrement(xIncrement),
            gtap.$height(chartOptions.chartHeight),
            gtap.$alignBottom(chartOptions.yMargin - 0.5),
            gtap.$style(`stroke: none; fill:#767A8F00;`),
            gtap.$lambda((v, index) => {
                const node = gtap.vLine(v.$parentElm);
                node.$x(v.$x() + xIncrement * 0.5);
                node.$y(v.$y());
                node.$height(chartOptions.chartHeight)

                const fillstyle = (index % 2) ? 'transparent' : '#767A8F';
                const label = gtap.text(v.$parentElm);
                label.$x(v.$x() + xIncrement * 0.5);
                label.$y(v.$y() + chartOptions.chartHeight + 15);
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
            gtap.$xMargin(chartOptions.xMargin),
            gtap.$xIncrement(xIncrement),
            gtap.$lambda((v, index, d) => {
                const yOffset = chartOptions.chartHeight * .2
                v.$y((1 - v.getDataValue()) * chartOptions.chartHeight * .8 + 50 + yOffset / 2.0);
            }),
        ], {
            curveLength: 3,
        }).withPostActions([
            gtap.$style(`stroke-linecap:round;fill:none;stroke:${colors[textArray.indexOf("Max_High")]};stroke-width:1`),
        ]),

        // Min_Low
        gtap.$polygon(minLowData, [
            gtap.$x(xIncrement),
            gtap.$xMargin(chartOptions.xMargin),
            gtap.$xIncrement(xIncrement),
            gtap.$lambda((v, index, d) => {
                const yOffset = chartOptions.chartHeight * .2
                v.$y((1 - v.getDataValue()) * chartOptions.chartHeight * .8 + 50 + yOffset / 2.0);
            })
        ], {
            curveLength: 3,
        }).withPostActions([
            gtap.$style(`stroke-linecap:round;fill:none;stroke:${colors[textArray.indexOf("Min_Low")]};stroke-width:1`),
        ]),

        // Legend
        gtap.$wrappedShape(gtap.pointNode, gtap.$dataWithIncrement(textArray.length, 1), [
            gtap.$x(chartOptions.chartXLegend),
            gtap.$y(chartOptions.chartYLegend),
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
                valNode.$style(`stroke: none; fill:#767A8F; font-size:0.7em; font-weight: 600;`);

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