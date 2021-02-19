import React from 'react';
import Item from './Item.jsx';

const Items = ({ title, items, onCheckOff }) => {
  return (
    <section className="Items">
      <h2>{ title }</h2>
      {items.map(item => (
        <Item 
          key={item.id} //when working with an array of components, React requires that each component has a unique key
          onCheckOff={() => onCheckOff(item)} //pass the specific item that should be checked off to onCheckOff()
          {...item} //spread operator passes all the item’s properties to the component
        />
      ))}
    </section>
  );
};

export default Items;