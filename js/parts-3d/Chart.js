(function (H) {
	var Chart = H.Chart,
		each = H.each,
		pick = H.pick,
		wrap = H.wrap;

/*** 
	EXTENSION FOR 3D CHARTS
***/
// Shorthand to check the is3d flag
Chart.prototype.is3d = function () {
	return this.options.chart.options3d && this.options.chart.options3d.enabled; // #4280
};

wrap(Chart.prototype, 'isInsidePlot', function (proceed) {
	if (this.is3d()) {
		return true;
	} else {
		return proceed.apply(this, [].slice.call(arguments, 1));
	}
});

var defaultChartOptions = H.getOptions();
defaultChartOptions.chart.options3d = {
	enabled: false,
	alpha: 0,
	beta: 0,
	depth: 100,
	viewDistance: 25,
	frame: {
		bottom: { size: 1, color: 'rgba(255,255,255,0)' },
		side: { size: 1, color: 'rgba(255,255,255,0)' },
		back: { size: 1, color: 'rgba(255,255,255,0)' }
	}
};

wrap(Chart.prototype, 'init', function (proceed) {
	var args = [].slice.call(arguments, 1),
		plotOptions,
		pieOptions;

	if (args[0].chart.options3d && args[0].chart.options3d.enabled) {
		// Normalize alpha and beta to (-360, 360) range
		args[0].chart.options3d.alpha = (args[0].chart.options3d.alpha || 0) % 360;
		args[0].chart.options3d.beta = (args[0].chart.options3d.beta || 0) % 360;

		plotOptions = args[0].plotOptions || {};
		pieOptions = plotOptions.pie || {};

		pieOptions.borderColor = pick(pieOptions.borderColor, undefined); 
	}
	proceed.apply(this, args);
});

wrap(Chart.prototype, 'setChartSize', function (proceed) {
	proceed.apply(this, [].slice.call(arguments, 1));

	if (this.is3d()) {
		var inverted = this.inverted,
			clipBox = this.clipBox,
			margin = this.margin,
			x = inverted ? 'y' : 'x',
			y = inverted ? 'x' : 'y',
			w = inverted ? 'height' : 'width',
			h = inverted ? 'width' : 'height';

		clipBox[x] = -(margin[3] || 0);
		clipBox[y] = -(margin[0] || 0);
		clipBox[w] = this.chartWidth + (margin[3] || 0) + (margin[1] || 0);
		clipBox[h] = this.chartHeight + (margin[0] || 0) + (margin[2] || 0);
	}
});

wrap(Chart.prototype, 'redraw', function (proceed) {
	if (this.is3d()) {
		// Set to force a redraw of all elements
		this.isDirtyBox = true;
	}
	proceed.apply(this, [].slice.call(arguments, 1));	
});

// Draw the series in the reverse order (#3803, #3917)
wrap(Chart.prototype, 'renderSeries', function (proceed) {
	var series,
		i = this.series.length;
	
	if (this.is3d()) {
		while (i--) {		
			series = this.series[i];
			series.translate();
			series.render();	
		}
	} else {
		proceed.call(this);
	}
});

Chart.prototype.retrieveStacks = function (stacking) {
	var series = this.series,
		stacks = {},
		stackNumber,
		i = 1;

	each(this.series, function (s) {
		stackNumber = stacking ? (s.options.stack || 0) : series.length - 1 - s.index; // #3841
		if (!stacks[stackNumber]) {
			stacks[stackNumber] = { series: [s], position: i};
			i++;
		} else {
			stacks[stackNumber].series.push(s);
		}
	});

	stacks.totalStacks = i + 1;
	return stacks;
};

	return H;
}(Highcharts));
