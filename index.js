const express = require('express');
const exphbs = require('express-handlebars');
const app = express();
const port = 3000;
var bodyParser = require('body-parser');
const dotenv = require('dotenv').config();
// const { MongoClient } = require('mongodb');

// Connect database with .env username and password
var { MongoClient } = require("mongodb");
var ObjectId = require('mongodb').ObjectID;
var client = new MongoClient(process.env.DB_URI);

// Get info from database
var db;
// collection people
var col;
// Person info
var colm;
// Movie info
var movie;
// After login get currrentUser id
var currrentUser;
// list of movies
var movies;
// get curent user favorite moviename
var usermovies;

// function connectDB
async function connectDB() {
    // Get data from database
    await client.connect();
    console.log("Connected correctly to server");
    db = await client.db(process.env.DB_NAME);
    col = db.collection("people");
    colm = db.collection("movies");
    movie = await colm.findOne();
    currrentUser = "603fb9c67d5fab08997fc484";
    movies = await colm.find({}, { }).toArray();
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
  db.collection('voorkeur').findOne({id: gebruiker}, async function(err, result) {
    if (err) throw err;
    // filter op geslacht, leeftijd en platform
    const filter = {geslacht: result.geslacht, leeftijdcategory: result.leeftijd, platform: result.platform}; 
    // haalt alle profielen de voldoen aan het filter uit de database op en stopt ze in een array
    profielen = await db.collection('profielen').find(filter).toArray();
    const match = 'current';
    res.render('home', {profielen, match})
  });
});

// When going to profiel.html when node is running your wil be redirected to a dynamic template
app.get('/profiel', async (req, res) => {

  var person = await col.findOne();
  var favoritemovies = (person.favoritemovies );

  const profielpagina = 'current';

  res.render('profiel', {
      name: person.name,
      age: person.age,
      movies: movies,
      favoritemovies: favoritemovies,
      profielpagina
  })

});

// Render template changeinfo with database values 
app.get('/changeinfo', async (req, res) => {

  var person = await col.findOne();

  res.render('changeinfo', {
      name: person.name,
      age: person.age
  })
});

// Update name and age from database and render template again
app.post('/bedankt2', async (req, res) => {
  

  await col.updateOne(
 { _id: ObjectId(currrentUser) },
 {
   $set: {
     name: req.body.name,
     age: req.body.age
   }
 }
)

  res.render('changeinfo', {
      name: req.body.name,
      age: req.body.age
  })

});


// Render template with movies name and image url
app.get('/changemovie', async (req, res) => {

  // Verbinden met het cms
const sanityClient = require('@sanity/client')
const client2 = sanityClient({
  projectId: '5wst6igf',
  dataset: 'production',
  token: '', // or leave blank to be anonymous user
  useCdn: true // `false` if you want to ensure fresh data
})

var cmsgames;

// Data ophalen uit het cms
const query = "*[_type == 'games']{name, 'posterUrl': poster.asset->url}"

// *[_type == 'movie']{title, 'posterUrl': poster.asset->url} 
await client2.fetch(query).then(games => {
  cmsgames = games;
})

console.log(cmsgames);


  var person = await col.findOne();
  var favoritemovies = (person.favoritemovies );

  res.render('changemovie', {
      movies: cmsgames,
      favoritemovies: favoritemovies
  })
});


// Add movie to database with form
app.post('/addmovie', async (req, res) => {

var str = req.body.moviename.toString();
var arrayofgames = str.split(",");


var i;
for (i = 0; i < arrayofgames.length; i++) {

if(req.body.moviename != null || arrayofgames[i] != "test" ){
  await col.updateOne(
 { _id: ObjectId(currrentUser) },
 {
   $addToSet: {
     favoritemovies: arrayofgames[i]
   }
 }
)

}

}

  res.redirect('/changemovie');

});

// Remove movie from database with form
app.post('/removemovie', async (req, res) => {

str = req.body.moviename.toString();
var arrayofgames = str.split(",");


var i;
for (i = 0; i < arrayofgames.length; i++) {

if(req.body.moviename != null || arrayofgames[i] != "test" ){
    await col.update(
{ _id: ObjectId(currrentUser) },
{$pull: { favoritemovies: arrayofgames[i] }}
)

}

}


     res.redirect('/changemovie');

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
  res.render('questions', {randVraag, layout: 'chat_layout.handlebars'});
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
  res.render('questions', {questAndAnswer, layout: 'chat_layout.handlebars'});
});


app.get('/chat', async (req, res) => {
  // takes the last match and sets it into an array
  var lastItem = await db.collection('matches').find().limit(1).sort({$natural:-1}).toArray();
res.render('chat', {lastItem, layout: 'chat_layout.handlebars'});
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
  res.render('filter',{geslacht, leeftijd, platform});
});

app.post('/filter', async (req,res) => {
  // update voorkeur in de database
  await db.collection("voorkeur").findOneAndUpdate({ id: gebruiker },{ $set: {"geslacht": req.body.geslacht, "leeftijd": req.body.leeftijd, "platform": req.body.platform  }},{ new: true, upsert: true, returnOriginal: false })
  res.redirect('/')
});

app.use(function (req, res) {
  res.status(404).send("Sorry this page doesn't exist, try another one");
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Express web app on localhost:3000');
});