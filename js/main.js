  /*Script by Emily Pettit, 2018*/
(function(){

  //pseudo-global variables
  var attrArray = ["Pop2017", "Income2016", "USFAclubs", "USFAmembers", "Tournaments2017", "RioOlympians", "LondonOlympians"]; //list of attributes
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

      var colorScale = makeColorScale(csvData); //create the choropleth color scale

      setEnumerationUnits(continentalUSA, map, path, colorScale); //add enumeration units to the map
    };
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
      .attr("d", path); //project data as geometry in svg
      .style("fill", function(d) { //color enumeration units
      	return choropleth(d.properties, colorScale);
      });
  };

  //create color scale generator
  function makeColorScale(data){
    var colorClasses = [
      "#f9f6f4",
      "#fce8de",
      "#fcceb5",
      "#ce9b80",
      "#916953"
    ];

    var colorScale = d3.scaleQuantile() //create color scale generator
      .range(colorClasses);

    var domainArray = []; //build array of all values of the expressed attribute
      for(var i=0; i<data.length; i++){
        var val = parseFloat(data[i][expressed]);
        domainArray.push(val);
    };

    colorScale.domain(domainArray); //assign array of expressed values as scale domain

    return colorScale;
  };

  //function to test for data value and return color in choropleth
  function choropleth(props, colorScale){
    var val = parseFloat(props[expressed]); //make sure attribute value is a number

    if (typeof val == "number" && !isNaN(val)){ //if attribute value exists, assign a color; otherwise assign gray
      return colorScale(val);
    } else {
      return "#ccc";
    };
  };
})();
