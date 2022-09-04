import cu from "./chart-utils.js"

function renderChangePercentages(chartOptions, meanHighMeanLowData) {
    const yIncrement = 15;
    const weekNames = ["1 wk", "2 wk", "3 wk", "4 wk", "5 wk"];
    const weeklyPercentageChange = [...meanHighMeanLowData.data].reverse();
    const weeklyData = gtap.$data(weeklyPercentageChange);

    weeklyData.withVisibleItems(5);

    return gtap.$bars(weeklyData, [
        gtap.$x(chartOptions.chartXLegend + 40),
        gtap.$y(chartOptions.chartYLegend + 60),
        gtap.$yIncrement(yIncrement + 5),
        gtap.$maxWidth(50),
        gtap.$height(15),

        gtap.$lambda((v, index) => {
            const d = weeklyData.itemAtIndex(index)
            const h = 170 + d * 80;
            const l = 70 + (0.7 - d) * 50;

            v.$style(`stroke:none;fill:hsl(${h}, 100%, ${l}%);`);
        }),
        // Add text
        gtap.$lambda((v, index) => {
            const percentage = weeklyData.rawItemAtIndex(index) * 100;
            const percentageText = `${percentage.toFixed(0)}%`;

            const valLabel = gtap.text(v.$parentElm);
            valLabel.$x(v.$x() + v.$width() + 5);
            valLabel.$y(v.$y() + 11.125);
            valLabel.$text(percentageText);
            valLabel.$textAnchor('left');
            valLabel.$style(`stroke: none; fill:#333; font-size:0.6em;`);

            const wkLabel = gtap.text(v.$parentElm);
            wkLabel.$x(v.$x() - 25);
            wkLabel.$y(v.$y() + 11.125);
            wkLabel.$text(weekNames[index]);
            wkLabel.$textAnchor('right');
            wkLabel.$style(`fill:#999; font-size:0.6em;`);
        }),
    ]);
}


export function renderChangeData(chartOptions, sharedContext, stockChangeData) {
    const colors = ["#7EADB9", "#FFD797"];
    const textArray = ["MaxHigh_MinLow", "MeanHigh_MeanLow"];

    let weekData = stockChangeData.map(s => s.Week);
    let maxHighMinLowData = gtap.$data(stockChangeData.map(s => s.MaxHigh_MinLow));
    let meanHighMeanLowData = gtap.$data(stockChangeData.map(s => s.MeanHigh_MeanLow));

    let maxData = maxHighMinLowData.max();

    maxData = maxData > 1 ? maxData : 1;
    maxHighMinLowData.forcedMax(maxData);
    meanHighMeanLowData.forcedMax(maxData);

    const xIncrement = chartOptions.chartWidth / maxHighMinLowData.itemCount();
    const max_high = Math.ceil(maxHighMinLowData.max());

    const yTickCount = 10;
    const yTickSpace = (chartOptions.chartHeight) / yTickCount;
    const yIndexer = (index) => { return 100 * (index + 1) * yTickSpace * max_high / chartOptions.chartHeight };

    console.log("stockChangeData:", stockChangeData)
    let ctx = gtap.container("change-data", gtap.$id("change-chart"));
    gtap.renderVisuals(ctx, [
        cu.xAxis(chartOptions),
        cu.xAxisName(chartOptions),
        cu.yAxis(chartOptions, yTickCount, yTickSpace, yIndexer, "%"),
        cu.horizontalGridLines(chartOptions, yTickCount, yTickSpace),

        // Background highlight
        gtap.$bars(gtap.$dataWithIncrement(maxHighMinLowData.itemCount(), 1), [
            gtap.$width(xIncrement),
            gtap.$x((xIncrement) * .5),
            gtap.$xMargin(chartOptions.xMargin),
            gtap.$xIncrement(xIncrement),
            gtap.$height(chartOptions.chartHeight),
            gtap.$alignBottom(chartOptions.yMargin),
            gtap.$style(`stroke: none; fill:#767A8F00;`),
            gtap.$lambda((v, index) => {
                const node = gtap.vLine(v.$parentElm);
                node.$x(v.$x() + xIncrement * 0.5);
                node.$y(v.$y());
                node.$height(chartOptions.chartHeight)

                const fillstyle = (index % 2) ? 'transparent' : '#767A8F';
                const label = gtap.text(v.$parentElm);
                label.$x(v.$x() + xIncrement * 0.5);
                label.$y(v.$y() + chartOptions.chartHeight);
                label.$text(weekData[index]);
                label.$textAnchor('middle');
                label.$style(`stroke: none; fill:${fillstyle}; font-size:0.6em;`);

                sharedContext.changeCtx[index] = {
                    context: ctx,
                    priceData: stockChangeData,
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
            gtap.$xMargin(chartOptions.xMargin),
            gtap.$xIncrement(xIncrement),
            gtap.$maxY(-chartOptions.chartHeight + 15),
            gtap.$yMargin(chartOptions.yMargin),
        ], {
            curveLength: 2,
        }).withPostActions([
            gtap.$style(`stroke-linecap:round;fill: none;stroke:${colors[textArray.indexOf("MaxHigh_MinLow")]};stroke-width:1`),
        ]),

        // MeanHigh_MeanLow
        gtap.$lines(meanHighMeanLowData, [
            gtap.$x(xIncrement),
            gtap.$xMargin(chartOptions.xMargin),
            gtap.$xIncrement(xIncrement),
            gtap.$maxY(-chartOptions.chartHeight + 15),
            gtap.$yMargin(chartOptions.yMargin),
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
            gtap.$x(chartOptions.chartXLegend),
            gtap.$y(chartOptions.chartYLegend),
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
        ]),

        renderChangePercentages(chartOptions, meanHighMeanLowData),
    ]);
}