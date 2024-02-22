// Set margins and dimensions 
const margin = { top: 50, right: 50, bottom: 50, left: 200 };
const width = 900; //- margin.left - margin.right;
const height = 650; //- margin.top - margin.bottom;

const svg2 = d3.select("#vis-container")
                .append("svg")
                .attr("width", width - margin.left - margin.right)
                .attr("height", height - margin.top - margin.bottom)
                .attr("viewBox", [0, 0, width, height]); 

//container for barchart
const svg3 = d3.select("#vis-container")
                .append("svg")
                .attr("width", width - margin.left - margin.right)
                .attr("height", height - margin.top - margin.bottom)
                .attr("viewBox", [0, 0, width, height]); 

//container for scatter plot
const svg1 = d3.select("#vis-container")
                .append("svg")
                .attr("width", width - margin.left - margin.right)
                .attr("height", height - margin.top - margin.bottom)
                .attr("viewBox", [0, 0, width, height]); 
//tooltip for hovering

let tooltip = d3.select("#vis-container")
    .append("div")
    .style("opacity", 0)
    .attr("class", "tooltip")
    .style("background-color", "white")
    .style("border", "solid")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "10px");

//global variables
let x1;
let y1;
let x3;
let y3;
let maxY3;
let myBars;
let myCircles;
let column = "Macroeconomic Overall";
let continent = "North America";
let data;

//sets color scheme
const color = d3.scaleOrdinal()
                    .domain(["Macroeconomic Overall", "Recreational Overall","Residential Overall"])
                    .range([ "#21908dff",  "#8d68b3",  "#cf4851"]);



d3.csv("data/New_Cleaned_CityLife.csv").then((consdata) => {

//creates data
    data = consdata.filter(function(d) 
    { 
        if( d["UA_Continent"] == continent)
        { 
            return d;
        } 
    });

    let overallScore = data.map(function(d) { return d["Overall Rating"] });
    let cities = data.map(function(d) { return d["UA_Name"] });
    let input = data.map(function(d) { return d[column] });

    let cityCostOfLiving = [
    {city: cities, overall: overallScore, rating:input}];
  
    let scatterData = [];

    for (let i = 0; i < cities.length; i++) {
        scatterData.push({city : cities[i], overall:overallScore[i], rating:input[i]})
    }

let macro = data.map(function(d) { return d["Macroeconomic Overall"] });
let recreational = data.map(function(d) { return d["Recreational Overall"] });
let residential = data.map(function(d) { return d["Residential Overall"] });




    let avgRatings = [
    {attr : "Macroeconomic Overall", rating:(d3.mean(macro))},
    {attr : "Recreational Overall", rating:(d3.mean(recreational))},
    {attr : "Residential Overall", rating:(d3.mean(residential))}
    ];

/*
//world map
//reference:
//https://d3-graph-gallery.com/graph/choropleth_basic.html
//continent json file:
//https://gist.github.com/cmunns/76fb72646a68202e6bde#file-continents-json
*/
{

    // add title
    svg2.append("text")
        .attr("x", width/2)
        .attr("y", -margin.top/2)
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .style("font-weight", 700)
        .text("Overall Attribute Rating By Continent");

    // add title
    svg2.append("text")
        .attr("x", width/2)
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .text("Click a continent below");

    const projection = d3.geoNaturalEarth1()
        .scale(175)
        .center([0,0])
        .translate([width / 2, height / 2]);
    const path = d3.geoPath().projection(projection);

    // Data and color scale
    let mapData = new Map()
    const colorScale = d3.scaleLinear()
        .domain([4, 6])
        .range(["#deebf7","#3182bd"] );

    Promise.all([
    d3.json('data/continents.json'),
    d3.csv('data/dests.csv', function(d) {
        mapData.set(d.name, +d.overallRating);
    })
    ]).then(function(loadData){
        let topo = loadData[0]

        //add and color continents
        svg2.append("g")
            .selectAll("path")
            .data(topo.features)
            .join("path")
            .attr("d", path)
            .attr("fill", function (d) {
                d.total = mapData.get(d.properties.continent) || 0;
                return colorScale(d.total);
            })
            .style('cursor', 'pointer')
            .on("mousedown", updateBar)
            .on("click",updateScatter);

        //add labels to map
        // reference https://plnkr.co/edit/evfrVWyG0oJPAv60CMa5?p=preview&preview
        let continents = ['Asia', 'Africa', 'Europe', 'North America', 'Oceania', 'South America'];
        svg2.append("g")
            .attr("class", "continentLabels")
            .selectAll("text")
            .data(topo.features)
            .enter()
            .append("svg:text")
            .text(function(d, i){
                return continents[i];
            })
            .attr("x", function(d){
                return path.centroid(d)[0];
            })
            .attr("y", function(d){
                return  path.centroid(d)[1];
            })
            .attr("text-anchor","middle")
            .style('cursor', 'pointer')
            .on("mousedown", updateBar)
            .on("click",updateScatter);

        });

    // Legend
    //reference https://d3-legend.susielu.com/#color-linear
let g = svg2.append("g")
    
    .attr("class", "legendThreshold");

g.append("text")
    .attr("class", "caption")
    .attr("x", 0)
    .attr("y", -15)
    .style("font-size","12px")
    .style("font-weight", 700)
    .text("Overall Attribute Rating");
let labels = ['4.0', '4.5', '5.0', '5.5', '6.0'];
let legend = d3.legendColor()
    .labels(function (d) { return labels[d.i];})
    .shapePadding(0)
    .cells(5)
    .orient('vertical')
    .shapeWidth(30)
    .scale(colorScale);

    
svg2.select(".legendThreshold")
    .call(legend);
}

//bar chart

//average each attribute in category across continent - AvgRating
//plot bar chart: x-axis -> category for continent, y-axis -> AvgRating

{
    //add title
    svg3.append("text")
        .attr("class", "barTitle")
        .attr("x", width/2)
        .attr("y", 0)
        .attr("text-anchor", "middle")
        .style("font-size", "20px")
        .style("font-weight", 700)
        .text("Ratings for Chosen Continent: North America");

// Create X scale
    x3 = d3.scaleBand()
            .domain(d3.range(avgRatings.length))
            .range([margin.left, width - margin.right])
            .padding(0.1); 
    
    // Add x axis 
    svg3.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`) 
        .call(d3.axisBottom(x3)   
          .tickFormat(i => avgRatings[i].attr))
        .attr("font-size", '20px');



    maxY3 = 7;

    // Create Y scale
    y3 = d3.scaleLinear()
                .domain([0, maxY3])
                .range([height - margin.bottom, margin.top]); 

    // Add y axis 
    svg3.append("g")
        .attr("transform", `translate(${margin.left}, 0)`) 
        .call(d3.axisLeft(y3)) 
        .attr("font-size", '20px')
        .call((g) => g.append("text")
                    .attr("transform", "rotate(-90)")
                    .attr("y", 0-margin.left)
                    .attr("x", 0- (height/2)+20)
                    .attr("dy", "7em")
                    .attr('fill', 'black')
                    .style("text-anchor", "middle")
                    .text("Attribute Rating")
      ); 

       
        

    // Add points
    myBars = svg3.selectAll("bar")
                            .data(avgRatings)
                            .enter()
                              .append("rect")
                              .attr("x", (d,i) => x3(i))
                              .attr("y", (d) => y3(d.rating))
                              .attr("height", (d) => (height - margin.bottom) - y3(d.rating)) 
                              .attr("width", x3.bandwidth())
                              .style("fill", (d) => color(d.attr))
                              .on("click", updateScatter); 
  }

 

//scatter plot
{
    //add title
    svg1.append("text")
    .attr("class", "scatterTitle")
   .attr("x", width/2)
   .attr("y", 0)
   .attr("text-anchor", "middle")
   .style("font-size", "20px")
   .style("font-weight", 700)
   .text("Macroeconomic Overall Rating vs. Average Overall Rating by City for Chosen Continent");

    // Find max x 
    let maxX1 = d3.max(overallScore);

    // Create X scale
    x1 = d3.scaleLinear()
                .domain([0, 9])
                .range([margin.left, width-margin.right]); 
    
    // Add x axis 
    svg1.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`) 
        .call(d3.axisBottom(x1))   
        .attr("font-size", '20px')
        .call((g) => g.append("text")
                      .attr("x", width - margin.right)
                      .attr("y", margin.bottom - 4)
                      .attr("fill", "black")
                      .attr("text-anchor", "end")
                      .text("Average Overall Rating Across Cities")
      );

    // Finx max y 
    let maxY1 = 10;

    // Create Y scale
    y1 = d3.scaleLinear()
                .domain([0, maxY1])
                .range([height - margin.bottom, margin.top]); 
       

     //Create y axis
      svg1.append("g")
      .attr("transform", `translate(${margin.left}, 0)`) 
      .call(d3.axisLeft(y1)) 
      .attr("font-size", '20px')
      .call((g) => g.append("text")
                    .attr("class", "scatterYAxisTitle")
                    .attr("transform", "rotate(-90)")
                    .attr("y", 0-margin.left)
                    .attr("x", 0- (height/2)+20)
                    .attr("dy", "8em")
                    .attr('fill', 'black')
                    .style("text-anchor", "middle")
                    .text("Macroeconomic Overall Rating")
      ); 

  
  //Create x axis
    svg1.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`) 
        .call(d3.axisBottom(x1)) 
        .attr("font-size", '20px'); 


    // Add points to Scatterplot
    myCircles = svg1.selectAll("circle")
                            .data(scatterData)
                            .enter()
                            .append("circle")
                              .attr("cx", (d) => x1(d.overall))
                              .attr("cy", (d) => y1(d.rating))
                              .attr("r", 8)
                              .style("fill", (d) => color(column))
                              .style("opacity", 0.5)
                              .on("mouseover", mouseover )
                              .on("mousemove", mousemove )
                              .on("mouseleave", mouseleave ); 
}

/* functions -----------------------------------------------------------------------------------------------------
*/

function formatCont(cont) {
    if (cont == "northAmerica") {
            return "North America";
        } else if (cont == "southAmerica") {
            return "South America";
        } else if (cont == "asia") {
            return "Asia";
        } else if (cont == "africa") {
            return "Africa";
        } else if (cont == "europe") {
            return "Europe";
        } else {
            return "Oceania"
        }
}

//mouse over function for scatter plot
function mouseover(event, d) {
    d3.select(this).transition()
        .duration('100')
        .attr("r", 10);
        tooltip
        .style("opacity", 1);
  }

  //adds text to hover function scatter plot
  function mousemove(event, d) {
    tooltip
    .html("City: " + d.city + "<br/>" + column + ": "+ d.rating + "<br/>Overall Rating: " 
        + d.overall)
    .style("left", event.pageX + "px") // It is important to put the +90: other wise the tooltip is exactly where the point is an it creates a weird effect
    .style("top", event.pageY + "px")
  }

  //mouse leave function for scatter plot
  function mouseleave(event, d) {
    d3.select(this).transition()
        .attr("r", 8)
        .duration(100);
        tooltip.style("opacity", 0);
  }


//updates scatter plot
    function updateScatter(d,i) {
        let newColumn = i.attr;
        if (newColumn == null) {
            column ="Macroeconomic Overall";

        } else {
            column = newColumn;
        }
        updateData(d);
        svg1.selectAll(".scatterTitle")
            .text(column + " Rating vs. Average Overall Rating by City for Chosen Continent");
        svg1.selectAll(".scatterYAxisTitle")
            .text(column + " Rating");
        svg1.selectAll("circle").remove();
        myCircles = svg1.selectAll("circle")
            .data(scatterData)
            .enter()
            .append("circle")
            .attr("cx", (d) => x1(d.overall))
            .attr("cy", (d) => y1(d.rating))
            .attr("r", 8)
            .style("fill", (d) => color(column))
            .style("opacity", 0.5)
            .on("mouseover", mouseover )
            .on("mousemove", mousemove )
            .on("mouseleave", mouseleave ); 
                             
    }
//updates barchart
    function updateBar(event, d) {
        continent = formatCont(d.properties.continent)

        updateData(d);

        svg3.selectAll(".barTitle")
            .text("Ratings for Chosen Continent: " + continent);

        svg3.selectAll("rect").remove();
        myBars = svg3.selectAll("bar")
            .data(avgRatings)
            .enter()
            .append("rect")
            .attr("x", (d,i) => x3(i))
            .attr("y", (d) => y3(d.rating))
            .attr("height", (d) => (height - margin.bottom) - y3(d.rating)) 
            .attr("width", x3.bandwidth())
            .style("fill", (d) => color(d.attr))
            .on("click", updateScatter); 
        

    
                             
    }
//function that updates data
    function updateData(d) {
         data = consdata.filter(function(d) 
    { 
        if( d["UA_Continent"] == continent)
        { 
            return d;
        } 
    });

    overallScore = data.map(function(d) { return d["Overall Rating"] });
    cities = data.map(function(d) { return d["UA_Name"] });
    input = data.map(function(d) { return d[column] });

    cityCostOfLiving = [
    {city: cities, overall: overallScore, rating:input}];
    scatterData = [];

    for (let i = 0; i < cities.length; i++) {
        scatterData.push({city : cities[i], overall:overallScore[i], rating:input[i]})
    }
    macro = data.map(function(d) { return d["Macroeconomic Overall"] });
    recreational = data.map(function(d) { return d["Recreational Overall"] });
    residential = data.map(function(d) { return d["Residential Overall"] });


    avgRatings = [
    {attr : "Macroeconomic Overall", rating:(d3.mean(macro))},
    {attr : "Recreational Overall", rating:(d3.mean(recreational))},
    {attr : "Residential Overall", rating:(d3.mean(residential))}
    ];


    }



}); 
