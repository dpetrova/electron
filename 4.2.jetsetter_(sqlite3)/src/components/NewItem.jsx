import React, { Component } from 'react';

class NewItem extends Component {
  constructor(props) {
    super(props);
    //set the initial state of the input field as an empty string
    this.state = {
      value: ''
    };

    //bind methods so that they have a reference to the component when invoked from the event queue
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    //event.target is the DOM node that triggered the event; here we pull the value from the input field
    const { value } = event.target;
    //update the state of the component based on the value of the input field
    this.setState({ value });
  }

  handleSubmit(event) {
    //pass in a function as a prop to this component
    const { onSubmit } = this.props;
    //pull the current value of the input field from the component’s state
    const { value } = this.state;

    event.preventDefault();
    //pass an object representing the new item
    onSubmit({ value, packed: false });
    //reset the value of the input to an empty string
    this.setState({ value: '' });
  }

  render() {
    const { value } = this.state;

    return (
      //trigger the handleSubmit() method when the user submits the form as pass the current value in state
      <form className="NewItem" onSubmit={this.handleSubmit}>
        {/* update the value in state whenever the user makes a change to the input field */}
        <input className="NewItem-input" type="text" value={value} onChange={this.handleChange} /> 
        <input className="NewItem-submit button" type="submit" />
      </form>
    );
  }
}

//set the default value of onSubmit() to an empty function so that we don’t accidentally trigger “undefined is not a function”
NewItem.defaultProps = {
  onSubmit: () => {}
};

export default NewItem;