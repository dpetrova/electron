import React, { Component } from 'react'; //import React and its Component class
import NewItem from './NewItem.jsx';
import Items from './Items.jsx';

//Application component is a subclass of React’s Component class
class Application extends Component {
  //constructor() method is called when the component is first initialized
  constructor(props) {
    super(props);

    //set the initial state of the component to an empty array
    this.state = { items: [] };

    //because each of these functions work asynchronously in the event loop, and they may lose context of this component,
    //we bind them to the current instance of the Application component so that it has access to the correct context    
    this.fetchItems = this.fetchItems.bind(this);
    this.addItem = this.addItem.bind(this);
    this.markAsPacked = this.markAsPacked.bind(this);
    this.markAllAsUnpacked = this.markAllAsUnpacked.bind(this);
    this.deleteItem = this.deleteItem.bind(this);
    this.deleteUnpackedItems = this.deleteUnpackedItems.bind(this);
  }

  //fetch the items from the database as soon as the component starts
  async componentDidMount() {
    this.fetchItems();
  }

  fetchItems() {
    this.props
      .database('items')
      .select() //selects all rows from that table
      .then(items => this.setState({ items })) //update the array of items stored in state
      .catch(console.error);
  }

  addItem(item) {
    this.props
      .database('items')
      .insert(item) //inster item into database
      .then(this.fetchItems); //refetch all of the items when insterting is complete
  }  

  markAsPacked(item) {
    this.props
      .database('items')
      .where('id', '=', item.id) //find the item with the correct ID
      .update({
        packed: !item.packed //updates the item to the opposite of its current state
      })
      .then(this.fetchItems)
      .catch(console.error);
  }

  markAllAsUnpacked() {
    this.props
      .database('items')
      .select() //select all of the items from the table
      .update({
        packed: false //updates all items by setting their packed column to false
      })
      .then(this.fetchItems)
      .catch(console.error);
  }

  deleteItem(item) {
    this.props
      .database('items')
      .where('id', item.id) //find the item that matches the ID of the item selected from the UI
      .delete() //remove the item from the database
      .then(this.fetchItems)
      .catch(console.error);
  }

  deleteUnpackedItems() {
    this.props
      .database('items')
      .where('packed', false) //find all of the items where the packed property is set to false
      .delete()
      .then(this.fetchItems)
      .catch(console.error);
  }

  render() {
    //pull the list of items off the component’s state (alternatively, you could use this.state.items)
    const { items, loading } = this.state;
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
          onDelete={this.deleteItem}
        />
        {/* display packed items */}
        <Items
          title="Packed Items"
          items={packedItems}
          onCheckOff={this.markAsPacked}
          onDelete={this.deleteItem}
        />
        {/* React components use className, instead of class, because class is a reserved word in JS */}
        <button className="button full-width" onClick={this.markAllAsUnpacked}>
          Mark All As Unpacked
        </button>
        <button className="button full-width secondary" onClick={this.deleteUnpackedItems}>
          Remove Unpacked Items
        </button>
      </div>
    );
  }
}

export default Application;