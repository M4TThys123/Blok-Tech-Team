const mongoose = require('mongoose');
const schemeName = 'voorkeur';

const voorkeurSchema = new mongoose.Schema({
    id: { type: String, required: true },
    geslacht: { type: String, required: true },
    leeftijd: { type: String, required: true },
    platform: { type: String,required: true},
},{collection:'voorkeur'});

module.exports = mongoose.model(schemeName, voorkeurSchema)

