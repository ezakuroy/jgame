import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

const API = 'http://localhost:3001/category?q=';
const DEFAULT_QUERY = '2';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      clues: [],
    };
  }

  toggleHidden () {
    this.setState({
      isHidden: !this.state.isHidden
    })
  }

  handleChange(event) {

    this.setState({number: event.target.value})
  }

  handleSubmit() {
    console.log(this.state.number)

    fetch(API + this.state.number)
      .then(response => response.json())
      .then(data => this.setState({ clues: data }));    
  }

  componentDidMount() {
    fetch(API + DEFAULT_QUERY)
      .then(response => response.json())
      .then(data => this.setState({ clues: data }));
  }

  callbackFromCategory = (dataFromChild) => {
    console.log(dataFromChild);
    this.setState({clues:[]})
    fetch(API + dataFromChild)
      .then(response => response.json())
      .then(data => this.setState({ clues: data }));    
  }

  render() {
    const { clues } = this.state;

    return (
        <div className="row">
          <div className="col-md-3">
            <ul>
            {clues.map(clue => (
              <Clue object = {clue} />
            ))}
            </ul>
          </div>

          <div className = "col-md-6">
            <Categories callbackFromParent={this.callbackFromCategory} />
          </div>

        </div>
    );
  }
}


class Clue extends Component {
  state = {isHidden : true}
  toggleHidden () {
    this.setState({
      isHidden: !this.state.isHidden
    })
  }
  render() {
    return(
      <div key={this.props.object.objectID} className="box">
        <div onClick={this.toggleHidden.bind(this, this.props.object.objectID)}>{this.props.object.clue} <span className="val">({this.props.object.value})</span></div>
        <span className={this.state.isHidden ? 'hidden answer' : 'visible answer'}>{this.props.object.answer}</span>
      </div>      
    )
  }  

}



class Categories extends Component {
  state = {selectedCategory : null, 
          categories : [],
          search : null
        }

  toggleHidden () {
    this.setState({
      isHidden: !this.state.isHidden
    })
  }

  componentDidMount() {
    fetch('http://localhost:3001/category/search?q=')
      .then(response => response.json())
      .then(data => this.setState({ categories: data }));
  }

  handleChange(event) {
    this.setState({search: event.target.value})
  
    fetch('http://localhost:3001/category/search?q=' + event.target.value)
      .then(response => response.json())
      .then(data => this.setState({ categories: data }));    
  }

  setCategory(event, parameter) {
    console.log(parameter)

    this.props.callbackFromParent(parameter);
  }

  render() {

    const { categories } = this.state;

    return(
      <div>
        <div>
          <span >Search Category: </span>
          <input type="text" name="search" value={this.state.search} onChange={this.handleChange.bind(this)}/>
        </div>

        {categories.map(category => (
            <div className="category">
              <div onClick={(e) => {this.setCategory(e, category.id)}}>{category.category}</div>
            </div>
        ))}
      </div>   
    )
  }  

}

export default App;
