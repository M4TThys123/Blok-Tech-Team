const express = require('express');
const exphbs = require('express-handlebars');
const app = express();
const port = 3000;
var bodyParser = require('body-parser');
const dotenv = require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.DB_URI, {useNewUrlParser: true, useUnifiedTopology: true});

//models
const voorkeurmod = require('./models/voorkeur');
const profielmod = require('./models/profiel');
const peoplemod = require('./models/people');
const gamesmod = require('./models/games');
const vraagmod = require('./models/vragen');
const matchesmod = require('./models/vragen');

// Connect database with .env username and password
var { MongoClient } = require("mongodb");
var ObjectId = require('mongodb').ObjectID;
var client = new MongoClient(process.env.DB_URI);

// Get info from database
// var db;
// collection people
var col;
// After login get currrentUser id
var currrentUser;

// function connectDB
async function connectDB() {
    // Get data from database
    await client.connect();
    console.log("Connected correctly to server");
    db = await client.db(process.env.DB_NAME);
    col = peoplemod;
    person = await col.findOne();
    colm = gamesmod;
    movie = await colm.findOne();
    currrentUser = "603fb9c67d5fab08997fc484";
    movies = await colm.find({}, { }).lean();
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

//Mongoose DB connectie
const mongodb = mongoose.connection;
mongodb.on('error', console.error.bind(console, 'connection error:'));
mongodb.once('open', function() {
  // we're connected!
  console.log('connected');
});


// a little array to mimic real accounts
// const person = [
//   {"id": 14256, "naam": "Bert"},
//   {"id": 987643, "naam": "Maaike"}
// ];

const geslacht = ["man","vrouw"];
const leeftijd = ["20-30", "30-40", "40-50", "50+"];
const platform = ["PC", "Playstation", "Xbox"];
const gebruiker = 2;


app.use(bodyParser.urlencoded({extended:false}));
app.use(express.static('static'));

app.engine('handlebars', exphbs());
app.set("view engine", 'handlebars');

app.get('/', async (req, res) => {
  let profielen = {}

  // haalt je voorkeur uit de database
    await voorkeurmod.findOne({id: gebruiker}, async function(err, result) {
    if (err) throw err;
    // filter op geslacht, leeftijd en platform
    const filter = {geslacht: result.geslacht, leeftijdcategory: result.leeftijd, platform: result.platform}; 
    // haalt alle profielen de voldoen aan het filter uit de database op en stopt ze in een array
    profielen = await profielmod.find(filter).lean();
    const match = 'current';
    console.log(profielen)
    res.render('home', {profielen, match})
  });
});

app.get('/voorkeur', async (req, res) => {
// console.log(voorkeur)
    // voorkeur.updateOne( { geslacht: "vrouw", leeftijd: "20-30", platform: "Playstation"} );
// let voorkeurd = {}
 const voorkeur = await voorkeurmod.find({}).lean();
  console.log(voorkeur);
  console.log(profiel); 

  res.render('voorkeur', { voorkeurList: voorkeur });
});

// When going to profiel.html when node is running your wil be redirected to a dynamic template

// Dit zijn de profiel pagina's

// profiel overzicht pagina

app.get('/profiel', async (req, res) => {

  // Opvragen informatie persoon
  var person = await col.findOne();
  
  // footer weet nu op welke pagina je bent
  const profielpagina = 'current';

  // rendert het template profiel
  res.render('profiel', {
      name: person.name,
      age: person.age,
      favoritegames: person.favoritegames,
      profielpagina
  })

});

// Persoonlijke informatie gebruiker
app.get('/overzichtPersoon', async (req, res) => {

  // Opvragen informatie persoon
  var person = await col.findOne();

  // rendert het template overzichtPersoon
  res.render('overzichtPersoon', {
      name: person.name,
      age: person.age
  })
});

// Update name and age from database and render template again
app.post('/overzichtPersoon', async (req, res) => {
  
  // Updaten van currrentUser
    await col.updateOne(
   { _id: ObjectId(currrentUser) },
   {
     $set: {
       name: req.body.name,
       age: req.body.age
     }
   }
  )

  // rendert het template overzichtPersoon
  res.render('overzichtPersoon', {
      name: req.body.name,
      age: req.body.age
  })

});


// Render template with games name and image url
app.get('/overzichtGames', async (req, res) => {

  // Verbinden met het cms
  const sanityClient = require('@sanity/client')
  const client2 = sanityClient({
    projectId: '5wst6igf',
    dataset: 'production',
    token: '', // or leave blank to be anonymous user
    useCdn: true // `false` if you want to ensure fresh data
  })

  var cmsgames;

  // Data ophalen uit het cms met query
  const query = "*[_type == 'games']{name, 'posterUrl': poster.asset->url}"

  // verander variable naar die van de database
  await client2.fetch(query).then(games => {
    cmsgames = games;
  })

  // Opvragen informatie persoon
  var person = await col.findOne();

  // rendert het template overzichtPersoon
  res.render('overzichtGames', {
      games: cmsgames,
      favoritegames: person.favoritegames
  })
});


// Toevoegen van game in persoon
app.post('/toevoegenGame', async (req, res) => {

  // games in een array zetten
  var str = req.body.gameNaam.toString();
  var arrayofgames = str.split(",");

  // loop door alle games in array en plaats ze elke keer in database.
  var i;
  for (i = 0; i < arrayofgames.length; i++) {

    if(req.body.gameNaam != null || arrayofgames[i] != "test" ){
      await col.updateOne(
      { _id: ObjectId(currrentUser) },
       {
         $addToSet: {
           favoritegames: arrayofgames[i]
         }
      })
    }
  }

  // Stuur naar overzichtGames
  res.redirect('/overzichtGames');

});

// Remove game from database with form
app.post('/verwijderGame', async (req, res) => {

  // games in een array zetten
  str = req.body.gameNaam.toString();
  var arrayofgames = str.split(",");

  // loop door alle games in array en verwijder ze elke keer in database.
  var i;
  for (i = 0; i < arrayofgames.length; i++) {

    if(req.body.gameNaam != null || arrayofgames[i] != "test" ){
      await col.update(
      { _id: ObjectId(currrentUser) },
      {$pull: { favoritegames: arrayofgames[i] }}
      )
    }
  }

  // Stuur naar overzichtGames
  res.redirect('/overzichtGames');

});
// Einden van profiel pagina's


app.get('/q&a', async (req, res) => {
  var vragen = [];
  //takes all the questions from the database and places them into the array vragen
  vragen = await vraagmod.find({}).lean();
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
  res.render('questions', {randVraag, layout: 'chat_layout.handlebars'});
});

app.post('/q&a', async (req,res) => {
  //pushes chosen answers to the database with the id's from the users
  const questAndAnswer = {"person1": person[0].id, "ansPerson1": req.body.answer, "person2": person[1].id, "ansPerson2": req.body.answer};
  console.log(req.body.answer);
  await matchesmod.insertOne(questAndAnswer)
  .then(function() { 
    // redirects the user to a new view
    res.redirect('/chat');
}).catch(function(error){
    res.send(error);
})
  res.render('questions', {questAndAnswer, layout: 'chat_layout.handlebars'});
});


app.get('/chat', async (req, res) => {
  // takes the last match and sets it into an array
  var lastItem = await matchesmod.find().limit(1).sort({$natural:-1}).lean();
res.render('chat', {lastItem, layout: 'chat_layout.handlebars'});
});

  app.get('/vragen', (req, res) => {
  res.render('add', {layout: 'addlayout.handlebars'});
});

app.post('/vragen', async (req,res) => {
  // takes the info given in the view form and places it into the database
  const Addvragen = {"vraag": req.body.vraag, "ant1": req.body.answer1, "ant2": req.body.answer2};
  await vragenmod.insertOne(Addvragen);
  res.render('add', {Addvragen, layout: 'addlayout.handlebars'})
});

app.get('/filter', (req, res) => {
  res.render('filter',{geslacht, leeftijd, platform});
});

app.post('/filter', async (req,res) => {
  // update voorkeur in de database
  await voorkeurmod.findOneAndUpdate({ id: gebruiker },{ $set: {"geslacht": req.body.geslacht, "leeftijd": req.body.leeftijd, "platform": req.body.platform  }},{ new: true, upsert: true, returnOriginal: false })

  res.redirect('/')
});

app.use(function (req, res) {
  res.status(404).send("Sorry this page doesn't exist, try another one");
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Express web app on localhost:3000');
});