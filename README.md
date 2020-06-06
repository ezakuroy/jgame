# jgame
Multiplayer Jeopardy game.

Prerequisites:
- Requires a db file (clues.db) which contains questions and categories.  (not included in this repo)

How the game works:
- Enter a player name.
- If you're the first player, a board will be generated.  Afterwards, everyone else will see the same first board.
- Pick a clue.
- Enter a guess.  
- If someone guessed, the correct answer will be shown in spoilers.  Determine if the first guess is correct; if there are multiple guesses, then the first person to get it correct gets the points.  Go down the line until a correct guess is found.
- Click "Don't know" if nobody knows the answer.  Don't click it until everyone has confirmed that they want to see the answer.
- Search by category or click "Double Jeopardy" if you want to switch it up.

TODOs:
- Daily Doubles
- Final Jeopardy
- Custom input of clues

Running the game:
- Create a clues.db file
- Run node api/api.js
- Run npm start in /react
