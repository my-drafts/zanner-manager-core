
module.exports = [
	{id:'m3', execute:function(){}, match:'*', order:['m2'], alias:{'m3-1': function(){}}},
	{id:'m4', execute:function(){}, match:'*', order:['m2', 'm3'], alias:{'m4-1': function(){}, 'm4-2': function(){}, 'm4-3': function(){}}},
	{id:'m1', execute:function(){}, match:'*', order:[], alias:{'m1-1': function(){}, 'm1-2': function(){}}},
	{id:'m2', execute:function(){}, match:'*', order:['m1'], alias:{'m1-1': function(){ console.log(arguments); return 1; }}}
];
