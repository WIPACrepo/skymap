// Object.assign polyfill
if (typeof Object.assign != 'function') {
  Object.assign = function(target, varArgs) { // .length of function is 2
    'use strict';
    if (target == null) { // TypeError if undefined or null
      throw new TypeError('Cannot convert undefined or null to object');
    }
    var to = Object(target);
    for (var index = 1; index < arguments.length; index++) {
      var nextSource = arguments[index];
      if (nextSource != null) { // Skip over if undefined or null
        for (var nextKey in nextSource) {
          // Avoid bugs when hasOwnProperty is shadowed
          if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
    }
    return to;
  };
}

function toDegrees(angle) {
  return angle * (180 / Math.PI);
}
function toRadians(angle) {
  return angle * (Math.PI / 180);
}

conversions = (function(){
  var ret = {
    altaz2horiz: function(alt, az, lat) {
      var lat_rad = toRadians(lat+90); // input is -90 to 90, but we need 0 to 180
      console.log(lat_rad);

      var dec = Math.asin(-1*Math.cos(az)*Math.cos(alt)*Math.cos(lat_rad) + Math.sin(alt)*Math.sin(lat_rad));

      var f = Math.sin(az)*Math.cos(alt);
      var g = Math.cos(az)*Math.cos(alt)*Math.sin(lat_rad) + Math.sin(alt)*Math.cos(lat_rad);
      var ha = Math.atan2(f,g);

      return {dec: toDegrees(dec), ha: toDegrees(ha)};
    },
    horiz2equatorial: function(time, dec, ra) {
      var MJD = time/86400;

      // JC Time from J2000.0 in Julian centuries
      // JC =(JulianDay - 2451545.0)/36525.0;
      // MJD is standard modified Julian day: MJD = JulianDay - 2400000.5
      var JC  = (MJD - 51544.5) / 36525.0;

      var zeta = toRadians((0.6406161 + (0.0000839 + 0.0000050*JC)*JC)*JC);
      var z  = toRadians((0.6406161 + (0.0003041 + 0.0000051*JC)*JC)*JC);
      var theta = toRadians((0.5567530 - (0.0001185 + 0.0000116*JC)*JC)*JC);

      var cosTheta = Math.cos(theta);
      var sinTheta = Math.sin(theta);

      ra = toRadians(ra);
      dec = toRadians(dec);
      var sinDec = Math.sin(dec);
      var cosDec = Math.cos(dec);
      var cosRA  = Math.cos(ra-z);

      var dec_eq = toDegrees(Math.asin(-1 * cosRA * sinTheta * cosDec + cosTheta * sinDec));

      if( dec_eq == 90.0 ) {
        // declination is 90 -> RA is anything, return 0.0
        return {dec: dec_eq, ra: 0.0};
      }

      var s1 = Math.sin(ra-z) * cosDec;
      var c2 = cosRA * cosTheta * cosDec + sinTheta * sinDec;

      var ra_eq  = toDegrees(Math.atan2(s1,c2) - zeta);
      if (ra_eq < 0)
        ra_eq += 360;

      return {dec: dec_eq, ra: ra_eq};
    },
    altaz2equatorial : function(params) {
      params = Object.assign({
        altitude: 0,
        azimuth: 0,
        latitude: 0,
        longitude: null,
        local_sidereal: null,
        date: null
      }, params);
      if (params.local_sidereal == null) {
        // try using date + longitude
        if (params.date == null || params.longitude == null) {
          throw "Must supply either local_sidereal or date + longitude";
        }
        params.local_sidereal = astrojs.dates.getLST(params.date, params.longitude);
      }
      var horiz = ret.altaz2horiz(params.altitude, params.azimuth, params.latitude);
      return ret.horiz2equatorial(params.local_sidereal, horiz.dec, horiz.ha);
    }
  };
  return ret;
})();
