const mongoose = require('mongoose');
const schemeName = 'matches';

const profielSchema = new mongoose.Schema({
    person1: { type: String, required: true },
    ansPerson1: { type: String, required: true},
    person2: { type: String, required: true},
    ansPerson2: { type: String, required: true},
},{collection:'matches'});

module.exports = mongoose.model(schemeName, profielSchema)