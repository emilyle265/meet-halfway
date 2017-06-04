// none of these need to be global -- pass these as parameters to each function
// instead of defining them globally
var geocoder;
var map;
// var midpointMarker;

function initialize() {
  // TO DO: make sure everything defined in intialize never changes (if it changes, move it out of initialize)
  var directionsService = new google.maps.DirectionsService;
  var directionsDisplay = new google.maps.DirectionsRenderer({suppressMarkers:true});
  // TO DO: do i change?
  geocoder = new google.maps.Geocoder();
  // TO DO: do i change? --> No, this is latlng of hackbright
  var latlng = new google.maps.LatLng(37.78, -122.41);

  var mapOptions = {
    zoom: 8,
    center: latlng,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  }

  var first_location_input = document.getElementById('location_a');
  var autocomplete = new google.maps.places.Autocomplete(first_location_input);

  var second_location_input = document.getElementById('location_b');
  var autocomplete = new google.maps.places.Autocomplete(second_location_input);

  // TODO: initialize instance of map, but re-draw the map on click
  // (if that's what is necessary for adding points to the map)
  // this map is necessary to show map on load
  map = new google.maps.Map(document.getElementById('map'), mapOptions);

  // TODO: do i need this for an initial map rendering? what does this do?
  // directionsDisplay is a DirectionsRenderer object that controls how the map renders.
  // You can create markers and add them to a map at a later time e.g. after clicking some button using setMap()
  polyline = new google.maps.Polyline({
    path: [],
    strokeColor: '#FF0000',
    strokeWeight: 3
  });
  directionsDisplay.setMap(map);

  var oldInfoWindow = {
    oldWindow: null
  };

  // move this out of initialize
  function onSubmit(evt) {
    evt.preventDefault();
    // TO DO: this is still being assigned as a global map parameter; this is bad
    // var map = getNewMap(directionsDisplay, mapOptions);
    calculateAndDisplayRoute(directionsService, directionsDisplay);
    // getStartAndEndLocationCoords(oldInfoWindow);
    clearYelpListing();
  }

  // this is a good use of initialize
  document.getElementById("search").addEventListener("click", onSubmit);
}


// function getNewMap(directionsDisplay, mapOptions) {
//   var map = new google.maps.Map(document.getElementById('map'), mapOptions);
//   directionsDisplay.setMap(map);

//   return map;
// }

function calculateAndDisplayRoute(directionsService, directionsDisplay) {
  var start = document.getElementById('location_a').value;
  var end = document.getElementById('location_b').value;
  var travelMode = google.maps.DirectionsTravelMode.DRIVING;

  var request = {
        origin: start,
        destination: end,
        travelMode: travelMode
  };
  debugger
  directionsService.route(request, function(response, status) {
    if(status == google.maps.DirectionsStatus.OK) {
      polyline.setPath([]);
      var bounds = new google.maps.LatLngBounds();
      startLocation = new Object();
      endLocation = new Object();
      directionsDisplay.setDirections(response);
      var route = response.routes[0];

      // For each route, display summary information.
      var path = response.routes[0].overview_path;
      var legs = response.routes[0].legs;

      for (i=0;i<legs.length;i++) {
        if (i == 0) { 
          startLocation.latlng = legs[i].start_location;
          startLocation.address = legs[i].start_address;
          marker = createMarker(legs[i].start_location,"midpoint","","green");
        }
        endLocation.latlng = legs[i].end_location;
        endLocation.address = legs[i].end_address;
        var steps = legs[i].steps;
        for (j=0;j<steps.length;j++) {
          var nextSegment = steps[j].path;
          for (k=0;k<nextSegment.length;k++) {
            polyline.getPath().push(nextSegment[k]);
            bounds.extend(nextSegment[k]);
          }
        }
      }

      polyline.setMap(map);

      computeTotalDistance(response);
    } else {
      alert("directions response "+status);
    }
  });
  
}


var totalDist = 0;
var totalTime = 0;

function computeTotalDistance(result) {
  totalDist = 0;
  totalTime = 0;
  var myroute = result.routes[0];
  for (i = 0; i < myroute.legs.length; i++) {
    totalDist += myroute.legs[i].distance.value;
    totalTime += myroute.legs[i].duration.value;      
  }

  putMarkerOnRoute(50);

  totalDist = totalDist / 1000.
  document.getElementById("total").innerHTML = "total distance is: "+ totalDist + " km<br>total time is: " + (totalTime / 60).toFixed(2) + " minutes";
}

function putMarkerOnRoute(percentage) {
  var distance = (percentage/100) * totalDist;
  var time = ((percentage/100) * totalTime/60).toFixed(2);
  if (!marker) {
    marker = createMarker(polyline.GetPointAtDistance(distance));
  } else {
    marker.setPosition(polyline.GetPointAtDistance(distance));
    marker.setTitle("time:"+time);
  }
}

function createMarker(latlng) {
  var contentString = '<div>THIS IS MY MIDPOINT</div>';
  var marker = new google.maps.Marker({
      position: latlng,
      map: map,
      // title: label,
      zIndex: Math.round(latlng.lat()*-100000)<<5
      });
      // marker.myname = label;

  google.maps.event.addListener(marker, 'click', function() {
    infowindow.setContent(contentString+"<br>"+marker.getPosition().toUrlValue(6)); 
    infowindow.open(map,marker);
  });
  return marker;
}


  // {
    // origin: start,
    // destination: end,
    // travelMode: 'WALKING'
  // }, function(response, status) {
  //   if (status === 'OK') {
  //     directionsDisplay.setDirections(response);
  //   } else {
  //     window.alert('Directions request failed due to ' + status);
  //   }
  // });
// }

function getStartAndEndLocationCoords(oldInfoWindow) {
  var location = document.getElementsByName('location');

  var startAndEndLocationCoords = [];
  // go through each location and geocode;?
  // goes through each location entered and get the geocode.
  for(var i=0; i < location.length; i++) {
    var address = location[i].value;
    geocoder.geocode( { 'address': address}, function(results, status) {
    var _lat = results[0].geometry.location.lat()
    var _lng = results[0].geometry.location.lng()
      if (status == 'OK') {
        startAndEndLocationCoords.push(_lat);
        startAndEndLocationCoords.push(_lng);
        if (startAndEndLocationCoords.length == 4) {
          // console.log('calculating midpoint')
          calculateMidpoint(startAndEndLocationCoords, oldInfoWindow);
        }
      } else {
        alert('Geocode was not successful for the following reason: ' + status);
      }    
    });
  }
}

function calculateMidpoint(startAndEndLocationCoords, oldInfoWindow) {
  var _lat = (startAndEndLocationCoords[0] + startAndEndLocationCoords[2])/2.0;
  var _lng = (startAndEndLocationCoords[1] + startAndEndLocationCoords[3])/2.0;

  var midpointCoords = {"lat": _lat, "lng": _lng};

  placeMidpointMarker(midpointCoords);
  map.setCenter(midpointCoords); 

  markYelpBusinessesOnMap(midpointCoords, oldInfoWindow);
}


function markYelpBusinessesOnMap(midpointCoords, oldInfoWindow) {
  var venue_type = document.getElementById("venue_type_selections").value;
  var params = {"lat": midpointCoords["lat"], 
                "lng": midpointCoords["lng"],
                "venue_type": venue_type}

  $.get("/yelp_search.json", params, function(yelpResults) {
    // console.log(yelpResults);
    for(let i=0; i < yelpResults.length; i++) {
      address = yelpResults[i]['location']['address1'];
      geocoder.geocode( { 'address': address}, function(businessResults, status) {
        // businessResults no longer null during subsequent search
        // console.log("BUSINESS RESULTS: ");
        // console.log(businessResults);
        // console.log("end busiess results"); // TO DO: this is null when you do a subsequent search -- why?
        var _lat = businessResults[0].geometry.location.lat();
        var _lng = businessResults[0].geometry.location.lng();
        if (status == 'OK') {
          var yelp_marker = new google.maps.Marker({
            position: {lat: _lat, lng: _lng},
            map: map
          });

          yelp_marker.setIcon('http://maps.google.com/mapfiles/ms/icons/blue-dot.png');
          
          var business_phone = yelpResults[i]['display_phone'];
          var business_street_address = yelpResults[i]['location']['display_address'][0];
          var business_city_zip = yelpResults[i]['location']['display_address'][1];
          var complete_business_address = business_street_address + ", " + business_city_zip;

          var rating = yelpResults[i]['rating'];
          var review_count = yelpResults[i]['review_count'];
          var url = yelpResults[i]['url']

          var price = yelpResults[i]['price'];
          var name = yelpResults[i]['name'];

          var latOfBusiness = yelpResults[i]['coordinates']['latitude'];
          var lngOfBusiness = yelpResults[i]['coordinates']['longitude'];

          var coordsOfOneBusiness = {"lat": latOfBusiness, "lng": lngOfBusiness};

          
          var yelpBusinessDict = {
            "complete_business_address": complete_business_address,
            "business_phone": business_phone,
            "image_url": yelpResults[i].image_url,
            "name": name
          }
          
          var yelpBusinessInfowindowDetails = 
            '<div id="content">'+
              '<h3 id="firstHeading" class="firstHeading">' + name + '</h3>' +
              '<div id="bodyContent">'+
                '<p>' + business_phone + '<br>' +
                  complete_business_address + '<br>' +
                  'Price: ' + price + '<br>' +
                  'Rating: ' + rating + '<br>' +
                  'Review Count: ' + review_count +
                '</p>' +
                'Click ' + '<span><a href=' + url + '>' +
                'here' + '</a> '+ 'to view this business on Yelp!' +
                '</span>'+ '<br><br>' +
                '<form id="inviteForm">' + 
                  'E-mail: ' + '<br>' + 
                  '<input type="text" id="inviteEmail" name="inviteEmail" value="emily@gmail.com">' + 
                  '<span>' + '<button type="submit" class="inviteFriendButton" value="submit">invite</button>' +
                  '</span>' +
                '</form>' +
              '</div>'+
            '</div>';

          var newInfoWindow = new google.maps.InfoWindow({
            content: yelpBusinessInfowindowDetails
          });


          yelp_marker.addListener('click', function() {
            openInfoWindowAndCallInvitationHandler(newInfoWindow, complete_business_address, name, yelp_marker, oldInfoWindow);
          });

          showBusinessOnLeftScreen(yelpBusinessDict);
          // end info window
        } else {
          alert('Geocode was not successful for the following reason: ' + status);
        }    
    });
  }
  });
}


function showBusinessOnLeftScreen(yelpBusinessDict) {
  var yelpBusinessInfowindowDetails = 
    '<div id="bodyContent">'+
    '<h3 id="firstHeading" class="firstHeading">' + name + '</h3>' +
      '<p>' + yelpBusinessDict.name + '<br>' +
        yelpBusinessDict.complete_business_address + '<br>' +
        yelpBusinessDict.business_phone + '<br>' +
      '</p>' +
    '</div>' + '<hr>';

  $(".yelp_business_details").append(yelpBusinessInfowindowDetails);
}


function clearYelpListing() {
  $(".yelp_business_details").empty();
}


function openInfoWindowAndCallInvitationHandler(newInfoWindow, complete_business_address, name, yelp_marker, oldInfoWindow) {
  if(oldInfoWindow.oldWindow == null) {
    newInfoWindow.open(map, yelp_marker);
    oldInfoWindow.oldWindow = newInfoWindow;
  } else {
    oldInfoWindow.oldWindow.close(map, yelp_marker);
    newInfoWindow.open(map, yelp_marker);
    oldInfoWindow.oldWindow = newInfoWindow;
  }

  $(".inviteFriendButton").click(function(evt){ 
    evt.preventDefault(); 

    var emailOfPersonInvited = document.getElementById("inviteEmail").value;

    $.post(
      url="/add_invitation", 
      data= {"email": emailOfPersonInvited, 
              "businessAddress": complete_business_address,
              "businessName": name}, 
      // check for valid email, need to be a registered user to be Ok
      function(result){
        if(result["status"] !== "Ok") {
          console.log("invalid email!!! :(");
          // need to figure out how to make this htmlcontent to show up in a certain area of my page
          var invitation_failed_message = '<div>' + 
            data["email"] + " is an invalid email!" + " Please try again."
            '</div>';
          $("#successFailureMessage").html(invitation_failed_message)
                                      .fadeIn()
                                      .fadeOut(3000)
   
        } else {
          var invitation_success_message = '<div>' + 
            result["recipient_name"] +  " has been invited to " + name + "at " + 
              complete_business_address + "."
            '</div>';
          try {
          $("#successFailureMessage").html(invitation_success_message)
                                      .fadeIn()
                                      .fadeOut(3000)
          }
          catch(err) {
            console.log(err.message);
          }
        }
        setTimeout(function() { $("#successFailureMessage").val('');}, 6000);
      }
    );
  });
}

// TO DO: midpoint marker should NOT be global. you can pass midpointmarker here as a parameter
// and call setPosition on it.
// if midpoint marker doesnt exist, you can call something like createMidpointMarker
function placeMidpointMarker(midpointCoords, midpointMarker) {
  if (midpointMarker) {
    midpointMarker.setPosition(midpointCoords);
  } else {
    createMidpointMarker(midpointCoords);
  }
}


function createMidpointMarker(coords) {
  var midpointMarker = new google.maps.Marker({
      position: coords,
      map: map
  });
}

// TO DO: midpoint marker should NOT be global. you can pass midpointmarker here as a parameter
// and call setPosition on it.
// if midpoint marker doesnt exist, you can call something like createMidpointMarker
function placeMidpointMarker(coords, midpointMarker) {

  // console.log(midpointMarker)
  if (midpointMarker) {
    // clear the map
    // create a new map with new midpoint
    midpointMarker.setPosition(coords);
  } else {
    // console.log('new google maps')
    // change midpointMarker color
    createMidpointMarker(coords);
    // midpointMarker = new google.maps.Marker({
    //   position: coords,
    //   map: map
    // });
  }
}


function createMidpointMarker(coords) {
  var midpointMarker = new google.maps.Marker({
      position: coords,
      map: map
  });
}

// user will remain on invitations page after responding to invitation, not taken to json request
$(".respond_to_invitation").submit(function(evt) {
    evt.preventDefault();
    var formData = $(this).closest('form').serializeArray();

    var data = {"invite_id": $(this).data("id"),
                "selection": formData[0].value}


    $.post("/invitations", data, function() {
        console.log("yay!");
    })
})

initialize();


