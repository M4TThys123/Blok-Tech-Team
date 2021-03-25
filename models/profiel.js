const mongoose = require('mongoose');
const schemeName = 'profielen';

const profielSchema = new mongoose.Schema({
    id: { type: Number, required: true },
    naam: { type: String, required: true },
    leeftijd: { type: String, required: true },
    geslacht: { type: String,required: true},
    beschrijving: { type: String,required: true},
    afbeelding: { type: String,required: true},
    leeftijdcategory: { type: String,required: true},
    platform: { type: String,required: true},
    favoritemovies: { type: Array,required: true},
},{collection:'profielen'});

module.exports = mongoose.model(schemeName, profielSchema)