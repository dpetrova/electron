import React from 'react';

// this functional component expects four properties and stores them as local variables inside of the function
const Item = (({ packed, id, value, onCheckOff }) => {
  return (
    <article className="Item">
      <label>
      {/* onCheckOff passed to the input is called whenever checkbox is clicked */}
      <input type="checkbox" checked={packed} onChange={onCheckOff} />
      {value}
      </label>
    </article>
  );
});

export default Item;