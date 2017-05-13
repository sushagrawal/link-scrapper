var express = require('express');
var fs = require('fs');
var request = require('request');
var cheerio = require('cheerio');
var app     = express();
var _ = require('underscore');
var path = require('path');
var http = require('http');
http.globalAgent.maxSockets = 5;
app.listen(4000);

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.static('public'));
// app.set('view engine', 'ejs');
console.log("Server is running");

app.get('/scrape', function(req, res){
    var url = "https://medium.com/" ;
    request(url, function(error, response, html){
        // console.log('res', res);
        if (error) {
          throw error;
        }
        
        var that = this;
        var linkArray = [];
        $ = cheerio.load(html);
        

        var hrefList = $("[href]");

        if(hrefList.length > 0 ){
          for(var i=0; i<hrefList.length ; i++){
            var link  = hrefList[i].attribs['href'];
            if(!_.contains(linkArray,link)) {
              linkArray.push(link);
            }
          }
        }
        // console.log('linkArray', linkArray.length);
        var csv  = linkArray.join(',/n');
        fs.appendFile('links.csv', csv, function(err) {
          if (err) throw err;
          console.log('file saved');
        });
    
    });
    res.render('index');
});