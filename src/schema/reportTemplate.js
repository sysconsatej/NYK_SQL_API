const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    reportTemplateName: {
        type: String,
        required: true,
    },
    clientCode: {
        type: String,
        required: true,
    },
    id: {
        type: Number,
        required: true,
    },
    menuId: {
        type: String,
        required: true,
    }
}, { collection: 'tblReportTemplate' });

const ReportTemplate = mongoose.model('ReportTemplate', reportSchema);

module.exports = ReportTemplate;
