Qweary - MongoDB query construction
===================================
### Construct readable, complex logical MongoDB queries for use with Mongoose

Qweary makes it easier to build complex boolean queries for MongoDB (by way of Mongoose). It's used to build the conditions or criteria, not for setting updates to documents.

Installation
-------------

 using Git
``` bash
$ git clone git://github.com/treygriffith/Qweary.git node_modules/qweary/
```

Build a Query
-------------
Require the Qweary module, using your instance of Mongoose as the only parameter
```javascript
var Qweary = require('qweary')(mongoose);
```
To build a query, you create a new `Qweary` object:
``` javascript
var query = new Qweary();
```
Now let's add some conditions to our query. Let's say we're looking for users who have active accounts and either live in New York or Chicago
``` javascript
query.is({active:true}).andEither([{location: 'New York'}, {location: 'Chicago'}]);
```
What if we want people who have at least two skills that I need
``` javascript
query.andTwoOf([{skills: 'plumber'}, {skills: 'carpenter'}, {skills: 'electrician'}]);
```
And we don't want anyone without an email address
``` javascript
query.andNot({email:null});
```
Now we can feed this directly into a Mongoose query:
``` javascript
myModel.find(query, function(err, results) {
	if(err) {
		throw err;
	}
	console.log(results);
});
```
If we need to debug the query, we can print it to the console to see the underlying structure of the MongoDB query. For more depth, use the `inspect` method
``` javascript
console.log(query);
/*
Prints:
	{ '$and': 
	   [ { active: true },
	     { '$or': [Object] },
	     { '$or': [Object] },
	     { email: [Object] } ] }
*/
console.log(query.inspect(5));
/*
Prints:
	{ '$and': 
	   [ { active: true },
	     { '$or': [ { location: 'New York' }, { location: 'Chicago' } ] },
	     { '$or': 
	        [ { '$and': [ { skills: 'plumber' }, { skills: 'carpenter' } ] },
	          { '$and': [ { skills: 'plumber' }, { skills: 'electrician' } ] },
	          { '$and': [ { skills: 'carpenter' }, { skills: 'electrician' } ] } ] },
	     { email: { '$ne': null } } ] }
*/
```

Performance Considerations
--------------------------
The primary concern of this library is readability and maintainability. As you can see, the queries it constructs are quite deep, and there may be a performance hit as a result. If your primary concern is the speed of the query itself, there may be better options, including building them by hand.