var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();
var _ = require('underscore');
var async = require('async'); 
app.listen(4000);

//Description : Here I used async module , foreachlimit inbuilt method for limit=5 concurrent requests. 
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

console.log("Server is running");

app.get('/scrape', function(req, res){
    var url = "https://medium.com/" ;
    request(url, function(error, response, html){
        if (error) {
          throw error;
        }
        var linkArray = makeLinkArray(html);
        if( linkArray.length >0 ){
            uploadToCSV(linkArray);
            scrapeEachLink(linkArray);
        }
    
    });
    res.render('index');
});

function makeLinkArray(body){
    var that = this;
    var linkArray = [];
    $ = cheerio.load(body);
    var hrefList = $("[href]");

    if(hrefList.length > 0 ){
        for(var i=0; i<hrefList.length ; i++){
            var link  = hrefList[i].attribs['href'];
            if (/^https?:\/\//i.test(link)) {
                if(!_.contains(linkArray,link)) {
                    linkArray.push(link);
                }
            }
        }
    }
    return linkArray;
}

function uploadToCSV(linkArray){
    var csv  = linkArray.join(',');
    fs.appendFile('links.csv', csv, function(err) {
      if (err) throw err;
    });
}

var requestApi = function(url, next){
    if (/^https?:\/\//i.test(url)) {
        request(url, function (error, response, html) {
             var linkArray;
            if(html)
                linkArray = makeLinkArray(html);
            if( linkArray && linkArray.length >0 ){
                uploadToCSV(linkArray);
                scrapeEachLink(linkArray);
                next(error); //this callback is for async to know about error or successful response. 
            }
        });
    }
};

//async module used. 

function scrapeEachLink(linkArray){
    async.forEachLimit(linkArray, 5, requestApi, function(err){
        if (err) throw err;
        console.log('All requests processed!');
    });
}

