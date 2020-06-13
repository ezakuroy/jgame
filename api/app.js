const express = require('express')
const app = express()
const port = 3001


//var http = require('http').Server(app);
const ioserver = require('http').createServer();
var io = require('socket.io').listen(ioserver);
app.set('socketIo', io);

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
var board = [];
var game = {
	settings: {
		dailyDouble: true
	},
	state: {
		currentTurn: null,
		bet: null
	}
};

io.on('connection', function(socket){
	console.log('A user connected.');

	socket.on('clueChange', (data) => {
		currentQuestion = data;
     	socket.emit('currentClue', currentQuestion);
     	socket.broadcast.emit('currentClue', currentQuestion);

		for(var index = 0; index < board.length; index++) {
			for(var i = 0; i < board[index].length; i++) {
				if(currentQuestion.clue_id === board[index][i].clue_id) {
					board[index][i].used = true;
					socket.emit('board', board);
					socket.broadcast.emit('board', board);
					break;
				}
			}     				
		}
	})

	socket.on('event', (data) => {
		console.log(data);

		if(data.type == 'exit') {

			socket.emit('showAnswer', 'noSpoiler');
			socket.broadcast.emit('showAnswer', 'noSpoiler');								

			setTimeout(function() { // After x seconds, clear out the current question / exit out
				currentQuestion = null;
				guesses = [];
		     	socket.emit('currentClue', currentQuestion);
		     	socket.broadcast.emit('currentClue', currentQuestion);					
			}, 3000);	   			
		}
		else if(data.type == 'guess') {
			var playerName = (socket.id in playerList) ? playerList[socket.id].name : socket.id.toString();
			console.log('player name: ' + playerName);
			guesses.push({answer: data.answer, playerName: playerName, player: socket.id, index: guesses.length, status: 'published'})
			
			broadcastEverything();		
		}
		else if(data.type == 'bet') {
			if(data.bet !== null) {
				game.state.bet = data.bet;
			}
		}
		else if(data.type == 'judgement') {
			if(data.judgement == 'correct' && currentQuestion !== null) {
				if(game.state.bet == null) { // not daily double
					playerList[data.player].score += currentQuestion.value;
				}
				else { // daily double
					playerList[data.player].score += game.state.bet;					
					game.state.bet = null;
				}

				guesses[data.index].status = 'correct';
				socket.emit('showAnswer', 'noSpoiler');
				socket.broadcast.emit('showAnswer', 'noSpoiler');

				broadcastEverything();

				currentQuestion = null;
				guesses = [];

				setTimeout(function() { // After x seconds, clear out the current question / exit out
			     	socket.emit('currentClue', currentQuestion);
			     	socket.broadcast.emit('currentClue', currentQuestion);					
				}, 3000);				
			}
			else {
				if(game.state.bet == null) { // not daily double
					playerList[data.player].score -= currentQuestion.value;
				}
				else {
					playerList[data.player].score -= game.state.bet;
					game.state.bet = null;
				}
				guesses[data.index].status = 'incorrect';

				broadcastEverything();
			}
		}
		else if(data.type == 'reset') {
			for(var i in playerList) {
				playerList[i].score = 0;
			}
			broadcastEverything();
		}
	})

	socket.on('nameChange', (data) => {
		console.log('Name changed: ' + socket.id + ' to ' + data);
		playerList[socket.id] = {name : data, score : 0};

		broadcastEverything();
	});


	socket.on('disconnect', function() {
		console.log('A user disconnected.');
	})

	function broadcastEverything() {
      var output = [], item;
      for(var type in playerList) {
      	item = {};
      	item.id = type;
      	item.name = playerList[type].name;
      	item.score = playerList[type].score;
      	output.push(item);
      }			
		socket.emit('playerList', output);
		socket.broadcast.emit('playerList', output);

		if(guesses.length > 0) {
			socket.emit('guesses', guesses);
			socket.broadcast.emit('guesses', guesses);			
		}
		if(currentQuestion != undefined) {
			socket.emit('answer', currentQuestion.answer);
			socket.broadcast.emit('answer', currentQuestion.answer);															
		}
		socket.emit('currentClue', currentQuestion);
		socket.broadcast.emit('currentClue', currentQuestion);		
	}

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

app.get('/category', (req, res) => {
	let term = req.query.q;

	//console.log('Searching for ' + term);

	var query = 'SELECT clues.id, game, round, value, clue, answer FROM clues JOIN documents ON clues.id = documents.id JOIN classifications ON clues.id = classifications.clue_id WHERE classifications.category_id = ' + term;

	db.all(query, function(err, allRows) {
		if(err) {
			return console.error(err.message);
		}

		//res.json(allRows)
	   board = returnArray;		
	   var socket = req.app.get('socketIo');
       socket.emit('board', allRows);		
   	   res.end();

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

		var dailyDouble = [];
		if(roundNum == 1) {
			dailyDouble = [[Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 4)]];
		}
		else if(roundNum == 2) {
			dailyDouble = [[Math.floor(Math.random() * 6), 1 + Math.floor(Math.random() * 4)], [Math.floor(Math.random() * 5), 1 + Math.floor(Math.random() * 4)]];
			if(dailyDouble[1][0] == dailyDouble[0][0]) { // Check if the column of the first daily double is the same
				dailyDouble[1][0] = dailyDouble[1][0] + 1; // If so, then increment it because it needs to be a different column
			}
		}

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
		//board = JSON.stringify(allRows);

		try {
			console.log('Setting ' + dailyDouble[0][0] + ' , ' + dailyDouble[0][1] + ' to daily double');
			returnArray[dailyDouble[0][0]][dailyDouble[0][1]].dailyDouble = true;

			if(typeof dailyDouble[1] !== 'undefined') {
				returnArray[dailyDouble[1][0]][dailyDouble[1][1]].dailyDouble = true;
				console.log('Setting ' + dailyDouble[1][0] + ' , ' + dailyDouble[1][1] + ' to daily double');
			}
		}
		catch(err) {
			console.log(err.message);
		}

	   board = returnArray;
	   var socket = req.app.get('socketIo');
       socket.emit('board', returnArray);		
   	   res.end();
		//res.json(returnArray);
	});
});

var server = app.listen(port, () => console.log(`Example app listening on port ${port}!`))