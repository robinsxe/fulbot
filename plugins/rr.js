var util = require('util');
var Utils = require('../utils').Utils;

function doRussianRoulette(bot, from, to, message) {
  var isChan = Utils.isChanMessage(to);

  if(isChan && Utils.isUserOperator(bot, to, bot.nick)) {
    var users = Utils.userList(bot, to);

    var ua = Object.keys(users);

    console.log(ua);

    var me = ua.indexOf(bot.nick);

    //Dont kick self lol
    if(me > -1) {
      ua.splice(me,1);
    }

    var rnd = Math.floor(Math.random() * ua.length);

    var kick = ua[rnd];


    //console.log();

    bot.say(to, "I choose you, " + kick + "!!");

    var pew = Math.floor(Math.random() * 6) + 1;
    console.log(pew);
    if(pew == 3) {
      bot.say(to, 'Boom!');
      bot.send('kick', to, kick, 'You have been randomly selected for termination.');
    } else {
      bot.say(to, 'Klick.')
    }


  }
}

exports.listeners = function(){
  return [{
    name : '!rr listener',
    match : /^\!rr/i,
    func : doRussianRoulette,
    listen : ["#sogeti", "#botdev", "priv"]
  }];
};