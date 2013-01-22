var Qweary = require('../');
var query = new Qweary();
query.is({active:true}).andEither([{location: 'New York'}, {location: 'Chicago'}]);
query.andTwoOf([{skills: 'plumber'}, {skills: 'carpenter'}, {skills: 'electrician'}]);
query.andNot({email:null});
console.log(query);
console.log(query.inspect(6));