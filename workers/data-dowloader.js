var sync = require('../node_modules/synchronize');

var downloading = function() {
	sync.fiber(function () {
		try {
			console.log('LOOOL');
		}
		catch(err){
			console.log('ERROR: ',err);
		}

		console.log('DATA DOWNLOADER: ', new Date(), new Date().getTime());
		setTimeout(function() {
				downloading();
		}, 1000 *60);
	});
};

downloading();

