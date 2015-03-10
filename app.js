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

// homepage
app.get('/', function (req, res) {
  res.send('Tradecraft messagehub API.')
});

//get all messages in a type's channel
app.get('/:type_token/:channel_token', function (req, res) {
  console.log(db);
  db.query("SELECT type_token, channel_token, user_name, user_ip, message_text, message_timestamp FROM messages WHERE type_token = $1 AND channel_token = $2", [req.params.type_token, req.params.channel_token], function(err, result) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.send(result.rows);
    }
  })
});

//get all channels by type
app.get('/:type_token', function (req, res) {
    db.query("SELECT type_token, channel_token FROM messages WHERE type_token = $1 GROUP BY type_token, channel_token", [req.params.type_token], function(err, result) {
    if (err) {
      res.status(500).send(err);
    } else {
      res.send(result.rows);
    }
  })
});

//Create a new message
app.post('/:type_token/:channel_token', function(req, res){
  db.query("INSERT INTO messages (type_token, channel_token, user_name, user_ip, message_text) VALUES ($1, $2, $3, $4, $5)", [req.params.type_token, req.params.channel_token, req.body.user_name, req.connection.remoteAddress, req.body.message_text], function(err, result) {
    if (err) {
      if (err.code == "23502") {
        err.explanation = "Didn't get all of the parameters in the request body. Send user_name and message_text in the request body (remember this is a POST request)."
      }
      res.status(500).send(err);
    } else {
      res.send(result);
    }
  });
});

//Start the actual server
var server = app.listen(process.env.PORT, function () {
  //server is actually running!
  var host = server.address().address;
  var port = server.address().port;

  console.log('Listening at http://%s:%s', host, port);

});
