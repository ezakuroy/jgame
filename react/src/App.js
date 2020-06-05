import React, { Component } from 'react';
import socketIOClient from "socket.io-client";

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
      currentClue: null
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleSearch = this.handleSearch.bind(this);
    this.handleClueChange = this.handleClueChange.bind(this);
  }

  componentDidMount() {
    console.log('mounting')
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
    socket.emit('event', {clue : value});    
  }

  render() {
    const { clues } = this.state;

    let currentClueComponent = null;
    if(this.state.currentClue !== null) {
      currentClueComponent = <CurrentClue object = {this.state.currentClue} />;
    }
    return (
        <div className="container">
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
                <h4>Round</h4>
                <div className="btn btn-primary"><a onClick={(e) => {this.changeRound(e, 1)}}>Jeopardy Round</a></div>
                <div className="btn btn-primary"><a onClick={(e) => {this.changeRound(e, 2)}}>Double Jeopardy Round</a></div>                
              </div>

          </div>
        </div>
    );
  }
}

class CurrentClue extends Component {
  constructor(props) {
    super(props);

    this.state = {
      answer: null
    };

    this.answerQuestion = this.answerQuestion.bind(this);
  }

  answerQuestion(value) {
    console.log(this.state.answer);
  }

  componentDidMount() {
    console.log(this.props);    
  }

  render() {
    return(
      <div className = "modal-overlay">
         <div className = "clue"> {this.props.object.clue} </div>
         <div className = "answer"> 
            <input type="text" value={this.state.answer} onChange={this.answerQuestion}/>
            &nbsp;<input type="submit" value="Submit" />
         </div>

      </div>
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


export default App;
