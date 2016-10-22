//mobile 66 - descktop 85
var weather;
var cloudCover;
var cloudIcon;
var temp;
var precip;
var precipType;
var humidity;
var pressure;
var wind;
var bfs;
var bfsIcon;
var windDir;
var conditions;
var conditionsURL = [];
var fmtConditionsURL = "";
var summary;
var geoLoc = false;
var latitude;
var longitude;
var city = "";
var state = ""
var country = ""
var locDesc = "Alcatraz, CA"
var forecastURL;
var units = "us";
var options = {
  enableHighAccuracy: true,
  timeout: 5000,
  maximumAge: 0
};
var fiveDayHigh = [];
var fiveDayLow = [];
var fiveDayIcon = [];
var fiveDayDate = [];
var sevenDaySummary="";
/* Note: the Beaufort scale is a measure of wind intensity */
var beaufortScale=
 [
   [0],
   [1,2,3],
   [4,5,6,7],
   [8,9,10,11,12],
   [13,14,15,16,17,18],
   [19,20,21,22,23,24],
   [25,26,27,28,29,30,31],
   [32,33,34,35,36,37,38],
   [39,40,41,42,43,44,45,46],
   [47,48,49,50,51,52,53,54],
   [55,56,57,58,59,60,61,62,63],
   [64,65,66,67,68,69,70,71,72]
 ];


$(document).ready(function(){
  /* Event handlers for the Fahrenheit/Celsius buttons */
  $("#f").on("click touchstart", handleFClick);
  $("#c").on("click touchstart", handleCClick);
});

$(window).bind("load", function(){
  refreshWeather();
});

/*HandleFahrenheitClick()*/
function handleFClick(event){
  if ($("#f").hasClass("highlight-on")){
    return;
  } else {
    $("#f").velocity({translateY: "2px", translateX: "1px"},{duration:100}).velocity("reverse");
    $("#f").toggleClass("highlight-on highlight-off");
    $("#c").toggleClass("highlight-on highlight-off");
    temp = Math.round(((temp * 1.8)+32),0);
    $("#currTemp").html(temp + "&deg;");
  }
}

/* handle Celsius click */
function handleCClick(event){
  if ($("#c").hasClass("highlight-on")){
    return;
  } else {
    $("#c").velocity({translateY: "2px", translateX: "1px"},{duration:100}).velocity("reverse");
    $("#f").toggleClass("highlight-on highlight-off");
    $("#c").toggleClass("highlight-on highlight-off");
    temp = Math.round(((temp-32)*(5/9)),0);
    $("#currTemp").html(temp + "&deg;");
  }
}

/* If location is known, call the Forecast.IO api
   Otherwise, call the GoogleMaps api
*/
function refreshWeather(){
  if (geoLoc){
    callFIO();
  } else {
    getLocation();
  }
}

/* Uses the browser function to get current position.
   May be inaccurate due to use of IP or wifi position if GPS is not available
*/
function getLocation() {

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(getPosition, handleGeoLocErr, {maximumAge:60000, timeout:5000, enableHighAccuracy:true});
    } else {
        geoLoc = false;
        locDesc = "Geolocation is not supported by this browser.  Showing weather data for Alcatraz.";
        forecastURL = "https://api.darksky.net/forecast/d988cd2afdb026c3385691413a1baf5a/37.8267,-122.423";
        callFIO();
    }
}

/* When the gelocation returns a position, parse the json to determine city/state/country*/
/* should work reasonably well for internation locations...
   Locality corresponds to city
   administrative_area_level_1 corresponds to state
   country.short name gets the country abbreviation

   Next we call the forecastIO API with these coordinates
*/
function getPosition(position) {
    latitude = position.coords.latitude;
    longitude = position.coords.longitude;
    $.ajax({ url:'https://maps.googleapis.com/maps/api/geocode/json?latlng='+latitude+','+longitude+'&sensor=true',
               success: function(data){
                 console.log(JSON.stringify(data));
                 for(var i in data.results[0].address_components){
                   for( var j in data.results[0].address_components[i].types){
                     console.log(data.results[0].address_components[i]);
                     if (data.results[0].address_components[i].types[j] == "locality"){
                       city = data.results[0].address_components[i].long_name;
                     }
                     if (data.results[0].address_components[i].types[j] == "administrative_area_level_1"){
                       state = data.results[0].address_components[i].long_name;
                     }
                     if (data.results[0].address_components[i].types[j] == "country"){
                       country = data.results[0].address_components[i].short_name;
                     }
                   }
                   }
                   geoLoc = true;
                   locDesc = city + ", " + state + " (" + country + ")";
                   $("#locDesc").html(locDesc);
                }
               });
    forecastURL = "https://api.darksky.net/forecast/d988cd2afdb026c3385691413a1baf5a/" + latitude + "," + longitude + "?units=auto";
    callFIO();
}


function callFIO(){

  $.ajax({
    url: forecastURL,
    dataType: "jsonp",
    jsonpCallback: "update"
  });
}

/* weather is the json object from forecast IO with ALL the details
   prepData() parses out the desired details
   updateDisplay() creates the html syntax to display it
*/
function update(response){
  weather = response;
  //console.log(JSON.stringify(weather));
  prepData();
  updateDisplay();
  }
/* Not much error handling...just update the console */

function handleErr(err){
}

/* if geolocation cannot return the position
   use coordinates for Alcatraz
*/
function handleGeoLocErr(err){
  geoLoc = false;
  locDesc = "Geolocation is not supported by this browser.  Showing weather data for Alcatraz.";
  $("#locDesc").html(locDesc);
  forecastURL = "https://api.darksky.net/forecast/d988cd2afdb026c3385691413a1baf5a/37.8267,-122.423";
  callFIO();
}

/* PrepData() extracts the elements that we want to display from the JSON object
   and does some basic formatting/error checking:
   - Sets temperatures, humidity, pressure and wind to whole numbers
   - Interprets the precipitation variable
   - finds the windspeed on the beaufort scale
   - if weather alerts exist, will parse the URLS
   - checks the local return units to set F/C default
   - calls utility function to parse the 5 day forecast
*/
function prepData(){

  temp = Math.round(weather.currently.temperature);
  summary = weather.currently.summary;
  cloudCover = Math.round(weather.currently.cloudCover*100);
  cloudIcon = weather.currently.icon;
  precip = weather.currently.precipIntensity;
  if (precip > 0){
    precipType = weather.currently.precipType;
  } else {
    precipType = "none";
  }
  humidity = Math.round( (weather.currently.humidity * 100));
  pressure = Math.round( weather.currently.pressure);
  wind = Math.round(weather.currently.windSpeed);
  setBeaufort(wind);

  // not currently used
  // could add wind direction icon
  windDir = weather.currently.windBearing;

  if( weather.hasOwnProperty("alerts")){
    conditions = weather.alerts.length;
    getConditionsURL();
  } else {
    conditions = 0;
  }

  // set default F/C values
  units = weather.flags.units;
  if (units !== "us"){
    $("#c").addClass("highlight-on");
    $("#f").addClass("highlight-off");
    $("#c").removeClass("highlight-off");
    $("#f").removeClass("highlight-on");
  }

  getFiveDayForecast();
}

/* Format the modules to display the weather data correctly */
function updateDisplay(){
  $("#currTemp").html(temp + "&deg;");
  $("#summary").html("Current conditions (" + timeConverter( weather.currently.time ) + "): " + summary);

  $("#cldIcon").html("<i class='wi wi-forecast-io-" + cloudIcon + " wi-fw'></i>");

  $("#cloudCover").html("The sky is " + (cloudCover) + "% Cloudy.");

  if (precipType !== "none"){
    $("#precipIcon").html("<i class='wi wi-umbrella wi-fw'></i>");
    $("#precipitation").html("There is " + precipType + " falling in your location.");
  } else {
    $("#precipitation").html("There is no precipitation at this time.");
    $("#precipIcon").html("<i class='wi wi-umbrella wi-fw'></i><i class='wi wi-na'></i>");
  }

  $("#humidity").html( "The humidity is " + humidity + "%.");

  $("#pressure").html( "The pressure is " + pressure + " millibars.");

  $("#bfs").html("<i class='wi " + bfsIcon + "'></i>");
  $("#wind").html("The wind speed is " + wind + "mph.");

  if (conditions > 0){
    $("#alerts").html("There are " + conditions + " alerts in your area. Click " + fmtConditionsURL + " to view the alerts.");
  } else {
    $("#alerts").html("There are no weather alerts in your area");
  }
  //display the weekly forecast //
  $("#sevenDaySummary").html( sevenDaySummary );
  for( var y=0; y<5; y++){
    $("#day"+(y+1)+"icon").html("<i class='wi wi-forecast-io-" + fiveDayIcon[y] + " wi-fw'></i>");
    $("#day"+(y+1)+"text").html("<b>" + fiveDayDate[y].format("ddd") + "<br>" + fiveDayDate[y].format( "mmm d") + "</b><br>" + Math.floor(fiveDayLow[y]) + " / " + Math.floor(fiveDayHigh[y]));
  }
}

// find the windspeed on the global beaufortScale array
// the array doesn't handle values greater than 73 or less than 1
// so those values are handled up front
// icon name is then set based on the scale value
function setBeaufort(w){

  if (w >= 73){
    bfs = 13;
  } else if (w==0){
    bfs= 0;
  } else {

   for(i=0;i<beaufortScale.length; i++){
     for(j=0;j<beaufortScale[i].length; j++){
       if (beaufortScale[i][j]==w){
         bfs=i;
       }
     }
   }
 }
  bfsIcon = "wi-wind-beaufort-" + bfs;
}

// If the weather object containes alerts, parse them out into a URL
// The app won't display the actual alerts, but will provide links.
function getConditionsURL(){
  for( i=0; i<weather.alerts.length; i++){
    conditionsURL[i] = weather.alerts[i].uri;
    if (i>0){
      fmtConditionsURL += " and ";
    }
    fmtConditionsURL += "<a href='" + conditionsURL[i] + "' target='_blank'>here</a>";
  }
}

// Get the forecast for each of the next 5 dates and load to the
// arrays.
function getFiveDayForecast(){
  sevenDaySummary = weather.daily.summary;
  for( x=0; x<5; x++){
    fiveDayLow[x] = weather.daily.data[x+1].temperatureMin;
    fiveDayHigh[x] = weather.daily.data[x+1].temperatureMax;
    fiveDayIcon[x] = weather.daily.data[x+1].icon;
    fiveDayDate[x] = new Date( weather.daily.data[x+1].time*1000);
  }
}

/* Convert time from unix time to user friendly time */
function timeConverter(UNIX_timestamp){
  var a = new Date(UNIX_timestamp * 1000);
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var year = a.getFullYear();
  var month = months[a.getMonth()];
  var date = a.getDate();
  var hour = a.getHours() < 10 ? '0' + a.getHours() : a.getHours();
  var min = a.getMinutes()< 10 ? '0' + a.getMinutes() : a.getMinutes();
  var sec = a.getSeconds()< 10 ? '0' + a.getSeconds() : a.getSeconds();
  var time = month + ' ' + date + ' ' + year + ' ' + hour + ':' + min;
  return time;
}
/* sample forecast.io json object
=================================
{ "latitude":37.8267
 ,"longitude":-122.423
 ,"timezone":"America/Los_Angeles"
 ,"offset":-7
 ,"currently":{"time":1470337577
              ,"summary":"Mostly Cloudy"
              ,"icon":"partly-cloudy-day"
              ,"nearestStormDistance":0
              ,"precipIntensity":0
              ,"precipProbability":0
              ,"temperature":57.82
              ,"apparentTemperature":57.82
              ,"dewPoint":51.37
              ,"humidity":0.79
              ,"windSpeed":9.49
              ,"windBearing":252
              ,"visibility":9.4
              ,"cloudCover":0.73
              ,"pressure":1014.56
              ,"ozone":298.21}
  ,"minutely":{"summary":"Mostly cloudy for the hour."
              ,"icon":"partly-cloudy-day"
              ,"data":[{"time":1470337560,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470337620,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470337680,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470337740,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470337800,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470337860,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470337920,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470337980,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470338040,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470338100,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470338160,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470338220,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470338280,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470338340,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470338400,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470338460,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470338520,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470338580,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470338640,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470338700,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470338760,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470338820,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470338880,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470338940,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470339000,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470339060,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470339120,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470339180,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470339240,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470339300,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470339360,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470339420,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470339480,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470339540,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470339600,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470339660,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470339720,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470339780,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470339840,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470339900,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470339960,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470340020,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470340080,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470340140,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470340200,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470340260,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470340320,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470340380,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470340440,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470340500,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470340560,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470340620,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470340680,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470340740,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470340800,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470340860,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470340920,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470340980,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470341040,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470341100,"precipIntensity":0,"precipProbability":0}
                      ,{"time":1470341160,"precipIntensity":0,"precipProbability":0}]}
  ,"hourly":{"summary":"Mostly cloudy throughout the day."
            ,"icon":"partly-cloudy-night"
            ,"data":[{"time":1470337200,"summary":"Mostly Cloudy","icon":"partly-cloudy-day","precipIntensity":0,"precipProbability":0,"temperature":57.48,"apparentTemperature":57.48,"dewPoint":51.37,"humidity":0.8,"windSpeed":9.28,"windBearing":252,"visibility":9.39,"cloudCover":0.74,"pressure":1014.67,"ozone":298.18},
                     {"time":1470340800,"summary":"Mostly Cloudy","icon":"partly-cloudy-day","precipIntensity":0,"precipProbability":0,"temperature":60.68,"apparentTemperature":60.68,"dewPoint":51.21,"humidity":0.71,"windSpeed":11.27,"windBearing":252,"visibility":9.43,"cloudCover":0.7,"pressure":1013.58,"ozone":298.46},
                     {"time":1470344400,"summary":"Mostly Cloudy","icon":"partly-cloudy-day","precipIntensity":0,"precipProbability":0,"temperature":62.27,"apparentTemperature":62.27,"dewPoint":52.22,"humidity":0.7,"windSpeed":11.78,"windBearing":256,"visibility":9.41,"cloudCover":0.6,"pressure":1013.08,"ozone":299.06},
                     {"time":1470348000,"summary":"Partly Cloudy","icon":"partly-cloudy-day","precipIntensity":0,"precipProbability":0,"temperature":63.15,"apparentTemperature":63.15,"dewPoint":53.19,"humidity":0.7,"windSpeed":12.01,"windBearing":261,"visibility":9.38,"cloudCover":0.56,"pressure":1012.59,"ozone":300.15},
                     {"time":1470351600,"summary":"Partly Cloudy","icon":"partly-cloudy-day","precipIntensity":0,"precipProbability":0,"temperature":63.01,"apparentTemperature":63.01,"dewPoint":53.65,"humidity":0.72,"windSpeed":12.15,"windBearing":264,"visibility":9.28,"cloudCover":0.51,"pressure":1012.12,"ozone":301.56},
                     {"time":1470355200,"summary":"Partly Cloudy","icon":"partly-cloudy-day","precipIntensity":0,"precipProbability":0,"temperature":62.27,"apparentTemperature":62.27,"dewPoint":53.58,"humidity":0.73,"windSpeed":12.17,"windBearing":267,"visibility":9,"cloudCover":0.55,"pressure":1011.74,"ozone":302.81},
                     {"time":1470358800,"summary":"Partly Cloudy","icon":"partly-cloudy-day","precipIntensity":0,"precipProbability":0,"temperature":60.9,"apparentTemperature":60.9,"dewPoint":53.25,"humidity":0.76,"windSpeed":12.01,"windBearing":268,"visibility":8.76,"cloudCover":0.56,"pressure":1011.23,"ozone":303.77},
                     {"time":1470362400,"summary":"Mostly Cloudy","icon":"partly-cloudy-day","precipIntensity":0,"precipProbability":0,"temperature":58.92,"apparentTemperature":58.92,"dewPoint":52.98,"humidity":0.81,"windSpeed":11.68,"windBearing":269,"visibility":8.25,"cloudCover":0.61,"pressure":1011.04,"ozone":304.58},
                     {"time":1470366000,"summary":"Mostly Cloudy","icon":"partly-cloudy-day","precipIntensity":0,"precipProbability":0,"temperature":57.2,"apparentTemperature":57.2,"dewPoint":52.84,"humidity":0.85,"windSpeed":10.92,"windBearing":269,"visibility":7.05,"cloudCover":0.67,"pressure":1010.94,"ozone":305.14},
                     {"time":1470369600,"summary":"Mostly Cloudy","icon":"partly-cloudy-night","precipIntensity":0,"precipProbability":0,"temperature":56.18,"apparentTemperature":56.18,"dewPoint":52.56,"humidity":0.88,"windSpeed":10.16,"windBearing":270,"visibility":6.37,"cloudCover":0.79,"pressure":1010.99,"ozone":305.3},
                     {"time":1470373200,"summary":"Mostly Cloudy","icon":"partly-cloudy-night","precipIntensity":0,"precipProbability":0,"temperature":55.46,"apparentTemperature":55.46,"dewPoint":52.39,"humidity":0.89,"windSpeed":9.33,"windBearing":269,"visibility":6.21,"cloudCover":0.87,"pressure":1011.14,"ozone":305.2},
                     {"time":1470376800,"summary":"Overcast","icon":"cloudy","precipIntensity":0.0008,"precipProbability":0.01,"precipType":"rain","temperature":54.86,"apparentTemperature":54.86,"dewPoint":51.93,"humidity":0.9,"windSpeed":9,"windBearing":267,"visibility":6.1,"cloudCover":0.94,"pressure":1011.21,"ozone":305.15},
                     {"time":1470380400,"summary":"Overcast","icon":"cloudy","precipIntensity":0.0008,"precipProbability":0.01,"precipType":"rain","temperature":54.47,"apparentTemperature":54.47,"dewPoint":51.7,"humidity":0.9,"windSpeed":8.47,"windBearing":265,"visibility":6.08,"cloudCover":0.96,"pressure":1011.11,"ozone":305.24},
                     {"time":1470384000,"summary":"Overcast","icon":"cloudy","precipIntensity":0,"precipProbability":0,"temperature":54.05,"apparentTemperature":54.05,"dewPoint":51.35,"humidity":0.91,"windSpeed":8.38,"windBearing":262,"visibility":6.11,"cloudCover":0.97,"pressure":1010.93,"ozone":305.39},
                     {"time":1470387600,"summary":"Overcast","icon":"cloudy","precipIntensity":0,"precipProbability":0,"temperature":53.7,"apparentTemperature":53.7,"dewPoint":50.87,"humidity":0.9,"windSpeed":8.34,"windBearing":261,"visibility":5.85,"cloudCover":0.98,"pressure":1010.77,"ozone":305.66},
                     {"time":1470391200,"summary":"Overcast","icon":"cloudy","precipIntensity":0,"precipProbability":0,"temperature":53.26,"apparentTemperature":53.26,"dewPoint":50.64,"humidity":0.91,"windSpeed":8.12,"windBearing":260,"visibility":5.74,"cloudCover":0.99,"pressure":1010.63,"ozone":306.13},
                     {"time":1470394800,"summary":"Overcast","icon":"cloudy","precipIntensity":0,"precipProbability":0,"temperature":52.99,"apparentTemperature":52.99,"dewPoint":50.33,"humidity":0.91,"windSpeed":7.75,"windBearing":259,"visibility":5.68,"cloudCover":0.98,"pressure":1010.51,"ozone":306.74},
                     {"time":1470398400,"summary":"Overcast","icon":"cloudy","precipIntensity":0,"precipProbability":0,"temperature":53.82,"apparentTemperature":53.82,"dewPoint":50.92,"humidity":0.9,"windSpeed":7.14,"windBearing":256,"visibility":6.75,"cloudCover":0.98,"pressure":1010.5,"ozone":307.4},
                     {"time":1470402000,"summary":"Overcast","icon":"cloudy","precipIntensity":0.0008,"precipProbability":0.01,"precipType":"rain","temperature":54.47,"apparentTemperature":54.47,"dewPoint":51.5,"humidity":0.9,"windSpeed":6.62,"windBearing":252,"visibility":7.85,"cloudCover":0.98,"pressure":1010.64,"ozone":308.28},
                     {"time":1470405600,"summary":"Overcast","icon":"cloudy","precipIntensity":0.001,"precipProbability":0.01,"precipType":"rain","temperature":54.96,"apparentTemperature":54.96,"dewPoint":51.63,"humidity":0.89,"windSpeed":6.21,"windBearing":247,"visibility":8.72,"cloudCover":0.99,"pressure":1010.88,"ozone":309.21},
                     {"time":1470409200,"summary":"Overcast","icon":"cloudy","precipIntensity":0.001,"precipProbability":0.01,"precipType":"rain","temperature":55.45,"apparentTemperature":55.45,"dewPoint":51.59,"humidity":0.87,"windSpeed":5.98,"windBearing":243,"visibility":9.29,"cloudCover":0.98,"pressure":1011.14,"ozone":309.68},
                     {"time":1470412800,"summary":"Overcast","icon":"cloudy","precipIntensity":0.0009,"precipProbability":0.01,"precipType":"rain","temperature":56.1,"apparentTemperature":56.1,"dewPoint":51.33,"humidity":0.84,"windSpeed":5.68,"windBearing":237,"visibility":10,"cloudCover":0.98,"pressure":1011.41,"ozone":309.33},
                     {"time":1470416400,"summary":"Overcast","icon":"cloudy","precipIntensity":0,"precipProbability":0,"temperature":56.93,"apparentTemperature":56.93,"dewPoint":51.02,"humidity":0.81,"windSpeed":5.8,"windBearing":234,"visibility":10,"cloudCover":0.98,"pressure":1011.69,"ozone":308.51},
                     {"time":1470420000,"summary":"Overcast","icon":"cloudy","precipIntensity":0,"precipProbability":0,"temperature":58.01,"apparentTemperature":58.01,"dewPoint":50.84,"humidity":0.77,"windSpeed":6.17,"windBearing":235,"visibility":10,"cloudCover":0.94,"pressure":1011.83,"ozone":307.71},
                     {"time":1470423600,"summary":"Mostly Cloudy","icon":"partly-cloudy-day","precipIntensity":0,"precipProbability":0,"temperature":59.13,"apparentTemperature":59.13,"dewPoint":51.75,"humidity":0.76,"windSpeed":6.88,"windBearing":240,"visibility":9.92,"cloudCover":0.76,"pressure":1011.79,"ozone":307.07},
                     {"time":1470427200,"summary":"Partly Cloudy","icon":"partly-cloudy-day","precipIntensity":0,"precipProbability":0,"temperature":61.46,"apparentTemperature":61.46,"dewPoint":52.99,"humidity":0.74,"windSpeed":7.86,"windBearing":246,"visibility":9.8,"cloudCover":0.51,"pressure":1011.63,"ozone":306.45},
                     {"time":1470430800,"summary":"Partly Cloudy","icon":"partly-cloudy-day","precipIntensity":0,"precipProbability":0,"temperature":63.62,"apparentTemperature":63.62,"dewPoint":54.2,"humidity":0.71,"windSpeed":8.79,"windBearing":251,"visibility":9.75,"cloudCover":0.31,"pressure":1011.41,"ozone":305.92},
                     {"time":1470434400,"summary":"Clear","icon":"clear-day","precipIntensity":0,"precipProbability":0,"temperature":65.24,"apparentTemperature":65.24,"dewPoint":55.39,"humidity":0.7,"windSpeed":9.49,"windBearing":255,"visibility":9.8,"cloudCover":0.23,"pressure":1011.12,"ozone":305.49},
                     {"time":1470438000,"summary":"Clear","icon":"clear-day","precipIntensity":0,"precipProbability":0,"temperature":66.11,"apparentTemperature":66.11,"dewPoint":56.3,"humidity":0.71,"windSpeed":10.05,"windBearing":259,"visibility":9.92,"cloudCover":0.21,"pressure":1010.8,"ozone":305.14},
                     {"time":1470441600,"summary":"Clear","icon":"clear-day","precipIntensity":0,"precipProbability":0,"temperature":65.28,"apparentTemperature":65.28,"dewPoint":56.09,"humidity":0.72,"windSpeed":10.32,"windBearing":262,"visibility":10,"cloudCover":0.2,"pressure":1010.55,"ozone":304.94},
                     {"time":1470445200,"summary":"Clear","icon":"clear-day","precipIntensity":0,"precipProbability":0,"temperature":63.29,"apparentTemperature":63.29,"dewPoint":55.44,"humidity":0.76,"windSpeed":10.12,"windBearing":263,"visibility":10,"cloudCover":0.17,"pressure":1010.36,"ozone":304.97},
                     {"time":1470448800,"summary":"Clear","icon":"clear-day","precipIntensity":0,"precipProbability":0,"temperature":60.33,"apparentTemperature":60.33,"dewPoint":54.24,"humidity":0.8,"windSpeed":9.61,"windBearing":263,"visibility":10,"cloudCover":0.15,"pressure":1010.21,"ozone":305.16},
                     {"time":1470452400,"summary":"Clear","icon":"clear-day","precipIntensity":0,"precipProbability":0,"temperature":58.01,"apparentTemperature":58.01,"dewPoint":53.41,"humidity":0.85,"windSpeed":9.08,"windBearing":263,"visibility":10,"cloudCover":0.19,"pressure":1010.18,"ozone":305.33},
                     {"time":1470456000,"summary":"Partly Cloudy","icon":"partly-cloudy-night","precipIntensity":0,"precipProbability":0,"temperature":56.45,"apparentTemperature":56.45,"dewPoint":52.95,"humidity":0.88,"windSpeed":8.58,"windBearing":262,"visibility":10,"cloudCover":0.34,"pressure":1010.39,"ozone":305.49},
                     {"time":1470459600,"summary":"Partly Cloudy","icon":"partly-cloudy-night","precipIntensity":0,"precipProbability":0,"temperature":55.36,"apparentTemperature":55.36,"dewPoint":52.77,"humidity":0.91,"windSpeed":8.08,"windBearing":261,"visibility":10,"cloudCover":0.56,"pressure":1010.72,"ozone":305.64},
                     {"time":1470463200,"summary":"Mostly Cloudy","icon":"partly-cloudy-night","precipIntensity":0,"precipProbability":0,"temperature":54.92,"apparentTemperature":54.92,"dewPoint":52.97,"humidity":0.93,"windSpeed":7.74,"windBearing":260,"visibility":10,"cloudCover":0.74,"pressure":1010.93,"ozone":305.52},
                     {"time":1470466800,"summary":"Mostly Cloudy","icon":"partly-cloudy-night","precipIntensity":0,"precipProbability":0,"temperature":54.77,"apparentTemperature":54.77,"dewPoint":53.12,"humidity":0.94,"windSpeed":7.62,"windBearing":259,"visibility":10,"cloudCover":0.83,"pressure":1010.91,"ozone":304.95},
                     {"time":1470470400,"summary":"Mostly Cloudy","icon":"partly-cloudy-night","precipIntensity":0,"precipProbability":0,"temperature":54.77,"apparentTemperature":54.77,"dewPoint":53.22,"humidity":0.94,"windSpeed":7.62,"windBearing":259,"visibility":10,"cloudCover":0.88,"pressure":1010.78,"ozone":304.12},
                     {"time":1470474000,"summary":"Mostly Cloudy","icon":"partly-cloudy-night","precipIntensity":0,"precipProbability":0,"temperature":54.66,"apparentTemperature":54.66,"dewPoint":53.15,"humidity":0.95,"windSpeed":7.62,"windBearing":259,"visibility":10,"cloudCover":0.91,"pressure":1010.64,"ozone":303.28},
                     {"time":1470477600,"summary":"Mostly Cloudy","icon":"partly-cloudy-night","precipIntensity":0,"precipProbability":0,"temperature":54.39,"apparentTemperature":54.39,"dewPoint":52.93,"humidity":0.95,"windSpeed":7.56,"windBearing":260,"visibility":10,"cloudCover":0.93,"pressure":1010.5,"ozone":302.5},
                     {"time":1470481200,"summary":"Overcast","icon":"cloudy","precipIntensity":0,"precipProbability":0,"temperature":54.04,"apparentTemperature":54.04,"dewPoint":52.57,"humidity":0.95,"windSpeed":7.49,"windBearing":261,"visibility":10,"cloudCover":0.94,"pressure":1010.36,"ozone":301.72},
                     {"time":1470484800,"summary":"Overcast","icon":"cloudy","precipIntensity":0,"precipProbability":0,"temperature":53.69,"apparentTemperature":53.69,"dewPoint":52.14,"humidity":0.94,"windSpeed":7.4,"windBearing":261,"visibility":10,"cloudCover":0.94,"pressure":1010.31,"ozone":301.05},
                     {"time":1470488400,"summary":"Overcast","icon":"cloudy","precipIntensity":0,"precipProbability":0,"temperature":53.34,"apparentTemperature":53.34,"dewPoint":51.67,"humidity":0.94,"windSpeed":7.23,"windBearing":261,"visibility":10,"cloudCover":0.94,"pressure":1010.41,"ozone":300.59},
                     {"time":1470492000,"summary":"Overcast","icon":"cloudy","precipIntensity":0,"precipProbability":0,"temperature":53.01,"apparentTemperature":53.01,"dewPoint":51.14,"humidity":0.93,"windSpeed":7.04,"windBearing":260,"visibility":10,"cloudCover":0.95,"pressure":1010.61,"ozone":300.24},
                     {"time":1470495600,"summary":"Overcast","icon":"cloudy","precipIntensity":0.0007,"precipProbability":0.01,"precipType":"rain","temperature":53.73,"apparentTemperature":53.73,"dewPoint":51.43,"humidity":0.92,"windSpeed":6.99,"windBearing":258,"visibility":10,"cloudCover":0.95,"pressure":1010.85,"ozone":299.77},
                     {"time":1470499200,"summary":"Overcast","icon":"cloudy","precipIntensity":0,"precipProbability":0,"temperature":54.95,"apparentTemperature":54.95,"dewPoint":51.87,"humidity":0.89,"windSpeed":7.07,"windBearing":256,"visibility":10,"cloudCover":0.95,"pressure":1011.12,"ozone":298.78},
                     {"time":1470502800,"summary":"Overcast","icon":"cloudy","precipIntensity":0,"precipProbability":0,"temperature":56.24,"apparentTemperature":56.24,"dewPoint":52.12,"humidity":0.86,"windSpeed":7.3,"windBearing":252,"visibility":10,"cloudCover":0.95,"pressure":1011.4,"ozone":297.67},
                     {"time":1470506400,"summary":"Mostly Cloudy","icon":"partly-cloudy-day","precipIntensity":0,"precipProbability":0,"temperature":57.4,"apparentTemperature":57.4,"dewPoint":52.17,"humidity":0.83,"windSpeed":7.84,"windBearing":250,"visibility":10,"cloudCover":0.91,"pressure":1011.57,"ozone":297.39},
                     {"time":1470510000,"summary":"Mostly Cloudy","icon":"partly-cloudy-day","precipIntensity":0,"precipProbability":0,"temperature":58.71,"apparentTemperature":58.71,"dewPoint":52.26,"humidity":0.79,"windSpeed":8.88,"windBearing":251,"visibility":10,"cloudCover":0.81,"pressure":1011.59,"ozone":298.29}]}
  ,"daily":{"summary":"No precipitation throughout the week, with temperatures peaking at 69°F on Sunday."
           ,"icon":"clear-day"
           ,"data":[{"time":1470294000
                   ,"summary":"Mostly cloudy throughout the day."
                   ,"icon":"partly-cloudy-day"
                   ,"sunriseTime":1470316644
                   ,"sunsetTime":1470366995
                   ,"moonPhase":0.07
                   ,"precipIntensity":0.0002
                   ,"precipIntensityMax":0.0008
                   ,"precipIntensityMaxTime":1470376800
                   ,"precipProbability":0.01
                   ,"precipType":"rain"
                   ,"temperatureMin":54.03
                   ,"temperatureMinTime":1470290400
                   ,"temperatureMax":63.15
                   ,"temperatureMaxTime":1470348000
                   ,"apparentTemperatureMin":54.03
                   ,"apparentTemperatureMinTime":1470290400
                   ,"apparentTemperatureMax":63.15
                   ,"apparentTemperatureMaxTime":1470348000
                   ,"dewPoint":52.14,"humidity":0.85
                   ,"windSpeed":9.03,"windBearing":262
                   ,"visibility":7.48,"cloudCover":0.64
                   ,"pressure":1013,"ozone":301.43}
                  ,{"time":1470380400,"summary":"Mostly cloudy throughout the day."
                   ,"icon":"partly-cloudy-day"
                   ,"sunriseTime":1470403097
                   ,"sunsetTime":1470453332,"moonPhase":0.1,"precipIntensity":0.0004,"precipIntensityMax":0.001,"precipIntensityMaxTime":1470409200,"precipProbability":0.01,"precipType":"rain","temperatureMin":52.99,"temperatureMinTime":1470394800,"temperatureMax":66.11,"temperatureMaxTime":1470438000,"apparentTemperatureMin":52.99,"apparentTemperatureMinTime":1470394800,"apparentTemperatureMax":66.11,"apparentTemperatureMaxTime":1470438000,"dewPoint":52.59,"humidity":0.83,"windSpeed":7.87,"windBearing":255,"visibility":8.8,"cloudCover":0.67,"pressure":1010.92,"ozone":306.52}
                  ,{"time":1470466800,"summary":"Mostly cloudy throughout the day.","icon":"partly-cloudy-day","sunriseTime":1470489549,"sunsetTime":1470539668,"moonPhase":0.13,"precipIntensity":0.0001,"precipIntensityMax":0.0007,"precipIntensityMaxTime":1470495600,"precipProbability":0.01,"precipType":"rain","temperatureMin":53.01,"temperatureMinTime":1470492000,"temperatureMax":64.43,"temperatureMaxTime":1470524400,"apparentTemperatureMin":53.01,"apparentTemperatureMinTime":1470492000,"apparentTemperatureMax":64.43,"apparentTemperatureMaxTime":1470524400,"dewPoint":52.53,"humidity":0.85,"windSpeed":9.11,"windBearing":254,"visibility":10,"cloudCover":0.7,"pressure":1010.82,"ozone":304.65}
                  ,{"time":1470553200,"summary":"Mostly cloudy until afternoon.","icon":"partly-cloudy-day","sunriseTime":1470576001,"sunsetTime":1470626002,"moonPhase":0.16,"precipIntensity":0,"precipIntensityMax":0,"precipProbability":0,"temperatureMin":52.42,"temperatureMinTime":1470574800,"temperatureMax":68.68,"temperatureMaxTime":1470610800,"apparentTemperatureMin":52.42,"apparentTemperatureMinTime":1470574800,"apparentTemperatureMax":68.68,"apparentTemperatureMaxTime":1470610800,"dewPoint":51.74,"humidity":0.78,"windSpeed":6.7,"windBearing":245,"visibility":10,"cloudCover":0.44,"pressure":1011.51,"ozone":298.41}
                  ,{"time":1470639600,"summary":"Clear throughout the day.","icon":"clear-day","sunriseTime":1470662454,"sunsetTime":1470712335,"moonPhase":0.19,"precipIntensity":0,"precipIntensityMax":0,"precipProbability":0,"temperatureMin":51.49,"temperatureMinTime":1470657600,"temperatureMax":65.69,"temperatureMaxTime":1470690000,"apparentTemperatureMin":51.49,"apparentTemperatureMinTime":1470657600,"apparentTemperatureMax":65.69,"apparentTemperatureMaxTime":1470690000,"dewPoint":48.61,"humidity":0.73,"windSpeed":5.1,"windBearing":221,"cloudCover":0,"pressure":1009.53,"ozone":297.14}
                  ,{"time":1470726000,"summary":"Partly cloudy until afternoon.","icon":"partly-cloudy-day","sunriseTime":1470748906,"sunsetTime":1470798667,"moonPhase":0.22,"precipIntensity":0,"precipIntensityMax":0,"precipProbability":0,"temperatureMin":52.24,"temperatureMinTime":1470744000,"temperatureMax":68.13,"temperatureMaxTime":1470780000,"apparentTemperatureMin":52.24,"apparentTemperatureMinTime":1470744000,"apparentTemperatureMax":68.13,"apparentTemperatureMaxTime":1470780000,"dewPoint":48.83,"humidity":0.71,"windSpeed":5.21,"windBearing":224,"cloudCover":0.15,"pressure":1007.44,"ozone":315}
                  ,{"time":1470812400,"summary":"Mostly cloudy overnight.","icon":"partly-cloudy-night","sunriseTime":1470835359,"sunsetTime":1470884998,"moonPhase":0.25,"precipIntensity":0,"precipIntensityMax":0,"precipProbability":0,"temperatureMin":53.49,"temperatureMinTime":1470891600,"temperatureMax":62.09,"temperatureMaxTime":1470862800,"apparentTemperatureMin":53.49,"apparentTemperatureMinTime":1470891600,"apparentTemperatureMax":62.09,"apparentTemperatureMaxTime":1470862800,"dewPoint":49.96,"humidity":0.78,"windSpeed":6.49,"windBearing":211,"cloudCover":0.08,"pressure":1008.87,"ozone":312.51}
                  ,{"time":1470898800,"summary":"Mostly cloudy until afternoon.","icon":"partly-cloudy-day","sunriseTime":1470921812,"sunsetTime":1470971327,"moonPhase":0.28,"precipIntensity":0.0006,"precipIntensityMax":0.0013,"precipIntensityMaxTime":1470909600,"precipProbability":0.02,"precipType":"rain","temperatureMin":52.63,"temperatureMinTime":1470981600,"temperatureMax":61.05,"temperatureMaxTime":1470952800,"apparentTemperatureMin":52.63,"apparentTemperatureMinTime":1470981600,"apparentTemperatureMax":61.05,"apparentTemperatureMaxTime":1470952800,"dewPoint":49.1,"humidity":0.79,"windSpeed":5.94,"windBearing":221,"cloudCover":0.5,"pressure":1011.71,"ozone":302.38}]}

                   ,"flags":{"sources":["darksky","lamp","gfs","cmc","nam","rap","rtma","sref","fnmoc","isd","nwspa","madis","nearest-precip"],"darksky-stations":["KMUX"],"lamp-stations":["KAPC","KCCR","KHWD","KLVK","KNUQ","KOAK","KPAO","KSFO","KSQL"],"isd-stations":["724943-99999","745039-99999","745065-99999","994016-99999","998479-99999"],"madis-stations":["AU915","C5988","C8158","C9629","CQ147","D5422","E0426","E6067","E9227","FTPC1","GGBC1","OKXC1","PPXC1","PXOC1","SFOC1","TIBC1"],"units":"us"}}
*/
