const express = require('express');
const exphbs = require('express-handlebars');
const app = express();
const port = 3000;
var bodyParser = require('body-parser');
const dotenv = require('dotenv').config();
const mongoose = require('mongoose');

//models
const voorkeurmod = require('./models/voorkeur');
const profielmod = require('./models/profiel');
const peoplemod = require('./models/people');
const vraagmod = require('./models/vragen');
const matchesmod = require('./models/matches');

// Connect database with .env username and password
const MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;

// collection people
var col;
// After login get currrentUser id
var currrentUser;

// database connectie met mongoose
mongoose.connect(process.env.DB_URI, {useNewUrlParser: true, useUnifiedTopology: true});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async function() {
    // Get data from database
    console.log("Connected correctly to server");
    col = peoplemod;
    person = await col.findOne();
    currrentUser = "603fb9c67d5fab08997fc484";
});

// array met accounts
const fakeperson = [
  {"id": 14256,"naam": "Bert"},
  {"id": 987643,"naam": "Maaike"}
];
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
    res.render('home', {profielen, match})
  });
});

// When going to profiel.html when node is running your wil be redirected to a dynamic template

//////////// Dit zijn de profiel pagina's gemaakt door tim //////////////

// functie die de favoritegames update
async function updateGames(req, res, change){
    // games in een array zetten
  const str = req.body.gameNaam.toString();
  const arrayofgames = str.split(",");

  // loop door alle games in array en plaats ze elke keer in database.
  for (i = 0; i < arrayofgames.length; i++) {

    if(req.body.gameNaam != null || arrayofgames[i] != "test" ){

      if(change == "add"){
        await col.updateOne(
          { _id: ObjectId(currrentUser) },
          {$addToSet: {favoritegames: arrayofgames[i]}}
        )
      }

      if(change == "remove"){
        await col.updateOne(
          { _id: ObjectId(currrentUser) },
          {$pull:{favoritegames: arrayofgames[i]}}
        )
      }
    }
  }

  // Stuur naar overzichtGames
  res.redirect('/overzichtGames');
}

// profiel overzicht pagina

app.get('/profiel', async (req, res) => {

  // Opvragen informatie persoon
  const persoon = await col.findOne();
  
  // footer weet nu op welke pagina je bent
  const profielpagina = 'current';

  // rendert het template profiel
  res.render('profiel', {
      name: persoon.name,
      age: persoon.age,
      favoritegames: persoon.favoritegames,
      profielpagina
  })

});

// Persoonlijke informatie gebruiker
app.get('/overzichtPersoon', async (req, res) => {

  // Opvragen informatie persoon
  const persoon = await col.findOne();

  // rendert het template overzichtPersoon
  res.render('overzichtPersoon', {
      name: persoon.name,
      age: persoon.age
  })
});

// Update name and age from database and render template again
app.post('/overzichtPersoon', async (req, res) => {
  
  // Updaten van currrentUser
  await col.updateOne(
      { _id: ObjectId(currrentUser) },
      {$set: { name: req.body.name, age: req.body.age}}
    )
  // Stuur naar overzichtPersoon
  res.redirect('/overzichtPersoon');

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
  const persoon = await col.findOne();

  // rendert het template overzichtPersoon
  res.render('overzichtGames', {
      games: cmsgames,
      favoritegames: persoon.favoritegames
  })

});


// Toevoegen van game in persoon
app.post('/toevoegenGame', async (req, res) => {

  updateGames(req, res, "add");

});

// Remove game from database with form
app.post('/verwijderGame', async (req, res) => {

  updateGames(req, res, "remove");

});

/////////// Einden van profiel pagina's /////////


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
  const questAndAnswer = {"person1": fakeperson[0].id, "ansPerson1": req.body.answer, "person2": fakeperson[1].id, "ansPerson2": req.body.answer};
  console.log(questAndAnswer);
  await matchesmod.create(questAndAnswer)
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
  await vraagmod.create(Addvragen);
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