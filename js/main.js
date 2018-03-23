  /*Script by Emily Pettit, 2018*/
(function(){

  //pseudo-global variables
  var attrArray = ["Income2016", "Pop2017", "USFAclubs", "USFApercapita", "USFAmembers", "MembersPerCapita", "Tournaments2017", "RioOlympians", "LondonOlympians"]; //list of attributes
  var expressed = attrArray[0]; //initial attribute

  window.onload = setMap(); //begin script when window loads

  //set up choropleth map
  function setMap(){
    var width = 1000, //set map frame dimensions
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

      var states = map.append("path") //add states to map
        .datum(continentalUSA)
        .attr("class", "states")
        .attr("d", path);

      continentalUSA = joinData(continentalUSA, csvData); //join csv data to geojson enumeration units

      var colorScale = makeColorScale(csvData); //create the color scale

      setEnumerationUnits(continentalUSA, map, path, colorScale); //add enumeration units to the map
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
        return "#ccc";
    };
};
})();
