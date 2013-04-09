var util = require('util');

function iterate(o, fn) {
	Object.keys(o).forEach(function(key, i) {
		fn(o[key], key, o);
	});
}

function length(o) {
	return Object.keys(o).length;
}

function normalize(x) {
	if(!x || typeof x !== 'object') {
		throw new Error("Argument must be an Object or an Array.");
	}
	if(x.toObject) {
		x = x.toObject();
	}
	if(!Array.isArray(x)) {
		x = [x];
	}
	var arr = [];
	x.forEach(function(o) {
		var _o = o;
		if(o.toObject) {
			_o = o.toObject();
		}
		iterate(_o, function(v, p) {
			var _obj = {};
			_obj[p] = v;
			arr.push(_obj);
		});
	});
	return arr;
}

function combine(n, arr) {
	if(n === 1) {
		return arr;
	}
	var or = [];
	comb(n, arr).forEach(function(a) {
		var _a = {$and:a};
		if(a.length === 1) {
			_a = a[0];
		}
		or.push(_a);
	});
	return or;
}

function bitprint(u, arr) {
  var s=[];
  for (var n=0; u; ++n, u>>=1)
    if (u&1) s.push(arr[n]);
  return s;
}
function bitcount(u) {
  for (var n=0; u; ++n, u=u&(u-1));
  return n;
}
function comb(c, arr) {
  var s=[], n = arr.length;
  for (var u=0; u<1<<n; u++)
    if (bitcount(u)==c)
      s.push(bitprint(u, arr));
  return s.sort();
}

function Qweary(criteria) {
	this._query = {$and:[]};
	if(criteria) {
		this.is(criteria);
	}
	return this;
}

Qweary.isQweary = function(q) {
	if(q.toString() === new Qweary().toString()) {
		return true;
	}
	return false;
};

Qweary.prototype.toObject = function() {
	if(this._query.$and.length > 1) {
		return this._query;
	} else if (this._query.$and.length === 1) {
		return this._query.$and[0];
	} else {
		return {};
	}
};

Qweary.prototype.toJSON = function() {
	return this.toObject();
};

Qweary.prototype.toString = function() {
	return "[object Qweary]";
};

Qweary.prototype.valueOf = function() {
	return {}.valueOf.call(this.toObject());
};

// Add a custom inspect method for Node.js (see: https://github.com/joyent/node/blob/master/lib/util.js)
Qweary.prototype.inspect = function(depth) {
	return util.inspect(this.toObject(), undefined, depth); //this is old way that arguments are ordered, and it's current for Node 0.8.x
};

Qweary.prototype.is = function(obj) {
	this._query.$and = this._query.$and.concat(normalize(obj));
	return this;
};

Qweary.prototype.and = Qweary.prototype.is;

Qweary.prototype.or = function(o) {
	o = normalize(o);
	var arg;
	if(o.length > 1) {
		arg = {$and:o};
	} else if(o.length) {
		arg = o[0];
	} else {
		arg = {};
	}
	return this.oneOf([this.toObject(), arg]);
};

Qweary.prototype.allOf = Qweary.prototype.is;
Qweary.prototype.andAllOf = Qweary.prototype.allOf;
Qweary.prototype.bothOf = Qweary.prototype.allOf;
Qweary.prototype.andBothOf = Qweary.prototype.bothOf;

Qweary.prototype.nOf = function(n, arr) {
	if(n > arr.length) {
		throw new Error("Number of required arguments exceeds number of arguments.");
	}
	if(n === 0) {
		return this.noneOf(arr);
	}
	this._query.$and = this._query.$and.concat({$or:combine(n, normalize(arr))});
	return this;
};
Qweary.prototype.andNOf = Qweary.prototype.nOf;

["one", "two", "three", "four", "five"].forEach(function(num, i) {
	Qweary.prototype[num+'Of'] = function(o) {
		return this.nOf(i+1, o);
	};
	Qweary.prototype['and'+num[0].toUpperCase()+num.slice(1)+'Of'] = Qweary.prototype[num+'Of'];
});

Qweary.prototype.either = Qweary.prototype.oneOf;
Qweary.prototype.andEither = Qweary.prototype.either;
Qweary.prototype.eitherOf = Qweary.prototype.either;
Qweary.prototype.andEitherOf = Qweary.prototype.eitherOf;

// .not({linkedin:true})										=> .concat({linkedin: {$ne: true} })
// .not({price:{$gt: 10}})										=> .concat({price: {$not: {$gt: 10} } })
// .not({price:{$gt: 10, $lte:20}})								=> .concat({price: {$not: {$gt: 10, $lte:20} } })
// .not([{linkedin:true}, {username:'Trey'}])					=> .concat({$nor: [{linkedin:true}, {username:'Trey'}] })
// .not([{linkedin:true}, {username: {$ne:null}}])				=> .concat({$nor: [{linkedin:true}, {username: {$ne:null} }] })
// .not({settings: {receive_email:true, other_setting:false}})	=> .concat({settings: {$ne: {receive_email:true, other_setting:false}}})
Qweary.prototype.not = function(arr) {
	arr = normalize(arr);
	// multiple statements should be negated with $nor
	var not = {$nor:arr};
	if(arr.length === 1) {
		// transforms a normalized array of length 1 into a statement like {field: {$not: expression } }
		not = {};
		var field = Object.keys(arr[0])[0];
		var value = arr[0][field];
		if(value && typeof value === 'object') {
			var keys = Object.keys(value);
			if(keys[0][0] === '$') { // check if this is an object of mongodb operators (there should never be a mix of operators and non-operators) All mongodb operators start with '$'
				not[field] = {$not:value}; 
			} else {
				not[field] = {$ne: value};// simple object, negated with $ne
			}
		} else {
			not[field] = {$ne: value}; // primitive value
		}
	}
	if(arr.length) {
		this._query.$and = this._query.$and.concat(not);
	}
	return this;
};
Qweary.prototype.andNot = Qweary.prototype.not;

Qweary.prototype.noneOf = Qweary.prototype.not;
Qweary.prototype.andNoneOf = Qweary.prototype.noneOf;
Qweary.prototype.neither = Qweary.prototype.noneOf;
Qweary.prototype.andNeither = Qweary.prototype.neither;
Qweary.prototype.neitherOf = Qweary.prototype.neither;
Qweary.prototype.andNeitherOf = Qweary.prototype.neitherOf;

// We have to do the inheritance on instantiation, otherwise the test for instanceof Document won't work.
module.exports = function(mongoose) {
	// Inherit from Mongoose#Document. This causes causes Mongoose#Query to cast the Qweary using Qweary#toObject
	// See Query.prototype.find in Mongoose (https://github.com/LearnBoost/mongoose/blob/master/lib/query.js, line 194)
	util.inherits(Qweary, mongoose.Document);
	return Qweary;
};