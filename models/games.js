const mongoose = require('mongoose');
const schemeName = 'games';

const profielSchema = new mongoose.Schema({
    gameimage: { type: String, required: true },
    gamename: { type: String, required: true },
},{collection:'games'});

module.exports = mongoose.model(schemeName, profielSchema)