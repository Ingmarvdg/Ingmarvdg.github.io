// constants and variables
const defaultLocation = [5.9795, 50.8882];
const defaultZoom = 16;
let userGEO = {"geometry": {"type": "Point", "coordinates": defaultLocation}, "type": "Feature", "properties": {}};
mapboxgl.accessToken = 'pk.eyJ1IjoiaW5nbWFydmRnIiwiYSI6ImNqeXUzcTdxOTAyMW8zbm1sa2N0MnR4dG8ifQ.yeAXLRvaquHKHuOaPIqOYw';
let userLat;
let userLon;
let actionRadius = 1;
let userMarkerSize = 100;
let userDot = newDot(userMarkerSize);

// update user location by watching its position
navigator.geolocation.watchPosition(function(pos) {
    userLat = pos.coords.latitude;
    userLon = pos.coords.longitude;
    userGEO = {"geometry": {"type": "Point", "coordinates": [userLon, userLat]}, "type": "Feature", "properties": {}};
    console.log('position updated')
});

// load map
let map = new mapboxgl.Map({
    container: 'map', // container id
    style: 'mapbox://styles/mapbox/streets-v11',
    center: defaultLocation, // starting position
    zoom: defaultZoom // starting zoom
});

map.on('load', function () {
    // periodical events
    window.setInterval(function() {
        // update user location with geodata
        map.getSource('user').setData(userGEO);

        // filter locations within radius of user
        let bbox = calculateBBox(userLat, userLon, actionRadius);
        let relevantLocations = map.queryRenderedFeatures(bbox, {layers: ['locations-target']});
        console.log(relevantLocations);
        let filter = relevantLocations.reduce(function(memo, relevantLocations) {
            memo.push(relevantLocations.properties.Location);
            return memo;
        }, ['in', 'Location']);
        map.setFilter("locations-highlighted", filter);

    }, 500);

    // load and add images
    map.addImage('pulsing-dot', userDot, { pixelRatio: 2 });

    map.loadImage('./fine.png', function(error, image){
        if (error) throw error;
        map.addImage('fine', image)
    });

    map.loadImage('./module.png', function(error, image){
        if (error) throw error;
        map.addImage('module', image)
    });

    map.loadImage('./loi.png', function(error, image){
        if (error) throw error;
        map.addImage('loi', image)
    });

    map.loadImage('./event2.png', function(error, image){
        if (error) throw error;
        map.addImage('event', image)
    });

    // add data sources
    map.addSource('user', { type: 'geojson', data: userGEO });
    map.addSource('locationpoints', {
        type: 'geojson',
        data: './GeoJason.geojson'
    });

    // add map layers
    map.addLayer({
        'id': 'locations-target',
        'type': 'circle',
        'source': 'locationpoints',
        "paint": {
            "circle-radius": 1,
            "circle-color": "#000000",
            "circle-opacity": 1
        }
    });

    map.addLayer({
        "id": "user",
        "type": "symbol",
        "source": "user",
        "layout": {
            "icon-image": "pulsing-dot"
        }
    });

    map.addLayer({
        "id": "markers",
        "type": "circle",
        "source": "locationpoints",
        "paint": {
            "circle-radius": 20,
            "circle-color": "#39a843",
            "circle-opacity": 1
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

    map.addLayer({
        "id": "locations",
        "type": "symbol",
        "source": "locationpoints",
        "layout": {
            "icon-image": "{Icon-image}",
            "icon-allow-overlap": true,
            "icon-ignore-placement": true,
            "icon-padding": 0,
            "icon-size": 0.38,

            "text-size": 10,
            "text-font": ["Meta Offc Pro Medium","Arial Unicode MS Regular"],
            "text-allow-overlap": true,
            "text-offset": [1,0],
            "text-anchor": "left",
            "text-field": "{icon_image}",
            "text-rotate": 270
        }
    });
});



// takes user location+radius and returns pixel values of bound box coordinates
function calculateBBox(userLat, userLon, radius){
    const latLngKilometers = 111.2;
    let latLngOffset = radius/latLngKilometers;
    console.log(userLon - latLngOffset, userLat - latLngOffset);
    let northEast = map.project([userLon + latLngOffset, userLat - latLngOffset]);
    let southWest = map.project([userLon - latLngOffset, userLat + latLngOffset]);
    console.log(southWest, northEast);
    return [southWest, northEast];
}

