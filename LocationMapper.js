// constants and variables
const defaultLocation = [5.9795, 50.8882];
const defaultZoom = 16;
let currentZoom = defaultZoom;
let userFilter = {action: true, intel: true};
let userGEO = {"geometry": {"type": "Point", "coordinates": defaultLocation}, "type": "Feature", "properties": {}};
mapboxgl.accessToken = 'pk.eyJ1IjoiaW5nbWFydmRnIiwiYSI6ImNqeXUzcTdxOTAyMW8zbm1sa2N0MnR4dG8ifQ.yeAXLRvaquHKHuOaPIqOYw';
let userLat = 0;
let userLon = 0;
let refreshRate = 2000;
let userSpeed = 5; // variable for user speed, default is 6 meters per second, this is used if speed cannot be detected on device
let actionRadius;
let oldRelevantLocations = [];
let relevantLocations = [];
let responseTime = 120; // used to set distance, show all locations that are within 120 seconds reach

// initialize map
let map = new mapboxgl.Map({
    container: 'map', // container id
    style: 'mapbox://styles/ingmarvdg/cjz12ef7l00oy1cro517z0nzl',
    center: defaultLocation, // starting position
    zoom: defaultZoom // starting zoom
});

// request permission to send notifications
Notification.requestPermission(function(status) {
    console.log('Notification permission status:', status);
});

// set filter for categories, now only done at setup
let categoryFilter = userToCategoryFilter(userFilter);

// add user location marker
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

// check for events
geoLocateController.on("trackuserlocationstart", function() {
    console.log("user location started")
    //sendNotifications(actionRadius);
});

geoLocateController.on("geolocate", function(data) {
    userLat = data.coords.latitude;
    userLon = data.coords.longitude;
    if(data.coords.speed != null){
        userSpeed = data.coords.speed;
    }
    userGEO = {"geometry": {"type": "Point", "coordinates": [userLon, userLat]}, "type": "Feature", "properties": {}};
});

map.on('load', function () {
    // periodical events
    window.setInterval(function() {
        // update user location with geo data
        map.getSource('user').setData(userGEO);

        // update zoom level based on speed
        currentZoom = getZoomFromSpeed(userSpeed, defaultZoom);

        // set action radius based on speed
        actionRadius = getRadiusFromSpeed(userSpeed, responseTime);

        // filter locations within radius of user
        let bbox = calculateBBox(userLat, userLon, actionRadius);
        relevantLocations = map.queryRenderedFeatures(bbox, {layers: ['locations-target']});
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

        // detect if a new item came in range and send a notification
        let joeysList = [];
        for (let index = 0; index < relevantLocations.length; index++) {
            joeysList.push(relevantLocations[index].properties.Location)
        }

        if(oldRelevantLocations.length >= 0) {
            console.log(relevantLocations.length, oldRelevantLocations.length);
            for (let index = 0; index < relevantLocations.length; index++) {
                if(joeysList.includes(!relevantLocations[index].properties.Location)){
                    sendNotifications(relevantLocations[index]);
                }
            }
        }
        oldRelevantLocations = relevantLocations;
    }, refreshRate);

    // load and add images
    map.loadImage('images/intelin.png', function(error,image){
        if(error) throw error;
        map.addImage('IIntel', image)
    });

    map.loadImage('images/intelout.png', function(error,image){
        if(error) throw error;
        map.addImage('OIntel', image)
    });

    map.loadImage('images/actionin.png', function(error,image){
        if(error) throw error;
        map.addImage('IAction', image)
    });

    map.loadImage('images/actionout.png', function(error,image){
        if(error) throw error;
        map.addImage('OAction', image)
    });

    // add data sources for user location and points of interest
    map.addSource('user', { type: 'geojson', data: userGEO });

    map.addSource('locationpoints', {
        type: 'geojson',
        data: './GeoJason.geojson'
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
        }
    });

    map.addLayer({
        "id": "markers",
        "type":"symbol",
        "source": "locationpoints",
        "layout":{
            "icon-image": 'O'+ "{Icon-image}",
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
            "icon-image": 'I'+ "{Icon-image}",
            "icon-allow-overlap":true,
            "icon-ignore-placement":true,
            "icon-padding":0,
            "icon-size":0.3,

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
    radius = responseTime * multiplier;
    return(radius);
}

// converts user input to a mapbox interpretable filter
function userToCategoryFilter(userFilter){
    let filter = ["in", "Icon-image"];
    if(userFilter.action === true){
        filter.push("Action");
    }
    if (userFilter.intel === true){
        filter.push("Intel")
    }
    console.log(filter);
    return filter;
}

function sendNotifications() {
    let notifTitle = "Nieuwe notificatie";
    // var notifBody = "Intel in de buurt";
    let options = {
        body: 'Intel in de buurt!',
        icon: 'fine.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        }
    };
    console.log("this is supposed to be a notification");
    new Notification(notifTitle, options);
}

