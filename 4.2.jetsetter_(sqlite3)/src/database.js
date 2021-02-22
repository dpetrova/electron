import path from 'path';
import { remote } from 'electron';
import 'sqlite3';
import knex from 'knex';

const { app } = remote;

const database = knex({
  client: 'sqlite3', //tell Knex.js that we’re intending to use it with an SQLite database
  connection: {
    //specify the location where the SQLite database should be created
    //filename: './db.sqlite'
    filename: path.join(app.getPath('userData'), 'jetsetter-items.sqlite') //use Electron’s built-in API to find the correct path for user data depending on the operating system    
  },
  useNullAsDefault: true //configure Knex.js to use NULL whenever a value for a particular column isn’t provided
});

//check if the database already has an items table
database.schema.hasTable('items').then(exists => {
  if (!exists) {
    //create items table  
    return database.schema.createTable('items', t => {
      t.increments('id').primary(); //create an id column to serve as the primary key and auto-increments it
      t.string('value', 100); //set the value column to a string with a width of 100 characters
      t.boolean('packed'); //set the packed column to store a Boolean type
    });
  }
});

export default database;