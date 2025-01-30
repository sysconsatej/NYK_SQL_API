const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    ReportName: {
        type: String,
        required: true,
    }
});

const Report = mongoose.model('Report', reportSchema, 'tblReportList');

module.exports = Report;