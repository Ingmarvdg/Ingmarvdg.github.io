// constants and variables
const defaultLocation = [5.9795, 50.8882];
const defaultZoom = 16;
let currentZoom = defaultZoom;
let userFilter = {action: true, intel: true};
mapboxgl.accessToken = 'pk.eyJ1IjoiaW5nbWFydmRnIiwiYSI6ImNqeXUzcTdxOTAyMW8zbm1sa2N0MnR4dG8ifQ.yeAXLRvaquHKHuOaPIqOYw';
let userLat = 0;
let userLon = 0;
let refreshRate = 2000;
let userSpeed = 5; // variable for user speed, default is 6 meters per second, this is used if speed cannot be detected on device
let actionRadius;
let oldRelevantLocations = [];
let relevantLocations = [];
let responseTime = 120; // used to set distance, show all locations that are within 120 seconds reach
let dataSource;

// load datasource
$.getJSON("./json/GeoJason.geojson", function(json){
    dataSource = json;
});

// initialize map and controllers
let map = new mapboxgl.Map({
    container: 'map', // container id
    style: 'mapbox://styles/ingmarvdg/cjz12ef7l00oy1cro517z0nzl',
    center: defaultLocation, // starting position
    zoom: defaultZoom // starting zoom
});

let geoLocateController = new mapboxgl.GeolocateControl({
    positionOptions: {
        enableHighAccuracy: true
    },
    trackUserLocation: true,
    fitBoundsOptions: {
        maxZoom: currentZoom
    }
});
map.addControl(geoLocateController);

// request permission to send notifications
Notification.requestPermission(function(status) {
    console.log('Notification permission status:', status);
});

// set filter for categories, now only done at setup
let categoryFilter = userToCategoryFilter(userFilter);


// check for events
geoLocateController.on("trackuserlocationstart", function() {
    console.log("user location started")
});

map.on('load', function () {
    // periodical events
    geoLocateController.on("geolocate", function(data) {
        // get user latitude and longitude
        userLat = data.coords.latitude;
        userLon = data.coords.longitude;
        // get user speed when available
        if(data.coords.speed != null){
            userSpeed = data.coords.speed;
        }

        // update source and variables
        $.each(dataSource.features, function (key, val) {
            val.properties.distance = turf.distance(val.geometry.coordinates, [userLon, userLat]);
        });
        map.getSource('locationpoints').setData(dataSource);
        currentZoom = getZoomFromSpeed(userSpeed, defaultZoom);
        actionRadius = getRadiusFromSpeed(userSpeed, responseTime);

        // new filter for locations
        relevantLocations = map.querySourceFeatures('locationpoints',{filter:["<", "distance", actionRadius]});
        console.log(relevantLocations);

        // filter locations within radius of user
        let inclusiveFilter = relevantLocations.reduce(function(memo, relevantLocations) {
            memo.push(relevantLocations.properties.Location);
            return memo;
        }, ['in', 'Location']);
        let exclusiveFilter = relevantLocations.reduce(function(memo, relevantLocations) {
            memo.push(relevantLocations.properties.Location);
            return memo;
        }, ['!in', 'Location']);
        map.setFilter("locations-highlighted", ["all", inclusiveFilter, categoryFilter]);
        map.setFilter("markers", ["all", exclusiveFilter, categoryFilter]);

        // send notifications for new markers in the area
        if(oldRelevantLocations.length > 0) {
            let joeysList = [];
            for (let index = 0; index < oldRelevantLocations.length; index++) {
                joeysList.push(oldRelevantLocations[index].properties.Location)
            }
            for (let index = 0; index < relevantLocations.length; index++) {
                if(joeysList.includes(relevantLocations[index].properties.Location) === false){
                    sendNotifications(relevantLocations[index]);
                }
            }
        }
        oldRelevantLocations = relevantLocations;
    });

    // load and add images
    map.loadImage('images/finelightbluein.png', function(error,image){
        if(error) throw error;
        map.addImage('Ifine', image)
    });

    map.loadImage('images/finelightblueout.png', function(error,image){
        if(error) throw error;
        map.addImage('Ofine', image)
    });

    map.loadImage('images/moduleinorangein.png', function(error,image){
        if(error) throw error;
        map.addImage('Imodule', image)
    });

    map.loadImage('images/moduleinorangeout.png', function(error,image){
        if(error) throw error;
        map.addImage('Omodule', image)
    });

    map.loadImage('images/loilightgreenin.png', function(error,image){
        if(error) throw error;
        map.addImage('Iloi', image)
    });

    map.loadImage('images/loilightgreenout.png', function(error,image){
        if(error) throw error;
        map.addImage('Oloi', image)
    });

    // add data sources for user location and points of interest
    map.addSource('locationpoints', {
        type: 'geojson',
        data: dataSource
    });
    // add map layers for points of interest coordinates and points of interest within user range
    map.addLayer({
        "id": "locations-target",
        "type": "circle",
        "source": "locationpoints",
        "paint": {
            "circle-radius": 1,
            "circle-color": "#000000",
            "circle-opacity": 0
        },
    });

    map.addLayer({
        "id": "markers",
        "type":"symbol",
        "source": "locationpoints",
        "layout":{
            "icon-image": 'O'+ "{Prioriteit}",
            "icon-allow-overlap":true,
            "icon-ignore-placement":true,
            "icon-padding":0,
            "icon-size":0.3,

            "text-size":10
        },
        "filter": ["!in", "Location", ""]
    });

    map.addLayer({
        'id': 'locations-highlighted',
        "type":"symbol",
        "source": "locationpoints",
        "layout":{
            "icon-image": 'I'+ "{Prioriteit}",
            "icon-allow-overlap":true,
            "icon-ignore-placement":true,
            "icon-padding":0,
            "icon-size":0.35,

            "text-size":10
        },
        "filter": ["in", "Location", ""]
    });

    // allow for popup when clicking on marker
    map.on('click', function(e) {
        let features = map.queryRenderedFeatures(e.point, {
            layers: ['markers', 'locations-highlighted'] // replace this with the name of the layer
        });

        if (!features.length) {
            return;
        }

        let feature = features[0];

        let popup = new mapboxgl.Popup({ offset: [0, -15] })
            .setLngLat(feature.geometry.coordinates)
            .setHTML(
                //'<p><img src="event.png" width="30" height="30" align="middle"></p>' +
                '<h3>'+ feature.properties.Subject + '</h3>' +
                '<p><b>Datum: \</b>' + feature.properties.Date + '</p>' +
                '<p><b>Locatie: \</b>' + feature.properties.Location + '</p>' +
                '<p><b>Beschrijving: \</b>' + feature.properties.Description + '</p>'
            )
            .addTo(map);
    });
});

// takes user location+radius and returns pixel values of bound box coordinates
function calculateBBox(userLat, userLon, radius){
    const latLngKilometers = 111200;
    let latLngOffset = radius/latLngKilometers;
    let northEast = map.project([userLon + latLngOffset, userLat - latLngOffset]);
    let southWest = map.project([userLon - latLngOffset, userLat + latLngOffset]);
    return [southWest, northEast];
}

// gets zoom level from speed
function getZoomFromSpeed(speed, defaultZoom){
    let zoom;
    let multiplier;
    if(speed <= 2){
        multiplier = 1.0;
    } else if(speed <= 4){
        multiplier = 1.9;
    } else if(speed <= 8){
        multiplier = 0.8;
    } else if(speed <= 16){
        multiplier = 0.7;
    } else {
        multiplier = 0.6;
    }
    zoom = defaultZoom * multiplier;
    return(zoom);
}

// get action radius from speed
function getRadiusFromSpeed(speed, responseTime){
    let radius;
    let multiplier;
    if(speed <= 2){
        multiplier = 2;
    } else if(speed <= 4){
        multiplier = 4;
    } else if(speed <= 8){
        multiplier = 8;
    } else if(speed <= 16){
        multiplier = 16;
    } else {
        multiplier = 24;
    }
    radius = (responseTime * multiplier) / 1000;
    return(radius);
}

// converts user input to a mapbox interpretable filter
function userToCategoryFilter(userFilter){
    let filter = ["in", "Category"];
    if(userFilter.action === true){
        filter.push("Action");
    }
    if (userFilter.intel === true){
        filter.push("Intel")
    }
    console.log(filter);
    return filter;
}

$.notify.addStyle("metro", {
    html:
        "<div>" +
        "<div class='image' data-notify-html='image'/>" +
        "<div class='text-wrapper'>" +
        "<div class='title' data-notify-html='title'/>" +
        "<div class='text' data-notify-html='text'/>" +
        "</div>" +
        "</div>",
    classes: {
        error: {
            "color": "#fafafa !important",
            "background-color": "#F71919",
            "border": "1px solid #FF0026"
        },
        success: {
            "background-color": "#32CD32",
            "border": "1px solid #4DB149"
        },
        info: {
            "color": "#fafafa !important",
            "background-color": "#1E90FF",
            "border": "1px solid #1E90FF"
        },
        warning: {
            "background-color": "#FAFA47",
            "border": "1px solid #EEEE45"
        },
        black: {
            "color": "#fafafa !important",
            "background-color": "#333",
            "border": "1px solid #000"
        },
        white: {
            "background-color": "#f1f1f1",
            "border": "1px solid #ddd"
        }
    }
});

function sendNotifications(feature) {
    let notifTitle = feature.properties.Category + " in de buurt!";

    let options = {
        body: feature.properties.Subject,
        icon: feature.properties.Prioriteit + '.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        }
    };
    //new Notification(notifTitle, options);

    $.notify(notifTitle + "\n" + feature.properties.Subject, "info", {
        style: 'metro',
        autoHide: false,
        clickToHide: true,

    });
}

