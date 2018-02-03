'use strict';

const mongoose = require('mongoose');

const {
    Schema,
    ObjectId,
} = mongoose;

const stringField = {
    type: String,
    minlength: 1,
    maxlength: 500,
};

const TaskSchema = new Schema({
    owner: ObjectId,
    name: stringField,
    description: stringField,
    isComplete: Boolean,
    collaborators: [String],
});

module.exports = mongoose.model('Tasks', TaskSchema);
