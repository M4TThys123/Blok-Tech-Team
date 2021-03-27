const express = require('express');
const app = require('express')();
var socket = require('socket.io');
var server = require('http').createServer(app);


const exphbs = require('express-handlebars');
const port = 3000;
var bodyParser = require('body-parser');
const dotenv = require('dotenv').config();
server.listen(port);
const mongoose = require('mongoose');

// models
const voorkeurmod = require('./models/voorkeur');
const profielmod = require('./models/profiel');
const peoplemod = require('./models/people');
const vraagmod = require('./models/vragen');
const matchesmod = require('./models/matches');

// Mongodb gebruiken
const MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;

// collection personen
var col;
// after login pak de currrentUser id
var currrentUser;

// database connectie met mongoose
mongoose.connect(process.env.DB_URI, {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async function() {
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

app.use(bodyParser.urlencoded({extended:false}));
app.use(express.static('static'));

app.engine('handlebars', exphbs());
app.set("view engine", 'handlebars');


//socket setup
var io = socket(server);
io.on('connection', function(socket) {
  console.log('made the socket connection');

  //luistert naar de client side of daar een chat bericht van verstuurd wordt
  socket.on('chat', function(data){
    //stuurt het bericht door naar alle clients die gekoppeld zijn aan dezelfde room
    io.sockets.emit('chat', data);
  });
});


app.get('/match', async (req, res) => {
  let profielen = {}

  // haalt je voorkeur uit de database
    await voorkeurmod.findOne({id: currrentUser}, async function(err, result) {
    if (err) throw err;
    // filter op geslacht, leeftijd en platform
    const filter = {geslacht: result.geslacht, leeftijdcategory: result.leeftijd, platform: result.platform}; 
    // haalt alle profielen de voldoen aan het filter uit de database op en stopt ze in een array
    // https://stackoverflow.com/a/59759088
    profielen = await profielmod.find(filter).lean();
    const match = 'current';
    res.render('home', {profielen, match})
  });
});

// Wanneer je naar profiel.html gaat, runt node en wordt je geredirect naar een dynamische template

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


// 

// const profielChat = [
//   {"naam": "Sarah",
//   "games": "Rocket league"},
  
//   {"naam": "Jack","games": "Rocket league"},
//   {"naam": "Mara","games": "Rocket league"}
// ];


app.get('/chat_home', async (req, res) => {
  var profielChat = await profielmod.find().lean();
  res.render('chat_home', {
    profiel: profielChat
  })
  console.log (profielChat);
});

app.get('/', async (req, res) => {

  
    res.render('login', {

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


// Render template met games naam en image url
app.get('/overzichtGames', async (req, res) => {

  // Verbinden met het cms
  const sanityClient = require('@sanity/client')
  const client2 = sanityClient({
    projectId: '5wst6igf',
    dataset: 'production',
    token: '', // of laat leeg om een verborgen gebruiker te zijn
    useCdn: true // `false` als je nieuwe verse data wilt krijgen
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

// verwijder game van de database met een form
app.post('/verwijderGame', async (req, res) => {

  updateGames(req, res, "remove");

});

/////////// Einden van profiel pagina's /////////


app.get('/q&a', async (req, res) => {
  var vragen = [];
  //Neemt alle vragen van de database en plaatst ze in de array vragen
  vragen = await vraagmod.find({}).lean();
  //Kiest 5 random vragen van de array vragen
  const randVraag = [];
  // vraagHolder is een holder voor een enkele vraag om te testen of deze al in de nieuwe array randVraag staat
  var vraagHolder = "";
  while (randVraag.length < 5) {
    vraagHolder = (vragen[Math.floor(Math.random() * vragen.length)]); 
    //als de nieuwe vraag in vraagHolder, niet in de nieuwe array staat, push hem dan naar de nieuwe array.
    if(!randVraag.includes(vraagHolder)){
      randVraag.push(vraagHolder);
    }
  }
  res.render('questions', {randVraag, layout: 'chat_layout.handlebars'});
});

app.post('/q&a', async (req,res) => {
  //stuurt de gekozen antwoorden via de model naar de databasepushes chosen answers to the database with the id's from the users
  const questAndAnswer = {"person1": fakeperson[0].id, "ansPerson1": req.body.answer, "person2": fakeperson[1].id, "ansPerson2": req.body.answer};
  await matchesmod.create(questAndAnswer)
  .then(function() { 
    // redirects de gebruiker naar een nieuwe view
    res.redirect('/chat');
}).catch(function(error){
    res.send(error);
})
  res.render('questions', {questAndAnswer, layout: 'chat_layout.handlebars'});
});


app.get('/chat', async (req, res) => {
  // pakt de laatste match aan antwoorden en zet ze in een array
  var lastItem = await matchesmod.find().limit(1).sort({$natural:-1}).lean();
res.render('chat', {lastItem, layout: 'chat_layout.handlebars'});
});

  app.get('/vragen', (req, res) => {
  res.render('add', {layout: 'addlayout.handlebars'});
});

app.post('/vragen', async (req,res) => {
  // pakt de info die gegeven is in de view en plaatst het via de model in de database
  const Addvragen = {"vraag": req.body.vraag, "ant1": req.body.answer1, "ant2": req.body.answer2};
  await vraagmod.create(Addvragen);
  res.render('add', {Addvragen, layout: 'addlayout.handlebars'})
});

app.get('/filter', (req, res) => {
  res.render('filter',{geslacht, leeftijd, platform});
});

app.post('/filter', async (req,res) => {
  // update voorkeur in de database
  // https://poopcode.com/mongoerror-the-update-operation-document-must-contain-atomic-operators-how-to-fix/
  await voorkeurmod.findOneAndUpdate({ id: currrentUser },{ $set: {"geslacht": req.body.geslacht, "leeftijd": req.body.leeftijd, "platform": req.body.platform  }},{ new: true, upsert: true, returnOriginal: false })
  res.redirect('/match')
});

app.use(function (req, res) {
  res.status(404).send("Sorry this page doesn't exist, try another one");
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Express web app on localhost:3000');
});