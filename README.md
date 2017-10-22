# Suomi Puhuu -twitterbot

## See it live at:
https://twitter.com/SuomiPuhuu

## What does it do?
The bot searches 50 most recent Finnish tweets and gets all the hashtags included in those tweets. It saves them in a list and randomizes them and slices the list to be 10 hashtags long. That list is saved to MongoDB. It then chooses one tweet randomly from the 50 tweets to retweet. The next search the bot makes is made with a random hashtag from the curated 10 hashtag long list. The bot repeats the action every 30 minutes. The bot is running on Heroku.

# Technologies used
- Node JS
- Twit -npm module
- MongoDatabase 
- Heroku

# How to use it?
Input your own MongoDB URI to config.js and your own Twitter credentials to twitterConfig.js.

# Licence 
MIT-license

## Thanks
Based on tutorials by Aman Mittal
- https://hackernoon.com/create-a-simple-twitter-bot-with-node-js-5b14eb006c08
- https://community.risingstack.com/how-to-make-a-twitter-bot-with-node-js/