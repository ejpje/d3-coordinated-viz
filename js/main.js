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

  var path = d3.geoPath() //reate path generator to draw the geographies
    .projection(projection);

  d3.queue() //queue to parallelize asynchronous data loading
    .defer(d3.csv, "data/d3data.csv") //load attributes from csv
    .defer(d3.json, "data/USA_adm1.topojson") //load background spatial data
    .await(callback);

  function callback(error, csvData, usa){
    var usaStates = topojson.feature(usa, usa.objects.USA_adm1).features; //convert topojson to geojson

    var states = map.selectAll(".states") //add states to the map
      .data(usaStates)
      .enter()
      .append("path")
      .attr("class", function(d){
        return "states " + d.properties.State;
      })
      .attr("d", path);
  };
};
