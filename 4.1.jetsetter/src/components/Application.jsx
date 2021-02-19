import React, { Component } from 'react'; //import React and its Component class
import NewItem from './NewItem.jsx';
import Items from './Items.jsx';

//Application component is a subclass of React’s Component class
class Application extends Component {
  //constructor() method is called when the component is first initialized
  constructor(props) {
    super(props);
    //when the component is initialized, we set its state to include an array of items with one item in it
    this.state = {
      items: [{ value: 'Pants', id: Date.now(), packed: false }]
    };

    //each of the actions happens on the event loop, which means that they lose context of this component;
    //binding the methods to the current instance of the Application component is a common pattern in React
    this.addItem = this.addItem.bind(this);
    this.markAsPacked = this.markAsPacked.bind(this);
    this.markAllAsUnpacked = this.markAllAsUnpacked.bind(this);
  }

  addItem(item) {
    //set the state to a new array consisting of all of the existing items along with the item passed in as an argument
    this.setState({ items: [item, ...this.state.items] });
  }

  markAsPacked(item) {
    //create a new array of all the items that are not the one we’re looking for
    const otherItems = this.state.items.filter(other => other.id !== item.id);
    //use the object rest spread operator to make a clone of the object replacing the packed key with its opposite
    const updatedItem = { ...item, packed: !item.packed };
    //replace the items in the component’s state with the item and all the other items
    this.setState({ items: [updatedItem, ...otherItems] });
  }

  markAllAsUnpacked() {
    //make a new array of items with copies of the existing items with their packed property set to false
    const items = this.state.items.map(item => ({ ...item, packed: false }));
    //replace the items in state with the new array of items
    this.setState({ items });
  }

  render() {
    //pull the list of items off the component’s state (alternatively, you could use this.state.items)
    const { items } = this.state;
    const unpackedItems = items.filter(item => !item.packed);
    const packedItems = items.filter(item => item.packed);

    return (
      <div className="Application">
        {/* add new item   */}
        <NewItem onSubmit={this.addItem} />
        {/* display unpacked items */}
        <Items
          title="Unpacked Items"
          items={unpackedItems}
          onCheckOff={this.markAsPacked}
        />
        {/* display packed items */}
        <Items
          title="Packed Items"
          items={packedItems}
          onCheckOff={this.markAsPacked}
        />
        {/* React components use className, instead of class, because class is a reserved word in JS */}
        <button className="button full-width" onClick={this.markAllAsUnpacked}>
          Mark All As Unpacked
        </button>
      </div>
    );
  }
}

export default Application;