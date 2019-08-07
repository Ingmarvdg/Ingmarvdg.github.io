// constants and variables
const defaultLocation = [5.9795, 50.8882];
const defaultZoom = 16;
let currentZoom = defaultZoom;
let userGEO = {"geometry": {"type": "Point", "coordinates": defaultLocation}, "type": "Feature", "properties": {}};
mapboxgl.accessToken = 'pk.eyJ1IjoiaW5nbWFydmRnIiwiYSI6ImNqeXUzcTdxOTAyMW8zbm1sa2N0MnR4dG8ifQ.yeAXLRvaquHKHuOaPIqOYw';
let userLat;
let userLon;
let userSpeed = 5; // variable for user speed, default is 6 meters per second, this is used if speed cannot be detected on device
let actionRadius;
let geoLocationOptions = {enableHighAccuracy: true,
                            timeout: 5000,
                            maximumAge: 0};
let responseTime = 120; // used to set distance, show all locations that are within 120 seconds reach

// update user location by watching its position
navigator.geolocation.watchPosition(function(pos) {
    userLat = pos.coords.latitude;
    userLon = pos.coords.longitude;
    if(pos.coords.speed != null){
        userSpeed = pos.coords.speed;
    }
    userGEO = {"geometry": {"type": "Point", "coordinates": [userLon, userLat]}, "type": "Feature", "properties": {}};
    console.log('position updated', userLat, userLon)
},function() {
    console.log('couldnt get user location')
    }, geoLocationOptions
);

// initialize map
let map = new mapboxgl.Map({
    container: 'map', // container id
    style: 'mapbox://styles/ingmarvdg/cjz12ef7l00oy1cro517z0nzl',
    center: defaultLocation, // starting position
    zoom: defaultZoom // starting zoom
});

// add user location marker
map.addControl(new mapboxgl.GeolocateControl({
    positionOptions: {
        enableHighAccuracy: true
    },
    trackUserLocation: true,
    fitBoundsOptions: {
        maxZoom: currentZoom
    }
}));

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
        let relevantLocations = map.queryRenderedFeatures(bbox, {layers: ['locations-target']});
        let filter = relevantLocations.reduce(function(memo, relevantLocations) {
            memo.push(relevantLocations.properties.Location);
            return memo;
        }, ['in', 'Location']);
        map.setFilter("locations-highlighted", filter);
        console.log("Update information: actionRadius is %d, ", actionRadius);
    }, 250);

    // add data sources for user location and points of interest
    map.addSource('user', { type: 'geojson', data: userGEO });
    map.addSource('locationpoints', {
        type: 'geojson',
        data: './GeoJason.geojson'
    });

    // add map layers for points of interest coordinates and points of interest within user range
    map.addLayer({
        'id': 'locations-target',
        'type': 'circle',
        'source': 'locationpoints',
        "paint": {
            "circle-radius": 1,
            "circle-color": "#000000",
            "circle-opacity": 0
        }
    });

    map.addLayer({
        'id': 'locations-highlighted',
        'type': 'circle',
        'source': 'locationpoints',
        "paint": {
            "circle-radius": 20,
            "circle-color": "#a80013",
            "circle-opacity": 1
        },
        "filter": ["in", "Location", ""]
    });

    // allow for popup when clicking on marker
    map.on('click', function(e) {
        let features = map.queryRenderedFeatures(e.point, {
            layers: ['data-police'] // replace this with the name of the layer
        });

        if (!features.length) {
            return;
        }

        let feature = features[0];

        let popup = new mapboxgl.Popup({ offset: [0, -15] })
            .setLngLat(feature.geometry.coordinates)
            .setHTML('<h3>' + feature.properties.title + '</h3><p>' + feature.properties.description + '</p>')
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

