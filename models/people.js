const mongoose = require('mongoose');
const schemeName = 'people';

const profielSchema = new mongoose.Schema({
    age: { type: Number, required: true },
    name: { type: String, required: true },
    favoritegames: { type: Array,required: true},
    favoritegames: { type: Array,required: true},
},{collection:'people'});

module.exports = mongoose.model(schemeName, profielSchema)