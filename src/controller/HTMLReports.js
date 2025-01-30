const mongoose = require('mongoose');
const Report = require('../schema/htmlReportSchema');
const ReportTemplate = require('../schema/reportTemplate');

module.exports = {
  report: async (req, res) => {
    try {
      const reports = await Report.find();

      res.status(200).send({
        success: true,
        message: "Reports fetched successfully",
        data: reports
      });
    } catch (error) {
      res.status(500).send({
        success: false,
        message: "Something went wrong....!",
        data: error.message
      });
    }
  },
  template: async (req, res) => {
    try {
      // Use the select method to specify the fields you want to include
      const reports = await ReportTemplate.find().select('reportTemplateName clientCode id _id menuId');

      res.status(200).send({
        success: true,
        message: "Reports fetched successfully",
        data: reports
      });
    } catch (error) {
      res.status(500).send({
        success: false,
        message: "Something went wrong....!",
        data: error.message
      });
    }
  }
};
