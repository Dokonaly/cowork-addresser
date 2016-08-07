var sync = require('../node_modules/synchronize');
var http = require('http');
var curl = require('curlrequest');
var cheerio = require('cheerio');
var cradle = require('cradle');
var fs = require('fs');
var request = require('request');

cradle.setup({
    host: 'localhost',
    cache: false,
    raw: false,
    forceSave: true
});

var parser = {
    slovakia:{
        "hash": function(html,key){
            var leftSide  = html.html('div[id=download-left]');
            var tempList = leftSide.split('<li>');
            var list = tempList[3].split('</li>');
            var md5List = list[0].split('MD5 sum:');
            var hashList = md5List[1].split('>');
            var hash = hashList[1].substring(0,hashList[1].length-3);
            return hash;
        },
        "url": function(html,key){
            var urlPrefix = 'http://download.geofabrik.de/europe/';
            var leftSide  = html.html('div[id=download-left]');
            var tempList = leftSide.split('<li>');
            var list = tempList[3].split('</li>');
            var downloadList = list[0].split('<a href="');
            var downloadUrlList = downloadList[1].split('">');
            return urlPrefix+downloadUrlList[0];
        }
    }
};

var getHtml = function(result,cb) {
    var data = '';
    result.on("data", function(chunk) {
        data += chunk;
    });
    result.on("end", function(){
        return cb(null,data);
    });
};

var parseData = function(data, cb) {
    var parsedData = {};
    var $ = cheerio.load(data);
    parsedData.hash = parser.slovakia.hash($,'hash');
    parsedData.url = parser.slovakia.url($,'url');
    return cb(null,parsedData);
};

var downloadFile = function(uri, filename, callback){
    request.head(uri, function(err, res, body){
        request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
};

var getLastDownloadedHash = function(cb) {
    var connection = new(cradle.Connection);
    var db = connection.database('downloader');
    db.view('system/last', function (err, res) {
        return cb(null,res);
    });
};

var getPage = function(host,cb) {
    http.get(host, function(res) {
        return cb(null,res);
    }).on('error', function(e) {
        console.log("Got error: " + e.message);
        return cb(e,res);
    });
};

var storeInformationAboutDownload = function(data, cb) {
    var connection = new(cradle.Connection);
    var db = connection.database('downloader');
    db.save(data, function (err, res) {
        return cb(null,res);
    });
};

var downloadAndSaveFile = function (parsedData, cb){
    sync.fiber(function () {
        try {
            sync.await(downloadFile(parsedData.url, parsedData.hash+'.osm.bz2', sync.defer()));
            var obj = {
                type: 'slovakia',
                hash: parsedData.hash,
                created: new Date().toISOString(),
                last_changed: new Date().toISOString()
            };
            var res = sync.await(storeInformationAboutDownload(obj, sync.defer()));
            return cb(null, res);
        } catch(err){
            console.log('ERROR', err);
            return cb(err,{});
        }
    });
};

var compareCouchDataWithActual = function (parsedData, selectedData, cb){
    sync.fiber(function () {
        try {
            if (selectedData.length === 0){
                sync.await(downloadAndSaveFile(parsedData, sync.defer()));
            }
            else {
                var wasFound = false;
                selectedData.forEach(function(item){
                    if (item.hash === parsedData.hash){
                        wasFound = true;
                    }
                });
                if (!wasFound){
                    sync.await(downloadAndSaveFile(parsedData, sync.defer()));
                    console.log('HASH IS NEW:');
                }
                else {
                    console.log('HASH IS ALREADY IN COUCH');
                }
            }
            console.log('WE HAVE LATEST VERSION OF DATA FROM SLOVAKIA TO PROCESSING');
            return cb(null,{});

        } catch (err) {
            return cb(err, {});
        }
    });
};

var downloading = function() {
    sync.fiber(function () {
        try {
            var options = {
                hostSlovakia: 'http://download.geofabrik.de/europe/slovakia.html'
            };

            var result = sync.await(getPage(options.hostSlovakia, sync.defer()));
            var htmlData = sync.await(getHtml(result,sync.defer()));
            var selectedData = sync.await(getLastDownloadedHash(sync.defer()));
            var parsedData = sync.await(parseData(htmlData, sync.defer()));
            var res = sync.await(compareCouchDataWithActual(parsedData, selectedData, sync.defer()));

        }
        catch(err){
            console.log('ERROR: ',err);
        }

        console.log('DATA DOWNLOADER: ', new Date(), new Date().getTime());
        setTimeout(function() {
                downloading();
        }, 5000 *60);
    });
};

downloading();

