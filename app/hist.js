$(document).ready(function() {

  //PREP:
  var margin = {top: 20, right: 100, bottom: 30, left: 50},
    w = 960 - margin.left - margin.right,
    h = 500 - margin.top - margin.bottom;

  var xScale = d3.scaleLinear()
               .range([0, w]);

  var yScale = d3.scaleLinear()
                .range([h, 0]);
  //Make the svg:
  var svg = d3.select("#myGraph")
        .append("svg")
        .attr("height", h + margin.bottom + margin.top)
        .attr("width", w + margin.left  + margin.right)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  d3.csv("data/ths.csv", function(data) {
    measurename = "HAI_1_SIR";
    measurescore = "Measure.Score." + measurename;
    drawHist(data, measurename, 'Cleaned.Score.UW');

    d3.select("#z-box")
      .on('click', function() {
        if (!d3.select('#z-box').property('checked')) {
          drawHist(data, measurename, "Cleaned.Score");
        } else {
          drawHist(data, measurename, measurescore);
        }
      });

      d3.select("#win-box")
        .on("click", function() {
            if (d3.select("#win-box").property("checked")) {
              drawHist(data, measurename, "Cleaned.Score");
            } else {
              drawHist(data, measurename, "Cleaned.Score.UW");
            }
        });
  });


  function drawHist(data, measurename, scorename) {
    d = _.filter(data, function(x) { return x["Measure.ID"] === measurename});
    mean_d = d[0];
    xScale.domain(d3.extent(d, function(x) {
                                        return Number(x[scorename])}));
    scores = _.map(d, function(x) { return Number(x[scorename])});

    var bins = d3.histogram()
                .domain(xScale.domain())
                .thresholds(xScale.ticks(20));

    bins = bins(scores);
    bins = _.each(bins, function(b,i) { b.id = i});

    yScale.domain([0, d3.max(bins, function(b) { return b.length;})]);

    oneSDAbove = Number(mean_d["Cleaned.Score.mean"]) + Number(mean_d["Cleaned.Score.sd"])
    oneSDBelow = Number(mean_d["Cleaned.Score.mean"]) - Number(mean_d["Cleaned.Score.sd"])

    var barsCont = svg.selectAll("g.bar")
                      .data(bins, function(b) { return b.id});

    var barWidth = w/bins.length - 1;
    var priorVal = -1;
    var barsEnter = barsCont.enter().append("g")
                          .attr("class", function(x) {
                            cl = xScale(x.x0) > xScale(oneSDBelow) & xScale(x.x0) < xScale(oneSDAbove) ? "bar sd-bar" : "bar";
                            return cl;
                          })
                          .attr("transform", function(x) {
                                    var xVal = xScale(x.x0);
                                    if (priorVal != -1) {
                                      xVal = xVal - priorVal > barWidth ? xVal : xVal + barWidth + 1;
                                    }
                                    priorVal = xVal;
                                    return "translate(" + xVal + "," + yScale(x.length) + ")" });
    priorVal = -1;
    barsCont.attr("transform", function(x) {
                        var xVal = xScale(x.x0);
                        if (priorVal != -1) {
                          xVal = xVal - priorVal > barWidth ? xVal : xVal + barWidth + 1;
                        }
                        priorVal = xVal;
                        return "translate(" + xVal + "," + yScale(x.length) + ")"
                        });

    barsCont.select("rect")
            .transition()
            .duration(500)
            .attr("width", barWidth)
            .attr("height", function(x) {
                   return h - yScale(x.length);
             });

    barsEnter.append("rect")
            .attr("x", 1)
            .attr("width", w/bins.length - 1)
            .attr("height", function(x) {
                   return h - yScale(x.length);
             })
             .attr("fill", "steelblue");

   barsCont.exit().remove();

   svg.selectAll(".axis").remove();

   svg.append("g")
      .attr("class", "axis y-axis")
      .call(d3.axisLeft(yScale));

    svg.append("g")
       .attr("class", "axis x-axis")
       .attr("transform", "translate(0," + h + ")")
       .call(d3.axisBottom(xScale));

      d3.select("#mean-box")
        .on("click", function() {
          if (d3.select("#mean-box").property("checked")) {
              writeLine("Cleaned.Score.mean", "mean-line");
            } else {
              svg.select(".mean-line").remove();
            }
        });

        d3.select("#sd-box")
          .on("click", function() {
              fillColor = d3.select("#sd-box").property("checked") ? "orange" : "steelblue";
              numBars = (svg.selectAll(".sd-bar rect")._groups[0].length/2) -0.5;
              svg.selectAll(".sd-bar rect")
                 .transition()
                 .delay(function(d, i) {
                   return Math.abs(i - numBars) * 50;
                 })
                 .style("opacity", 1)
                 .attr("fill", fillColor);
        });

      d3.select("#w-box")
        .on("click", function() {
          if (d3.select("#w-box").property("checked")) {
            writeLine("Cleaned.Score.UW.5%", "winsor-line");
            writeLine("Cleaned.Score.UW.95%", "winsor-line");
          } else {
            svg.selectAll("line").remove();
          }
        });

  }

  function writeLine(measurepoint, classpoint) {
    svg.append("line")
       .attr("class", classpoint)
       .attr("x1", xScale(Number(mean_d[measurepoint])))
       .attr("x2", xScale(Number(mean_d[measurepoint])))
       .attr("y1", yScale(yScale.domain()[1]))
       .attr("y2", yScale(yScale.domain()[0]))
       .attr("stroke", "black")
       .attr("stroke-width", 2);
  }

  function calcXValue(x, priorVal, barWidth) {
    var xVal = xScale(x.x0);
    if (priorVal != -1) {
      xVal = xVal - priorVal > barWidth ? xVal : xVal + barWidth + 1;
    }
    priorVal = xVal;
    return "translate(" + xVal + "," + yScale(x.length) + ")"
  }



});
