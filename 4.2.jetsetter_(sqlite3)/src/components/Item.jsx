import React from 'react';

// this functional component expects five properties that pull in using object destructuring and stores them as local variables inside of the function
const Item = (({ packed, id, value, onCheckOff, onDelete }) => {
  return (
    <article className="Item">
      <label>
      {/* onCheckOff passed to the input is called whenever checkbox is clicked */}
      <input type="checkbox" checked={packed} onChange={onCheckOff} />
      {value}
      </label>
      {/* set click event handler of the button to the onDelete() function passed in from the parent */}
      <button className="delete" onClick={onDelete}>❌</button>
    </article>
  );
});

export default Item;