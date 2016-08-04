/*
var cradle = require('cradle');

cradle.setup({
	host: '194.160.28.214',
	cache: false,
	raw: false,
	forceSave: true,
	auth: { username: 'admin', password: 'qwerty' }
});

var connection = new(cradle.Connection);
var db = connection.database('task');

var map = {
	'new': 'open',
	'done': 'done',
}

db.get('_all_docs', {include_docs:true} ,function(err, res){

	if(!err){
		res.forEach(function(row){
			//console.log(row);
			
			if(row.type && row.type == 'task'){
				if(map[row.status]){
					row.status = map[row.status];
				}else{
					row.status = 'open';
				}
				console.log(row.status);	

				db.save(row._id, row._rev, row, function(e, r){
					console.log(e, r);
				});
			}
			
		});
	}
});
*/


var config = {

}

var api = {
	task:{
		huhu:1,
		post:{
			items:{
				'id_1':{
					a:1
				},
				'id_2':{
					a:2
				}				
			}
		}
	}
}

//toto sa builduje cez rekurziu
var form = {
	'task.huhu': api.task.huhu,
	'task.post.items.id_1.a': api.task.post.items.id_1.a,
	'task.post.items.id_2.a': api.task.post.items.id_1.a
}



console.log(api);
console.log(form);