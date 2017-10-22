var twitterConfig = require("./twitterConfig.js");
var config = require("./config.js");
var twit = require("twit");  
var Twitter = new twit(twitterConfig);  
var express = require('express')
var app = express();
///DATABASE
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');

// Connection URL
var url = config.mongodb_uri;
var collectionName = 'tweets'

//Retweet logic
var list_of_popular_hashtags = "#finlayson";
var tempTags = '';
//Find 50 most recent Finnish tweets that have hashtags that appear on the hashtag-list
var retweet = function() {  
    var params = {
        q: list_of_popular_hashtags,
        result_type: 'recent',
        count: '50',
        lang: 'fi'
    }
    console.log(list_of_popular_hashtags);
    Twitter.get('search/tweets', params, function(err, data) {
    console.log(data);

    if (data.statuses && data.statuses.length)
        {
        var tweets = data.statuses;
        var randInt = getRandomInt(0, tweets.length-1);
        console.log(randInt);

        var temp = 0;
        var tempId = '';

        //Get all hashtags from the searched tweets
        for (i = 0; i < tweets.length; i++) { 
            if (temp < tweets[i].entities.hashtags.length) {
            temp = tweets[i].entities.hashtags.length;
                for (j = 0; j < tweets[i].entities.hashtags.length; j++) { 
                    tempTags = tempTags + '#' + tweets[i].entities.hashtags[j].text +", ";
                    }
            }
        }
        //Make the retweet a random tweet in the tweets array
        tempId = tweets[randInt].id_str;
        tempTags = tempTags.replace(/[ ]/g,"").split(",");
        var result = [];
        for(var i =0; i < tempTags.length ; i++){
            if(result.indexOf(tempTags[i]) == -1) {result.push(tempTags[i]);}
        }
        //Shuffle the list of hashtags
        result = shuffle(result);
        var result = result.filter(function(x){
            return (x !== (undefined || null || ''));
        });
        //Make the list at most 10 tags long
        if (result.length > 10) result = result.slice(0, 10);
        myTags = {'hashtags':result};

        // Save tweet-array in to the database
        MongoClient.connect(url, function(err, db) {
            var collection = db.collection(collectionName);
            assert.equal(null, err);
            console.log("Connected successfully to server");
            collection.insertOne(myTags, function(err, res) {
                if (err) throw err;
                console.log("1 document inserted");
                db.close();
            });
        });
        tempTags=result.join(", ");
        var tA = tempTags.split(", ", 10);
        tempTags = tA.join();
        
        console.log(tempTags);
        var retweetId = tempId;
        console.log(retweetId);

        var tagArray = tempTags.split(',');
        var newRandom = getRandomInt(0, tagArray.length);
        list_of_popular_hashtags = tagArray[newRandom];
        console.log(list_of_popular_hashtags);

            //Retweet the chosen tweet
            Twitter.post('statuses/retweet/:id', {
                id: retweetId
            }, function(err, response) {
                if (response) {
                    console.log('Retweeted!!!');
                }
                //Error
                if (err) {
                    console.log('Something went wrong while RETWEETING... Duplication maybe...');
                }
            });
        }
        //If no tweet is returned from the search
        else {
          console.log('Something went wrong while SEARCHING...');
          console.log('Getting the second to last document from the collection.');
            // Save tweet-array in to the database
            MongoClient.connect(url, function(err, db) {
                var collection = db.collection(collectionName);
                assert.equal(null, err);
                var cursor = collection.find().limit(1).sort({ $natural : -1 });
                cursor.toArray(function(err, results) {
                    if (err) throw err;
                    var tmp = results[0].hashtags;
                    var randInt2 = getRandomInt(0, results[0].hashtags.length-1);
                    console.log(randInt2);
                    console.log(results[0].hashtags[randInt]);
                    list_of_popular_hashtags = tmp[randInt2];
                    db.close();
                });
            });


        }
    });
}

//Start tweeting when the program runs
var twiittaa = true;
if (twiittaa)
    {
retweet();  
//repeat every 30 minutes
setInterval(retweet, 1800000);

//From tutorial by Aman Mittal
//https://hackernoon.com/create-a-simple-twitter-bot-with-node-js-5b14eb006c08
//https://community.risingstack.com/how-to-make-a-twitter-bot-with-node-js/
var stream = Twitter.stream('user'); 
stream.on('follow', followed);

stream.on('disconnect', function (disconnectMessage) {
  console.log("Disconnected from the Twitter stream. Reconnecting in 5 minutes...");
  setInterval(follow, 300000);
})
}

// ...trigger the callback
function followed(event) {  
    console.log('Follow Event is running');
    //get user's twitter handler (screen name)
    var name = event.source.name;
    var screenName = event.source.screen_name;
    // function that replies back to the user who followed
    followUser(screenName);
    tweetNow('@' + screenName + ' Kiitos, että seurasit! Seuraan sinua takaisin, jotta oppisin lisää! :)');
}

//FOR TWEETING
function tweetNow(tweetTxt) {  
    var tweet = {
        status: tweetTxt
    }
    Twitter.post('statuses/update', tweet, function(err, data, response) {
      if(err){
        console.log("Error in Replying");
      }
      else{
        console.log("Gratitude shown successfully");
      }
    });
}

function followUser(username) {  
    var tweet = {
        screen_name: username,
        follow: true
    }
    Twitter.post('friendships/create', tweet, function(err, data, response) {
      if(err){
        console.log("Error in Following user!");
      }
      else{
        console.log("Followed user successfully!");
      }
    });
}
////////////////////////////

//GENERAL FUNCTIONS

//Random Integer
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

//Shuffle an Array, Fisher–Yates shuffle
//https://bost.ocks.org/mike/shuffle/
function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

/////////////////////////

//Start the server
var port = process.env.PORT || 8080; 
app.listen(port, function () {
  console.log('App is listening on port:'+port)
})
