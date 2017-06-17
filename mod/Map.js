var
GOOGLE_MAPS_API='https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=false&callback=_wf_maps_loaded&key=KEY',
dummyCB=function(){},
getState=function(self){
	var deps=self.deps

	// Marker
	var marker= new google.maps.Marker({
	  draggable: false
	})

	// Tooltip infowindow
	var infowindow= new google.maps.InfoWindow({
	  disableAutoPan: true
	})

  // LatLng center point
  var coords = deps.latlng
  var latlngObj = new google.maps.LatLng(coords[0], coords[1]);

  // Map instance
  var map = new google.maps.Map(self.el, {
	center: latlngObj,
	zoom: deps.zoom,
	maxZoom: 18,
	mapTypeControl: false,
	panControl: false,
	streetViewControl: false,
	scrollwheel: !deps.disableScroll,
	draggable: !deps.disableTouch, // TODO: touch device detection in lean?
	zoomControl: true,
	zoomControlOptions: {
	  style: google.maps.ZoomControlStyle.SMALL
	},
	mapTypeId: deps.style
  });
  self.map=map
  marker.setMap(map);

  // Fix position after first tiles have loaded
  google.maps.event.addListener(map, 'tilesloaded', function() {
	google.maps.event.clearListeners(map, 'tilesloaded');
	setMapPosition(self,latlngObj);
  });

  // Set initial position
  setMapPosition(self,latlngObj);
  marker.setPosition(latlngObj);
  infowindow.setPosition(latlngObj);

  // Draw tooltip
  var tooltip = deps.widgetTooltip;
  if (tooltip) {
	infowindow.setContent(tooltip);
	if (!self.infowindowOpen) {
	  infowindow.open(map, marker);
	  self.infowindowOpen = true;
	}
  }

  // Map style - options.style
  var style = deps.widgetStyle;
  if (style) {
	map.setMapTypeId(style);
  }

  // Zoom - options.zoom
  var zoom = deps.widgetZoom;
  if (zoom != null) {
	zoom = zoom;
	map.setZoom(Number(zoom));
  }

  // Click marker to open in google maps
  google.maps.event.addListener(marker, 'click', function() {
	window.open('https://maps.google.com/?z=' + zoom + '&daddr=' + coords.join(','));
  });
},
setMapPosition=function(self,latlngObj) {
	var map=self.map
	var el=self.el
	map.setCenter(latlngObj);
	var offsetX = 0;
	var offsetY = 0;
	var style=window.getComputedStyle(el)
	offsetX -= parseInt(style['paddingLeft'], 10);
	offsetX += parseInt(style['paddingRight'], 10);
	offsetY -= parseInt(style['paddingTop'], 10);
	offsetY += parseInt(style['paddingBottom'], 10);
	if (offsetX || offsetY) {
		map.panBy(offsetX, offsetY);
	}
	el.style.position='' // Remove injected position
}

return {
	deps:{
		latlng:['list',[1.3431,103.739795]],
		style:['text','roadmap'],
		zoom:['int',12],
		disableScroll:['bool',1],
		tooltip:['text',''],
    	googleMapsApiKey:['text','']
	},
	create:function(deps,params){
		var self=this
		this.super.create.call(this,deps,params)

		this.google=window.google

		var mapsLoaded=function(){
			window._wf_maps_loaded = dummyCB
			self.google = window.google
			getState(self)
		}

		if (this.google){
			mapsLoaded()
		}else{
			__.dom.link(GOOGLE_MAPS_API.replace('KEY',deps.googleMapsApiKey),'js',dummyCB)
			window._wf_maps_loaded=mapsLoaded
		}
	},
	rendered:function(){
		if (!window.google) return
		this.google.maps.event.trigger(this.map, 'resize')
	},
	events:{
		'RESIZE window':function(e, target){
			this.google.maps.event.trigger(this.map, 'resize')
			var coords = this.deps.latlng
			setMapPosition(this,new google.maps.LatLng(coords[0], coords[1]))
		}
	},
}
