const express = require('express')
const app = express()
const port = 3001

//var http = require('http').Server(app);
const ioserver = require('http').createServer();
var io = require('socket.io').listen(ioserver);

ioserver.listen(3002);

var sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('clues.db', sqlite3.OPEN_READWRITE, (err) => {
if (err) {
  console.error(err.message);
}
});

//io.set('origins', 'http://localhost:3000')

var playerList = {};
var currentQuestion;
var guesses = [];

io.on('connection', function(socket){
	console.log('A user connected.');

	socket.on('clueChange', (data) => {
		currentQuestion = data;
	})

	socket.on('event', (data) => {
		console.log(data);

		if(data.type == 'exit') {
			currentQuestion = null;
			guesses = [];
		}
		else if(data.type == 'guess') {
			var playerName = (socket.id in playerList) ? playerList[socket.id].name : socket.id.toString();
			console.log('player name: ' + playerName);
			guesses.push({answer: data.answer, playerName: playerName, player: socket.id, index: guesses.length, status: 'published'})

			setTimeout(function(){
				socket.emit('answer', currentQuestion.answer);
			}, 1);
		}
		else if(data.type == 'judgement') {
			if(data.judgement == 'correct' && currentQuestion !== null) {
				playerList[data.player].score += currentQuestion.value;
				currentQuestion = null;
				guesses = [];
			}
			else {
				playerList[data.player].score -= currentQuestion.value;
				guesses[data.index].status = 'incorrect';
			}
		}
	})

	socket.on('nameChange', (data) => {
		console.log('Name changed: ' + socket.id + ' to ' + data);
//		socket.emit('players', io.sockets.clients());
		playerList[socket.id] = {name : data, score : 0};

		console.log(playerList);
	});

   setInterval(function() {
      //Sending an object when emmiting an event
      var output = [], item;
      for(var type in playerList) {
      	item = {};
      	item.id = type;
      	item.name = playerList[type].name;
      	item.score = playerList[type].score;
      	output.push(item);
      }
      socket.emit('playerList', output);

      socket.emit('currentClue', currentQuestion);

      socket.emit('guesses', guesses);
   }, 1000);

	socket.on('disconnect', function() {
		console.log('A user disconnected.');
	})
}) 

const getApiAndEmit = socket => {
	const response = new String();

	socket.emit("FromAPI", response);
}

app.get('/', (req, res) => res.send('Hello World!'))

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/category/search', (req, res) => {
	let term = req.query.q;

	//console.log('Searching for ' + term);

	var query = 'SELECT id, category FROM categories WHERE category LIKE "%' + term + '%" limit 20';

	db.all(query, function(err, allRows) {
		if(err) {
			return console.error(err.message);
		}

		res.json(allRows)
	});

});

app.get('/category', (req, res) => {
	let term = req.query.q;

	//console.log('Searching for ' + term);

	var query = 'SELECT clues.id, game, round, value, clue, answer FROM clues JOIN documents ON clues.id = documents.id JOIN classifications ON clues.id = classifications.clue_id WHERE classifications.category_id = ' + term;

	db.all(query, function(err, allRows) {
		if(err) {
			return console.error(err.message);
		}

		res.json(allRows)
	});

});

app.get('/clues/search', (req, res) => {
	let term = req.query.q;

	//console.log('Searching for ' + term);

	var query = 'SELECT id, category FROM categories WHERE category LIKE "%' + term + '%" limit 20';

	db.all(query, function(err, allRows) {
		if(err) {
			return console.error(err.message);
		}

		res.json(allRows)
	});

});

app.get('/clues/getGroup', (req, res) => {
	console.log('Called get group API');
	console.log('category: ' + req.query.categorySearch)
	let groupSize = req.query.groupSize;
	let roundNum = req.query.roundNum;
	let categorySearch = req.query.categorySearch;

	if(roundNum == null) {
		roundNum = 1;
	}
	console.log('Round: ' + roundNum);

	categoryQueryParam = '';
	if(categorySearch !== undefined) {
		categoryQueryParam = 'select id from categories WHERE category like \'%' + categorySearch + '%\' ORDER BY random() limit 20';
	}
	else {
		categoryQueryParam = 'select id from categories ORDER BY random() limit 20'
	}


	var query = 'SELECT clue_id, value, answer, clue, round, classifications.category_id, categories.category, airdates.airdate FROM clues JOIN documents ON clues.id = documents.id JOIN classifications ON clues.id = classifications.clue_id JOIN categories ON classifications.category_id = categories.id JOIN airdates ON clues.game = airdates.game WHERE classifications.category_id IN (select category_id from categorycount where category_id IN (' + categoryQueryParam + ')) AND round =' + roundNum + ' ORDER BY classifications.category_id';

	//console.log('query: ' + query);

	db.all(query, function(err, allRows) {
		if(err) {
			return console.error(err.message);
		}

		var returnArray = [];
		var currentArray = [];
		var currentCat = allRows[0].category_id;
		var count = 0;
		var returnCount = 0;

		allRows.forEach((row) => {

			if(currentCat !== row.category_id) {
				count = 0;
				currentCat = row.category_id;	
				returnCount++;
				if(returnCount < 5) {
					returnArray.push(currentArray);	
				}
				currentArray = [];								
			}
			row.value = roundNum * 200 * (count+1)

			if(count < 5) {
				currentArray.push(row);				
			}

			count++;


		});	

		returnArray.push(currentArray);
		res.json(returnArray);
	});
});

var server = app.listen(port, () => console.log(`Example app listening on port ${port}!`))