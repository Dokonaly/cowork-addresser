var cradle = require('cradle');
var fs = require('fs');
var sync = require('synchronize');

cradle.setup({
	host: 'localhost',
	cache: false,
	raw: false,
	forceSave: true
});

var path = 'databases';
var connection = new(cradle.Connection);
var dbs = {};

var changes = {};

var dev_db_prefix = 'dev_';
var update_dev = false;
process.argv.forEach(function (val, index, array) {
	console.log(index + ': ' + val);
	if(val == 'update_dev'){
		update_dev = true;
	}
});

console.log(update_dev);

sync.fiber(function(){
	//check db
	var dir = fs.readdirSync(path);
	dir.forEach(function(db_name) {
		var db_name_p = db_name;
		if(update_dev) {
			db_name_p = dev_db_prefix+db_name;
		}
		var db = connection.database(db_name_p);
		db.create();
		console.log('Database '+db_name_p+' is created.');

		changes = {
			insert:[],
			update:[],
			delete:[]
		};

		var newDocs = {};
		var prevDocs = {};

		var desing = fs.readdirSync(path+'/'+db_name);
		desing.forEach(function(design_name) {
			console.log(design_name);
			var d = {};
			d._id = '_design/'+design_name;
			d.language = 'javascript';

			fs.readdirSync(path+'/'+db_name+'/'+design_name).forEach(function(type){
				d[type] = {};
				fs.readdirSync(path+'/'+db_name+'/'+design_name+'/'+type).forEach(function(name){
					d[type][name] = {};
					fs.readdirSync(path+'/'+db_name+'/'+design_name+'/'+type+'/'+name).forEach(function(script){
						d[type][name][script.replace('.js', "")] = fs.readFileSync(path+'/'+db_name+'/'+design_name+'/'+type+'/'+name+'/'+script, 'utf8');
					});
				});
			});

			newDocs[d._id] = d;
		});

		var dbprevDocs = sync.await(db.all({startkey:"_design/", endkey:"_design0", include_docs:true}, sync.defer()));

		dbprevDocs.forEach(function(prevDoc){

			if(!newDocs[prevDoc._id]){
				changes.delete.push(prevDoc);
			}else{
				newDocs[prevDoc._id]._rev = prevDoc._rev;
				changes.update.push(newDocs[prevDoc._id]);
			}
			prevDocs[prevDoc._id] = prevDoc;

		});

		Object.keys(newDocs).forEach(function(key){
			if(!prevDocs[key]){
				changes.insert.push(newDocs[key]);
			}
		});

		if(changes.insert.length > 0){
			db.save(changes.insert, function(err, doc){
			});
		}

		if(changes.update.length > 0){
			db.save(changes.update, function(err, doc){

			});
		}

		if(changes.delete.length > 0){
			changes.delete.forEach(function(item){
				db.remove(item._id, item._rev, function (err, res) {
	  			});
			});
		}

		//console.log(prevDocs);
		console.log(changes.delete);
		console.log('DB: '+db_name+' - INSERT: '+changes.insert.length);
		console.log('DB: '+db_name+' - UPDATE: '+changes.update.length);
		console.log('DB: '+db_name+' - DELETE: '+changes.delete.length);
	});
});
