import React, { Component } from 'react';
import socketIOClient from "socket.io-client";

import {subscribeToEvents} from './subscribeToEvents';
import logo from './logo.svg';
import './App.css';

const ENDPOINT = 'http://localhost:3002';
const API = 'http://localhost:3001/category?q=';
const CategoriesAPI = 'http://localhost:3001/clues/getGroup';
const DEFAULT_QUERY = '2';
const socket = socketIOClient(ENDPOINT);

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      clues: [],
      currentRound: 1,
      currentClue: null,
      players: null,
      nameSet: false,
      playerName: ''
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.handleClueChange = this.handleClueChange.bind(this);
    this.setName = this.setName.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);

    //subscribeToEvents((err, playerList) => this.setState({players: playerList}));
    socket.on('playerList', data => this.setState({players: data}));
    socket.on('currentClue', data => this.setState({currentClue: data}));
  }

  componentDidMount() {
    console.log('mounting');
    fetch(CategoriesAPI)
      .then(response => response.json())
      .then(data => this.setState({ clues: data }));
  }

  changeRound(event, parameter) {
    console.log(parameter);
    this.setState({clues:[]})
    this.setState({currentRound: parameter})

    console.log('changing round');
    fetch(CategoriesAPI + '?roundNum=' + parameter)
      .then(response => response.json())
      .then(data => this.setState({ clues: data }));      
  }

  handleSearch(event) {
    console.log('searching');
    this.setState({clues:[]})

    fetch(CategoriesAPI + '?roundNum=' + this.state.currentRound + '&categorySearch=' + this.state.categorySearch)
      .then(response => response.json())
      .then(data => this.setState({ clues: data }));     
     event.preventDefault();

     socket.emit('event', {my: 'data'});
  }

  handleChange(event) {
    this.setState({categorySearch: event.target.value})
  }

  handleClueChange(value) {
    //event.preventDefault();
    this.setState({ currentClue: value })
    console.log('Clue changed: ' + value);
    socket.emit('clueChange', value);    
  }

  setName(event) {
    this.setState({ playerName: event.target.value })    
  }

  handleSubmit(event) {
    socket.emit('nameChange', this.state.playerName);    
    this.setState({ nameSet: true});
    event.preventDefault();
  }


  render() {
    const { clues } = this.state;

    let currentClueComponent = null;
    if(this.state.currentClue !== null) {
      currentClueComponent = <CurrentClue object = {this.state.currentClue} />;
    }


    let playerList = null;
    if(this.state.players !== null) {
      playerList =  <div><h4>Players</h4>{this.state.players.map(player => (<Player object = {player} />))}</div>;      
    }

    let container = null;
    if(!this.state.nameSet) {
      container = <div className="nameInput"><form onSubmit = {this.handleSubmit}><label>What is your name?</label> &nbsp; <input type="text" value={this.state.playerName} onChange={this.setName}/> &nbsp;<input type="submit" value="Set" /></form></div>
    }
    else {
      container = 
        
        <div>
          <div className="row" className="header">
            <form onSubmit={this.handleSearch}>
              Category Search: &nbsp;
              <input type="text" value={this.state.categorySearch} onChange={this.handleChange}/>
              &nbsp;<input type="submit" value="Submit" />
            </form>
            </div>

            <div className="row">
                { currentClueComponent }

                {clues.map(category => (
                  <Cat object = {category} handleClueChange= {this.handleClueChange} />
                ))}

                <div className="col-md-2 navigation">
                   {playerList}

                  <h4>Round</h4>
                  <div className="btn btn-primary"><a onClick={(e) => {this.changeRound(e, 1)}}>Jeopardy Round</a></div>
                  <div className="btn btn-primary"><a onClick={(e) => {this.changeRound(e, 2)}}>Double Jeopardy Round</a></div>                
                </div>

            </div>
        </div>
      
    }

    return (
        <div className="container">
          { container }
        </div>
    );
  }
}

class CurrentClue extends Component {
  constructor(props) {
    super(props);

    this.state = {
      answer: null,
      allGuesses: [],
      correctAnswer: null
    };

    this.handleExit = this.handleExit.bind(this);    
    this.handleGuess = this.handleGuess.bind(this);
    this.handleGuessChange = this.handleGuessChange.bind(this);

    socket.on('guesses', data => this.setState({allGuesses: data}));    
    socket.on('answer', data => this.setState({correctAnswer: data}));
  }

  handleExit(event) {
    socket.emit('event', {type: 'exit'})
  }

  handleGuessChange(event) {
    this.setState({ guess: event.target.value })
  }

  handleGuess(event) {
    socket.emit('event', {type: 'guess', answer: this.state.guess})
    event.preventDefault();    
  }

  componentDidMount() {
    console.log(this.props);    
  }

  render() {
    let correctAnswer = null;
    if(this.state.correctAnswer !== null) {
      correctAnswer = 
        <div className="answers">
          <div className = "correctAnswer"><strong>Correct Answer:</strong> <span className="spoiler">{this.state.correctAnswer}</span></div>

         <table className = "guesses">
            {this.state.allGuesses.map(guess => (<Guess object = {guess} />))}          
         </table>
      </div>;
    }
    return(
      <div className = "modal-overlay">
        <div className = "clue-details col-md-4 offset-md-4">
          <div className='categoryName'>{this.props.object.category}</div>
          <div className='clueValue'>${this.props.object.value}</div>
          <div className='airdate'>{this.props.object.airdate}</div>
          <div className = "clue"> {this.props.object.clue} </div>
          <div className = "answer"> 
            <form onSubmit = {this.handleGuess}>
              <input type="text" value={this.state.guess} onChange={this.handleGuessChange}/>
              &nbsp;<input type="submit" className="btn-lg btn-primary" value="Submit" />
            </form>
         </div>

            {correctAnswer}

         <button className="btn-lg btn-info" onClick={this.handleExit}>Exit</button>
         
         </div>

      </div>
    );
  }
}

class Guess extends Component {
  constructor(props) {
    super(props);

    this.handleJudgement = this.handleJudgement.bind(this);    
  }

  handleJudgement(value, e) {
    console.log('Judgement: ' + value);
    socket.emit('event', {type: 'judgement', judgement: value, player: this.props.object.player, index: this.props.object.index});
  }

  render() {
    return(
      <tr className={this.props.object.status}>
        <td className='guess'>
          <div className="guessBy">Guess by: {this.props.object.playerName}</div>
          <div className="guessAnswer">{this.props.object.answer}</div>
        </td>
        <td className="judgement ">
          <button onClick={(e) => this.handleJudgement("correct", e)}><i className="fa fa-check"/></button>
          <button onClick={(e) => this.handleJudgement("incorrect", e)}><i className="fa fa-remove"/></button> 
        </td>
      </tr>
    );
  }
}

class Cat extends Component {

  componentDidMount() {
    console.log(this.props);    
  }

  render() {
    return(
        <div className="col-md-2">
            <div className="categoryName">
              {this.props.object[0].category}
            </div>

            {this.props.object.map(clue => (

                 <Clue object= {clue} handleClueChange = {this.props.handleClueChange}/>
            ))}       
        </div>     
    );
  }  

}

class Clue extends Component {
  state = {boxState: 'showValue'}
  toggleHidden () {
    if(this.state.boxState == 'showValue') {
      this.setState({boxState : 'showClue' })
    }
    else if(this.state.boxState == 'showClue') {
      this.setState({boxState : 'showAnswer' })
    }
    else {
      this.setState({boxState : 'showValue' })
    }
    this.props.handleClueChange(this.props.object);
  }
  render() {
    return(
      <div key={this.props.object.objectID} className={this.state.boxState + ' box'} onClick={this.toggleHidden.bind(this, this.props.object.objectID)}>
        
          <div className={this.state.boxState == 'showValue' ? 'visible value' : 'hidden value'}>${this.props.object.value} 
          <div className='airdate'>{this.props.object.airdate}</div></div>
          <div className={this.state.boxState == 'showClue' ? 'visible clue' : 'hidden clue'}>{this.props.object.clue} </div>
          <div className={this.state.boxState == 'showAnswer' ? 'visible answer' : 'hidden answer'}>{this.props.object.answer}</div>
        
      </div>      
    )
  }  

}

class Player extends Component {

  componentDidMount() {
    console.log(this.props);    
  }

  render() {
    return(
        <div className="player">
            <span className="playerName">{this.props.object.name}</span> <span className="score">${this.props.object.score}</span>
        </div>     
    );
  }  

}

export default App;
