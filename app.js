var pg = require('pg');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');

// allows us to parse the incoming request body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Connects to postgres once, on server start
var conString = process.env.DATABASE_URL || "postgres://localhost/action";
var db;
pg.connect(conString, function(err, client) {
  if (err) {
    console.log(err);
  } else {
    db = client;
  }
});

app.get('/', function (req, res) {
  res.send('Tradecraft messagehub API')
});

app.get('/:type_token/:channel_token', function (req, res) {
  // return information assoc with channel
  // start with a list of messages
  console.log(db);
  db.query("SELECT type_token, channel_token, user_name, message_text, message_timestamp FROM messages WHERE type_token = $1 AND channel_token = $2", [req.params.type_token, req.params.channel_token], function(err, result) {
    if (err) {
      res.send(err);
    } else {
      res.send(result.rows);
    }
  })
});

app.get('/:type_token', function (req, res) {
  // return everything about that type
  // start off by returning a list of channels, later perhaps metadata about the type
  
    db.query("SELECT type_token, channel_token FROM messages WHERE type_token = $1 GROUP BY type_token, channel_token", [req.params.type_token], function(err, result) {
    if (err) {
      res.send(err);
    } else {
      res.send(result.rows);
    }
  })
});

app.post('/:type_token/:channel_token', function(req, res){
  // looking for something like {type:"", ""}
  db.query("INSERT INTO messages (type_token, channel_token, user_name, message_text) VALUES ($1, $2, $3, $4)", [req.params.type_token, req.params.channel_token, req.body.user_name, req.body.message_text], function(err, result) {
    if (err) {
      res.send(err);
    } else {
      res.send(result);
    }
  });
});


var server = app.listen(process.env.PORT, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Listening at http://%s:%s', host, port);

});