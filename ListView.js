let locations = localStorage.getItem('locations-list');
locations = JSON.parse(locations);
let userFilter = {fines: true, module: true, loi: true};
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

wantedData.sort(function(a, b){
    return (a.properties.distance - b.properties.distance)
});

$.each(wantedData, function (key, val) {
    $( ".locations-list" ).append( "<div class=\"card mb-4\">\n" +
        "<div class=\"card-body\">\n" +
        "<h2 class=\"card-title\">" + val.properties.Subject + "</h2>\n" +
        "<p class=\"card-text\" id=\"locaties_adres\">"+ val.properties.Date +"</p>\n" +
        "<p class=\"card-text\" id=\"afstand\">"+ val.properties.distance + " KM </p>\n" +
        "</div>\n" +
        "<div class=\"card-footer text-muted\">\n" +
        "Posted on January 1, 2017\n" +
        "</div>\n" +
        "</div>"
    );
});

var sort_by = function(field, reverse, primer){

    var key = primer ?
        function(x) {return primer(x[field])} :
        function(x) {return x[field]};

    reverse = !reverse ? 1 : -1;

    return function (a, b) {
        return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
    }
}