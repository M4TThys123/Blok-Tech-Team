const mongoose = require('mongoose');
const schemeName = 'matches';

const profielSchema = new mongoose.Schema({
    id: { type: Number},
    person1: { type: String },
    ansPerson1: { type: String},
    person2: { type: String},
    ansPerson2: { type: String},
},{collection:'matches'});

module.exports = mongoose.model(schemeName, profielSchema)