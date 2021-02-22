import { openDB, deleteDB, wrap, unwrap } from 'idb';

//open up version 1 of the jetsetter database
const database = openDB('jetsetter-database', 1, {
    //create a store for the items in the application
    upgrade(db) {
      db.createObjectStore('items', { 
        keyPath: 'id', //use the id property of the objects to serve as the key
        autoIncrement: true //tell IndexedDB to take care of autoincrementing the id key
      });
    },
  });

export default {
  getAll() {
    return database.then(db => { //accesses the database
       return db.transaction('items') //start a transaction and declares that you’ll be working with the items store
                .objectStore('items') //access the items store
                .getAll(); //get all items from the store
    });
  },

  add(item) {
    return database.then(db => {
      //create a new read/write transaction with the items store
      const tx = db.transaction('items', 'readwrite');
      //access the items store, and add the item to the database
      tx.objectStore('items').add(item);
      //return completed transaction
      return tx.complete;
    });
  },
  
  update(item) {
    return database.then(db => {
      const tx = db.transaction('items', 'readwrite');
      tx.objectStore('items').put(item);
      return tx.complete;
    });
  },  

  markAllAsUnpacked() {
    return this.getAll() //get all items from db
      .then(items => items.map(item => ({ ...item, packed: false }))) //set packed status of each item to false
      .then(items => {
        return database.then(db => {
          //create a new read/write transaction with the items store
          const tx = db.transaction('items', 'readwrite');
          //update each item
          for (const item of items) {
            tx.objectStore('items').put(item);
          }
          //complete the transaction
          return tx.complete;
        });
      });
  },

  delete(item) {
    return database.then(db => {
      const tx = db.transaction('items', 'readwrite');
      tx.objectStore('items').delete(item.id);
      return tx.complete;
    });
  },  

  deleteUnpackedItems() {
    return this.getAll()
      //filter out all of the items that are unpacked
      .then(items => items.filter(item => !item.packed))
      .then(items => {
        return database.then(db => {
          //create a new read/write transaction with the items store
          const tx = db.transaction('items', 'readwrite');
          //delete each item
          for (const item of items) {
            tx.objectStore('items').delete(item.id);
          }
          //complete the transaction
          return tx.complete;
        });
      });
  }
};