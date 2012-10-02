// winston-campfire
// -----------
// ## A [Winston](https://github.com/flatiron/winston) Transport for sending messages to Campfire chatroom.
// (C) 2011-2012, CircuitHub
// MIT License

// Dependencies
// ------------

var _            = require('underscore'),
  CampfireCleint = require('campfire').Campfire,
  winston        = require('winston'),
  util           = require('util');

// Local (Private) Variables
// -------------------------

// required variables - winston-sns will not start without at least these options.
var required = ["campfire_account", "campfire_token", "campfire_room_id"],
// optional variables (and their default values)
  optional = {
    // default title for notification (%e, %l, and %m are available here, same as in subject.)
    "subject" : "Winston Error Report",
    // default message for notification (%l is the level, %e is the error text, %m is the metadata.)
    "message" : "Error:\n%e",
    //
    // standard winston variables
    //
    "level" : "info",
    // handle exceptions?
    "handleExceptions" : false,
    // show json instead of inspecting
    "json" : false
  };

// Campfire Class
// ---------

var Campfire = winston.transports.Campfire = exports.Campfire = function(options){
  winston.Transport.call(this, options);
  // don't cause errors when options is empty
  options = options || {};
  // make sure we have the minimum required options
  var missing = [];
  required.forEach(function(r){
    if(!options.hasOwnProperty(r)) missing.push(r);
  });
  if(missing.length) throw "You must specify options: " + missing.join(",") + " to use winston-campfire.";
  // fill in optional options, and set an options object.
  this.options = o = _.defaults(options,optional);
  // set up campfire service
  this.chat = new CampfireCleint({
    ssl    : true,
    token  : o.campfire_token,
    account: o.campfire_account
  });
  // give name to the transport
  this.name = "CampfireTransport";
  // set up log levels
  this.level = o.level;
  // handle exceptions
  this.handleExceptions = o.handleExceptions;
};

// Inherit Winston's transport protocols
util.inherits(Campfire,winston.Transport);

// Public Methods
// --------------

// logging method that is exposed to Winston.
Campfire.prototype.log = function(level,msg,meta,callback){
  if(this.silent){
    return callback(null, true);
  }  
  // send it 
  var message = this.options.subject.replace('%l',level) + '\n' + msg.replace('%e',msg);
  var sendMessage = function(err,room){
    if(err){
      callback(err);
    }else{
      room.speak(message,function(err,response){
        // might just be able to pass the callback directly into sns, but let's be nice and return a bool.
        callback(err, !!response);
      });
    }  
  };  
  this.chat.room(this.options.campfire_room_id,_.once(sendMessage));  
};