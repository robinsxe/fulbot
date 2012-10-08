#!/usr/bin/env node

var irc = require("irc");
var Listener = require('./listeners').Listener;
var chanlisteners = new Listener();

var fs = require("fs");

var conf = {
  server : "irc.isolated.se",
  channels : ["#martin"],
  nick : "Martin"
};

var bot = new irc.Client(conf.server, conf.nick, {
  debug: true,
  channels : conf.channels
});


//init plugins
fs.readdir(__dirname + '/plugins', function(err, f) {
  if(err)
    throw err;

  f.forEach(function(file) {
    if(file.indexOf(".js") < 0) return;
    var plug = require(__dirname + "/plugins/" + file);
    var listener = plug.listener();
    
    if(listener.listen.indexOf('chan') > -1) {
      chanlisteners.addListener(listener);
    }


  });
});


chanlisteners.init(bot);

bot.addListener("message", function(from, to, message) {
  if( to.match(/^[#&]/)) {
    //Chan msg
    chanlisteners.checkListeners(from, to, message);
  } else {
    //Priv msg
  }
});


