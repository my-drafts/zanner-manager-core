
var C = require('../core');
var c = new C();

//console.log(c);
c.middleRegister('./test/middles', function(){
	//console.log(c);
	c.replyRegister('./test/replys', function(){
		console.log(c);
		c.alias('m1-1', 1, 2, 3);
	});
});
