const mongoose = require('mongoose');
const schemeName = 'matches';

const profielSchema = new mongoose.Schema({
    id: { type: Number, required: true },
    answer: { type: String, required: true },
},{collection:'matches'});

module.exports = mongoose.model(schemeName, profielSchema)