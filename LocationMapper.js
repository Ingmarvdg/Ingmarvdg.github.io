// constants and variables
const defaultLocation = [5.9795, 50.8882];
const defaultZoom = 16;
let userGEO = {"geometry": {"type": "Point", "coordinates": defaultLocation}, "type": "Feature", "properties": {}};
mapboxgl.accessToken = 'pk.eyJ1IjoiaW5nbWFydmRnIiwiYSI6ImNqeXUzcTdxOTAyMW8zbm1sa2N0MnR4dG8ifQ.yeAXLRvaquHKHuOaPIqOYw';
let userLat;
let userLon;

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
        map.getSource('user').setData(userGEO);
        map.flyTo({center: [userLon, userLat] , zoom: defaultZoom})
    }, 1000);

    // markers
    let size = 100;
    let checkDot = newDot(size);
    map.addImage('pulsing-dot', checkDot, { pixelRatio: 2 });

    // map layers
    map.addSource('user', { type: 'geojson', data: userGEO });
    map.addLayer({
        "id": "user",
        "type": "symbol",
        "source": "user",
        "layout": {
            "icon-image": "pulsing-dot"
        }
    });
});

