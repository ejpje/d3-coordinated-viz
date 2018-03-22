/*Script by Emily Pettit, 2018*/

window.onload = setMap(); //begin script when window loads

function setMap(){ //set up choropleth map
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
    var continentalUSA = topojson.feature(usa, usa.objects.USAstates).features; //convert topojson to geojson

    var attrArray = ["State", "FID", "2016medHouseInc", "USFAclubs", "USFAmembers", "2017tournaments", "RioOlympians", "LondonOlympians"]; //variables for data join

    for (var i=0; i<csvData.length; i++){ //loop through csv to assign each set of csv attribute values to geojson state
      var csvState = csvData[i]; //the current state
      var csvKey = csvState.FID; //the csv primary key
      console.log(csvKey);
      for (var a=0; a<continentalUSA.length; a++){ //loop through geojson states to find correct state

        var geojsonProps = continentalUSA[a].properties; //the current state geojson properties
        var geojsonKey = geojsonProps.FID; //the geojson primary key

        if (geojsonKey == csvKey){ //where primary keys match, transfer csv data to geojson properties object

          attrArray.forEach(function(attr){ //assign all attributes and values
            var val = parseFloat(csvState[attr]); //get csv attribute value
            geojsonProps[attr] = val; //assign attribute and value to geojson properties
          });
        };
      };
    };

    var states = map.selectAll(".states") //add states to the map
      .data(continentalUSA)
      .enter()
      .append("path")
      .attr("class", function(d){
        return "states " + d.properties.State;
      })
      .attr("d", path);

      console.log(csvData);
      console.log(continentalUSA);
    };
};
