var utils = {

  validateIp: function(ip) {
    if (/^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ip)) {
      return true;
    } else {
      return false;
    }
  },

  validateMac: function(mac) {
    // from: http://stackoverflow.com/questions/4260467/what-is-a-regular-expression-for-a-mac-address
    if (/^([0-9A-Fa-f]{2}[:]){5}([0-9A-Fa-f]{2})$/.test(mac)) {
      return true;
    } else {
      return false;
    }
  }

};

module.exports = utils;
