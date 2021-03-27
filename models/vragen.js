const mongoose = require('mongoose');
const schemeName = 'vragen';

const voorkeurSchema = new mongoose.Schema({
    id: { type: Number},
    vraag: { type: String, required: true },
    ant1: { type: String, required: true },
    ant2: { type: String, required: true},
},{collection:'vragen'});

module.exports = mongoose.model(schemeName, voorkeurSchema)

