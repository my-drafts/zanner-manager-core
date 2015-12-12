
var aw = require('async').waterfall;
var fs = require('fs');
var path = require('path');
var pf = require('util').format;
var uis = require('util').inspect;
var logger = require('zanner-logger')('core');
var of = require('zanner-typeof').of;
var aliasManager = require('zanner-manager-alias');
var middleManager = require('zanner-manager-middle');
var replyManager = require('zanner-manager-reply');

var core = module.exports = function(_log){
	var self = this;

	var log = function(){
		(_log ? _log : logger.log).apply(self, arguments);
	};

	var am = self._aliasManager = new aliasManager();
	var mm = self._middleManager = new middleManager(self);
	var rm = self._replyManager = new replyManager(self);

	// alias
	this.alias = function(name){
		var args = Array.prototype.slice.call(arguments, 1);
		log('debug', 'alias("%s", %j)', name, args);
		return am.run(name, args);
	};

	// middle
	this.middleRegister = function(middlePath, next){
		fs.readdir(path.join(__dirname, middlePath), function(error, items){
			if(error){
				log('error', '[middleRegister]: %j', error);
				return;
			}
			for(var index in items){
				var item = items[index], itemPath = path.join(__dirname, middlePath, item);
				if(!item.match(/[\.]js$/i) && !fs.statSync(itemPath).isDirectory()) continue;
				var middle = require(itemPath);
				var set = coreSet(mm, am, middle, true);
				switch(set){
					case 'object':
						log('error', '[middleRegister]: middle [%s] has wrong type', itemPath);
						break;
					case 'id':
						log('error', '[middleRegister]: middle [%s] has no id', itemPath);
						break;
					case 'execute':
						log('error', '[middleRegister]: middle [%s] has no execute', itemPath);
						break;
					case 'match':
						log('error', '[middleRegister]: middle [%s] has no match', itemPath);
						break;
					case 'order':
						log('error', '[middleRegister]: middle [%s] has no order', itemPath);
						break;
					case 'set':
						log('error', '[middleRegister]: middle [%s] registeration', itemPath);
						break;
					case true:
						log('debug', '[middleRegister]: middle & alias registration');
						break;
					default:
						log('debug', '[middleRegister]: middle unknown %j', set);
				}
			}
			log('debug', 'middle registration done');
			mm.done();
			if(of(next, 'function')) next();
		});
	};

	// middle register undo
	this.middleRegisterUndo = function(id){
		log('debug', 'middle ("%s") undo alias registration', id);
		mm.aliasStoreUndo(id, function(alias){
			am.unset(alias);
		});
		log('debug', 'middle ("%s") undo registration', id);
		mm.unset(id);
		log('debug', 'middle undo registration done');
		mm.done();
	};

	// reply register
	this.replyRegister = function(replyPath, next){
		fs.readdir(path.join(__dirname, replyPath), function(error, items){
			if(error){
				log('error', '[replyRegister]: %j', error);
				return;
			}
			for(var index in items){
				var item = items[index], itemPath = path.join(__dirname, replyPath, item);
				if(!item.match(/[\.]js$/i) && !fs.statSync(itemPath).isDirectory()) continue;
				var reply = require(itemPath);
				var set = coreSet(rm, am, reply, false);
				switch(set){
					case 'object':
						log('error', '[replyRegister]: reply [%s] has wrong type', itemPath);
						break;
					case 'id':
						log('error', '[replyRegister]: reply [%s] has no id', itemPath);
						break;
					case 'execute':
						log('error', '[replyRegister]: reply [%s] has no execute', itemPath);
						break;
					case 'match':
						log('error', '[replyRegister]: reply [%s] has no match', itemPath);
						break;
					case 'set':
						log('error', '[replyRegister]: reply [%s] registeration', itemPath);
						break;
					case true:
						log('debug', '[replyRegister]: reply & alias registration');
						break;
					default:
						log('debug', '[replyRegister]: reply unknown', set);
				}
			}
			log('debug', 'reply registration done');
			rm.done();
			if(of(next, 'function')) next();
		});
	};

	// reply register undo
	this.replyRegisterUndo = function(id){
		log('debug', 'reply ("%s") undo alias registration', id);
		mm.aliasStoreUndo(id, function(alias){
			am.unset(alias);
		});
		log('debug', 'reply ("%s") undo registration', id);
		mm.unset(id);
		log('debug', 'reply undo registration done');
		mm.done();
	};

	// run
	this.run = function(request, response){
		log('notice', 'run {uri:"%s", method:"%s", host:"%s"}', request.url, request.method, request.headers.host);
		var z = request.z = response.z = { alias: self.alias };
		aw(mm.run(z, request, response), rm.run);
	};
};

core.prototype.inspect = function(depth){
	var a = uis(this._aliasManager, {depth:0});
	var m = uis(this._middleManager, {depth:0});
	var r = uis(this._replyManager, {depth:0});
	return pf('core{%s,%s,%s}', a, m, r);
};



var coreSet = function(_manager, _alias, _item, f){
	if(of(_item, 'array')){
		var result = true;
		for(var index in _item){
			var set = coreSet(_manager, _alias, _item[index], f);
			if(of(set, 'string')) return set;
			else if(result!==true) continue;
			else if(set!==true) result = set;
		}
		return result;
	}
	else if(!of(_item, 'object')) return 'object';
	else if(!('id' in _item)) return 'id';
	else if(!('execute' in _item)) return 'execute';
	else if(!('match' in _item)) return 'match';
	else if(f && !('order' in _item)) return 'order';
	else if(!of(_manager.set(_manager.build(_item)), 'number')) return 'set';
	else{
		_manager.storeAlias(_item.id, function(alias){
			_alias.set(alias);
		});
		return true;
	}
	return undefined;
};
