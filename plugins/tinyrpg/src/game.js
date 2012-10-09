 var Dice = require('./dice');
 var Character = require('./entity').Character;
 var Item = require('./entity').Item;
 var AI = require('./ai');
 var FSM = require('../lib/fsm');
 var Dispatcher = require('../lib/dispatcher');
 var Grid = require('../lib/grid');
 var Vector = require('../lib/vector');
 var Generators = require('./generators');



 function Game(bot) {
   this.Rooms = {
       'Lobby' : {}
   }

   this.bot = bot;
   this.running = false;
   this.Characters = {};
   this.Players = {};
   //Init rooms
   /*
   for(var room in this.Rooms) {
     this.Rooms[room] = new Grid(500);
   }*/
 }

 //Expose singleton
 Game.Dispatcher = Dispatcher;

 Game.prototype.maxPlayerLevel = function() {
	var max = 1;
	for(var p in this.Players) {
		if (this.Players[p].Level > max) {
			max = this.Players[p].Level;
		}
	}
	
	console.log("MAXLEVEL:", max);
	return max;
 }
 
 Game.prototype.tick = function() {
	var chars = Object.keys(this.Characters);
	var charcount = chars.length;
	console.log("TICK:charcount", charcount);
	if(charcount < 12) {
		//Spawn roll
		var roll = Dice.DX(100);
		console.log("TICK:spawnroll", roll);
		if(roll < 20) {			
			var monsters = new Generators.MonsterGenerator().generate(1, this.maxPlayerLevel());
			
			for(var m in monsters) {
				var mon = monsters[m];
				this.Characters[mon.Name] = mon;
				Dispatcher.Emit({ Type: 'spawn', Message : { actor : mon.Name}});
			}
		}
	}
 }

 Game.prototype.start = function() {
   var that = this;
   that.running = true;

   console.log("Starting game...");
   setInterval(function() {

      if(!that.running) return;

      for(var char in that.Characters) {
        var c = that.Characters[char];
        c.AI.runCurrent(c);
		//c.Regen();
        //console.log(that.CH);
      }

      for(var pl in that.Players) {
        var p = that.Players[pl];
        p.AI.runCurrent(p);
		p.Regen();
        //console.log(char.AI);
      }
		
		that.tick();
     console.log("Tick");
   }, 2000);

 };

 
 Game.prototype.spendPoints = function(name, stat, points, _cb) {
	var player = this.getPlayerByName(name, function(e, player) {
		if(e || !player) _cb('Nope');
		
		var p = parseInt(points);		
		if(p <= player.Unassigned) {
			player[stat.toUpperCase()+ 'base'] += p;
			player.Unassigned -= points;
			player.Reset();
		}
	});
 }
 
 Game.prototype.equipInventory = function(name, index) {
   var player = this.Players[name];

   if(!player) return;

   var item = player.Inventory[index];

   if(!item) return;

   player.Equip(item);
   player.Reset();
 };

 Game.prototype.getInventory = function(name, _cb) {
   var player = this.Players[name];

   if(!player) return _cb('Nope');

   _cb(null, player.Inventory);
 };

 Game.prototype.lookRoom = function(player, _cb) {
   var chars = Object.keys(this.Characters);
   var players = Object.keys(this.Players);

   _cb(null, players.concat(chars));
 };

 Game.prototype.playerDeath = function(name) {
   delete this.Players[name];
   delete this.Characters[name];
 };

 Game.prototype.findCharacter = function(searchstr, _cb) {
   var charkeys = Object.keys(this.Characters);
   var playkeys = Object.keys(this.Players);

   var usearch = searchstr.toUpperCase();

    var hit = -1;
   var plhit = -1;

   for(var i = 0, l = charkeys.length; i< l; i++) {
     if(charkeys[i].toUpperCase().indexOf(usearch) > -1) {
       hit = i;
       break;
     }
   }

   for(var i = 0, l = playkeys.length; i< l; i++) {
     if(playkeys[i].toUpperCase().indexOf(usearch) > -1) {
       plhit = i;
       break;
     }
   }

   console.log(hit, charkeys);

   if(hit > -1) {
     _cb(null, this.Characters[charkeys[hit]]);
   }
   else if (plhit > -1) {
     _cb(null, this.Players[playkeys[plhit]]);
   }
   else {
     _cb("No such character found");
   }
 }

 Game.prototype.spawnMonster = function(_cb) {
   var gen = new Generators.MonsterGenerator().generate(10,1);

   for(var mon in gen) {
     var m = gen[mon];

     this.Characters[m.Name] = m;
   }

   _cb(null, gen[0]);
 }

 Game.prototype.getPlayerByName = function(name, _cb) {
   var p = this.Players[name];

   if(!p) _cb('No such player');

   _cb(null, p);
 }

 Game.prototype.newPlayer = function(name, _cb) {
   var player = new Character({ STR: 0, DEX: 0, MIND: 0, Name : name, pos : new Vector(1,1)});
   player.AI = new FSM(AI.Generic, 'Idle');
 
  
  var level = 1;

    player.Unassigned = level * 5;
  player.Level = level;
  
  player.Update();
  player.Reset();
  
  // var Sword = new Item({ DEX : 1, Name : 'Sword of Quickness', DRoll : 5, Type : 'Weapon'});
   //var Armor = new Item({ AC : 5, Name : 'Cloak of Pew', Type : 'Armor'});

   /*
   player.Equip(Sword);
   player.Equip(Armor);
   player.Reset();
   */

   this.Players[name] = player;

   _cb(null, player);
 }
 
 module.exports = Game;
 
 
 
 
 