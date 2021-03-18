const express = require('express');
const exphbs = require('express-handlebars');
const app = express();
const port = 3000;
var bodyParser = require('body-parser');
const dotenv = require('dotenv').config();
const { MongoClient } = require('mongodb');


let db = null;
// function connectDB
async function connectDB() {
  // Get URI from .env file
  const uri = process.env.DB_URI;
  // make connection to the db
  const options = { useUnifiedTopology: true };
  const client = new MongoClient(uri,options);
  await client.connect();
  db = await client.db(process.env.DB_NAME);
}
connectDB()
.then(() => {
  // if the connection was successfull, show:
  console.log("we have landed");
})
.catch ( error => {
  // if the connection fails, send error message
  console.log(error);
});

// a little array to mimic real accounts
const person = [
  {"id": 14256, "naam": "Bert", "leeftijd": "22"},
  {"id": 987643, "naam": "Maaike", "leeftijd": "23"}
];
const geslacht = ["man","vrouw"];
const leeftijd = ["20-30", "30-40", "40-50", "50+"];
const gebruiker = 2;

const games = [
  {
    gameNaam: "a",
    gameUrl: "public/images/71yW6lB4B5L._AC_SL1500_.jpg"
  },
  {
    gameNaam: "b",
    gameUrl: "public/images/Call-of-Duty-1.jpg"
  },
  {
    gameNaam: "c",
    gameUrl: "public/images/71RFxsydGTL._AC_SL1417_.jpg"
  }
];

app.use(bodyParser.urlencoded({extended:false}));
app.use(express.static('static'));

app.engine('handlebars', exphbs());
app.set("view engine", 'handlebars');

app.get('/', async (req, res) => {
  let profielen = {}

  // haalt je voorkeur uit de database
  db.collection('voorkeur').findOne({id: gebruiker}, async function(err, result) {
    if (err) throw err;
    // filter op geslacht en leeftijd
    const filter = {geslacht: result.geslacht, leeftijdcategory: result.leeftijd}; 
    // haalt alle profielen de voldoen aan het filter uit de database op en stopt ze in een array
    profielen = await db.collection('profielen').find(filter).toArray();
    res.render('home', {profielen})
  });
});

app.get('/q&a', async (req, res) => {
  var vragen = [];
  //takes all the questions from the database and places them into the array vragen
  vragen = await db.collection('vragen').find({}).toArray();
  //picks 5 random questions from vragen
  const randVraag = [];
  // vraagHolder is a holder for a single question to test if they are already in the new array randVraag
  var vraagHolder = "";
  while (randVraag.length < 5) {
    vraagHolder = (vragen[Math.floor(Math.random() * vragen.length)]); 
    //if the question in vraagHolder isn't in the new array, push them to the array
    if(!randVraag.includes(vraagHolder)){
      randVraag.push(vraagHolder);
    }
  }
  res.render('questions', {randVraag});
});

app.post('/q&a', async (req,res) => {
  //pushes chosen answers to the database with the id's from the users
  const questAndAnswer = {"person1": person[0].id, "ansPerson1": req.body.answer, "person2": person[1].id, "ansPerson2": req.body.answer};
  console.log(req.body.answer);
  await db.collection('matches').insertOne(questAndAnswer)
  .then(function() { 
    // redirects the user to a new view
    res.redirect('/chat');
}).catch(function(error){
    res.send(error);
})
  res.render('questions', {questAndAnswer});
});


app.get('/chat', async (req, res) => {
  // takes the last match and sets it into an array
  var lastItem = await db.collection('matches').find().limit(1).sort({$natural:-1}).toArray();
res.render('chat', {lastItem});
});

  app.get('/vragen', (req, res) => {
  res.render('add', {layout: 'addlayout.handlebars'});
});

app.post('/vragen', async (req,res) => {
  // takes the info given in the view form and places it into the database
  const Addvragen = {"vraag": req.body.vraag, "ant1": req.body.answer1, "ant2": req.body.answer2};
  await db.collection('questions').insertOne(Addvragen);
  res.render('add', {Addvragen, layout: 'addlayout.handlebars'})
});

app.get('/filter', (req, res) => {
  res.render('filter',{geslacht, leeftijd});
});

// Profiel pagina
app.get('/profiel', (req, res) => {
  res.render('profiel',{person, games});
});

// Profiel pagina
app.get('/aanpassenprofiel', (req, res) => {
  res.render('aanpassenprofiel',{person, games});
});

app.post('/aanpassenprofiel', (req, res) => {
  res.render('aanpassenprofiel',{person, games});
});

app.post('/filter', async (req,res) => {
  // update voorkeur in de database
  await db.collection("voorkeur").findOneAndUpdate({ id: gebruiker },{ $set: {"geslacht": req.body.geslacht, "leeftijd": req.body.leeftijd }},{ new: true, upsert: true, returnOriginal: false })
  res.redirect('/')
});

app.use(function (req, res) {
  res.status(404).send("Sorry this page doesn't exist, try another one");
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Express web app on localhost:3000');
});