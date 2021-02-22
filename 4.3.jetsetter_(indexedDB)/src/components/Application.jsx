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
    this.deleteItem = this.deleteItem.bind(this);
    this.deleteUnpackedItems = this.deleteUnpackedItems.bind(this);
    this.markAsPacked = this.markAsPacked.bind(this);
    this.markAllAsUnpacked = this.markAllAsUnpacked.bind(this);
  }

  async componentDidMount() {
    this.fetchItems();
  }

  fetchItems() {
    this.props
      .database
      .getAll()
      .then(items => this.setState({ items })) //update the array of items stored in state
      .catch(console.error);
  }

  addItem(item) {
    this.props
      .database
      .add(item)
      .then(this.fetchItems); //refetch all of the items when insterting is complete
  }

  deleteItem(item) {
    this.props
      .database
      .delete(item) //remove the item from the database
      .then(this.fetchItems) //refetch all of the items
      .catch(console.error);
  }

  markAsPacked(item) {
    const updatedItem = { ...item, packed: !item.packed };
    this.props
      .database
      .update(updatedItem) //updates the item to the opposite of its current state
      .then(this.fetchItems)
      .catch(console.error);
  }

  markAllAsUnpacked() {
    this.props
      .database
      .markAllAsUnpacked() //updates all items
      .then(this.fetchItems)
      .catch(console.error);
  }

  deleteUnpackedItems() {
    this.props
      .database
      .deleteUnpackedItems() //delete all unpacked items
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