let locations = localStorage.getItem('locations-list');
locations = JSON.parse(locations);
let userFilter = {fines: true, module: true, loi: true};
userFilter = localStorage.getItem("filter-settings");
console.log(userFilter);

// filtering which locations
wantedData = [];
$.each(locations.features, function(key, val) {
    if(userFilter.fines === true && val.properties.Prioriteit === 'fine'){
        wantedData.push(val);
    }
    if(userFilter.module === true && val.properties.Prioriteit === 'module'){
        wantedData.push(val);
    }
    if(userFilter.loi === true && val.properties.Prioriteit === 'loi'){
        wantedData.push(val);
    }
});

$.each(wantedData, function (key, val) {
    $( ".locations-list" ).append( "<div class=\"card mb-4\">\n" +
        "<div class=\"card-body\">\n" +
        "<h2 class=\"card-title\">Verdachte auto</h2>\n" +
        "<p class=\"card-text\" id=\"locaties_adres\">Smedestraat 2, Heerlen</p>\n" +
        "<p class=\"card-text\" id=\"afstand\"> 0.2 km</p>\n" +
        "</div>\n" +
        "<div class=\"card-footer text-muted\">\n" +
        "Posted on January 1, 2017\n" +
        "</div>\n" +
        "</div>" );
});