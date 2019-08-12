console.log(Cookies.get('filtered locations'));

let locations = Cookies.get('filtered locations');

$.each(locations.features, function (key, val) {
    val.properties.distance = turf.distance(val.geometry.coordinates, [userLon, userLat]);
});