const express = require('express')
const cors = require('cors')
require('dotenv').config()

const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

const app = express()





app.use(cors())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});



// Routes
const userRoutes = require('./routes/users');
app.use(userRoutes);



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})


// by using ? placeholders to pass values we can avoid SQL injections
// sqlite3 as db
// revamped the UI a bit so that it will be helpful while i am writing the backend
// also while evaluating
// also used postman
// handled all possible errors
