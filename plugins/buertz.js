"use strict";
var http = require('http'),
fs = require('fs'),
util = require('util'),
Admin = require("./buertz/buertzAdmin.js");

var buertzList = "./resources/buertz/Öl.txt";

var admin = null;
var buertzors = [];

function randomBuertz(cb, filter, filterparameters) {
  if (buertzors.length === 0){
    init(cb);
    cb(null, 'inga buertz än, vänta nån sekund...');
    return;
  }
  var useFilter = false;
  var filtered = [];

  if (filter !== undefined){
    filter = filter.toLowerCase();
    if (filter.indexOf("sek") === -1 )
    {
    filtered = buertzors.filter(
      function (element) {
        return (parseFloat(element.Alkoholhalt[0].replace('%')) >= filter);
      }
    );
    useFilter = true;
    } else {
    filtered = buertzors.filter(
      function (element) {
      return (parseFloat(element.Prisinklmoms[0]) <= parseFloat(filterparameters));
      }
    );
    useFilter = true;
    }
  }

  var data = "";
  for (var i = 0; i < 5; i++) {

    var buertz = null;
    if (useFilter && filtered.length !== 0){
      buertz = filtered[Math.floor(Math.random() * filtered.length)];
    }
    else {
      buertz = buertzors[Math.floor(Math.random() * buertzors.length)];
    }
    data += buertz.Namn + ' ' + (typeof buertz.Namn2[0] === "string" ? buertz.Namn2[0] : '')  +  ' , ' + buertz.Alkoholhalt + ' , SEK ' + buertz.Prisinklmoms[0].substr(0,buertz.Prisinklmoms[0].length -1) + ' (' + buertz.Volymiml + 'ml) \n';
  }
  cb(null,data);
}

function refresh(cb){
  if (admin === null){
    admin = new Admin();

    admin.emitter.on('refreshed',function(){
      load(cb);
    });
  }
  admin.refresh(cb);

}

function load(cb){
  fs.readFile(buertzList, function (err, data) {
    if (err) {
      throw err;
    }
    buertzors = JSON.parse(data);
    cb(null,'nu finns det buertz');
  });
}

function init(cb){
  fs.exists(buertzList, function (exists) {
    if(exists){
      load(cb);
    }
    else {
      refresh(cb);
    }
  });
}

function info(cb,name){
  if (buertzors.length === 0){
    init(cb);
    cb(null, 'inga buertz än, vänta nån sekund...');
    return;
  }

  var buertz =  buertzors.filter(
    function (element) {
      return (element.Namn[0].toLowerCase().indexOf(name) > -1 );
    }
  );
  var data = "";

  if (buertz.length === 1) {
    for (var i = buertz.length -1; i>=0;i--) {
      if (data !== "" ) {
        data += "\n";
      }
      data += buertz[i].Namn + ' ' + (typeof buertz[i].Namn2[0] === "string" ? buertz[i].Namn2[0] : '')  ;
      data += '\n  Alkohol halt: ' + buertz[i].Alkoholhalt ;
      data += '\n  Typ     : ' + buertz[i].Varugrupp[0].substr(4);
      data += '\n  Pris    : ' + buertz[i].Prisinklmoms[0].substr(0,buertz[i].Prisinklmoms[0].length -1);
      data += '\n  nr      : ' + buertz[i].Varnummer;
      data += '\n  Förpackning : ' + buertz[i].Volymiml + 'ml ' + buertz[i].Forpackning;
      data += '\n  Producent   : ' + buertz[i].Producent;
      data += '\n  Leverantör  : ' + buertz[i].Leverantor;
      data += '\n  Sälj start  : ' + buertz[i].Saljstart;
    }
    cb(null,data);
  } else if(buertz.length > 1){
    for (var n = buertz.length -1; n>=0;n--){
      data += buertz[n].Namn + ' ' + (typeof buertz[n].Namn2[0] === "string" ? buertz[n].Namn2[0] : '') + '\n' ;
    }
    cb(null,data);
  }
}

function hangman(cb){
  if (buertzors.length === 0){
    cb(null,'burpaderp');
    return;
  }
  var list = "";
  buertzors.forEach(function(beer){
    var n = beer.Namn +  (typeof beer.Namn2[0] === "string" ? ' ' + beer.Namn2[0] : '');
    if (list === ""){
      list = n.replace(',','') ;
    }else{
      list += ',' +  n.replace(',','') ;
    }
  });

  fs.open('./resources/hangman/öl.txt', 'w', 666, function(err, fd) {
    if(err) {
      throw err;
    }

    fs.write(fd,  list, null, undefined, function(err, written) {
      fs.close(fd, function(){
        cb(null, 'hangman file saved, ' + written + ' bytes written');
      });
    });
  });
}

function sayBeer (bot, from, to, message)
{
  var parts = message.split(" ");
  var command = parts[1];
  var rest = parts.slice(2,parts.length).join(" ");

  var callback = function(err, d) {
    if(err) {
      throw err ;
    }

    bot.say(to, d);
  };

  switch(command) {

    case "refresh":
      refresh(callback);
      break;
    case "info":
      info(function(err, d) {
        if(err){
          throw err;
        }
        bot.say(from, d);
      }, rest);
      break;
    case "hangman":
      hangman(callback);
      break;
    case "help":
      callback(null,'!BUERTZ!');
      callback(null,'utan command slumpas 5 öl, ange en siffra för alkohol halten som skall överstigas...');
      callback(null,'BUERTZ commands: ');
      callback(null,'   refresh: Hämtar ny lista för tornby från systemets hemsida. ');
      callback(null,'   info [namn]: Ger extra info om ölet. [namn] = namnet.');
      callback(null,'        Systemet hanterar dock 2 fält, så får man ingen träff på:');
      callback(null,'           !buertz info Paulaner Münchener Hell');
      callback(null,'        borde man söka på: ');
      callback(null,'           !buertz info Paulaner');
      callback(null,'!BUERTZ!');
      break;
    default :
      randomBuertz(callback, command, rest);
      break;
  }

}

exports.listeners = function(){
  return [{
    name : 'Buertz',
    match : /^\!buertz/i,
    func : sayBeer,
    listen : ["#sogeti", "priv"]
  }];
};
