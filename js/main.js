  /*Script by Emily Pettit, 2018*/
(function(){

  //pseudo-global variables
  var attrArray = ["State Population in 2017", "Number of USFA Sanctioned Clubs", "USFA Clubs Per Capita", "Number of Active USFA Members", "USFA Members Per Capita", "Number of 2017 Tournaments", "Rio 2016 Olympians", "London 2012 Olympians"]; //list of attributes
  var expressed = attrArray[2]; //initial attribute

  window.onload = setMap(); //begin script when window loads

  //set up choropleth map
  function setMap(){
    var width = window.innerWidth * 0.95, //set map frame dimensions
        height = 700;

    var map = d3.select("body") //create new svg container for the map
      .append("svg")
      .attr("class", "map")
      .attr("width", width)
      .attr("height", height);

    var projection = d3.geoAlbers() //set projection
      .center([-15, 41.78])
      .rotate([96.90, -5.45, 0])
      .parallels([45.00, 45.5])
      .scale(600)
      .translate([width / 2, height / 2]);

    var path = d3.geoPath() //create path generator to draw the geographies
      .projection(projection);

    d3.queue() //queue to parallelize asynchronous data loading
      .defer(d3.csv, "data/d3data.csv") //load attributes from csv
      .defer(d3.json, "data/USAstates.topojson") //load background spatial data
      .await(callback);

    function callback(error, csvData, usa){

      //translate topojson to geojson
      var continentalUSA = topojson.feature(usa, usa.objects.USAstates).features;

      continentalUSA = joinData(continentalUSA, csvData); //join csv data to geojson enumeration units

      var colorScale = makeColorScale(csvData); //create the color scale

      setEnumerationUnits(continentalUSA, map, path, colorScale); //add enumeration units to the map

      setChart(csvData, colorScale); //add coordinated visualization to the map

      createDropdown(csvData); //create dropdown menu
    };
  };

  //function to create color scale generator
  function makeColorScale(data){
      var colorClasses = [
          "#FFE3CC",
          "#FDBE85",
          "#FD8D3C",
          "#E6550D",
          "#A63603"
      ];

    //create color scale generator
    var colorScale = d3.scaleThreshold()
        .range(colorClasses);

    //build array of all values of the expressed attribute
    var domainArray = [];
    for (var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };

    //cluster data using ckmeans clustering algorithm to create natural breaks
    var clusters = ss.ckmeans(domainArray, 5);
    //reset domain array to cluster minimums
    domainArray = clusters.map(function(d){
        return d3.min(d);
    });
    //remove first value from domain array to create class breakpoints
    domainArray.shift();

    //assign array of last 4 cluster minimums as domain
    colorScale.domain(domainArray);

    return colorScale;
  };

  function joinData(continentalUSA, csvData){
    //loop through csv to assign each set of csv attribute values to geojson state
    for (var i=0; i<csvData.length; i++){
      var csvState = csvData[i]; //the current state
      var csvKey = csvState.STATE; //the csv primary key

      //loop through geojson states to find correct state
      for (var a=0; a<continentalUSA.length; a++){
        var geojsonProps = continentalUSA[a].properties; //the current state geojson properties
        var geojsonKey = geojsonProps.STATE; //the geojson primary key

        //where primary keys match, transfer csv data to geojson properties object
        if (geojsonKey == csvKey){

          //assign all attributes and values
          attrArray.forEach(function(attr){
            var val = parseFloat(csvState[attr]); //get csv attribute value
            geojsonProps[attr] = val; //assign attribute and value to geojson properties
          });
        };
      };
    };
    return continentalUSA;
  };

  //add states to the map
  function setEnumerationUnits(continentalUSA, map, path, colorScale){
    var states = map.selectAll(".state") //add states to map
      .data(continentalUSA)
      .enter() //create elements
      .append("path") //append elements to svg
      .attr("class", function(d){
        return "states " + d.properties.State;
      })
      .attr("d", path) //project data as geometry in svg
      .style("fill", function(d){
          return colorScale(d.properties[expressed]);
      });
  };

  //function to test for data value and return color
  function choropleth(props, colorScale){
      //make sure attribute value is a number
      var val = parseFloat(props[expressed]);
      //if attribute value exists, assign a color; otherwise assign gray
      if (typeof val == 'number' && !isNaN(val)){
          return colorScale(val);
      } else {
          return "#CCC";
      };
  };

  function setChart(csvData, colorScale){
    //chart frame dimensions
    var chartWidth = window.innerWidth * 0.425,
        chartHeight = 300,
        leftPadding = 25,
        rightPadding = 2,
        topBottomPadding = 5,
        chartInnerWidth = chartWidth - leftPadding - rightPadding,
        chartInnerHeight = chartHeight - topBottomPadding * 2,
        translate = "translate(" + leftPadding + "," + topBottomPadding + ")";

    var chart = d3.select("body") //create a second svg element for the bar chart
      .append("svg")
      .attr("width", chartWidth)
      .attr("height", chartHeight)
      .attr("class", "chart");

    var chartBackground = chart.append("rect") //create a rectangle for chart background fill
      .attr("class", "chartBackground")
      .attr("width", chartInnerWidth)
      .attr("height", chartInnerHeight)
      .attr("transform", translate);

    var yScale = d3.scaleLinear() //create a scale to size bars proportionally to frame and for axis
      .range([290, 0])
      .domain([0, 100]);

    var bars = chart.selectAll(".bars") //set bars for each state
      .data(csvData)
      .enter()
      .append("rect")
      .sort(function(a, b){
          return b[expressed]-a[expressed]
      })
      .attr("class", function(d){
          return "bars " + d.STATE;
      })
      .attr("width", chartInnerWidth / csvData.length - 1)
      .attr("x", function(d, i){
          return i * (chartInnerWidth / csvData.length) + leftPadding;
      })
      .attr("height", function(d, i){
          return 290 - yScale(parseFloat(d[expressed]));
      })
      .attr("y", function(d, i){
          return yScale(parseFloat(d[expressed])) + topBottomPadding;
      })
      .style("fill", function(d){
          return choropleth(d, colorScale);
      });

    var chartTitle = chart.append("text") //create a text element for the chart title
      .attr("x", 60)
      .attr("y", 30)
      .attr("class", "chartTitle")
      .text(expressed); //if this stops working, add back in attrArray[0] instead of just [expressed]

    var yAxis = d3.axisLeft() //create vertical axis generator
      .scale(yScale);

    var axis = chart.append("g") //place axis
      .attr("class", "axis")
      .attr("transform", translate)
      .call(yAxis);

    var chartFrame = chart.append("rect") //create frame for chart border
      .attr("class", "chartFrame")
      .attr("width", chartInnerWidth)
      .attr("height", chartInnerHeight)
      .attr("transform", translate);
  };

  //function to create a dropdown menu for attribute selection
  function createDropdown(csvData){

    var dropdown = d3.select("body") //add select element
      .append("select")
      .attr("class", "dropdown")
      .on("change", function(){
          changeAttribute(this.value, csvData)
      });

    var titleOption = dropdown.append("option") //add initial dropdown option
      .attr("class", "titleOption")
      .attr("disabled", "true")
      .text("Select Attribute");

    var attrOptions = dropdown.selectAll("attrOptions") //add attribute name options
      .data(attrArray)
      .enter()
      .append("option")
      .attr("value", function(d){ return d })
      .text(function(d){ return d });
  };

  //dropdown change listener handler
  function changeAttribute(attribute, csvData){
      expressed = attribute; //change the expressed attribute

      var colorScale = makeColorScale(csvData); //recreate the color scale

      var states = d3.selectAll(".states") //recolor enumeration units
          .style("fill", function(d){
              return choropleth(d.properties, colorScale)
          });

      var bars = d3.selectAll(".bar") //re-sort, resize, and recolor bars in bar chart
        //re-sort bars
        .sort(function(a, b){
            return b[expressed] - a[expressed];
        })
        .attr("x", function(d, i){
            return i * (chartInnerWidth / csvData.length) + leftPadding;
        })
        //resize bars
        .attr("height", function(d, i){
            return 290 - yScale(parseFloat(d[expressed]));
        })
        .attr("y", function(d, i){
            return yScale(parseFloat(d[expressed])) + topBottomPadding;
        })
        //recolor bars
        .style("fill", function(d){
            return choropleth(d, colorScale);
        });
  };

  function changeChart(attribute, csvData){

  }
})();
