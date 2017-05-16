var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();
var _ = require('underscore');
var https = require('https');
app.listen(4000);

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

console.log("Server is running");
var maxRequest = 5;  // make 5 concurrent request at a time.
var linkArray;
var csvContent = "data:text/csv;charset=utf-8,";  
app.get('/scrape', function(req, res){
   
    var url = "https://medium.com/" ;  //url to scrape
    request(url, function(error, response, html){
        if (error) {
          throw error;
        }
        linkArray = makeLinkArray(html);
        if( linkArray.length >0 ){
            uploadToCSV(linkArray);
            scrapeArray(linkArray);  //scrape further links.
        }
    
    });
    res.render('index');
});


function scrapeArray(linkArray){
    
    for(var i=0; i<maxRequest; i++){    // used for loop to make sure , max concurrent request would be 5. 
        if(linkArray.length >0 ){
            var url = linkArray[0];
            linkArray.shift();
            scrapNextUrl(url, linkArray);
            
        }
    }
}

function scrapNextUrl(url, linkArray){
    https.get(url, function(res) {
        var pageData = "";
        res.on('data', function (chunk) {
            if(res.statusCode == 200){
                pageData +=chunk;
            }
        });
 
        res.on('end', function() {
            var array = makeLinkArray(pageData);
            uploadToCSV(array);
            linkArray.concat(array);
            if(linkArray.length >0 ){
                url = linkArray[0];
                linkArray.shift();
                scrapNextUrl(url, linkArray);  // make new connection after 5th after successful response.
            }
        });
 
    }).on('error', function(e) {
        if(linkArray.length >0 ){
            url = linkArray[0];
            linkArray.shift();
            scrapNextUrl(url, linkArray); // make new connection after 5th after error response.
        }
    });
}

function makeLinkArray(body){
    var that = this;
    var linkArray = [];
    $ = cheerio.load(body);
    var hrefList = $("[href]");

    if(hrefList.length > 0 ){
        for(var i=0; i<hrefList.length ; i++){
            var link  = hrefList[i].attribs['href'];
            if (/^https?:\/\//i.test(link)) { // regex to check for http or https url in hrefs
                if(!_.contains(linkArray,link)) { // if a link is already present in array then continue. 
                    linkArray.push(link);
                }
            }
        }
    }
    return linkArray;
}

function uploadToCSV(linkArray){
    var csv  = linkArray.join(',');
    fs.appendFile('linksnoasync.csv', csv, function(err) { // make csv file. 
      if (err) throw err;
    });
}

