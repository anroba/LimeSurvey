/*
 * @license This file is part of LimeSurvey
 * See COPYRIGHT.php for copyright notices and details.
 *
 */

$(document).ready(function()
{
	$(".location").each(function(index,element){
		var question = $(element).attr('name');
		var coordinates = $(element).val();
		var latLng = coordinates.split(" ");
		var question_id = question.substr(0,question.length-2);
		if ($("#mapservice_"+question_id).val()==1){
			// Google Maps
			if (gmaps[''+question] == undefined) {
				GMapsInitialize(question,latLng[0],latLng[1]);
			}
		}
		else if ($("#mapservice_"+question_id).val()==100){
			//  Maps
			if (osmaps[''+question] == undefined) {
				osmaps[''+question] = OSGeoInitialize(question,latLng);
			}
		}
		
		// Highlight search box text on click 
		$("#searchbox").click(function () {
		  $(this).select();
		});
		
	});

});

gmaps = new Object;
osmaps = new Object;
zoom = [];


function isvalidCoord(val){
	if (!isNaN(parseFloat(val)) && (val>-180 && val<180)) {
		return true;
	} else {
		return false;
	}
}


// OSMap functions
function OSGeoInitialize(question,latLng){
		
		// tiles layers def
		
		var mapquestOSM = L.tileLayer("http://{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png", {
		  maxZoom: 19,
		  subdomains: ["otile1", "otile2", "otile3", "otile4"],
		  attribution: 'Tiles courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">. Map data (c) <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> contributors, CC-BY-SA.'
		});
		var mapquestOAM = L.tileLayer("http://{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg", {
		  maxZoom: 10,
		  subdomains: ["oatile1", "oatile2", "oatile3", "oatile4"],
		  attribution: 'Tiles courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a>. Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency'
		});
		var mapquestHYB = L.layerGroup([L.tileLayer("http://{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg", {
		  maxZoom: 10,
		  subdomains: ["oatile1", "oatile2", "oatile3", "oatile4"]
		}), L.tileLayer("http://{s}.mqcdn.com/tiles/1.0.0/hyb/{z}/{x}/{y}.png", {
		  maxZoom: 19,
		  subdomains: ["oatile1", "oatile2", "oatile3", "oatile4"],
		  attribution: 'Labels courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a> <img src="http://developer.mapquest.com/content/osm/mq_logo.png">. Map data (c) <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> contributors, CC-BY-SA. Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency'
		})]);

		var baseLayers = {
		  "Street Map": mapquestOSM,
		  "Aerial Imagery": mapquestOAM,
		  "Imagery with Streets": mapquestHYB
		};
		var overlays = {
		};	
		
		var map = L.map("map", { 
			zoom:1,
			minZoom:1,
			center: [15, 15] ,
			maxBounds: ([[-90, -180],[90, 180]]),
			layers: [mapquestOSM]
		});
		
		//function zoomExtent(){ // todo: restrict to rect ?
		//	map.setView([15, 15],1);
		//}
		
		var pt1 = latLng[0].split("@");
		var pt2 = latLng[1].split("@");
		
		if ((pt1.length == 2) && (pt2.length == 2)) { // is Rect
			var isRect = true;
			lat = "";
			lng = "";
			minLat = pt1[0];
			minLng = pt1[1];
			maxLat = pt2[0];
			maxLng = pt2[1];
			map.fitBounds([[minLat, minLng],[maxLat, maxLng]]);
			map.setMaxBounds([[minLat, minLng],[maxLat, maxLng]]);
			UI_update("","");
		} else { // is default marker position
			var isRect = false;
			lat = latLng[0];
			lng = latLng[1];
		}
		
		if (isNaN(parseFloat(lat)) || isNaN(parseFloat(lng))) {
			lat=-9999; lng=-9999;
		}
		
		marker = new L.marker([lat,lng], {title:'Current Location',id:1,draggable:'true'});
		map.addLayer(marker);
		
		var layerControl = L.control.layers(baseLayers, overlays, {
		  collapsed: true
		}).addTo(map);
		
		map.on('click', 
			function(e) { 
				var coords = L.latLng(e.latlng.lat,e.latlng.lng);
				marker.setLatLng(coords);
				UI_update(e.latlng.lat,e.latlng.lng)
			}	
		)
		
		marker.on('dragend', function(e){
				var marker = e.target;
				var position = marker.getLatLng();
				UI_update(position.lat,position.lng)
		});
		
		var name = question.substr(0,question.length - 2);
		
		function UI_update(lat,lng){
			if (isvalidCoord(lat) && isvalidCoord(lng)) {
				//$("#answer"+question).val(Math.round(lat*100000)/100000 + " " + Math.round(lng*100000)/100000);
				$("#answer"+name).val(Math.round(lat*100000)/100000 + ";" + Math.round(lng*100000)/100000);
				$("#answer_lat"+question).val(Math.round(lat*100000)/100000);
				$("#answer_lng"+question).val(Math.round(lng*100000)/100000);
			} else {
				//$("#answer"+question).val("");
				$("#answer"+name).val("");
				$("#answer_lat"+question).val("");
				$("#answer_lng"+question).val("");
			}
			
		}
		
		$('.coords').each(function() {
			// Save current value of element
			$(this).data('oldVal', $(this));
			
			// Look for changes
			$(this).bind("propertychange keyup input cut paste", function(event){
			   // If value has changed...
			   if ($(this).data('oldVal') != $(this).val()) {
				// Updated stored value
				$(this).data('oldVal', $(this).val());
				
				var newLat = $("#answer_lat"+question).val();
				var newLng = $("#answer_lng"+question).val();
				
				if (isNumber(newLat) && isNumber(newLng)) {
					$("#answer"+name).val(newLat + ";" + newLng);
					marker.setLatLng(L.latLng(newLat,newLng));
				} else {
					$("#answer"+name).val("-- --");
					marker.setLatLng(L.latLng(9999,9999));
				}
			  }
			});
		  });

		 function isNumber(n){
			return !isNaN(parseFloat(n)) && isFinite(n);
		 }
		  
// ---------------------------------
/* Typeahead search functionality */

			var geonamesBH = new Bloodhound({
			name: "GeoNames",
			datumTokenizer: function (d) {
			  return Bloodhound.tokenizers.whitespace(d.name);
			},
			queryTokenizer: Bloodhound.tokenizers.whitespace,
			remote: {
			  url: "http://api.geonames.org/searchJSON?username="+LSmap.geonameuser+"&featureClass=P&maxRows=5&name_startsWith=%QUERY",
			  filter: function (data) {
				return $.map(data.geonames, function (result) {
				  return {
					name: result.name + ", " + result.countryName,
					lat: result.lat,
					lng: result.lng,
					source: "GeoNames"
				  };
				});
			  },
			  ajax: {
				beforeSend: function (jqXhr, settings) {
					if ($("#restrictToExtent").prop('checked')){
						settings.url += "&east=" + osmaps[''+question] .getBounds().getEast() + "&west=" + osmaps[''+question] .getBounds().getWest() + "&north=" + osmaps[''+question] .getBounds().getNorth() + "&south=" + osmaps[''+question] .getBounds().getSouth();
					}
					$("#searchicon").removeClass("fa-search").addClass("fa-refresh fa-spin");
				},
				complete: function (jqXHR, status) {
					geonamesBH.clearRemoteCache(); //clear cache
					$('#searchicon').removeClass("fa-refresh fa-spin").addClass("fa-search");
				}
			  }
			},
			limit: 10
		  });

			geonamesBH.initialize();

		  /* instantiate the typeahead UI */
		  $("#searchbox").typeahead({
			minLength: 3,
			highlight: true,
			hint: false
		  }, {
			name: "GeoNames",
			displayKey: "name",
			source: geonamesBH.ttAdapter(),
			templates: {
			  header: "<h4 class='typeahead-header'><img src='styles-public/images/globe.png' width='25' height='25'>&nbsp;GeoNames</h4>"
			}
		  }).on("typeahead:selected", function (obj, datum) {
			if (datum.source === "GeoNames") {
			  osmaps[''+question].setView([datum.lat, datum.lng], 13);
			  marker.setLatLng([datum.lat, datum.lng]);
			  UI_update(datum.lat, datum.lng);
			}
			
			if ($(".navbar-collapse").height() > 50) {
			  $(".navbar-collapse").collapse("hide");
			}
		  }).on("typeahead:opened", function () {
			$(".navbar-collapse.in").css("max-height", $(document).height() - $(".navbar-header").height());
			$(".navbar-collapse.in").css("height", $(document).height() - $(".navbar-header").height());
		  }).on("typeahead:closed", function () {
			$(".navbar-collapse.in").css("max-height", "");
			$(".navbar-collapse.in").css("height", "");
		  });
		  $(".twitter-typeahead").css("position", "static");
		  $(".twitter-typeahead").css("display", "block");
		//});
//----------- end geonames		
	
    return map;

}


//// Google Maps Functions (for API V3) ////
// Initialize map
function GMapsInitialize(question,lat,lng) {

	
	var name = question.substr(0,question.length - 2);
	var latlng = new google.maps.LatLng(lat, lng);
	
	var mapOptions = {
		zoom: zoom[name],
		center: latlng,
		mapTypeId: google.maps.MapTypeId.ROADMAP
	};
	
	var map = new google.maps.Map(document.getElementById("gmap_canvas_" + question), mapOptions);
	gmaps[''+question] = map;
    
	var marker = new google.maps.Marker({
		position: latlng,
		draggable:true,
		map: map,
		id: 'marker__'+question
	});
	gmaps['marker__'+question] = marker;
	
	google.maps.event.addListener(map, 'rightclick', function(event) {
		marker.setPosition(event.latLng);
		map.panTo(event.latLng);
		geocodeAddress(name, event.latLng);
		$("#answer"+question).val(Math.round(event.latLng.lat()*10000)/10000 + " " + Math.round(event.latLng.lng()*10000)/10000);
	});
	
	google.maps.event.addListener(marker, 'dragend', function(event) {
		//map.panTo(event.latLng);
		geocodeAddress(name, event.latLng);
		$("#answer"+question).val(Math.round(event.latLng.lat()*10000)/10000 + " " + Math.round(event.latLng.lng()*10000)/10000);
	});
}

// Reset map when shown by conditions
function resetMap(qID) {
	var question = $('#question'+qID+' input.location').attr('name');
	var name = question.substr(0,question.length - 2);
	var coordinates = $('#question'+qID+' input.location').attr('value');
	var xy = coordinates.split(" ");
	if(gmaps[question]) {
		var currentMap = gmaps[question];
		var marker = gmaps['marker__'+question];
		var markerLatLng = new google.maps.LatLng(xy[0],xy[1]);
		marker.setPosition(markerLatLng);
		google.maps.event.trigger(currentMap, 'resize')
		currentMap.setCenter(markerLatLng);
	}
}

// Reverse geocoder
function geocodeAddress(name, pos) {
	var geocoder = new google.maps.Geocoder();
	
	var city  = '';
	var state = '';
	var country = '';
	var postal = '';
	
	geocoder.geocode({
		latLng: pos
	}, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK && results[0]) {
			$(results[0].address_components).each(function(i, val) {
				if($.inArray('locality', val.types) > -1) {
					city = val.short_name;
				}
				else if($.inArray('administrative_area_level_1', val.types) > -1) {
					state = val.short_name;
				}
				else if($.inArray('country', val.types) > -1) {
					country = val.short_name;
				}
				else if($.inArray('postal_code', val.types) > -1) {
					postal = val.short_name;
				}
			});
			
			var location = (results[0].geometry.location);
		}
		getInfoToStore(name, pos.lat(), pos.lng(), city, state, country, postal);
	});
}

// Store address info
function getInfoToStore(name, lat, lng, city, state, country, postal){
    
	var boycott = $("#boycott_"+name).val();
    // 2 - city; 3 - state; 4 - country; 5 - postal
    if (boycott.indexOf("2")!=-1)
        city = '';
    if (boycott.indexOf("3")!=-1)
        state = '';
    if (boycott.indexOf("4")!=-1)
        country = '';
    if (boycott.indexOf("5")!=-1)
        postal = '';
    
    $("#answer"+name).val(lat + ';' + lng + ';' + city + ';' + state + ';' + country + ';' + postal);
}



/* Placeholder hack for IE */
if (navigator.appName == "Microsoft Internet Explorer") {
  $("input").each(function () {
    if ($(this).val() === "" && $(this).attr("placeholder") !== "") {
      $(this).val($(this).attr("placeholder"));
      $(this).focus(function () {
        if ($(this).val() === $(this).attr("placeholder")) $(this).val("");
      });
      $(this).blur(function () {
        if ($(this).val() === "") $(this).val($(this).attr("placeholder"));
      });
    }
  });
}
