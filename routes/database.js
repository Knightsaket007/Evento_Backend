const { MongoClient } = require('mongodb');
const url = 'mongodb://localhost:27017';
const client = new MongoClient(url);
const dbName = 'Evento';

async function User_dbConnect() {
  // Use connect method to connect to the server
 let conn= await client.connect();
  console.log('Connected successfully to server');
  const db = conn.db(dbName);
return db.collection('User_Data');
}

// CoADMIN

async function Co_dbConnect() {
  // Use connect method to connect to the server
 let conn= await client.connect();
  console.log('Connected successfully to server');
  const db = conn.db(dbName);
// return db.collection('Co_admin_Data');
return {
  Co_admin_Data: db.collection('Co_admin_Data'),
  Co_EventData: db.collection('Co_EventData'),
  Event_actions: db.collection('Event_actions')
};
}



module.exports = {
  User_dbConnect,
  Co_dbConnect,
};