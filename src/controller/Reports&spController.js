const model = require("../models/module");
const mongoose = require("mongoose");
const validate = require("../helper/validate");
const { errorLogger } = require("../helper/loggerService");
const moment = require("moment");
const { ref } = require("pdfkit");
function createObjectId(companyId) {
  try {
    if (companyId !== null) {
      return new mongoose.Types.ObjectId(companyId);
    } else {
      return null;
    }
    // Attempt to create a new ObjectId with the provided companyId
  } catch (error) {
    // If an error occurs (e.g., due to an invalid companyId format), return null
    return companyId;
  }
}

function FilterCondition(matchData, body) {
  let keys = Object.keys(body?.filterCondition || {});
  for (const element of keys || []) {
    if (element !== "fromDate" && element !== "toDate") {
      matchData[element] = {
        $in: Array.isArray(body.filterCondition[element])
          ? body.filterCondition[element]
          : [body.filterCondition[element]],
      };
    }
  }
}
module.exports = {
  JobRegistration: async (req, res) => {
    try {
      let matchData = { status: Number(process.env.ACTIVE_STATUS) };
      FilterCondition(matchData, req.body);
      let { body } = req;
      if (body.id && body.id != "undefined" && body.id !== "") {
        matchData["id"] = Number(body.id);
      }
      if (body._id && body._id != "undefined" && body._id !== "") {
        matchData["_id"] = new mongoose.Types.ObjectId(body._id);
      }
      if (
        body.customerId &&
        body.customerId != "undefined" &&
        body.customerId !== ""
      ) {
        matchData["customerId"] = Number(body.customerId);
      }
      if (
        body.finYearId &&
        body.finYearId != "undefined" &&
        body.finYearId !== ""
      ) {
        matchData["finYearId"] = String(body.finYearId);
      }
      if (
        body.shipperId &&
        body.shipperId != "undefined" &&
        body.shipperId !== ""
      ) {
        matchData["shipperId"] = Number(body.shipperId);
      }
      if (
        body.consigneeId &&
        body.consigneeId != "undefined" &&
        body.consigneeId !== ""
      ) {
        matchData["consigneeId"] = Number(body.consigneeId);
      }
      if (
        body.shippingLineId &&
        body.shippingLineId != "undefined" &&
        body.shippingLineId !== ""
      ) {
        matchData["shippingLineId"] = Number(body.shippingLineId);
      }
      if (body.plrId && body.plrId != "undefined" && body.plrId !== "") {
        matchData["plrId"] = Number(body.plrId);
      }
      if (body.polId && body.polId != "undefined" && body.polId !== "") {
        matchData["polId"] = Number(body.polId);
      }
      if (body.podId && body.podId != "undefined" && body.podId !== "") {
        matchData["podId"] = Number(body.podId);
      }
      if (body.fpdId && body.fpdId != "undefined" && body.fpdId !== "") {
        matchData["fpdId"] = Number(body.fpdId);
      }
      if (
        body.fromDate &&
        body.fromDate != "undefined" &&
        body.fromDate !== "" &&
        body.toDate &&
        body.toDate != "undefined" &&
        body.toDate !== ""
      ) {
        matchData["jobDate"] = {
          $gte: new Date(body.fromDate),
          $lte: new Date(body.toDate),
        };
      } else if (
        body.fromDate &&
        body.fromDate != "undefined" &&
        body.fromDate !== ""
      ) {
        matchData["jobDate"] = { $gte: new Date(body.fromDate) };
      } else if (
        body.toDate &&
        body.toDate != "undefined" &&
        body.toDate !== ""
      ) {
        matchData["jobDate"] = { $lte: new Date(body.toDate) };
      }
      let page = parseInt(req.query.page, 10) || 1; // Default to page 1 if not specified
      let pageSize = parseInt(req.query.pageSize, 100) || 1000; // Default to 10 items per page if not specified

      // Calculate the number of documents to skip
      let skipCount = (page - 1) * pageSize;
      let query = [
        {
          $match: matchData,
        },
        {
          $sort: {
            id: 1,
          },
        },
        {
          $skip: skipCount,
        },
        {
          $limit: pageSize,
        },
      ];
      let project = {};
      if (body.projection && Object.keys(body.projection).length > 0) {
        project = body.projection;
      }
      if (Object.keys(project).length > 0) {
        query.push({ $project: project });
      }

      let data = await model.AggregateFetchData("tblJob", "tblJob", query, res);
      let plrId = new Set();
      let polId = new Set();
      let podId = new Set();
      let fpdId = new Set();
      let customerId = new Set();
      let shipperId = new Set();
      let consigneeId = new Set();
      let companyBranchId = new Set();
      let shippingLineId = new Set();
      let consigneeBranchId = new Set();
      let shipperBranchId = new Set();
      let salesExecutiveId = new Set();
      let companyId = new Set();
      let podAgentId = new Set();
      let polAgentId = new Set();
      let customerBranchId = new Set();
      let agentId = new Set();
      let agentBranchId = new Set();
      let notifyPartyId = new Set();
      let notifyPartyBranchId = new Set();
      let customBrokerId = new Set();
      let finYearId = new Set();
      let destinationCountryId = new Set();
      let originCountryId = new Set();
      let tradeTermsId = new Set();
      let natureOfCargoId = new Set();
      let stuffingTypeId = new Set();
      let containerStatusId = new Set();
      let preCarriageId = new Set();
      let destuffingTypeId = new Set();
      let cargoTypeId = new Set();
      let cargoWtUnitId = new Set();
      let packageId = new Set();
      let commodityTypeId = new Set();
      let volumeUnitId = new Set();
      let chargeableWtUnitId = new Set();
      let businessSegmentId = new Set();
      let polVoyageId = new Set();
      let polVesselId = new Set();
      let polTerminalId = new Set();
      let transporterId = new Set();
      let podCustomBrokerId = new Set();
      let shippingAgentId = new Set();
      let slotOwnerId = new Set();
      let mloId = new Set();
      let createdByCompanyId = new Set();
      let fpdAgentId = new Set();
      let surveyorId = new Set();
      let plrAgentId = new Set();
      let postCarriage = new Set();
      let routeId = new Set();
      let netWtUnitId = new Set();
      let createdByCompanyBranchId = new Set();
      let polAgentBranchId = new Set();
      let podAgentBranchId = new Set();
      let surveyorBranchId = new Set();
      let fpdAgentBranchId = new Set();
      let plrAgentBranchId = new Set();
      let pricingPersonId = new Set();
      let customerServicePersonId = new Set();
      let demmuragecurrency = new Set();
      let backOfficePersonId = new Set();
      let sellPersonId = new Set();
      let customerClearancePersonId = new Set();
      let depotId = new Set();
      let podTerminalId = new Set();
      let podVoyageId = new Set();
      let podVesselId = new Set();
      let rateRequestId = new Set();
      let masterJobId = new Set();
      // tblJobContainer
      let sizeId = new Set();
      let typeId = new Set();
      let dimensionUnitId = new Set();
      let wtUnitId = new Set();
      let containerId = new Set();

      // tblJobQuantity
      let grossWtUnitId = new Set();
      let tareWtUnitId = new Set();
      let refTempUnitId = new Set();
      let TransporterId = new Set();
      // tblJobCharge
      let unitId = new Set();
      let buyCurrencyId = new Set();
      let sellCurrencyId = new Set();
      let buyPrepaidCollectId = new Set();
      let sellPrepaidCollectid = new Set();
      let dueToId = new Set();
      // tblJobActivity
      let activityPersonId = new Set();
      let activityId = new Set();
      let chargeId = new Set();
      let buyPartyId = new Set();
      let sellPartyId = new Set();

      data.forEach((item) => {
        plrId.add(createObjectId(item.plrId));
        polId.add(createObjectId(item.polId));
        podId.add(createObjectId(item.podId));
        fpdId.add(createObjectId(item.fpdId));
        customerId.add(createObjectId(item.customerId));
        shipperId.add(createObjectId(item.shipperId));
        consigneeId.add(createObjectId(item.consigneeId));
        companyBranchId.add(createObjectId(item.companybranchId));
        shippingLineId.add(createObjectId(item.shippingLineId));
        consigneeBranchId.add(createObjectId(item.consigneeBranchId));
        shipperBranchId.add(createObjectId(item.shipperBranchId));
        salesExecutiveId.add(item.salesExecutiveId);
        companyId.add(createObjectId(item.companyId));
        podAgentId.add(createObjectId(item.podAgentId));
        polAgentId.add(createObjectId(item.polAgentId));
        customerBranchId.add(createObjectId(item.customerBranchId));
        agentId.add(createObjectId(item.agentId));
        agentBranchId.add(createObjectId(item.agentBranchId));
        notifyPartyId.add(createObjectId(item.notifyPartyId));
        notifyPartyBranchId.add(createObjectId(item.notifyPartyBranchId));
        customBrokerId.add(createObjectId(item.customBrokerId));
        finYearId.add(createObjectId(item.finYearId));
        destinationCountryId.add(createObjectId(item.destinationCountryId));
        originCountryId.add(createObjectId(item.originCountryId));
        tradeTermsId.add(createObjectId(item.tradeTermsId));
        natureOfCargoId.add(createObjectId(item.natureOfCargoId));
        stuffingTypeId.add(createObjectId(item.stuffingTypeId));
        containerStatusId.add(createObjectId(item.containerStatusId));
        preCarriageId.add(createObjectId(item.preCarriageId));
        // preCarriageId.add(item.preCarriageId);
        destuffingTypeId.add(createObjectId(item.destuffingTypeId));
        cargoTypeId.add(createObjectId(item.cargoTypeId));
        cargoWtUnitId.add(createObjectId(item.cargoWtUnitId));
        packageId.add(createObjectId(item.packageId));
        commodityTypeId.add(createObjectId(item.commodityTypeId));
        volumeUnitId.add(createObjectId(item.volumeUnitId));
        chargeableWtUnitId.add(createObjectId(item.chargeableWtUnitId));
        businessSegmentId.add(createObjectId(item.businessSegmentId));
        polVoyageId.add(createObjectId(item.polVoyageId));
        polVesselId.add(createObjectId(item.polVesselId));
        polTerminalId.add(createObjectId(item.polTerminalId));
        transporterId.add(createObjectId(item.transporterId));
        podCustomBrokerId.add(createObjectId(item.podCustomBrokerId));
        shippingAgentId.add(createObjectId(item.shippingAgentId));
        slotOwnerId.add(createObjectId(item.slotOwnerId));
        mloId.add(createObjectId(item.mloId));
        createdByCompanyId.add(createObjectId(item.createdByCompanyId));
        fpdAgentId.add(createObjectId(item.fpdAgentId));
        plrAgentId.add(createObjectId(item.plrAgentId));
        surveyorId.add(createObjectId(item.surveyorId));
        postCarriage.add(createObjectId(item.postCarriage));
        routeId.add(createObjectId(item.routeId));
        netWtUnitId.add(createObjectId(item.netWtUnitId));
        createdByCompanyBranchId.add(
          createObjectId(item.createdByCompanyBranchId)
        );
        polAgentBranchId.add(createObjectId(item.polAgentBranchId));
        podAgentBranchId.add(createObjectId(item.podAgentBranchId));
        surveyorBranchId.add(createObjectId(item.surveyorBranchId));
        fpdAgentBranchId.add(createObjectId(item.fpdAgentBranchId));
        plrAgentBranchId.add(createObjectId(item.plrAgentBranchId));
        pricingPersonId.add(createObjectId(item.pricingPersonId));
        customerServicePersonId.add(
          createObjectId(item.customerServicePersonId)
        );
        demmuragecurrency.add(createObjectId(item.demmuragecurrency));
        backOfficePersonId.add(createObjectId(item.backOfficePersonId));
        sellPersonId.add(createObjectId(item.sellPersonId));
        customerClearancePersonId.add(
          createObjectId(item.customerClearancePersonId)
        );
        depotId.add(createObjectId(item.depotId));
        podTerminalId.add(createObjectId(item.podTerminalId));
        podVoyageId.add(createObjectId(item.podVoyageId));
        podVesselId.add(createObjectId(item.podVesselId));
        rateRequestId.add(createObjectId(item.rateRequestId));
        masterJobId.add(createObjectId(item.masterJobId));
        // tblJobQty
        item.tblJobQty &&
          item.tblJobQty.map((x) => {
            console.log("x", x);
            sizeId.add(createObjectId(x.sizeId));
            typeId.add(createObjectId(x.typeId));
            dimensionUnitId.add(createObjectId(x.dimensionUnitId));
            wtUnitId.add(createObjectId(x.wtUnitId));
            volumeUnitId.add(createObjectId(x.volumeUnitId));
            depotId.add(createObjectId(x.depotId));
            containerId.add(createObjectId(x.containerId));
          });
        //  tblJobContainer
        item.tblJobContainer &&
          item.tblJobContainer.map((x) => {
            sizeId.add(createObjectId(x.sizeId));
            typeId.add(createObjectId(x.typeId));
            containerStatusId.add(createObjectId(x.containerStatusId));
            grossWtUnitId.add(createObjectId(x.grossWtUnitId));
            tareWtUnitId.add(createObjectId(x.tareWtUnitId));
            refTempUnitId.add(createObjectId(x.refTempUnitId));
            packageId.add(createObjectId(x.packageId));
            dimensionUnitId.add(createObjectId(x.dimensionUnitId));
            TransporterId.add(createObjectId(x.TransporterId));
            volumeUnitId.add(createObjectId(x.volumeUnitId));
            cargoTypeId.add(createObjectId(x.cargoTypeId));
            slotOwnerId.add(createObjectId(x.slotOwnerId));
          });
        // tblJobCharge
        item.tblJobCharge &&
          item.tblJobCharge.map((x) => {
            sizeId.add(createObjectId(x.sizeId));
            typeId.add(createObjectId(x.typeId));
            unitId.add(createObjectId(x.unitId));
            buyCurrencyId.add(createObjectId(x.buyCurrencyId));
            sellCurrencyId.add(createObjectId(x.sellCurrencyId));
            buyPrepaidCollectId.add(createObjectId(x.buyPrepaidCollectId));
            sellPrepaidCollectid.add(createObjectId(x.sellPrepaidCollectid));
            dueToId.add(createObjectId(x.dueToId));
            chargeId.add(createObjectId(x.chargeId));
            buyPartyId.add(createObjectId(x.buyPartyId));
            sellPartyId.add(createObjectId(x.sellPartyId));
          });
        // tblJobActivity
        item.tblJobActivity &&
          item.tblJobActivity.map((x) => {
            activityPersonId.add(createObjectId(x.activityPersonId));
            activityId.add(createObjectId(x.activityId));
          });
      });
      // return console.log(companyBranchId);
      const tables = [
        {
          tableName: "tblPort",
          query: [
            {
              $match: {
                $or: [
                  { _id: { $in: Array.from(plrId) } },
                  { _id: { $in: Array.from(polId) } },
                  { _id: { $in: Array.from(podId) } },
                  { _id: { $in: Array.from(fpdId) } },
                  { _id: { $in: Array.from(depotId) } },
                  { _id: { $in: Array.from(podTerminalId) } },
                  { _id: { $in: Array.from(podVoyageId) } },
                ],
                status: Number(process.env.ACTIVE_STATUS),
              },
            },
          ],
        },
        {
          tableName: "tblCompany",
          query: [
            {
              $match: {
                $or: [
                  { _id: { $in: Array.from(customerId) } },
                  { _id: { $in: Array.from(shipperId) } },
                  { _id: { $in: Array.from(consigneeId) } },
                  { _id: { $in: Array.from(shippingLineId) } },
                  { _id: { $in: Array.from(companyId) } },
                  { _id: { $in: Array.from(podAgentId) } },
                  { _id: { $in: Array.from(polAgentId) } },
                  { _id: { $in: Array.from(agentId) } },
                  { _id: { $in: Array.from(notifyPartyId) } },
                  { _id: { $in: Array.from(customBrokerId) } },
                  { _id: { $in: Array.from(transporterId) } },
                  { _id: { $in: Array.from(podCustomBrokerId) } },
                  { _id: { $in: Array.from(shippingAgentId) } },
                  { _id: { $in: Array.from(slotOwnerId) } },
                  { _id: { $in: Array.from(mloId) } },
                  { _id: { $in: Array.from(createdByCompanyId) } },
                  { _id: { $in: Array.from(fpdAgentId) } },
                  { _id: { $in: Array.from(plrAgentId) } },
                  { _id: { $in: Array.from(surveyorId) } },
                ],
              },
            },
          ],
        },
        {
          tableName: "tblCompany",
          query: [
            {
              $unwind: {
                path: "$tblCompanyBranch",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                tblCompanyBranch: { $exists: true, $ne: null },
                $or: [
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(companyBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(consigneeBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(shipperBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(customerBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": { $in: Array.from(agentBranchId) },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(notifyPartyBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(createdByCompanyBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(polAgentBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(podAgentBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(surveyorBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(plrAgentBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(fpdAgentBranchId),
                    },
                  },
                  // Add more conditions here if needed, each enclosed in {}
                ],
              },
            },
          ],
        },
        {
          tableName: "tblCompany",
          query: [
            {
              $unwind: {
                path: "$tblCompanyBranch",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $unwind: {
                path: "$tblCompanyBranch.tblCompanyBranchPerson",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                "tblCompanyBranch.tblCompanyBranchPerson": {
                  $exists: true,
                  $ne: null,
                },
                $or: [
                  {
                    "tblCompanyBranch.tblCompanyBranchPerson._id": {
                      $in: Array.from(salesExecutiveId),
                    },
                  },
                  {
                    "tblCompanyBranch.tblCompanyBranchPerson._id": {
                      $in: Array.from(pricingPersonId),
                    },
                  },
                  {
                    "tblCompanyBranch.tblCompanyBranchPerson._id": {
                      $in: Array.from(backOfficePersonId),
                    },
                  },
                  {
                    "tblCompanyBranch.tblCompanyBranchPerson._id": {
                      $in: Array.from(sellPersonId),
                    },
                  },
                  {
                    "tblCompanyBranch.tblCompanyBranchPerson._id": {
                      $in: Array.from(customerServicePersonId),
                    },
                  },
                  {
                    "tblCompanyBranch.tblCompanyBranchPerson._id": {
                      $in: Array.from(customerClearancePersonId),
                    },
                  },
                  {
                    "tblCompanyBranch.tblCompanyBranchPerson._id": {
                      $in: Array.from(activityPersonId),
                    },
                  },
                  // Add more conditions here if needed, each enclosed in {}
                ],
              },
            },
          ],
        },
        {
          tableName: "tblFinancialYear",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(finYearId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblCountry",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [
                  { _id: { $in: Array.from(destinationCountryId) } },
                  { _id: { $in: Array.from(originCountryId) } },
                ],
              },
            },
          ],
        },
        {
          tableName: "tblMasterData",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [
                  { _id: { $in: Array.from(tradeTermsId) } },
                  { _id: { $in: Array.from(natureOfCargoId) } },
                  { _id: { $in: Array.from(stuffingTypeId) } },
                  { _id: { $in: Array.from(containerStatusId) } },
                  { _id: { $in: Array.from(preCarriageId) } },
                  { _id: { $in: Array.from(destuffingTypeId) } },
                  { _id: { $in: Array.from(cargoTypeId) } },
                  { _id: { $in: Array.from(cargoWtUnitId) } },
                  { _id: { $in: Array.from(packageId) } },
                  { _id: { $in: Array.from(commodityTypeId) } },
                  { _id: { $in: Array.from(volumeUnitId) } },
                  { _id: { $in: Array.from(chargeableWtUnitId) } },
                  { _id: { $in: Array.from(postCarriage) } },
                  { _id: { $in: Array.from(routeId) } },
                  { _id: { $in: Array.from(netWtUnitId) } },
                  { _id: { $in: Array.from(demmuragecurrency) } },
                  { _id: { $in: Array.from(sizeId) } },
                  { _id: { $in: Array.from(typeId) } },
                  { _id: { $in: Array.from(dimensionUnitId) } },
                  { _id: { $in: Array.from(wtUnitId) } },
                  { _id: { $in: Array.from(grossWtUnitId) } },
                  { _id: { $in: Array.from(tareWtUnitId) } },
                  { _id: { $in: Array.from(refTempUnitId) } },
                  { _id: { $in: Array.from(TransporterId) } },
                  { _id: { $in: Array.from(unitId) } },
                  { _id: { $in: Array.from(buyCurrencyId) } },
                  { _id: { $in: Array.from(sellCurrencyId) } },
                  { _id: { $in: Array.from(buyPrepaidCollectId) } },
                  { _id: { $in: Array.from(sellPrepaidCollectid) } },
                  { _id: { $in: Array.from(dueToId) } },
                  { _id: { $in: Array.from(activityId) } },
                ],
              },
            },
          ],
        },
        {
          tableName: "tblVesselFlight",
          query: [
            {
              $unwind: {
                path: "$tblVoyage",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                tblVoyage: { $exists: true, $ne: null },
                $or: [{ "tblVoyage._id": { $in: Array.from(polVoyageId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblVesselFlight",
          query: [
            {
              $match: {
                $or: [
                  { _id: { $in: Array.from(polVesselId) } },
                  { _id: { $in: Array.from(podVesselId) } },
                ],
              },
            },
          ],
        },
        {
          tableName: "tblPort",
          query: [
            {
              $unwind: {
                path: "$tblBerth",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                tblBert: { $exists: true, $ne: null },
                $or: [{ "tblBert._id": { $in: Array.from(polTerminalId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblBusinessSegment",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(businessSegmentId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblRateRequest",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(rateRequestId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblJob",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(masterJobId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblContainer",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(containerId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblCharge",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(chargeId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblGeneralLedger",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [
                  { _id: { $in: Array.from(buyPartyId) } },
                  { _id: { $in: Array.from(sellPartyId) } },
                ],
              },
            },
          ],
        },
      ];
      // return console.log("tables", tables.length);

      const dataToQuery = tables.map((iterator) =>
        model.AggregateFetchData(
          iterator.tableName,
          iterator.tableName,
          iterator.query,
          res
        )
      );

      const resultOfQueryData = await Promise.all(dataToQuery);
      const portMap = new Map();
      const customerMap = new Map();
      const CompanyBranchMap = new Map();
      const CompanyBranchPerson = new Map();
      const finYearMap = new Map();
      const CountryMap = new Map();
      const MasterDataMap = new Map();
      const VoyageMap = new Map();
      const VesselMap = new Map();
      const polTerminalMap = new Map();
      const businessSegmentMap = new Map();
      const rateRequestMap = new Map();
      const JobMap = new Map();
      const containerMap = new Map();
      const chargeMap = new Map();
      const generalLedgerMap = new Map();

      // Optimizing portMap construction
      for (const item of resultOfQueryData[0]) {
        if (item._id !== undefined && item.name !== undefined) {
          portMap.set(item._id.toString(), item.name);
        }
      }
      // console.log("company length", resultOfQueryData[1][0]._id.toString());
      // Optimizing customerMap construction
      for (const item of resultOfQueryData[1]) {
        if (item.oldId !== undefined) {
          customerMap.set(item._id.toString(), {
            name: item.name,
            branch: item.tblCompanyBranch,
          });
        }
      }

      // Optimizing CompanyBranchMap construction
      for (const item of resultOfQueryData[2]) {
        // Check if tblCompanyBranch exists and has the oldId property
        if (
          item.tblCompanyBranch &&
          item.tblCompanyBranch.oldId !== undefined
        ) {
          CompanyBranchMap.set(item.tblCompanyBranch?._id.toString(), {
            name: item.tblCompanyBranch.name,
          });
        }
      }

      for (const item of resultOfQueryData[3]) {
        // Check if tblCompanyBranch exists and has the oldId property
        if (
          item.tblCompanyBranch &&
          item.tblCompanyBranch.tblCompanyBranchPerson &&
          item.tblCompanyBranch.tblCompanyBranchPerson._id !== undefined
        ) {
          CompanyBranchPerson.set(
            item.tblCompanyBranch.tblCompanyBranchPerson._id.toString(),
            { name: item.tblCompanyBranch.tblCompanyBranchPerson.name }
          );
        }
      }
      console.log("CompanyBranchPerson", resultOfQueryData[3].length);
      for (const item of resultOfQueryData[4]) {
        if (item._id !== undefined && item.financialYear !== undefined) {
          finYearMap.set(item._id.toString(), {
            financialYear: item.financialYear,
          });
        }
      }
      // console.log("finYearMap", finYearMap);
      for (const item of resultOfQueryData[5]) {
        if (item._id !== undefined && item.name !== undefined) {
          CountryMap.set(item._id.toString(), { name: item.name });
        }
      }
      // console.log("resultOfQueryData[6].length", resultOfQueryData[6].length);
      for (const item of resultOfQueryData[6]) {
        if (item._id !== undefined && item.name !== undefined) {
          MasterDataMap.set(item._id.toString(), { name: item.name });
        }
      }
      // console.log("MasterDataMap", MasterDataMap);
      for (const item of resultOfQueryData[7]) {
        if (
          item.tblVoyage &&
          item.tblVoyage._id !== undefined &&
          item.name !== undefined
        ) {
          VoyageMap.set(item.tblVoyage._id, { name: item.tblVoyage.name });
        }
      }
      for (const item of resultOfQueryData[8]) {
        if (item._id !== undefined && item.name !== undefined) {
          VesselMap.set(item._id, { name: item.name });
        }
      }
      for (const item of resultOfQueryData[9]) {
        if (
          item.tblBerth &&
          item.tblBerth._id !== undefined &&
          item.name !== undefined
        ) {
          polTerminalMap.set(item.tblBerth._id, { name: item.tblBerth.name });
        }
      }
      for (const item of resultOfQueryData[10]) {
        if (item._id !== undefined && item.name !== undefined) {
          businessSegmentMap.set(item._id, { name: item.name });
        }
      }
      for (const item of resultOfQueryData[11]) {
        if (item._id !== undefined && item.name !== undefined) {
          rateRequestMap.set(item._id, { name: item.name });
        }
      }
      for (const item of resultOfQueryData[12]) {
        if (item._id !== undefined && item.name !== undefined) {
          JobMap.set(item._id, { name: item.name });
        }
      }
      for (const item of resultOfQueryData[13]) {
        if (item._id !== undefined && item.name !== undefined) {
          containerMap.set(item._id, { name: item.name });
        }
      }
      for (const item of resultOfQueryData[14]) {
        if (item._id !== undefined && item.name !== undefined) {
          chargeMap.set(item._id.toString(), { name: item.name });
        }
      }

      for (const item of resultOfQueryData[15]) {
        if (item._id !== undefined && item.name !== undefined) {
          generalLedgerMap.set(item._id, { name: item.name });
        }
      }
      data.forEach((item) => {
        // console.log(CompanyBranchMap.get(item.shipperBranchId));
        // console.log("MasterDataMap.get(item.cargoTypeId)?.name", MasterDataMap.get(item.cargoTypeId));
        item["plrName"] = portMap.get(item.plrId) || "";
        item["polName"] = portMap.get(item.polId) || "";
        item["podName"] = portMap.get(item.podId) || "";
        item["fpdName"] = portMap.get(item.fpdId) || "";
        item["depotName"] = portMap.get(item.depotId) || "";
        item["podTerminalName"] = portMap.get(item.podTerminalId) || "";
        item["podVoyageName"] = portMap.get(item.podVoyageId) || "";
        // item["podVoyageName"] = portMap.get(item.podVoyageId) || "";

        const customerInfo = customerMap.get(item.customerId);
        // console.log("customerInfo", customerInfo.flat(2));
        item["consigneeName"] = customerMap.get(item.consigneeId)?.name || "";
        item["customerName"] = customerInfo ? customerInfo.name : "";
        item["shipperName"] = customerMap.get(item.shipperId)?.name || "";
        item["shippinglineName"] =
          customerMap.get(item.shippingLineId)?.name || "";
        item["companyName"] = customerMap.get(item.companyId)?.name || "";
        item["podAgentName"] = customerMap.get(item.podAgentId)?.name || "";
        item["polAgentName"] = customerMap.get(item.polAgentId)?.name || "";
        item["agentName"] = customerMap.get(item.agentId)?.name || "";
        item["notifyPartyName"] =
          customerMap.get(item.notifyPartyId)?.name || "";
        item["customBrokerName"] =
          customerMap.get(item.customBrokerId)?.name || "";
        item["transporterName"] =
          customerMap.get(item.transporterId)?.name || "";
        item["podCustomBrokerName"] =
          customerMap.get(item.podCustomBrokerId)?.name || "";
        item["shippingAgentName"] =
          customerMap.get(item.shippingAgentId)?.name || "";
        item["slotOwnerName"] = customerMap.get(item.slotOwnerId)?.name || "";
        item["mloName"] = customerMap.get(item.mloId)?.name || "";
        item["createdByCompanyName"] =
          customerMap.get(item.createdByCompanyId)?.name || "";
        item["fpdAgentName"] = customerMap.get(item.fpdAgentId)?.name || "";
        item["surveyorName"] = customerMap.get(item.surveyorId)?.name || "";
        item["plrAgentName"] = customerMap.get(item.plrAgentId)?.name || "";
        // Assuming you want to extract the branch name for the customer
        item["companyBranchName"] =
          CompanyBranchMap.get(item.companybranchId)?.name || "";
        item["consigneeBranchName"] =
          CompanyBranchMap.get(item.consigneeBranchId)?.name || "";
        item["shipperBranchName"] =
          CompanyBranchMap.get(item.shipperBranchId)?.name || "";
        item["customerBranchName"] =
          CompanyBranchMap.get(item.customerBranchId)?.name || "";
        item["agentBranchName"] =
          CompanyBranchMap.get(item.agentBranchId)?.name || "";
        item["notifyPartyBranchName"] =
          CompanyBranchMap.get(item.notifyPartyBranchId)?.name || "";
        item["createdByCompanyBranchName"] =
          CompanyBranchMap.get(item.createdByCompanyBranchId)?.name || "";
        item["polAgentBranchName"] =
          CompanyBranchMap.get(item.polAgentBranchId)?.name || "";
        item["podAgentBranchName"] =
          CompanyBranchMap.get(item.podAgentBranchId)?.name || "";
        item["surveyorBranchName"] =
          CompanyBranchMap.get(item.surveyorBranchId)?.name || "";
        item["fpdAgentBranchName"] =
          CompanyBranchMap.get(item.fpdAgentBranchId)?.name || "";
        item["plrAgentBranchName"] =
          CompanyBranchMap.get(item.plrAgentBranchId)?.name || "";

        //company branch person
        item["salesExecutiveName"] =
          CompanyBranchPerson.get(item.salesExecutiveId)?.name || "";
        item["pricingPersonName"] =
          CompanyBranchPerson.get(item.pricingPersonId)?.name || "";
        item["customerServicePersonName"] =
          CompanyBranchPerson.get(item.customerServicePersonId)?.name || "";
        item["backOfficePersonName"] =
          CompanyBranchPerson.get(item.backOfficePersonId)?.name || "";
        item["sellPersonName"] =
          CompanyBranchPerson.get(item.sellPersonId)?.name || "";
        item["customerClearancePersonName"] =
          CompanyBranchPerson.get(item.customerClearancePersonId)?.name || "";
        // financial year
        item["financialYear"] =
          finYearMap.get(item.finYearId)?.financialYear || "";

        //countryMap
        item["destinationCountryName"] =
          CountryMap.get(item.destinationCountryId)?.name || "";
        item["originCountryName"] =
          CountryMap.get(item.originCountryId)?.name || "";

        //MasterData
        item["tradeTermsName"] =
          MasterDataMap.get(item.tradeTermsId)?.name || "";
        item["natureOfCargoName"] =
          MasterDataMap.get(item.natureOfCargoId)?.name || "";
        item["stuffingTypeName"] =
          MasterDataMap.get(item.stuffingTypeId)?.name || "";
        item["containerStatusName"] =
          MasterDataMap.get(item.containerStatusId)?.name || "";
        item["preCarriageName"] =
          MasterDataMap.get(item.preCarriageId)?.name || "";
        item["destuffingTypeName"] =
          MasterDataMap.get(item.destuffingTypeId)?.name || "";
        item["cargoTypeName"] = MasterDataMap.get(item.cargoTypeId)?.name || "";
        item["cargoWtUnitName"] =
          MasterDataMap.get(item.cargoWtUnitId)?.name || "";
        item["packageName"] = MasterDataMap.get(item.packageId)?.name || "";
        item["commodityTypeName"] =
          MasterDataMap.get(item.commodityTypeId)?.name || "";
        item["volumeUnitName"] =
          MasterDataMap.get(item.volumeUnitId)?.name || "";
        item["chargeableWtUnitName"] =
          MasterDataMap.get(item.chargeableWtUnitId)?.name || "";
        item["postCarriageName"] =
          MasterDataMap.get(item.postCarriage)?.name || "";
        item["netWtUnitName"] = MasterDataMap.get(item.netWtUnitId)?.name || "";
        item["routeName"] = MasterDataMap.get(item.routeId)?.name || "";
        item["demmuragecurrencyName"] =
          MasterDataMap.get(item.demmuragecurrency)?.name || "";

        //voyage
        item["polVoyageName"] = VoyageMap.get(item.polVoyageId)?.name || "";
        //vessel
        item["polVesselName"] = VesselMap.get(item.polVesselId)?.name || "";
        item["podVesselName"] = VesselMap.get(item.podVesselId)?.name || "";
        //pol terminal
        item["polTerminalName"] =
          polTerminalMap.get(item.polTerminalId)?.name || "";
        // business segment
        item["businessSegmentName"] =
          businessSegmentMap.get(item.businessSegmentId)?.name || "";
        // rate request
        item["rateRequestName"] =
          rateRequestMap.get(item.rateRequestId)?.name || "";
        // Job map
        item["masterJobName"] = JobMap.get(item.masterJobId)?.name || "";
        // tblJobQty
        item.tblJobQty &&
          item.tblJobQty.map((item) => {
            //maserData
            item["sizeName"] = MasterDataMap.get(item.sizeId)?.name || "";
            item["typeName"] = MasterDataMap.get(item.typeId)?.name || "";
            item["dimensionUnitName"] =
              MasterDataMap.get(item.dimensionUnitId)?.name || "";
            item["wtUnitName"] = MasterDataMap.get(item.wtUnitId)?.name || "";
            item["volumeUnitName"] =
              MasterDataMap.get(item.volumeUnitId)?.name || "";
            item["depotName"] = portMap.get(item.depotId)?.name || "";
            item["containerName"] =
              containerMap.get(item.containerId)?.name || "";
          });
        // tblJobContainer
        item.tblJobContainer &&
          item.tblJobContainer.map((item) => {
            item["sizeName"] = MasterDataMap.get(item.sizeId)?.name || "";
            item["typeName"] = MasterDataMap.get(item.typeId)?.name || "";
            item["containerStatusName"] =
              MasterDataMap.get(item.containerStatusId)?.name || "";
            item["grossWtUnitName"] =
              MasterDataMap.get(item.grossWtUnitId)?.name || "";
            item["tareWtUnitName"] =
              MasterDataMap.get(item.tareWtUnitId)?.name || "";
            item["refTempUnitName"] =
              MasterDataMap.get(item.refTempUnitId)?.name || "";
            item["packageName"] = MasterDataMap.get(item.packageId)?.name || "";
            item["dimensionUnitName"] =
              MasterDataMap.get(item.dimensionUnitId)?.name || "";
            item["TransporterName"] =
              MasterDataMap.get(item.TransporterId)?.name || "";
            item["volumeUnitName"] =
              MasterDataMap.get(item.volumeUnitId)?.name || "";
            item["cargoTypeName"] =
              MasterDataMap.get(item.cargoTypeId)?.name || "";
            item["slotOwnerName"] =
              customerMap.get(item.cargoTypeId)?.name || "";
          });
        // tblJobCharge
        item.tblJobCharge &&
          item.tblJobCharge.map((item) => {
            item["sizeName"] = MasterDataMap.get(item.sizeId)?.name || "";
            item["typeName"] = MasterDataMap.get(item.typeId)?.name || "";
            item["unitName"] = MasterDataMap.get(item.unitId)?.name || "";
            item["buyCurrencyName"] =
              MasterDataMap.get(item.buyCurrencyId)?.name || "";
            item["sellCurrencyName"] =
              MasterDataMap.get(item.sellCurrencyId)?.name || "";
            item["buyPrepaidCollectName"] =
              MasterDataMap.get(item.buyPrepaidCollectId)?.name || "";
            item["sellPrepaidCollectName"] =
              MasterDataMap.get(item.sellPrepaidCollectid)?.name || "";
            item["dueToName"] = MasterDataMap.get(item.dueToId)?.name || "";
            item["chargeName"] = chargeMap.get(item.chargeId)?.name || "";
            item["buyPartyName"] = chargeMap.get(item.buyPartyId)?.name || "";
            item["sellPartyName"] = chargeMap.get(item.sellPartyId)?.name || "";
          });
        // tblJobActivity
        item.tblJobActivity &&
          item.tblJobActivity.map((item) => {
            item["activityPersonId"] =
              CompanyBranchPerson.get(item.activityPersonId)?.name || "";
            item["activityName"] =
              MasterDataMap.get(item.activityId)?.name || "";
          });
      });

      if (data.length > 0) {
        res.send({
          success: true,
          message: "Data fetched successfully",
          // reultofQueryData: resultOfqueryData,
          data: data,
        });
      } else {
        res.send({
          success: false,
          message: "Data not fetched successfully",
          data: data,
        });
      }
    } catch (error) {
      res.status(500).send({
        success: false,
        message: "Something went wrong",
        data: error.message,
      });
    }
  },
  JobRegistrationTest: async (req, res) => {
    try {
      let matchData = { status: Number(process.env.ACTIVE_STATUS) };
      let { body } = req;
      FilterCondition(matchData, req.body);
      if (body.id && body.id != "undefined" && body.id !== "") {
        matchData["id"] = Number(body.id);
      }
      if (body._id && body._id != "undefined" && body._id !== "") {
        matchData["_id"] = new mongoose.Types.ObjectId(body._id);
      }
      if (
        body.customerId &&
        body.customerId != "undefined" &&
        body.customerId !== ""
      ) {
        matchData["customerId"] = Number(body.customerId);
      }
      if (
        body.finYearId &&
        body.finYearId != "undefined" &&
        body.finYearId !== ""
      ) {
        matchData["finYearId"] = String(body.finYearId);
      }
      if (
        body.shipperId &&
        body.shipperId != "undefined" &&
        body.shipperId !== ""
      ) {
        matchData["shipperId"] = Number(body.shipperId);
      }
      if (
        body.consigneeId &&
        body.consigneeId != "undefined" &&
        body.consigneeId !== ""
      ) {
        matchData["consigneeId"] = Number(body.consigneeId);
      }
      if (
        body.shippingLineId &&
        body.shippingLineId != "undefined" &&
        body.shippingLineId !== ""
      ) {
        matchData["shippingLineId"] = Number(body.shippingLineId);
      }
      if (body.plrId && body.plrId != "undefined" && body.plrId !== "") {
        matchData["plrId"] = Number(body.plrId);
      }
      if (body.polId && body.polId != "undefined" && body.polId !== "") {
        matchData["polId"] = Number(body.polId);
      }
      if (body.podId && body.podId != "undefined" && body.podId !== "") {
        matchData["podId"] = Number(body.podId);
      }
      if (body.fpdId && body.fpdId != "undefined" && body.fpdId !== "") {
        matchData["fpdId"] = Number(body.fpdId);
      }
      if (
        body.fromDate &&
        body.fromDate != "undefined" &&
        body.fromDate !== "" &&
        body.toDate &&
        body.toDate != "undefined" &&
        body.toDate !== ""
      ) {
        matchData["jobDate"] = {
          $gte: new Date(body.fromDate),
          $lte: new Date(body.toDate),
        };
      } else if (
        body.fromDate &&
        body.fromDate != "undefined" &&
        body.fromDate !== ""
      ) {
        matchData["jobDate"] = { $gte: new Date(body.fromDate) };
      } else if (
        body.toDate &&
        body.toDate != "undefined" &&
        body.toDate !== ""
      ) {
        matchData["jobDate"] = { $lte: new Date(body.toDate) };
      }
      let page = parseInt(req.query.page, 10) || 1; // Default to page 1 if not specified
      let pageSize = parseInt(req.query.pageSize, 100) || 1000; // Default to 10 items per page if not specified

      // Calculate the number of documents to skip
      let skipCount = (page - 1) * pageSize;
      let query = [
        {
          $match: matchData,
        },
        {
          $sort: {
            id: 1,
          },
        },
        {
          $skip: skipCount,
        },
        {
          $limit: pageSize,
        },
      ];
      let project = {};
      if (body.projection && Object.keys(body.projection).length > 0) {
        project = body.projection;
      }
      if (Object.keys(project).length > 0) {
        query.push({ $project: project });
      }

      let data = await model.AggregateFetchData(
        "tblTestJob",
        "tblTestJob",
        query,
        res
      );
      let plrId = new Set();
      let polId = new Set();
      let podId = new Set();
      let fpdId = new Set();
      let customerId = new Set();
      let shipperId = new Set();
      let consigneeId = new Set();
      let companyBranchId = new Set();
      let shippingLineId = new Set();
      let consigneeBranchId = new Set();
      let shipperBranchId = new Set();
      let salesExecutiveId = new Set();
      let companyId = new Set();
      let podAgentId = new Set();
      let polAgentId = new Set();
      let customerBranchId = new Set();
      let agentId = new Set();
      let agentBranchId = new Set();
      let notifyPartyId = new Set();
      let notifyPartyBranchId = new Set();
      let customBrokerId = new Set();
      let finYearId = new Set();
      let destinationCountryId = new Set();
      let originCountryId = new Set();
      let tradeTermsId = new Set();
      let natureOfCargoId = new Set();
      let stuffingTypeId = new Set();
      let containerStatusId = new Set();
      let preCarriageId = new Set();
      let destuffingTypeId = new Set();
      let cargoTypeId = new Set();
      let cargoWtUnitId = new Set();
      let packageId = new Set();
      let commodityTypeId = new Set();
      let volumeUnitId = new Set();
      let chargeableWtUnitId = new Set();
      let businessSegmentId = new Set();
      let polVoyageId = new Set();
      let polVesselId = new Set();
      let polTerminalId = new Set();
      let transporterId = new Set();
      let podCustomBrokerId = new Set();
      let shippingAgentId = new Set();
      let slotOwnerId = new Set();
      let mloId = new Set();
      let createdByCompanyId = new Set();
      let fpdAgentId = new Set();
      let surveyorId = new Set();
      let plrAgentId = new Set();
      let postCarriage = new Set();
      let routeId = new Set();
      let netWtUnitId = new Set();
      let createdByCompanyBranchId = new Set();
      let polAgentBranchId = new Set();
      let podAgentBranchId = new Set();
      let surveyorBranchId = new Set();
      let fpdAgentBranchId = new Set();
      let plrAgentBranchId = new Set();
      let pricingPersonId = new Set();
      let customerServicePersonId = new Set();
      let demmuragecurrency = new Set();
      let backOfficePersonId = new Set();
      let sellPersonId = new Set();
      let customerClearancePersonId = new Set();
      let depotId = new Set();
      let podTerminalId = new Set();
      let podVoyageId = new Set();
      let podVesselId = new Set();
      let rateRequestId = new Set();
      let masterJobId = new Set();
      // tblJobContainer
      let sizeId = new Set();
      let typeId = new Set();
      let dimensionUnitId = new Set();
      let wtUnitId = new Set();
      let containerId = new Set();

      // tblJobQuantity
      let grossWtUnitId = new Set();
      let tareWtUnitId = new Set();
      let refTempUnitId = new Set();
      let TransporterId = new Set();
      // tblJobCharge
      let unitId = new Set();
      let buyCurrencyId = new Set();
      let sellCurrencyId = new Set();
      let buyPrepaidCollectId = new Set();
      let sellPrepaidCollectid = new Set();
      let dueToId = new Set();
      // tblJobActivity
      let activityPersonId = new Set();
      let activityId = new Set();
      let chargeId = new Set();
      let buyPartyId = new Set();
      let sellPartyId = new Set();

      data.forEach((item) => {
        plrId.add(createObjectId(item.plrId));
        polId.add(createObjectId(item.polId));
        podId.add(createObjectId(item.podId));
        fpdId.add(createObjectId(item.fpdId));
        customerId.add(createObjectId(item.customerId));
        shipperId.add(createObjectId(item.shipperId));
        consigneeId.add(createObjectId(item.consigneeId));
        companyBranchId.add(createObjectId(item.companybranchId));
        shippingLineId.add(createObjectId(item.shippingLineId));
        consigneeBranchId.add(createObjectId(item.consigneeBranchId));
        shipperBranchId.add(createObjectId(item.shipperBranchId));
        salesExecutiveId.add(item.salesExecutiveId);
        companyId.add(createObjectId(item.companyId));
        podAgentId.add(createObjectId(item.podAgentId));
        polAgentId.add(createObjectId(item.polAgentId));
        customerBranchId.add(createObjectId(item.customerBranchId));
        agentId.add(createObjectId(item.agentId));
        agentBranchId.add(createObjectId(item.agentBranchId));
        notifyPartyId.add(createObjectId(item.notifyPartyId));
        notifyPartyBranchId.add(createObjectId(item.notifyPartyBranchId));
        customBrokerId.add(createObjectId(item.customBrokerId));
        finYearId.add(createObjectId(item.finYearId));
        destinationCountryId.add(createObjectId(item.destinationCountryId));
        originCountryId.add(createObjectId(item.originCountryId));
        tradeTermsId.add(createObjectId(item.tradeTermsId));
        natureOfCargoId.add(createObjectId(item.natureOfCargoId));
        stuffingTypeId.add(createObjectId(item.stuffingTypeId));
        containerStatusId.add(createObjectId(item.containerStatusId));
        preCarriageId.add(createObjectId(item.preCarriageId));
        // preCarriageId.add(item.preCarriageId);
        destuffingTypeId.add(createObjectId(item.destuffingTypeId));
        cargoTypeId.add(createObjectId(item.cargoTypeId));
        cargoWtUnitId.add(createObjectId(item.cargoWtUnitId));
        packageId.add(createObjectId(item.packageId));
        commodityTypeId.add(createObjectId(item.commodityTypeId));
        volumeUnitId.add(createObjectId(item.volumeUnitId));
        chargeableWtUnitId.add(createObjectId(item.chargeableWtUnitId));
        businessSegmentId.add(createObjectId(item.businessSegmentId));
        polVoyageId.add(createObjectId(item.polVoyageId));
        polVesselId.add(createObjectId(item.polVesselId));
        polTerminalId.add(createObjectId(item.polTerminalId));
        transporterId.add(createObjectId(item.transporterId));
        podCustomBrokerId.add(createObjectId(item.podCustomBrokerId));
        shippingAgentId.add(createObjectId(item.shippingAgentId));
        slotOwnerId.add(createObjectId(item.slotOwnerId));
        mloId.add(createObjectId(item.mloId));
        createdByCompanyId.add(createObjectId(item.createdByCompanyId));
        fpdAgentId.add(createObjectId(item.fpdAgentId));
        plrAgentId.add(createObjectId(item.plrAgentId));
        surveyorId.add(createObjectId(item.surveyorId));
        postCarriage.add(createObjectId(item.postCarriage));
        routeId.add(createObjectId(item.routeId));
        netWtUnitId.add(createObjectId(item.netWtUnitId));
        createdByCompanyBranchId.add(
          createObjectId(item.createdByCompanyBranchId)
        );
        polAgentBranchId.add(createObjectId(item.polAgentBranchId));
        podAgentBranchId.add(createObjectId(item.podAgentBranchId));
        surveyorBranchId.add(createObjectId(item.surveyorBranchId));
        fpdAgentBranchId.add(createObjectId(item.fpdAgentBranchId));
        plrAgentBranchId.add(createObjectId(item.plrAgentBranchId));
        pricingPersonId.add(createObjectId(item.pricingPersonId));
        customerServicePersonId.add(
          createObjectId(item.customerServicePersonId)
        );
        demmuragecurrency.add(createObjectId(item.demmuragecurrency));
        backOfficePersonId.add(createObjectId(item.backOfficePersonId));
        sellPersonId.add(createObjectId(item.sellPersonId));
        customerClearancePersonId.add(
          createObjectId(item.customerClearancePersonId)
        );
        depotId.add(createObjectId(item.depotId));
        podTerminalId.add(createObjectId(item.podTerminalId));
        podVoyageId.add(createObjectId(item.podVoyageId));
        podVesselId.add(createObjectId(item.podVesselId));
        rateRequestId.add(createObjectId(item.rateRequestId));
        masterJobId.add(createObjectId(item.masterJobId));
        // tblJobQty
        item.tblJobQty &&
          item.tblJobQty.map((x) => {
            console.log("x", x);
            sizeId.add(createObjectId(x.sizeId));
            typeId.add(createObjectId(x.typeId));
            dimensionUnitId.add(createObjectId(x.dimensionUnitId));
            wtUnitId.add(createObjectId(x.wtUnitId));
            volumeUnitId.add(createObjectId(x.volumeUnitId));
            depotId.add(createObjectId(x.depotId));
            containerId.add(createObjectId(x.containerId));
          });
        //  tblJobContainer
        item.tblJobContainer &&
          item.tblJobContainer.map((x) => {
            sizeId.add(createObjectId(x.sizeId));
            typeId.add(createObjectId(x.typeId));
            containerStatusId.add(createObjectId(x.containerStatusId));
            grossWtUnitId.add(createObjectId(x.grossWtUnitId));
            tareWtUnitId.add(createObjectId(x.tareWtUnitId));
            refTempUnitId.add(createObjectId(x.refTempUnitId));
            packageId.add(createObjectId(x.packageId));
            dimensionUnitId.add(createObjectId(x.dimensionUnitId));
            TransporterId.add(createObjectId(x.TransporterId));
            volumeUnitId.add(createObjectId(x.volumeUnitId));
            cargoTypeId.add(createObjectId(x.cargoTypeId));
            slotOwnerId.add(createObjectId(x.slotOwnerId));
          });
        // tblJobCharge
        item.tblJobCharge &&
          item.tblJobCharge.map((x) => {
            sizeId.add(createObjectId(x.sizeId));
            typeId.add(createObjectId(x.typeId));
            unitId.add(createObjectId(x.unitId));
            buyCurrencyId.add(createObjectId(x.buyCurrencyId));
            sellCurrencyId.add(createObjectId(x.sellCurrencyId));
            buyPrepaidCollectId.add(createObjectId(x.buyPrepaidCollectId));
            sellPrepaidCollectid.add(createObjectId(x.sellPrepaidCollectid));
            dueToId.add(createObjectId(x.dueToId));
            chargeId.add(createObjectId(x.chargeId));
            buyPartyId.add(createObjectId(x.buyPartyId));
            sellPartyId.add(createObjectId(x.sellPartyId));
          });
        // tblJobActivity
        item.tblJobActivity &&
          item.tblJobActivity.map((x) => {
            activityPersonId.add(createObjectId(x.activityPersonId));
            activityId.add(createObjectId(x.activityId));
          });
      });
      // return console.log(companyBranchId);
      const tables = [
        {
          tableName: "tblPort",
          query: [
            {
              $match: {
                $or: [
                  { _id: { $in: Array.from(plrId) } },
                  { _id: { $in: Array.from(polId) } },
                  { _id: { $in: Array.from(podId) } },
                  { _id: { $in: Array.from(fpdId) } },
                  { _id: { $in: Array.from(depotId) } },
                  { _id: { $in: Array.from(podTerminalId) } },
                  { _id: { $in: Array.from(podVoyageId) } },
                ],
                status: Number(process.env.ACTIVE_STATUS),
              },
            },
          ],
        },
        {
          tableName: "tblCompany",
          query: [
            {
              $match: {
                $or: [
                  { _id: { $in: Array.from(customerId) } },
                  { _id: { $in: Array.from(shipperId) } },
                  { _id: { $in: Array.from(consigneeId) } },
                  { _id: { $in: Array.from(shippingLineId) } },
                  { _id: { $in: Array.from(companyId) } },
                  { _id: { $in: Array.from(podAgentId) } },
                  { _id: { $in: Array.from(polAgentId) } },
                  { _id: { $in: Array.from(agentId) } },
                  { _id: { $in: Array.from(notifyPartyId) } },
                  { _id: { $in: Array.from(customBrokerId) } },
                  { _id: { $in: Array.from(transporterId) } },
                  { _id: { $in: Array.from(podCustomBrokerId) } },
                  { _id: { $in: Array.from(shippingAgentId) } },
                  { _id: { $in: Array.from(slotOwnerId) } },
                  { _id: { $in: Array.from(mloId) } },
                  { _id: { $in: Array.from(createdByCompanyId) } },
                  { _id: { $in: Array.from(fpdAgentId) } },
                  { _id: { $in: Array.from(plrAgentId) } },
                  { _id: { $in: Array.from(surveyorId) } },
                ],
              },
            },
          ],
        },
        {
          tableName: "tblCompany",
          query: [
            {
              $unwind: {
                path: "$tblCompanyBranch",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                tblCompanyBranch: { $exists: true, $ne: null },
                $or: [
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(companyBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(consigneeBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(shipperBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(customerBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": { $in: Array.from(agentBranchId) },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(notifyPartyBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(createdByCompanyBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(polAgentBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(podAgentBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(surveyorBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(plrAgentBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(fpdAgentBranchId),
                    },
                  },
                  // Add more conditions here if needed, each enclosed in {}
                ],
              },
            },
          ],
        },
        {
          tableName: "tblCompany",
          query: [
            {
              $unwind: {
                path: "$tblCompanyBranch",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $unwind: {
                path: "$tblCompanyBranch.tblCompanyBranchPerson",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                "tblCompanyBranch.tblCompanyBranchPerson": {
                  $exists: true,
                  $ne: null,
                },
                $or: [
                  {
                    "tblCompanyBranch.tblCompanyBranchPerson._id": {
                      $in: Array.from(salesExecutiveId),
                    },
                  },
                  {
                    "tblCompanyBranch.tblCompanyBranchPerson._id": {
                      $in: Array.from(pricingPersonId),
                    },
                  },
                  {
                    "tblCompanyBranch.tblCompanyBranchPerson._id": {
                      $in: Array.from(backOfficePersonId),
                    },
                  },
                  {
                    "tblCompanyBranch.tblCompanyBranchPerson._id": {
                      $in: Array.from(sellPersonId),
                    },
                  },
                  {
                    "tblCompanyBranch.tblCompanyBranchPerson._id": {
                      $in: Array.from(customerServicePersonId),
                    },
                  },
                  {
                    "tblCompanyBranch.tblCompanyBranchPerson._id": {
                      $in: Array.from(customerClearancePersonId),
                    },
                  },
                  {
                    "tblCompanyBranch.tblCompanyBranchPerson._id": {
                      $in: Array.from(activityPersonId),
                    },
                  },
                  // Add more conditions here if needed, each enclosed in {}
                ],
              },
            },
          ],
        },
        {
          tableName: "tblFinancialYear",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(finYearId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblCountry",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [
                  { _id: { $in: Array.from(destinationCountryId) } },
                  { _id: { $in: Array.from(originCountryId) } },
                ],
              },
            },
          ],
        },
        {
          tableName: "tblMasterData",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [
                  { _id: { $in: Array.from(tradeTermsId) } },
                  { _id: { $in: Array.from(natureOfCargoId) } },
                  { _id: { $in: Array.from(stuffingTypeId) } },
                  { _id: { $in: Array.from(containerStatusId) } },
                  { _id: { $in: Array.from(preCarriageId) } },
                  { _id: { $in: Array.from(destuffingTypeId) } },
                  { _id: { $in: Array.from(cargoTypeId) } },
                  { _id: { $in: Array.from(cargoWtUnitId) } },
                  { _id: { $in: Array.from(packageId) } },
                  { _id: { $in: Array.from(commodityTypeId) } },
                  { _id: { $in: Array.from(volumeUnitId) } },
                  { _id: { $in: Array.from(chargeableWtUnitId) } },
                  { _id: { $in: Array.from(postCarriage) } },
                  { _id: { $in: Array.from(routeId) } },
                  { _id: { $in: Array.from(netWtUnitId) } },
                  { _id: { $in: Array.from(demmuragecurrency) } },
                  { _id: { $in: Array.from(sizeId) } },
                  { _id: { $in: Array.from(typeId) } },
                  { _id: { $in: Array.from(dimensionUnitId) } },
                  { _id: { $in: Array.from(wtUnitId) } },
                  { _id: { $in: Array.from(grossWtUnitId) } },
                  { _id: { $in: Array.from(tareWtUnitId) } },
                  { _id: { $in: Array.from(refTempUnitId) } },
                  { _id: { $in: Array.from(TransporterId) } },
                  { _id: { $in: Array.from(unitId) } },
                  { _id: { $in: Array.from(buyCurrencyId) } },
                  { _id: { $in: Array.from(sellCurrencyId) } },
                  { _id: { $in: Array.from(buyPrepaidCollectId) } },
                  { _id: { $in: Array.from(sellPrepaidCollectid) } },
                  { _id: { $in: Array.from(dueToId) } },
                  { _id: { $in: Array.from(activityId) } },
                ],
              },
            },
          ],
        },
        {
          tableName: "tblVesselFlight",
          query: [
            {
              $unwind: {
                path: "$tblVoyage",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                tblVoyage: { $exists: true, $ne: null },
                $or: [{ "tblVoyage._id": { $in: Array.from(polVoyageId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblVesselFlight",
          query: [
            {
              $match: {
                $or: [
                  { _id: { $in: Array.from(polVesselId) } },
                  { _id: { $in: Array.from(podVesselId) } },
                ],
              },
            },
          ],
        },
        {
          tableName: "tblPort",
          query: [
            {
              $unwind: {
                path: "$tblBerth",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                tblBert: { $exists: true, $ne: null },
                $or: [{ "tblBert._id": { $in: Array.from(polTerminalId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblBusinessSegment",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(businessSegmentId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblRateRequest",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(rateRequestId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblJob",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(masterJobId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblContainer",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(containerId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblCharge",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(chargeId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblGeneralLedger",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [
                  { _id: { $in: Array.from(buyPartyId) } },
                  { _id: { $in: Array.from(sellPartyId) } },
                ],
              },
            },
          ],
        },
      ];
      // return console.log("tables", tables.length);

      const dataToQuery = tables.map((iterator) =>
        model.AggregateFetchData(
          iterator.tableName,
          iterator.tableName,
          iterator.query,
          res
        )
      );

      const resultOfQueryData = await Promise.all(dataToQuery);
      const portMap = new Map();
      const customerMap = new Map();
      const CompanyBranchMap = new Map();
      const CompanyBranchPerson = new Map();
      const finYearMap = new Map();
      const CountryMap = new Map();
      const MasterDataMap = new Map();
      const VoyageMap = new Map();
      const VesselMap = new Map();
      const polTerminalMap = new Map();
      const businessSegmentMap = new Map();
      const rateRequestMap = new Map();
      const JobMap = new Map();
      const containerMap = new Map();
      const chargeMap = new Map();
      const generalLedgerMap = new Map();

      // Optimizing portMap construction
      for (const item of resultOfQueryData[0]) {
        if (item._id !== undefined && item.name !== undefined) {
          portMap.set(item._id.toString(), item.name);
        }
      }
      // console.log("company length", resultOfQueryData[1][0]._id.toString());
      // Optimizing customerMap construction
      for (const item of resultOfQueryData[1]) {
        if (item.oldId !== undefined) {
          customerMap.set(item._id.toString(), {
            name: item.name,
            branch: item.tblCompanyBranch,
          });
        }
      }

      // Optimizing CompanyBranchMap construction
      for (const item of resultOfQueryData[2]) {
        // Check if tblCompanyBranch exists and has the oldId property
        if (
          item.tblCompanyBranch &&
          item.tblCompanyBranch.oldId !== undefined
        ) {
          CompanyBranchMap.set(item.tblCompanyBranch?._id.toString(), {
            name: item.tblCompanyBranch.name,
          });
        }
      }

      for (const item of resultOfQueryData[3]) {
        // Check if tblCompanyBranch exists and has the oldId property
        if (
          item.tblCompanyBranch &&
          item.tblCompanyBranch.tblCompanyBranchPerson &&
          item.tblCompanyBranch.tblCompanyBranchPerson._id !== undefined
        ) {
          CompanyBranchPerson.set(
            item.tblCompanyBranch.tblCompanyBranchPerson._id.toString(),
            { name: item.tblCompanyBranch.tblCompanyBranchPerson.name }
          );
        }
      }
      console.log("CompanyBranchPerson", resultOfQueryData[3].length);
      for (const item of resultOfQueryData[4]) {
        if (item._id !== undefined && item.financialYear !== undefined) {
          finYearMap.set(item._id.toString(), {
            financialYear: item.financialYear,
          });
        }
      }
      // console.log("finYearMap", finYearMap);
      for (const item of resultOfQueryData[5]) {
        if (item._id !== undefined && item.name !== undefined) {
          CountryMap.set(item._id.toString(), { name: item.name });
        }
      }
      // console.log("resultOfQueryData[6].length", resultOfQueryData[6].length);
      for (const item of resultOfQueryData[6]) {
        if (item._id !== undefined && item.name !== undefined) {
          MasterDataMap.set(item._id.toString(), { name: item.name });
        }
      }
      // console.log("MasterDataMap", MasterDataMap);
      for (const item of resultOfQueryData[7]) {
        if (
          item.tblVoyage &&
          item.tblVoyage._id !== undefined &&
          item.name !== undefined
        ) {
          VoyageMap.set(item.tblVoyage._id, { name: item.tblVoyage.name });
        }
      }
      for (const item of resultOfQueryData[8]) {
        if (item._id !== undefined && item.name !== undefined) {
          VesselMap.set(item._id, { name: item.name });
        }
      }
      for (const item of resultOfQueryData[9]) {
        if (
          item.tblBerth &&
          item.tblBerth._id !== undefined &&
          item.name !== undefined
        ) {
          polTerminalMap.set(item.tblBerth._id, { name: item.tblBerth.name });
        }
      }
      for (const item of resultOfQueryData[10]) {
        if (item._id !== undefined && item.name !== undefined) {
          businessSegmentMap.set(item._id, { name: item.name });
        }
      }
      for (const item of resultOfQueryData[11]) {
        if (item._id !== undefined && item.name !== undefined) {
          rateRequestMap.set(item._id, { name: item.name });
        }
      }
      for (const item of resultOfQueryData[12]) {
        if (item._id !== undefined && item.name !== undefined) {
          JobMap.set(item._id, { name: item.name });
        }
      }
      for (const item of resultOfQueryData[13]) {
        if (item._id !== undefined && item.name !== undefined) {
          containerMap.set(item._id, { name: item.name });
        }
      }
      for (const item of resultOfQueryData[14]) {
        if (item._id !== undefined && item.name !== undefined) {
          chargeMap.set(item._id.toString(), { name: item.name });
        }
      }

      for (const item of resultOfQueryData[15]) {
        if (item._id !== undefined && item.name !== undefined) {
          generalLedgerMap.set(item._id, { name: item.name });
        }
      }
      data.forEach((item) => {
        // console.log(CompanyBranchMap.get(item.shipperBranchId));
        // console.log("MasterDataMap.get(item.cargoTypeId)?.name", MasterDataMap.get(item.cargoTypeId));
        item["plrName"] = portMap.get(item.plrId) || "";
        item["polName"] = portMap.get(item.polId) || "";
        item["podName"] = portMap.get(item.podId) || "";
        item["fpdName"] = portMap.get(item.fpdId) || "";
        item["depotName"] = portMap.get(item.depotId) || "";
        item["podTerminalName"] = portMap.get(item.podTerminalId) || "";
        item["podVoyageName"] = portMap.get(item.podVoyageId) || "";
        // item["podVoyageName"] = portMap.get(item.podVoyageId) || "";

        const customerInfo = customerMap.get(item.customerId);
        // console.log("customerInfo", customerInfo.flat(2));
        item["consigneeName"] = customerMap.get(item.consigneeId)?.name || "";
        item["customerName"] = customerInfo ? customerInfo.name : "";
        item["shipperName"] = customerMap.get(item.shipperId)?.name || "";
        item["shippinglineName"] =
          customerMap.get(item.shippingLineId)?.name || "";
        item["companyName"] = customerMap.get(item.companyId)?.name || "";
        item["podAgentName"] = customerMap.get(item.podAgentId)?.name || "";
        item["polAgentName"] = customerMap.get(item.polAgentId)?.name || "";
        item["agentName"] = customerMap.get(item.agentId)?.name || "";
        item["notifyPartyName"] =
          customerMap.get(item.notifyPartyId)?.name || "";
        item["customBrokerName"] =
          customerMap.get(item.customBrokerId)?.name || "";
        item["transporterName"] =
          customerMap.get(item.transporterId)?.name || "";
        item["podCustomBrokerName"] =
          customerMap.get(item.podCustomBrokerId)?.name || "";
        item["shippingAgentName"] =
          customerMap.get(item.shippingAgentId)?.name || "";
        item["slotOwnerName"] = customerMap.get(item.slotOwnerId)?.name || "";
        item["mloName"] = customerMap.get(item.mloId)?.name || "";
        item["createdByCompanyName"] =
          customerMap.get(item.createdByCompanyId)?.name || "";
        item["fpdAgentName"] = customerMap.get(item.fpdAgentId)?.name || "";
        item["surveyorName"] = customerMap.get(item.surveyorId)?.name || "";
        item["plrAgentName"] = customerMap.get(item.plrAgentId)?.name || "";
        // Assuming you want to extract the branch name for the customer
        item["companyBranchName"] =
          CompanyBranchMap.get(item.companybranchId)?.name || "";
        item["consigneeBranchName"] =
          CompanyBranchMap.get(item.consigneeBranchId)?.name || "";
        item["shipperBranchName"] =
          CompanyBranchMap.get(item.shipperBranchId)?.name || "";
        item["customerBranchName"] =
          CompanyBranchMap.get(item.customerBranchId)?.name || "";
        item["agentBranchName"] =
          CompanyBranchMap.get(item.agentBranchId)?.name || "";
        item["notifyPartyBranchName"] =
          CompanyBranchMap.get(item.notifyPartyBranchId)?.name || "";
        item["createdByCompanyBranchName"] =
          CompanyBranchMap.get(item.createdByCompanyBranchId)?.name || "";
        item["polAgentBranchName"] =
          CompanyBranchMap.get(item.polAgentBranchId)?.name || "";
        item["podAgentBranchName"] =
          CompanyBranchMap.get(item.podAgentBranchId)?.name || "";
        item["surveyorBranchName"] =
          CompanyBranchMap.get(item.surveyorBranchId)?.name || "";
        item["fpdAgentBranchName"] =
          CompanyBranchMap.get(item.fpdAgentBranchId)?.name || "";
        item["plrAgentBranchName"] =
          CompanyBranchMap.get(item.plrAgentBranchId)?.name || "";

        //company branch person
        item["salesExecutiveName"] =
          CompanyBranchPerson.get(item.salesExecutiveId)?.name || "";
        item["pricingPersonName"] =
          CompanyBranchPerson.get(item.pricingPersonId)?.name || "";
        item["customerServicePersonName"] =
          CompanyBranchPerson.get(item.customerServicePersonId)?.name || "";
        item["backOfficePersonName"] =
          CompanyBranchPerson.get(item.backOfficePersonId)?.name || "";
        item["sellPersonName"] =
          CompanyBranchPerson.get(item.sellPersonId)?.name || "";
        item["customerClearancePersonName"] =
          CompanyBranchPerson.get(item.customerClearancePersonId)?.name || "";
        // financial year
        item["financialYear"] =
          finYearMap.get(item.finYearId)?.financialYear || "";

        //countryMap
        item["destinationCountryName"] =
          CountryMap.get(item.destinationCountryId)?.name || "";
        item["originCountryName"] =
          CountryMap.get(item.originCountryId)?.name || "";

        //MasterData
        item["tradeTermsName"] =
          MasterDataMap.get(item.tradeTermsId)?.name || "";
        item["natureOfCargoName"] =
          MasterDataMap.get(item.natureOfCargoId)?.name || "";
        item["stuffingTypeName"] =
          MasterDataMap.get(item.stuffingTypeId)?.name || "";
        item["containerStatusName"] =
          MasterDataMap.get(item.containerStatusId)?.name || "";
        item["preCarriageName"] =
          MasterDataMap.get(item.preCarriageId)?.name || "";
        item["destuffingTypeName"] =
          MasterDataMap.get(item.destuffingTypeId)?.name || "";
        item["cargoTypeName"] = MasterDataMap.get(item.cargoTypeId)?.name || "";
        item["cargoWtUnitName"] =
          MasterDataMap.get(item.cargoWtUnitId)?.name || "";
        item["packageName"] = MasterDataMap.get(item.packageId)?.name || "";
        item["commodityTypeName"] =
          MasterDataMap.get(item.commodityTypeId)?.name || "";
        item["volumeUnitName"] =
          MasterDataMap.get(item.volumeUnitId)?.name || "";
        item["chargeableWtUnitName"] =
          MasterDataMap.get(item.chargeableWtUnitId)?.name || "";
        item["postCarriageName"] =
          MasterDataMap.get(item.postCarriage)?.name || "";
        item["netWtUnitName"] = MasterDataMap.get(item.netWtUnitId)?.name || "";
        item["routeName"] = MasterDataMap.get(item.routeId)?.name || "";
        item["demmuragecurrencyName"] =
          MasterDataMap.get(item.demmuragecurrency)?.name || "";

        //voyage
        item["polVoyageName"] = VoyageMap.get(item.polVoyageId)?.name || "";
        //vessel
        item["polVesselName"] = VesselMap.get(item.polVesselId)?.name || "";
        item["podVesselName"] = VesselMap.get(item.podVesselId)?.name || "";
        //pol terminal
        item["polTerminalName"] =
          polTerminalMap.get(item.polTerminalId)?.name || "";
        // business segment
        item["businessSegmentName"] =
          businessSegmentMap.get(item.businessSegmentId)?.name || "";
        // rate request
        item["rateRequestName"] =
          rateRequestMap.get(item.rateRequestId)?.name || "";
        // Job map
        item["masterJobName"] = JobMap.get(item.masterJobId)?.name || "";
        // tblJobQty
        item.tblJobQty &&
          item.tblJobQty.map((item) => {
            //maserData
            item["sizeName"] = MasterDataMap.get(item.sizeId)?.name || "";
            item["typeName"] = MasterDataMap.get(item.typeId)?.name || "";
            item["dimensionUnitName"] =
              MasterDataMap.get(item.dimensionUnitId)?.name || "";
            item["wtUnitName"] = MasterDataMap.get(item.wtUnitId)?.name || "";
            item["volumeUnitName"] =
              MasterDataMap.get(item.volumeUnitId)?.name || "";
            item["depotName"] = portMap.get(item.depotId)?.name || "";
            item["containerName"] =
              containerMap.get(item.containerId)?.name || "";
          });
        // tblJobContainer
        item.tblJobContainer &&
          item.tblJobContainer.map((item) => {
            item["sizeName"] = MasterDataMap.get(item.sizeId)?.name || "";
            item["typeName"] = MasterDataMap.get(item.typeId)?.name || "";
            item["containerStatusName"] =
              MasterDataMap.get(item.containerStatusId)?.name || "";
            item["grossWtUnitName"] =
              MasterDataMap.get(item.grossWtUnitId)?.name || "";
            item["tareWtUnitName"] =
              MasterDataMap.get(item.tareWtUnitId)?.name || "";
            item["refTempUnitName"] =
              MasterDataMap.get(item.refTempUnitId)?.name || "";
            item["packageName"] = MasterDataMap.get(item.packageId)?.name || "";
            item["dimensionUnitName"] =
              MasterDataMap.get(item.dimensionUnitId)?.name || "";
            item["TransporterName"] =
              MasterDataMap.get(item.TransporterId)?.name || "";
            item["volumeUnitName"] =
              MasterDataMap.get(item.volumeUnitId)?.name || "";
            item["cargoTypeName"] =
              MasterDataMap.get(item.cargoTypeId)?.name || "";
            item["slotOwnerName"] =
              customerMap.get(item.cargoTypeId)?.name || "";
          });
        // tblJobCharge
        item.tblJobCharge &&
          item.tblJobCharge.map((item) => {
            item["sizeName"] = MasterDataMap.get(item.sizeId)?.name || "";
            item["typeName"] = MasterDataMap.get(item.typeId)?.name || "";
            item["unitName"] = MasterDataMap.get(item.unitId)?.name || "";
            item["buyCurrencyName"] =
              MasterDataMap.get(item.buyCurrencyId)?.name || "";
            item["sellCurrencyName"] =
              MasterDataMap.get(item.sellCurrencyId)?.name || "";
            item["buyPrepaidCollectName"] =
              MasterDataMap.get(item.buyPrepaidCollectId)?.name || "";
            item["sellPrepaidCollectName"] =
              MasterDataMap.get(item.sellPrepaidCollectid)?.name || "";
            item["dueToName"] = MasterDataMap.get(item.dueToId)?.name || "";
            item["chargeName"] = chargeMap.get(item.chargeId)?.name || "";
            item["buyPartyName"] = chargeMap.get(item.buyPartyId)?.name || "";
            item["sellPartyName"] = chargeMap.get(item.sellPartyId)?.name || "";
          });
        // tblJobActivity
        item.tblJobActivity &&
          item.tblJobActivity.map((item) => {
            item["activityPersonId"] =
              CompanyBranchPerson.get(item.activityPersonId)?.name || "";
            item["activityName"] =
              MasterDataMap.get(item.activityId)?.name || "";
          });
      });

      if (data.length > 0) {
        res.send({
          success: true,
          message: "Data fetched successfully",
          // reultofQueryData: resultOfqueryData,
          data: data,
        });
      } else {
        res.send({
          success: false,
          message: "Data not fetched successfully",
          data: data,
        });
      }
    } catch (error) {
      res.status(500).send({
        success: false,
        message: "Something went wrong",
        data: error.message,
      });
    }
  },
  AuditTrailLog: async (req, res) => {
    const validationRule = {
      tableName: "required",
    };
    validate(req.body, validationRule, {}, async (err, status) => {
      if (!status) {
        res.status(403).send({
          success: false,
          message: "validation error",
          data: err,
        });
      } else {
        try {
          const {
            tableName,
            fromDate,
            toDate,
            companyId,
            companyBranchId,
            finYearId,
            ipAddress,
          } = req.body;
          let matchData = { clientCode: req.clientCode };
          if (tableName) {
            matchData["tableName"] = tableName;
          }
          if (fromDate && toDate) {
            matchData["createdDate"] = {
              $gte: new Date(fromDate),
              $lte: new Date(toDate),
            };
          } else if (fromDate) {
            matchData["createdDate"] = {
              $gte: new Date(fromDate),
            };
          } else if (toDate) {
            matchData["createdDate"] = {
              $lte: new Date(toDate),
            };
          }
          if (companyId && companyId != "") {
            matchData["companyId"] = companyId;
          }
          if (companyBranchId && companyBranchId != "") {
            matchData["companyBranchId"] = companyBranchId;
          }
          if (finYearId && finYearId != "") {
            matchData["finYearId"] = finYearId;
          }
          if (ipAddress && ipAddress != "") {
            matchData["ipAddress"] = ipAddress;
          }
          let query = [
            {
              $match: matchData,
            },
            { $project: { previousField: 0, updateFields: 0 } },
            {
              $sort: { _id: -1 },
            },
          ];
          let data = await model.AggregateFetchData(
            "tblAuditLog",
            "tblAuditLog",
            query,
            res
          );
          //                    // console.log(data.length);
          res.send({
            success: true,
            message: "Data fetched successfully",
            data: data,
          }); // model.AuditTrailLog(req.body, res)
        } catch (error) {
          errorLogger(error, req);
          res.status(500).send({
            success: false,
            message: "Something went wrong",
            data: error.message,
          });
        }
      }
    });
  },
  RateRequest: async (req, res) => {
    try {
      let matchData = { status: Number(process.env.ACTIVE_STATUS) };
      let { body } = req;
      FilterCondition(matchData, req.body);
      if (req.query.status) {
        matchData["status"] = Number(req.query.status);
      }
      if (body.plrId && body.plrId != "undefined" && body.plrId !== "") {
        matchData["plrId"] = Number(body.plrId);
      }
      if (body._id && body._id != "undefined" && body._id !== "") {
        matchData["_id"] = new mongoose.Types.ObjectId(body._id);
      }
      if (body.polID && body.polID != "undefined" && body.polID !== "") {
        matchData["polId"] = Number(body.polID);
      }
      if (body.podId && body.podId != "undefined" && body.podId !== "") {
        matchData["podId"] = Number(body.podId);
      }
      if (body.fpdID && body.fpdID != "undefined" && body.fpdID !== "") {
        matchData["fpdID"] = Number(body.fpdID);
      }
      if (body.id && body.id != "undefined" && body.id !== "") {
        matchData["id"] = Number(body.id);
      }
      if (
        body.shipperId &&
        body.shipperId != "undefined" &&
        body.shipperId !== ""
      ) {
        matchData["shipperId"] = Number(body.shipperId);
      }
      if (
        body.consigneeId &&
        body.consigneeId != "undefined" &&
        body.consigneeId !== ""
      ) {
        matchData["consigneeId"] = Number(body.consigneeId);
      }

      let page = parseInt(req.query.page, 10) || 1;
      let pageSize = parseInt(req.query.pageSize, 10) || 200;
      let skipCount = (page - 1) * pageSize;

      let projection = req.body.projection || {};
      let query = [
        {
          $match: matchData,
        },
        {
          $sort: {
            id: 1,
          },
        },
        {
          $skip: skipCount,
        },
        {
          $limit: 100,
        },
      ];

      if (Object.keys(projection).length > 0) {
        query.push({
          $project: projection,
        });
      }

      let data = await model.AggregateFetchData(
        "tblRateRequest",
        "tblRateRequest",
        query,
        res
      );
      //console.log(data.length);

      let plrId = new Set();
      let polId = new Set();
      let podId = new Set();
      let fpdId = new Set();
      //
      let brachId = new Set();
      let destinationFreeDays = new Set();
      let srNo = new Set();
      let enquiryId = new Set();
      let preparedById = new Set();
      let commodityType = new Set();
      let containerStatusId = new Set();
      let validityTo = new Set();
      let cargoWt = new Set();
      let chargeableWt = new Set();

      let customerId = new Set();
      let shipperId = new Set();
      let consigneeId = new Set();
      let CurrencyId = new Set();
      let agentId = new Set();
      let natureOfCargoId = new Set();
      let slotOwnerId = new Set();
      let loginCompany = new Set();
      let companyBranchId = new Set();
      let finYearId = new Set();
      let salesExecutiveId = new Set();
      let cargoTypeId = new Set();
      let agentBranchId = new Set();
      let podAgentId = new Set();
      let podAgentBranchId = new Set();
      let fpdAgentId = new Set();
      let fpdAgentBranchId = new Set();
      let routeId = new Set();
      let plrAgentId = new Set();
      let plrAgentBranchId = new Set();
      let polAgentId = new Set();
      let cargoWtUnitId = new Set();
      let volumeUnitId = new Set();
      let tradeTermsId = new Set();
      let packageId = new Set();
      let originCountryId = new Set();
      let destinationCountryId = new Set();
      let mlo = new Set();

      let customStationId = new Set();
      let businessSegmentId = new Set();

      //tblRateRequestQty
      let sizeId = new Set();
      let typeId = new Set();
      let dimensionUnitId = new Set();
      let wtUnitId = new Set();

      let chargeId = new Set();
      let sellCurrencyId = new Set();
      let buyCurrencyId = new Set();
      let PrepaidCollectId = new Set();
      let vendorId = new Set();

      let chargeGroupId = new Set();

      let rateBasis = new Set();

      data.forEach((item) => {
        plrId.add(createObjectId(item.plrId));
        polId.add(createObjectId(item.polId));
        podId.add(createObjectId(item.podId));
        fpdId.add(createObjectId(item.fpdId));
        brachId.add(createObjectId(item.brachId));
        finYearId.add(createObjectId(item.finYearId));
        shipperId.add(createObjectId(item.shipperId));
        consigneeId.add(createObjectId(item.consigneeId));
        agentId.add(createObjectId(item.agentId));
        natureOfCargoId.add(createObjectId(item.natureOfCargoId));
        slotOwnerId.add(createObjectId(item.slotOwnerId));
        loginCompany.add(createObjectId(item.loginCompany));
        customerId.add(createObjectId(item.customerId));
        companyBranchId.add(createObjectId(item.companyBranchId));
        cargoWtUnitId.add(createObjectId(item.cargoWtUnitId));
        volumeUnitId.add(createObjectId(item.volumeUnitId));
        tradeTermsId.add(createObjectId(item.tradeTermsId));
        packageId.add(createObjectId(item.packageId));
        originCountryId.add(createObjectId(item.originCountryId));
        destinationCountryId.add(createObjectId(item.destinationCountryId));
        CurrencyId.add(createObjectId(item.CurrencyId));
        salesExecutiveId.add(item.salesExecutiveId);
        cargoTypeId.add(createObjectId(item.cargoTypeId));
        agentBranchId.add(createObjectId(item.agentBranchId));
        mlo.add(createObjectId(item.mlo));
        podAgentBranchId.add(createObjectId(item.podAgentBranchId));
        fpdAgentBranchId.add(createObjectId(item.fpdAgentBranchId));
        plrAgentBranchId.add(createObjectId(item.plrAgentBranchId));

        // Schema Columns

        businessSegmentId.add(createObjectId(item.businessSegmentId));
        srNo.add(createObjectId(item.srNo));
        enquiryId.add(createObjectId(item.enquiryId));
        destinationFreeDays.add(createObjectId(item.destinationFreeDays));
        preparedById.add(createObjectId(item.preparedById));
        commodityType.add(createObjectId(item.commodityType));
        containerStatusId.add(createObjectId(item.containerStatusId));
        routeId.add(createObjectId(item.routeId));
        cargoWt.add(createObjectId(item.cargoWt));
        chargeableWt.add(createObjectId(item.chargeableWt));
        cargoWtUnitId.add(createObjectId(item.cargoWtUnitId));

        //tblRateRequestQty
        item.tblRateRequestQty &&
          item.tblRateRequestQty.map((x) => {
            // console.log("x", x);
            sizeId.add(createObjectId(x.sizeId));
            typeId.add(createObjectId(x.typeId));
            dimensionUnitId.add(createObjectId(x.dimensionUnitId));
            wtUnitId.add(createObjectId(x.wtUnitId));
            volumeUnitId.add(createObjectId(x.volumeUnitId));
            packageId.add(createObjectId(x.packageId));
          });

        //tblRateRequestCharge
        item.tblRateRequestCharge &&
          item.tblRateRequestCharge.map((x) => {
            chargeId.add(createObjectId(x.chargeId));
            sizeId.add(createObjectId(x.sizeId));
            typeId.add(createObjectId(x.typeId));
            sellCurrencyId.add(createObjectId(x.sellCurrencyId));
            buyCurrencyId.add(createObjectId(x.buyCurrencyId));
            PrepaidCollectId.add(createObjectId(x.PrepaidCollectId));
            vendorId.add(createObjectId(x.vendorId));
            chargeGroupId.add(createObjectId(x.chargeGroupId));
            rateBasis.add(createObjectId(x.rateBasis));
          });
        item.tblRateRequestPlan &&
          item.tblRateRequestPlan.map((x) => {
            vendorId.add(createObjectId(x.vendorId));
          });
      });
      const tables = [
        {
          tableName: "tblPort",
          query: [
            {
              $match: {
                $or: [
                  { _id: { $in: Array.from(plrId) } },
                  { _id: { $in: Array.from(polId) } },
                  { _id: { $in: Array.from(podId) } },
                  { _id: { $in: Array.from(fpdId) } },
                ],
                status: Number(process.env.ACTIVE_STATUS),
              },
            },
          ],
        },
        {
          tableName: "tblCompany",
          query: [
            {
              $match: {
                $or: [
                  { _id: { $in: Array.from(customerId) } },
                  { _id: { $in: Array.from(shipperId) } },
                  { _id: { $in: Array.from(consigneeId) } },
                  { _id: { $in: Array.from(loginCompany) } },
                  { _id: { $in: Array.from(podAgentId) } },
                  { _id: { $in: Array.from(polAgentId) } },
                  { _id: { $in: Array.from(agentId) } },
                  { _id: { $in: Array.from(slotOwnerId) } },
                  { _id: { $in: Array.from(fpdAgentId) } },
                  { _id: { $in: Array.from(plrAgentId) } },
                  { _id: { $in: Array.from(mlo) } },
                  { _id: { $in: Array.from(customStationId) } },
                  { _id: { $in: Array.from(vendorId) } },
                ],
              },
            },
          ],
        },
        {
          tableName: "tblCompany",
          query: [
            {
              $unwind: {
                path: "$tblCompanyBranch",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                tblCompanyBranch: { $exists: true, $ne: null },
                $or: [
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(companyBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": { $in: Array.from(agentBranchId) },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(podAgentBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(fpdAgentBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(plrAgentBranchId),
                    },
                  },
                  { "tblCompanyBranch._id": { $in: Array.from(brachId) } },
                  // Add more conditions here if needed, each enclosed in {}
                ],
              },
            },
          ],
        },
        {
          tableName: "tblCompany",
          query: [
            {
              $unwind: {
                path: "$tblCompanyBranch",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $unwind: {
                path: "$tblCompanyBranch.tblCompanyBranchPerson",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                "tblCompanyBranch.tblCompanyBranchPerson": {
                  $exists: true,
                  $ne: null,
                },
                $or: [
                  {
                    "tblCompanyBranch.tblCompanyBranchPerson._id": {
                      $in: Array.from(salesExecutiveId),
                    },
                  },
                  // Add more conditions here if needed, each enclosed in {}
                ],
              },
            },
          ],
        },
        {
          tableName: "tblMasterData",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [
                  { _id: { $in: Array.from(cargoWtUnitId) } },
                  { _id: { $in: Array.from(cargoWt) } },
                  { _id: { $in: Array.from(volumeUnitId) } },
                  { _id: { $in: Array.from(tradeTermsId) } },
                  { _id: { $in: Array.from(packageId) } },
                  { _id: { $in: Array.from(CurrencyId) } },
                  { _id: { $in: Array.from(cargoTypeId) } },
                  { _id: { $in: Array.from(sizeId) } },
                  { _id: { $in: Array.from(typeId) } },
                  { _id: { $in: Array.from(dimensionUnitId) } },
                  { _id: { $in: Array.from(wtUnitId) } },
                  { _id: { $in: Array.from(buyCurrencyId) } },
                  { _id: { $in: Array.from(enquiryId) } },
                  { _id: { $in: Array.from(commodityType) } },
                  { _id: { $in: Array.from(containerStatusId) } },
                  { _id: { $in: Array.from(routeId) } },
                  { _id: { $in: Array.from(chargeableWt) } },
                  { _id: { $in: Array.from(PrepaidCollectId) } },
                  { _id: { $in: Array.from(sellCurrencyId) } },
                  { _id: { $in: Array.from(natureOfCargoId) } },
                  { _id: { $in: Array.from(chargeGroupId) } },
                  { _id: { $in: Array.from(rateBasis) } },
                ],
              },
            },
          ],
        },
        {
          tableName: "tblCountry",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [
                  { _id: { $in: Array.from(destinationCountryId) } },
                  { _id: { $in: Array.from(originCountryId) } },
                ],
              },
            },
          ],
        },
        {
          tableName: "tblFinancialYear",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(finYearId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblCharge",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(chargeId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblBusinessSegment",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(businessSegmentId) } }],
              },
            },
          ],
        },
      ];
      const dataToQuery = tables.map((iterator) =>
        model.AggregateFetchData(
          iterator.tableName,
          iterator.tableName,
          iterator.query,
          res
        )
      );

      const resultOfQueryData = await Promise.all(dataToQuery);

      const portMap = new Map();
      const customerMap = new Map();
      const MasterDataMap = new Map();
      const finYearMap = new Map();
      const CompanyBranchMap = new Map();
      const CompanyBranchPerson = new Map();
      const CountryMap = new Map();
      const chargeMap = new Map();
      const businessSegmentMap = new Map();

      // tbl Port
      for (const item of resultOfQueryData[0]) {
        if (item._id !== undefined && item.name !== undefined) {
          portMap.set(item._id.toString(), item.name);
        }
      }
      // TBL customer
      for (const item of resultOfQueryData[1]) {
        if (item.oldId !== undefined) {
          customerMap.set(item._id.toString(), {
            name: item.name,
            branch: item.tblCompanyBranch,
          });
        }
      }
      // TBL CompanyBranchMap construction
      for (const item of resultOfQueryData[2]) {
        // Check if tblCompanyBranch exists and has the oldId property
        if (
          item.tblCompanyBranch &&
          item.tblCompanyBranch.oldId !== undefined
        ) {
          CompanyBranchMap.set(item.tblCompanyBranch?._id.toString(), {
            name: item.tblCompanyBranch.name,
          });
        }
      }
      for (const item of resultOfQueryData[3]) {
        // Check if tblCompanyBranch exists and has the oldId property
        if (
          item.tblCompanyBranch &&
          item.tblCompanyBranch.tblCompanyBranchPerson &&
          item.tblCompanyBranch.tblCompanyBranchPerson.oldId !== undefined
        ) {
          CompanyBranchPerson.set(
            item.tblCompanyBranch.tblCompanyBranchPerson._id.toString(),
            { name: item.tblCompanyBranch.tblCompanyBranchPerson.name }
          );
        }
      }
      // TBL masterdata
      for (const item of resultOfQueryData[4]) {
        if (item._id !== undefined && item.name !== undefined) {
          MasterDataMap.set(item._id.toString(), {
            name: item.name,
            code: item.code,
          });
        }
      }
      // TBL CountryMap
      for (const item of resultOfQueryData[5]) {
        if (item.oldId !== undefined && item.name !== undefined) {
          CountryMap.set(item._id.toString(), { name: item.name });
        }
      }
      // tBL FINANCIAL
      for (const item of resultOfQueryData[6]) {
        if (item._id !== undefined && item.financialYear !== undefined) {
          finYearMap.set(item._id.toString(), {
            financialYear: item.financialYear,
          });
        }
      }
      for (const item of resultOfQueryData[7]) {
        if (item._id !== undefined && item.name !== undefined) {
          chargeMap.set(item._id.toString(), { name: item.name });
        }
      }
      for (const item of resultOfQueryData[8]) {
        if (item._id !== undefined && item.name !== undefined) {
          businessSegmentMap.set(item._id.toString(), { name: item.name });
        }
      }

      data.forEach((item) => {
        //item["plrName"] = portMap.get(item.plrId)?.name || "";
        item["plrName"] = portMap.get(item.plrId) || "";
        item["polName"] = portMap.get(item.polId) || "";
        item["podName"] = portMap.get(item.podId) || "";
        item["fpdName"] = portMap.get(item.fpdId) || "";
        item["companyBranchName"] =
          CompanyBranchMap.get(item.brachId)?.name || "";

        //TBL customerMap
        const customerInfo = customerMap.get(item.customerId);

        item["customerName"] = customerInfo ? customerInfo.name : "";
        item["shipperName"] = customerMap.get(item.shipperId)?.name || "";
        item["agentName"] = customerMap.get(item.agentId)?.name || "";
        item["consigneeName"] = customerMap.get(item.consigneeId)?.name || "";
        item["podAgentName"] = customerMap.get(item.podAgentId)?.name || "";
        item["fpdAgentName"] = customerMap.get(item.fpdAgentId)?.name || "";
        item["plrAgentName"] = customerMap.get(item.plrAgentId)?.name || "";
        item["mloName"] = customerMap.get(item.mlo)?.name || "";
        item["customStationName"] =
          customerMap.get(item.customStationId)?.name || "";

        // TBL MasterDataMap
        item["natureOfCargoName"] =
          MasterDataMap.get(item.natureOfCargoId)?.name || "";
        item["cargoWtUnitName"] =
          MasterDataMap.get(item.cargoWtUnitId)?.name || "";
        item["volumeUnitName"] =
          MasterDataMap.get(item.volumeUnitId)?.name || "";
        item["volumeUnitNameCode"] =
          MasterDataMap.get(item.volumeUnitId)?.code || ""; //Komal

        item["tradeTermsName"] =
          MasterDataMap.get(item.tradeTermsId)?.name || "";
        item["packageName"] = MasterDataMap.get(item.packageId)?.name || "";
        item["CurrencyName"] = MasterDataMap.get(item.CurrencyId)?.name || "";
        item["cargoTypeName"] = MasterDataMap.get(item.cargoTypeId)?.name || "";
        //___________________
        item["enquiryName"] = MasterDataMap.get(item.enquiryId)?.name || "";
        item["commodityTypeName"] =
          MasterDataMap.get(item.commodityType)?.name || "";
        item["containerStatusName"] =
          MasterDataMap.get(item.containerStatusId)?.name || "";
        item["routeName"] = MasterDataMap.get(item.routeId)?.name || "";
        item["cargoWtUnitName"] = MasterDataMap.get(item.cargoWt)?.name || "";
        item["chargeableWtName"] =
          MasterDataMap.get(item.chargeableWt)?.name || "";
        item["cargoWtUnitNames"] =
          MasterDataMap.get(item.cargoWtUnitId)?.name || "";
        item["cargoWtUnitCode"] =
          MasterDataMap.get(item.cargoWtUnitId)?.code || "";

        // TBL company
        item["slotOwnerName"] = customerMap.get(item.slotOwnerId)?.name || "";
        item["companyName"] = customerMap.get(item.loginCompany)?.name || "";
        item["vendorName"] = customerMap.get(item.vendorId)?.name || "";

        // TBL companybranch
        //item["companyBranchName"] = CompanyBranchMap.get(item.companyBranchId)?.name || "";
        item["agentBranchName"] =
          CompanyBranchMap.get(item.agentBranchId)?.name || "";
        item["podAgentBranchName"] =
          CompanyBranchMap.get(item.podAgentBranchId)?.name || "";
        item["fpdAgentBranchName"] =
          CompanyBranchMap.get(item.fpdAgentBranchId)?.name || "";
        item["plrAgentBranchName"] =
          CompanyBranchMap.get(item.plrAgentBranchId)?.name || "";

        //  TBL CompanyBranchPerson
        item["salesExecutiveName"] =
          CompanyBranchPerson.get(item.salesExecutiveId)?.name || "";

        //TBL Country
        item["originCountryName"] =
          CountryMap.get(item.originCountryId)?.name || "";
        item["destinationCountryName"] =
          CountryMap.get(item.destinationCountryId)?.name || "";

        // financial year
        item["financialYear"] =
          finYearMap.get(item.finYearId)?.financialYear || "";
        item["businessSegmentName"] =
          businessSegmentMap.get(item.businessSegmentId)?.name || "";

        // tblRateRequestQty
        item.tblRateRequestQty &&
          item.tblRateRequestQty.map((item) => {
            //maserData
            item["sizeName"] = MasterDataMap.get(item.sizeId)?.name || "";
            item["typeName"] = MasterDataMap.get(item.typeId)?.name || "";
            item["dimensionUnitName"] =
              MasterDataMap.get(item.dimensionUnitId)?.name || "";
            item["wtUnitName"] = MasterDataMap.get(item.wtUnitId)?.code || "";
            item["volumeUnitName"] =
              MasterDataMap.get(item.volumeUnitId)?.name || "";
            item["packageName"] = MasterDataMap.get(item.packageId)?.name || "";
          });
        item.tblRateRequestCharge &&
          item.tblRateRequestCharge.map((item) => {
            item["chargeName"] = chargeMap.get(item.chargeId)?.name || "";
            item["sizeName"] = MasterDataMap.get(item.sizeId)?.name || "";
            item["typeName"] = MasterDataMap.get(item.typeId)?.name || "";
            item["typeCode"] = MasterDataMap.get(item.typeId)?.code || "";
            item["sellCurrencyName"] =
              MasterDataMap.get(item.sellCurrencyId)?.name || "";
            item["buyCurrencyName"] =
              MasterDataMap.get(item.buyCurrencyId)?.name || "";
            item["sellCurrencyCode"] =
              MasterDataMap.get(item.sellCurrencyId)?.code || "";
            item["buyCurrencyCode"] =
              MasterDataMap.get(item.buyCurrencyId)?.code || "";
            item["PrepaidCollectName"] =
              MasterDataMap.get(item.PrepaidCollectId)?.name || "";
            item["vendorName"] = customerMap.get(item.vendorId)?.name || "";
            item["chargeGroupName"] =
              MasterDataMap.get(item.chargeGroupId)?.name || "";
            item["rateBasisName"] =
              MasterDataMap.get(item.rateBasis)?.name || "";
          });
        item.tblRateRequestPlan &&
          item.tblRateRequestPlan.map((item) => {
            item["vendorNamePlan"] = customerMap.get(item.vendorId)?.name || "";
          });
      });

      if (data && data.length > 0) {
        // plrId.add(createObjectId(item.plrId));
        res.send({
          success: true,
          message: "Data fetched successfully",
          data: data,
        });
      } else {
        res.send({
          success: false,
          message: "No data found",
          data: [],
        });
      }
    } catch (error) {
      res.status(500).send({
        success: false,
        message: "Something went wrong",
        data: error.message,
      });
    }
  },
  Voucher: async (req, res) => {
    try {
      let matchData = { status: Number(process.env.ACTIVE_STATUS) };
      let { body } = req;
      FilterCondition(matchData, req.body);
      if (req.query.status) {
        matchData["status"] = Number(req.query.status);
      }
      if (body.plrId && body.plrId != "undefined" && body.plrId !== "") {
        matchData["plrId"] = Number(body.plrId);
      }
      if (body._id && body._id != "undefined" && body._id !== "") {
        matchData["_id"] = new mongoose.Types.ObjectId(body._id);
      }
      if (body.polID && body.polID != "undefined" && body.polID !== "") {
        matchData["polId"] = Number(body.polID);
      }
      if (body.podId && body.podId != "undefined" && body.podId !== "") {
        matchData["podId"] = Number(body.podId);
      }
      if (body.fpdID && body.fpdID != "undefined" && body.fpdID !== "") {
        matchData["fpdID"] = Number(body.fpdID);
      }
      if (body.id && body.id != "undefined" && body.id !== "") {
        matchData["id"] = Number(body.id);
      }
      if (
        body.shipperId &&
        body.shipperId != "undefined" &&
        body.shipperId !== ""
      ) {
        matchData["shipperId"] = Number(body.shipperId);
      }
      if (
        body.consigneeId &&
        body.consigneeId != "undefined" &&
        body.consigneeId !== ""
      ) {
        matchData["consigneeId"] = Number(body.consigneeId);
      }

      let page = parseInt(req.query.page, 10) || 1;
      let pageSize = parseInt(req.query.pageSize, 10) || 200;
      let skipCount = (page - 1) * pageSize;

      let projection = req.body.projection || {};
      let query = [
        {
          $match: matchData,
        },
        {
          $sort: {
            id: 1,
          },
        },
        {
          $skip: skipCount,
        },
        {
          $limit: 100,
        },
      ];

      if (Object.keys(projection).length > 0) {
        query.push({
          $project: projection,
        });
      }

      let data = await model.AggregateFetchData(
        "tblVoucher",
        "tblVoucher",
        query,
        res
      );
      //console.log(data.length);

      let srNo = new Set();
      let voucherTypeId = new Set();
      let finYearId = new Set();
      let companyId = new Set();
      let companyBranchId = new Set();
      let currencyId = new Set();
      let createdByCompanyId = new Set();
      let createdByCompanyBranchId = new Set();

      // tblVoucherLedger
      let glId = new Set();
      let glTypeId = new Set(); // not join

      //  tblVoucherLedgerDetails
      let jobId = new Set();
      let companyBranchPersonId = new Set();
      let chargeId = new Set();
      let containerId = new Set();

      data.forEach((item) => {
        srNo.add(createObjectId(item.srNo));
        voucherTypeId.add(createObjectId(item.voucherTypeId));
        finYearId.add(createObjectId(item.finYearId));
        companyId.add(createObjectId(item.companyId));
        companyBranchId.add(createObjectId(item.companyBranchId));
        currencyId.add(createObjectId(item.currencyId));
        createdByCompanyId.add(createObjectId(item.createdByCompanyId));
        createdByCompanyBranchId.add(
          createObjectId(item.createdByCompanyBranchId)
        );

        item.tblVoucherLedger &&
          item.tblVoucherLedger.map((ledger) => {
            glId.add(createObjectId(ledger.glId));
            glTypeId.add(createObjectId(ledger.glTypeId));
            currencyId.add(createObjectId(ledger.currencyId));

            ledger.tblVoucherLedgerDetails &&
              ledger.tblVoucherLedgerDetails.map((detail) => {
                currencyId.add(createObjectId(detail.currencyId));
                jobId.add(createObjectId(detail.jobId));
                companyId.add(createObjectId(detail.companyId));
                companyBranchPersonId.add(
                  createObjectId(detail.companyBranchPersonId)
                );
                chargeId.add(createObjectId(detail.chargeId));
                containerId.add(createObjectId(detail.containerId));
              });
          });
      });
      // return console.log(companyBranchId);
      //const sizeIdArray = Array.from(sizeIds).map(id => mongoose.Types.ObjectId(id));
      const tables = [
        // 0  tblFinancialYear
        {
          tableName: "tblFinancialYear",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(finYearId) } }],
              },
            },
          ],
        },
        // 1  tblCompany
        {
          tableName: "tblCompany",
          query: [
            {
              $match: {
                $or: [
                  { _id: { $in: Array.from(companyId) } },
                  { _id: { $in: Array.from(createdByCompanyId) } },
                ],
              },
            },
          ],
        },
        // 2 tblCompanyBranch
        {
          tableName: "tblCompany",
          query: [
            {
              $unwind: {
                path: "$tblCompanyBranch",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                tblCompanyBranch: { $exists: true, $ne: null },
                $or: [
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(companyBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(createdByCompanyBranchId),
                    },
                  },
                ],
              },
            },
          ],
        },
        // 3 tblCompanyBranchPerson
        {
          tableName: "tblCompany",
          query: [
            {
              $unwind: {
                path: "$tblCompanyBranch",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $unwind: {
                path: "$tblCompanyBranch.tblCompanyBranchPerson",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                "tblCompanyBranch.tblCompanyBranchPerson": {
                  $exists: true,
                  $ne: null,
                },
                $or: [
                  {
                    "tblCompanyBranch.tblCompanyBranchPerson._id": {
                      $in: Array.from(companyBranchPersonId),
                    },
                  },
                  // Add more conditions here if needed, each enclosed in {}
                ],
              },
            },
          ],
        },
        // 4 tblVoucherType
        {
          tableName: "tblVoucherType",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(voucherTypeId) } }],
              },
            },
          ],
        },
        // 5 tblMasterData
        {
          tableName: "tblMasterData",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [
                  { _id: { $in: Array.from(currencyId) } },
                  { _id: { $in: Array.from(glTypeId) } },
                ],
              },
            },
          ],
        },
        // 6  tblGeneralLedger
        {
          tableName: "tblGeneralLedger",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(glId) } }],
              },
            },
          ],
        },
        // 7 tblJob
        {
          tableName: "tblJob",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(jobId) } }],
              },
            },
          ],
        },
        // 8 tblCharge
        {
          tableName: "tblCharge",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(chargeId) } }],
              },
            },
          ],
        },
        // 9  tblContainer
        {
          tableName: "tblContainer",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(containerId) } }],
              },
            },
          ],
        },
      ];
      const dataToQuery = tables.map((iterator) =>
        model.AggregateFetchData(
          iterator.tableName,
          iterator.tableName,
          iterator.query,
          res
        )
      );

      const resultOfQueryData = await Promise.all(dataToQuery);

      const finYearMap = new Map();
      const customerMap = new Map();
      const CompanyBranchMap = new Map();
      const VoucherTypeMap = new Map();
      const MasterDataMap = new Map();
      const GeneralLedgerMap = new Map();
      const JobMap = new Map();
      const CompanyBranchPerson = new Map();
      const chargeMap = new Map();
      const containerMap = new Map();

      //  finYearMap - 1
      for (const item of resultOfQueryData[0]) {
        if (item._id !== undefined && item.financialYear !== undefined) {
          finYearMap.set(item._id.toString(), {
            financialYear: item.financialYear,
          });
        }
      }
      // tblCompany - 2
      for (const item of resultOfQueryData[1]) {
        if (item.oldId !== undefined) {
          customerMap.set(item._id.toString(), { name: item.name });
        }
      }
      // tblCompanyBranch - 3
      for (const item of resultOfQueryData[2]) {
        // Check if tblCompanyBranch exists and has the oldId property
        if (
          item.tblCompanyBranch &&
          item.tblCompanyBranch.oldId !== undefined
        ) {
          CompanyBranchMap.set(item.tblCompanyBranch?._id.toString(), {
            name: item.tblCompanyBranch.name,
          });
        }
      }
      // tblCompanyBranchPerson - 4
      for (const item of resultOfQueryData[3]) {
        // Check if tblCompanyBranch exists and has the oldId property
        if (
          item.tblCompanyBranch &&
          item.tblCompanyBranch.tblCompanyBranchPerson &&
          item.tblCompanyBranch.tblCompanyBranchPerson.oldId !== undefined
        ) {
          CompanyBranchPerson.set(
            item.tblCompanyBranch.tblCompanyBranchPerson._id.toString(),
            { name: item.tblCompanyBranch.tblCompanyBranchPerson.name }
          );
        }
      }
      // tblVoucherType - 5
      for (const item of resultOfQueryData[4]) {
        if (item._id !== undefined && item.name !== undefined) {
          VoucherTypeMap.set(item._id.toString(), { name: item.name });
        }
      }
      // TBL masterdata - 6
      for (const item of resultOfQueryData[5]) {
        if (item._id !== undefined && item.name !== undefined) {
          MasterDataMap.set(item._id.toString(), { name: item.name });
        }
      }
      // GeneralLedgerMap - 7
      for (const item of resultOfQueryData[6]) {
        if (item._id !== undefined && item.name !== undefined) {
          GeneralLedgerMap.set(item._id.toString(), { name: item.name });
        }
      }
      // TBLJob - 8
      for (const item of resultOfQueryData[7]) {
        // Ensure the _id and jobNo properties are defined
        if (item._id !== undefined && item.jobNo !== undefined) {
          JobMap.set(item._id.toString(), { jobNo: item.jobNo });
        }
      }

      //  chargeMap - 9
      for (const item of resultOfQueryData[8]) {
        if (item._id !== undefined && item.name !== undefined) {
          chargeMap.set(item._id, { name: item.name });
        }
      }
      // containerMap - 10
      for (const item of resultOfQueryData[9]) {
        if (item._id !== undefined && item.name !== undefined) {
          containerMap.set(item._id, { name: item.name });
        }
      }

      data.forEach((item) => {
        //  finYearMap
        item["financialYear"] =
          finYearMap.get(item.finYearId)?.financialYear || "";

        // customerMap
        item["companyName"] = customerMap.get(item.companyId)?.name || "";
        item["createdByCompanyName"] =
          customerMap.get(item.createdByCompanyId)?.name || "";

        // CompanyBranchMap
        item["companyBranchName"] =
          CompanyBranchMap.get(item.companyBranchId)?.name || "";
        item["createdByCompanyBranchName"] =
          CompanyBranchMap.get(item.createdByCompanyBranchId)?.name || "";

        // VoucherTypeMap
        item["voucherTypeName"] =
          VoucherTypeMap.get(item.voucherTypeId)?.name || "";

        // MasterDataMap
        item["CurrencyName"] = MasterDataMap.get(item.currencyId)?.name || "";

        // tblVoucherLedger
        item.tblVoucherLedger &&
          item.tblVoucherLedger.map((item) => {
            // MasterDataMap
            item["CurrencyName"] =
              MasterDataMap.get(item.currencyId)?.name || "";
            item["glTypeName"] = MasterDataMap.get(item.glTypeId)?.name || "";
            item["glName"] = GeneralLedgerMap.get(item.glId)?.name || "";
            item.tblVoucherLedgerDetails &&
              item.tblVoucherLedgerDetails.map((item) => {
                // MasterDataMap
                item["CurrencyName"] =
                  MasterDataMap.get(item.currencyId)?.name || "";

                item["JobName"] = JobMap.get(item.jobId)?.jobNo || ""; // Not found

                item["companyName"] =
                  customerMap.get(item.companyId)?.name || "";
                item["companyBranchName"] =
                  CompanyBranchMap.get(item.companyBranchId)?.name || "";

                item["companyBranchPersonName"] =
                  CompanyBranchPerson.get(item.companyBranchPersonId)?.name ||
                  ""; // not found
                item["chargeName"] = chargeMap.get(item.chargeId)?.name || ""; // not found
                item["containerName"] =
                  containerMap.get(item.containerId)?.name || "";
              });
          });
      });

      if (data && data.length > 0) {
        // plrId.add(createObjectId(item.plrId));
        res.send({
          success: true,
          message: "Data fetched successfully",
          data: data,
        });
      } else {
        res.send({
          success: false,
          message: "No data found",
          data: [],
        });
      }
    } catch (error) {
      res.status(500).send({
        success: false,
        message: "Something went wrong",
        data: error.message,
      });
    }
  },
  Invoices: async (req, res) => {
    try {
      let matchData = { status: Number(process.env.ACTIVE_STATUS) };
      let { body } = req;
      FilterCondition(matchData, req.body);
      if (req.query.status) {
        matchData["status"] = Number(req.query.status);
      }
      if (body._id && body._id != "undefined" && body._id !== "") {
        matchData["_id"] = new mongoose.Types.ObjectId(body._id);
      }
      if (body.id && body.id != "undefined" && body.id !== "") {
        matchData["id"] = Number(body.id);
      }
      if (body.plrId && body.plrId != "undefined" && body.plrId !== "") {
        matchData["plrId"] = Number(body.plrId);
      }
      if (body.polID && body.polID != "undefined" && body.polID !== "") {
        matchData["polID"] = Number(body.polID);
      }
      if (body.podId && body.podId != "undefined" && body.podId !== "") {
        matchData["podId"] = Number(body.podId);
      }
      if (body.fpdID && body.fpdID != "undefined" && body.fpdID !== "") {
        matchData["fpdID"] = Number(body.fpdID);
      }
      if (body.id && body.id != "undefined" && body.id !== "") {
        matchData["id"] = Number(body.id);
      }
      if (
        body.voucherTypeId &&
        body.voucherTypeId != "undefined" &&
        body.voucherTypeId !== ""
      ) {
        matchData["voucherTypeId"] = Number(body.voucherTypeId);
      }
      if (
        body.billingPartyId &&
        body.billingPartyId != "undefined" &&
        body.billingPartyId !== ""
      ) {
        matchData["billingPartyId"] = Number(body.billingPartyId);
      }
      if (body.srNo && body.srNo != "undefined" && body.srNo !== "") {
        matchData["srNo"] = Number(body.srNo);
      }
      if (
        body.billingPartyStateId &&
        body.billingPartyStateId != "undefined" &&
        body.billingPartyStateId !== ""
      ) {
        matchData["billingPartyStateId"] = Number(body.billingPartyStateId);
      }
      if (
        body.countryId &&
        body.countryId != "undefined" &&
        body.countryId !== ""
      ) {
        matchData["countryId"] = Number(body.countryId);
      }
      if (
        body.invoiceDate &&
        body.invoiceDate != "undefined" &&
        body.invoiceDate !== ""
      ) {
        matchData["invoiceDate"] = Number(body.invoiceDate);
      }

      let page = parseInt(req.query.page, 10) || 1;
      let pageSize = parseInt(req.query.pageSize, 10) || 200;
      let skipCount = (page - 1) * pageSize;
      let projection = req.body.projection || {};
      let query = [
        {
          $match: matchData,
        },
        {
          $sort: {
            id: 1,
          },
        },
        {
          $skip: skipCount,
        },
        {
          $limit: 100,
        },
      ];

      // Check if the projection object is not empty
      if (Object.keys(projection).length > 0) {
        query.push({
          $project: projection,
        });
      }

      let data = await model.AggregateFetchData(
        "tblInvoice",
        "tblInvoice",
        query,
        res
      );
      console.log(data.length);

      let plrId = new Set();
      let polId = new Set();
      let podId = new Set();
      let fpdId = new Set();
      let voucherTypeId = new Set();
      let billingPartyId = new Set();
      let srNo = new Set();
      let billingPartyStateId = new Set();
      let countryId = new Set();
      let invoiceDate = new Set();
      let finYearId = new Set();
      let jobId = new Set();
      let currencyId = new Set();
      let formControlId = new Set();
      let invoiceNo = new Set();
      let companyBranchId = new Set();
      let companyId = new Set();
      let vesselId = new Set();
      let voyageId = new Set();
      let blId = new Set();
      let voucherId = new Set();
      let parentInvoiceId = new Set();
      let fromLocationId = new Set();
      let toLocationId = new Set();
      let billingPartyBranchId = new Set();
      let bankId = new Set();
      let departmentId = new Set();
      let agentId = new Set();
      let depotId = new Set();
      let createdByCompanyId = new Set();
      let createdByCompanyBranchId = new Set();
      let billingPartyGstinNoId = new Set();
      let ownStateId = new Set();
      let polTerminalId = new Set();
      let placeOfSupplyStateId = new Set();
      let proformaInvoiceId = new Set();
      let principalId = new Set();
      let ownGstinNoId = new Set();
      let loginBranch = new Set();

      //tblInvoiceCharge
      let chargeId = new Set();
      let sizeId = new Set();
      let typeId = new Set();
      let unitId = new Set();
      let chargeGlId = new Set();

      //tblInvoiceChargeTax
      let taxId = new Set();
      let taxDetailId = new Set();

      //tblInvoiceChargeTds
      let tdsId = new Set();
      let tdsDetailId = new Set();

      //tblInvoiceChargeDetails
      let containerId = new Set();

      data.forEach((item) => {
        console.log(createObjectId(item.jobId));
        plrId.add(createObjectId(item.plrId));
        polId.add(createObjectId(item.polId));
        podId.add(createObjectId(item.podId));
        fpdId.add(createObjectId(item.fpdId));
        voucherTypeId.add(createObjectId(item.voucherTypeId));
        billingPartyId.add(createObjectId(item.billingPartyId));
        srNo.add(createObjectId(item.srNo));
        billingPartyStateId.add(createObjectId(item.billingPartyStateId));
        countryId.add(createObjectId(item.countryId));
        invoiceDate.add(createObjectId(item.invoiceDate));
        jobId.add(createObjectId(item.jobId));
        finYearId.add(createObjectId(item.finYearId));
        currencyId.add(createObjectId(item.currencyId));
        formControlId.add(createObjectId(item.formControlId));
        invoiceNo.add(createObjectId(item.invoiceNo));
        companyBranchId.add(createObjectId(item.companyBranchId));
        companyId.add(createObjectId(item.companyId));
        loginBranch.add(createObjectId(item.loginBranch));
        vesselId.add(createObjectId(item.vesselId));
        voyageId.add(createObjectId(item.voyageId));
        blId.add(createObjectId(item.blId));
        voucherId.add(createObjectId(item.voucherId));
        parentInvoiceId.add(createObjectId(item.parentInvoiceId));
        fromLocationId.add(createObjectId(item.fromLocationId));
        toLocationId.add(createObjectId(item.toLocationId));
        billingPartyBranchId.add(createObjectId(item.billingPartyBranchId));
        bankId.add(createObjectId(item.bankId));
        departmentId.add(createObjectId(item.departmentId));
        depotId.add(createObjectId(item.depotId));
        agentId.add(createObjectId(item.agentId));
        principalId.add(createObjectId(item.principalId));
        createdByCompanyId.add(createObjectId(item.createdByCompanyId));
        createdByCompanyBranchId.add(
          createObjectId(item.createdByCompanyBranchId)
        );
        billingPartyGstinNoId.add(createObjectId(item.billingPartyGstinNoId));
        ownStateId.add(createObjectId(item.ownStateId));
        ownGstinNoId.add(createObjectId(item.ownGstinNoId));
        placeOfSupplyStateId.add(createObjectId(item.placeOfSupplyStateId));
        polTerminalId.add(createObjectId(item.polTerminalId));
        proformaInvoiceId.add(createObjectId(item.proformaInvoiceId));

        ///tblInvoiceCharge
        item.tblInvoiceCharge &&
          item.tblInvoiceCharge.map((x) => {
            console.log("x", x);
            chargeId.add(createObjectId(x.chargeId));
            unitId.add(createObjectId(x.unitId));
            sizeId.add(createObjectId(x.sizeId));
            typeId.add(createObjectId(x.typeId));
            chargeGlId.add(createObjectId(x.chargeGlId));
          }),
          //tblInvoiceChargeTax
          item.tblInvoiceChargeTax &&
            item.tblInvoiceChargeTax.map((x) => {
              console.log("x", x);
              taxId.add(createObjectId(x.taxId));
              taxDetailId.add(createObjectId(x.taxDetailId));
            });
        ///tblInvoiceChargeDetails
        item.tblInvoiceChargeDetails &&
          item.tblInvoiceChargeDetails.map((x) => {
            console.log("x", x);
            containerId.add(createObjectId(x.containerId));
          });
      });
      const tables = [
        //0
        {
          tableName: "tblPort",
          query: [
            {
              $match: {
                $or: [
                  { portId: { $in: Array.from(plrId) } },
                  { portId: { $in: Array.from(polId) } },
                  { portId: { $in: Array.from(podId) } },
                  { portId: { $in: Array.from(fpdId) } },
                ],
                status: Number(process.env.ACTIVE_STATUS),
              },
            },
          ],
        },
        //1
        {
          tableName: "tblCompany",
          query: [
            {
              $match: {
                $or: [
                  { _id: { $in: Array.from(companyId) } },
                  { _id: { $in: Array.from(principalId) } },
                  { _id: { $in: Array.from(agentId) } },
                  { _id: { $in: Array.from(billingPartyId) } },
                ],
              },
            },
          ],
        },
        //2
        {
          tableName: "tblCompany",
          query: [
            {
              $unwind: {
                path: "$tblCompanyBranch",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                tblCompanyBranch: { $exists: true, $ne: null },
                $or: [
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(companyBranchId),
                    },
                  },
                ],
                $or: [
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(loginBranch),
                    },
                  },
                ],
              },
            },
          ],
        },
        //3
        {
          tableName: "tblCharge",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(chargeId) } }],
              },
            },
          ],
        },
        //4
        {
          tableName: "tblMasterData",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [
                  { _id: { $in: Array.from(sizeId) } },
                  { _id: { $in: Array.from(typeId) } },
                  { _id: { $in: Array.from(unitId) } },
                  { _id: { $in: Array.from(currencyId) } },
                  { _id: { $in: Array.from(chargeId) } },
                ],
              },
            },
          ],
        },
        //5
        {
          tableName: "tblGeneralLedger",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(chargeGlId) } }],
                $or: [{ _id: { $in: Array.from(billingPartyId) } }],
              },
            },
          ],
        },
        //6
        {
          tableName: "tblTax",
          query: [
            {
              $unwind: {
                path: "$tblTaxDetails",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                tblTaxDetails: { $exists: true, $ne: null },
                $or: [
                  { "tblTaxDetails._id": { $in: Array.from(taxDetailId) } },
                ],
              },
            },
          ],
        },
        //7
        {
          tableName: "tblTds",
          query: [
            {
              $unwind: {
                path: "$tblTdsDetails",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                tblTdsDetails: { $exists: true, $ne: null },
                $or: [
                  { "tblTdsDetails._id": { $in: Array.from(tdsDetailId) } },
                ],
              },
            },
          ],
        },
        //8
        {
          tableName: "tblVesselFlight",
          query: [
            {
              $unwind: {
                path: "$tblVoyage",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                tblVoyage: { $exists: true, $ne: null },
                $or: [{ "tblVoyage._id": { $in: Array.from(voyageId) } }],
              },
            },
          ],
        },
        //9
        {
          tableName: "tblFinancialYear",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(finYearId) } }],
              },
            },
          ],
        },
        //10
        {
          tableName: "tblContainer",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(containerId) } }],
              },
            },
          ],
        },
        //11
        {
          tableName: "tblCountry",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(countryId) } }],
              },
            },
          ],
        },
        //12
        {
          tableName: "tblCountry",
          query: [
            {
              $unwind: {
                path: "$tblState",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                tblState: { $exists: true, $ne: null },
                $or: [
                  { "tblState._id": { $in: Array.from(billingPartyStateId) } },
                  { "tblState._id": { $in: Array.from(placeOfSupplyStateId) } },
                ],
              },
            },
          ],
        },
        //13
        {
          tableName: "tblVoucherType",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(voucherTypeId) } }],
              },
            },
          ],
        },
        //14
        {
          tableName: "tblJob",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(jobId) } }],
              },
            },
          ],
        },
        //15
        {
          tableName: "tblBl",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(blId) } }],
              },
            },
          ],
        },
        //16
        {
          tableName: "tblMasterData",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
              },
            },
          ],
        },
        //17
        {
          tableName: "tblBusinessSegment",
          query: [
            {
              $match: {
                $or: [{ _id: { $in: Array.from(departmentId) } }],
                status: Number(process.env.ACTIVE_STATUS),
              },
            },
          ],
        },
      ];

      const dataToQuery = tables.map((iterator) =>
        model.AggregateFetchData(
          iterator.tableName,
          iterator.tableName,
          iterator.query,
          res
        )
      );

      const resultOfQueryData = await Promise.all(dataToQuery);
      const portMap = new Map(); //0
      const customerMap = new Map(); //1
      const CompanyBranchMap = new Map(); //2
      const chargeMap = new Map(); //3
      const MasterDataMap = new Map(); //4
      const generalLedgerMap = new Map(); //5
      const tax = new Map(); //6
      const tds = new Map(); //7
      const VoyageMap = new Map(); //8
      const finYearMap = new Map(); //9
      const containerMap = new Map(); //10
      const CountryMap = new Map(); //11
      const CountryStateMap = new Map(); //12
      const voucherType = new Map(); //13
      const jobMap = new Map(); //14
      const blMap = new Map(); //15
      const chargeGroup = new Map(); //16
      const businessSegmentMap = new Map(); //16
      //0
      for (const item of resultOfQueryData[0]) {
        if (item.portId !== undefined && item.name !== undefined) {
          portMap.set(item.portId, item.name);
        }
      }
      //1
      for (const item of resultOfQueryData[1]) {
        if (item.oldId !== undefined) {
          customerMap.set(item._id.toString(), {
            name: item.name,
            branch: item.tblCompanyBranch,
            pan: item.panNo,
          });
        }
      }
      //2
      for (const item of resultOfQueryData[2]) {
        // Check if tblCompanyBranch exists and has the oldId property
        if (
          item.tblCompanyBranch &&
          item.tblCompanyBranch.oldId !== undefined
        ) {
          CompanyBranchMap.set(item.tblCompanyBranch?._id.toString(), {
            name: item.tblCompanyBranch.name,
            gstinNoData: item.tblCompanyBranch.gstinNo,
          });
        }
      }
      //3
      for (const item of resultOfQueryData[3]) {
        if (item._id !== undefined && item.name !== undefined) {
          chargeMap.set(item._id.toString(), {
            name: item.name,
            tblChargeGroups: item.tblChargeGroups,
          });
        }
      }
      //4
      for (const item of resultOfQueryData[4]) {
        if (item._id !== undefined && item.name !== undefined) {
          MasterDataMap.set(item._id.toString(), {
            name: item.name,
          });
        }
      }
      //5
      for (const item of resultOfQueryData[5]) {
        if (item._id !== undefined && item.name !== undefined) {
          generalLedgerMap.set(item._id.toString(), { name: item.name });
        }
      }
      //6
      for (const item of resultOfQueryData[6]) {
        if (item._id !== undefined && item.name !== undefined) {
          tax.set(item._id.toString(), { name: item.name });
        }
      }
      //7
      for (const item of resultOfQueryData[7]) {
        if (item._id !== undefined && item.name !== undefined) {
          tds.set(item._id.toString(), { name: item.name });
        }
      }
      //8
      for (const item of resultOfQueryData[8]) {
        if (
          item.tblVoyage &&
          item.tblVoyage._id !== undefined &&
          item.name !== undefined
        ) {
          VoyageMap.set(item.tblVoyage._id.toString(), {
            name: item.tblVoyage.name,
          });
        }
      }
      //9
      for (const item of resultOfQueryData[9]) {
        if (item._id !== undefined && item.financialYear !== undefined) {
          finYearMap.set(item._id.toString(), {
            financialYear: item.financialYear,
          });
        }
      }
      //10
      for (const item of resultOfQueryData[10]) {
        if (item._id !== undefined && item.name !== undefined) {
          containerMap.set(item._id.toString(), { name: item.name });
        }
      }
      //11
      for (const item of resultOfQueryData[11]) {
        if (item.oldId !== undefined) {
          CountryMap.set(item._id.toString(), {
            name: item.name,
            branch: item.name,
          });
        }
      }
      //12

      for (const item of resultOfQueryData[12]) {
        if (item.oldId !== undefined) {
          CountryStateMap.set(item._id.toString(), {
            name: item.name,
            branch: item.tblState,
          });
        }
      }
      //13
      for (const item of resultOfQueryData[13]) {
        if (item._id !== undefined && item.name !== undefined) {
          voucherType.set(item._id.toString(), { name: item.name });
        }
      }
      //14
      for (const item of resultOfQueryData[14]) {
        if (item._id !== undefined && item.name !== undefined) {
          jobMap.set(item._id.toString(), { name: item.name });
        }
      }
      //15
      for (const item of resultOfQueryData[15]) {
        if (item._id !== undefined && item.name !== undefined) {
          blMap.set(item._id.toString(), { name: item.name });
        }
      }
      //16
      for (const item of resultOfQueryData[16]) {
        if (item._id !== undefined && item.name !== undefined) {
          chargeGroup.set(item._id.toString(), { name: item.name });
        }
      }
      //17
      for (const item of resultOfQueryData[17]) {
        if (item._id !== undefined) {
          businessSegmentMap.set(item._id.toString(), { name: item.name });
        }
      }

      data.forEach((item) => {
        item["plrName"] = portMap.get(item.plrId) || "";
        item["polName"] = portMap.get(item.polId) || "";
        item["podName"] = portMap.get(item.podId) || "";
        item["fpdName"] = portMap.get(item.fpdId) || "";
        item["billingPartyName"] =
          generalLedgerMap.get(item.billingPartyId) || "";
        //item["polVoyage"] = VoyageMap.get(item.voyageId)?.name || "";
        item["financialYear"] =
          finYearMap.get(item.finYearId)?.financialYear || "";
        //
        item["VoucherType"] = voucherType.get(item.voucherTypeId)?.name || "";
        item["companyBranchName"] =
          CompanyBranchMap.get(item.companyBranchId)?.name || "";
        item["companyName"] = customerMap.get(item.companyId)?.name || "";
        item["departmentName"] =
          businessSegmentMap.get(item.departmentId)?.name || "";
        item["principal"] = customerMap.get(item.principalId)?.name || "";
        item["agentName"] = customerMap.get(item.agentId)?.name || "";
        // item["panNo"] = customerMap.get(item.companyId)?.pan || "";
        item["placeOfSupply"] =
          CountryMap.get(item.placeOfSupplyStateId)?.name || "";
        item["country"] = CountryMap.get(item.countryId)?.name || "";
        item["BillingState"] =
          CountryStateMap.get(item.billingPartyStateId)?.name || "";
        item["BillingStateCode"] =
          CountryStateMap.get(item.billingPartyStateId)?.code || "";
        item["Job"] = jobMap.get(item.jobId)?.name || "";
        const customerInfo = customerMap.get(item.billingPartyId);
        item["customerName"] = customerInfo ? customerInfo.name : "";
        item["panNo"] = customerInfo ? customerInfo.pan : "";
        item["gstinNo"] =
          CompanyBranchMap.get(item.loginBranch)?.gstinNoData || "";
        item["currency"] = MasterDataMap.get(item.currencyId)?.name || "";
        item["blNo"] = blMap.get(item.blId)?.name || "";

        // tblInvoiceCharge
        item.tblInvoiceCharge &&
          item.tblInvoiceCharge.map((item) => {
            item["size"] = MasterDataMap.get(item.sizeId)?.name || "";
            item["unit"] = MasterDataMap.get(item.unitId)?.name || "";
            item["type"] = MasterDataMap.get(item.typeId)?.name || "";
            item["chargeGl"] = MasterDataMap.get(item.chargeGlId)?.name || "";
            item["chargeName"] = chargeMap.get(item.chargeId)?.name || "";
            const chargeGroupData =
              chargeMap.get(item.chargeId)?.tblChargeGroups || [];
            item["chargeGroupName"] = chargeGroupData
              .map(
                (chargeDetail) =>
                  chargeGroup.get(chargeDetail.chargeGroup)?.name
              )
              .filter(Boolean) // removes any undefined names
              .join(", "); // j;
            item["currencyName"] =
              MasterDataMap.get(item.currencyId)?.name || "";
          });

        //tblInvoiceChargeTax
        item.tblInvoiceChargeTax &&
          item.tblInvoiceChargeTax.map((item) => {
            item["taxDetails"] = tax.get(item.taxDetailId)?.name || "";
          });
        //tblInvoiceChargeTds
        item.tblInvoiceChargeTds &&
          item.tblInvoiceChargeTds.map((item) => {
            item["tdsDetails"] = tds.get(item.tdsDetailId)?.name || "";
          });
        //tblInvoiceChargeDetails
        item.tblInvoiceChargeDetails &&
          item.tblInvoiceChargeDetails.map((item) => {
            item["containerName"] =
              containerMap.get(item.containerId)?.name || "";
          });
      });
      if (data.length > 0) {
        res.send({
          success: true,
          message: "Data fetched successfully",
          data: data,
        });
      } else {
        res.send({
          success: false,
          message: "Data not fetched successfully",
          data: data,
        });
      }
    } catch (error) {
      res.status(500).send({
        success: false,
        message: "Something went wrong",
        data: error.message,
      });
    }
  },
  BlRegistration: async (req, res) => {
    try {
      let matchData = {
        status: Number(process.env.ACTIVE_STATUS),
        id: { $gt: 444 },
      };
      let { body } = req;
      FilterCondition(matchData, req.body);
      if (
        body.shipperId &&
        body.shipperId != "undefined" &&
        body.shipperId !== ""
      ) {
        matchData["shipperId"] = Number(body.shipperId);
      }
      if (
        body.consigneeId &&
        body.consigneeId != "undefined" &&
        body.consigneeId !== ""
      ) {
        matchData["consigneeId"] = Number(body.consigneeId);
      }
      if (
        body.shippingLineId &&
        body.shippingLineId != "undefined" &&
        body.shippingLineId !== ""
      ) {
        matchData["shippingLineId"] = Number(body.shippingLineId);
      }
      if (body.plrId && body.plrId != "undefined" && body.plrId !== "") {
        matchData["plrId"] = Number(body.plrId);
      }
      if (body.polID && body.polID != "undefined" && body.polID !== "") {
        matchData["polID"] = Number(body.polID);
      }
      if (body.podId && body.podId != "undefined" && body.podId !== "") {
        matchData["podId"] = Number(body.podId);
      }
      if (body.fpdID && body.fpdID != "undefined" && body.fpdID !== "") {
        matchData["fpdID"] = Number(body.fpdID);
      }
      if (
        body.fromDate &&
        body.fromDate != "undefined" &&
        body.fromDate !== "" &&
        body.toDate &&
        body.toDate != "undefined" &&
        body.toDate !== ""
      ) {
        matchData["blDate"] = {
          $gte: new Date(body.fromDate),
          $lte: new Date(body.toDate),
        };
      } else if (
        body.fromDate &&
        body.fromDate != "undefined" &&
        body.fromDate !== ""
      ) {
        matchData["blDate"] = { $gte: new Date(body.fromDate) };
      } else if (
        body.toDate &&
        body.toDate != "undefined" &&
        body.toDate !== ""
      ) {
        matchData["blDate"] = { $lte: new Date(body.toDate) };
      }
      let page = parseInt(req.query.page, 10) || 1; // Default to page 1 if not specified
      let pageSize = parseInt(req.query.pageSize, 10) || 100; // Default to 10 items per page if not specified

      // Calculate the number of documents to skip
      let skipCount = (page - 1) * pageSize;
      let query = [
        {
          $match: matchData,
        },
        {
          $sort: {
            id: 1,
          },
        },
        {
          $skip: skipCount,
        },
        {
          $limit: pageSize,
        },
      ];
      let project = {};
      if (body.projection && Object.keys(body.projection).length > 0) {
        project = body.projection;
      }
      if (Object.keys(project).length > 0) {
        query.push({ $project: project });
      }

      let data = await model.AggregateFetchData("tblBl", "tblBl", query, res);
      //tblBl
      let containerStatusId = new Set();
      let blTypeId = new Set();
      let noOfBl = new Set();
      let shipperId = new Set();
      let shipperBranchId = new Set();
      let consigneeId = new Set();
      let consigneeBranchId = new Set();
      let notifyPartyId = new Set();
      let notifyPartyBranchId = new Set();
      let notifyParty2Id = new Set();
      let notifyParty2BranchId = new Set();
      let notifyParty3Id = new Set();
      let notifyParty3BranchId = new Set();
      let blOf = new Set();
      let fpdAgentId = new Set();
      let polAgentId = new Set();
      let customBrokerId = new Set();
      let podAgentId = new Set();
      let polVesselId = new Set();
      let polVoyageId = new Set();
      let plrId = new Set();
      let polId = new Set();
      let podId = new Set();
      let fpdId = new Set();
      let preCarriageId = new Set();
      let freightPrepaidCollect = new Set();
      let noOfPackages = new Set();
      let PackageId = new Set();
      let grossWt = new Set();
      let grossWtUnitId = new Set();
      let netWt = new Set();
      let netWtUnitId = new Set();
      let volume = new Set();
      let volumeUnitId = new Set();
      let cargoTypeId = new Set();
      let imoId = new Set();
      let shippingLineAirLineId = new Set();
      let tranship1PortId = new Set();
      let igmNo = new Set();
      let nominatedAreaId = new Set();
      let lineNo = new Set();
      let subLineNo = new Set();
      let natureOfCargoId = new Set();
      let shipmentTypeId = new Set();
      let movementTypeId = new Set();
      let companyId = new Set();
      let companyBranchId = new Set();
      let mblId = new Set();
      let tranship2PortId = new Set();
      let emptyDepotId = new Set();
      let movementCarrierId = new Set();
      let doNo = new Set();
      let podVesselId = new Set();
      let podVoyageId = new Set();
      let originFreeDays = new Set();
      let destinationFreeDays = new Set();
      let originDemurrageRate = new Set();
      let destinationDemurrageRate = new Set();
      let demurrageCurrencyId = new Set();
      let finYearId = new Set();
      let commodityTypeId = new Set();
      let postCarriageId = new Set();
      let mloId = new Set();
      let slotOwnerId = new Set();
      let deliveryAgentBranchId = new Set();
      let surveyorId = new Set();
      let GRentFreeDays = new Set();
      let srNo = new Set();
      let createdByCompanyBranchId = new Set();
      let createdByCompanyId = new Set();
      let blSlNo = new Set();
      let chargeableWt = new Set();
      let chargeableWtUnitId = new Set();
      let tranship1AgentId = new Set();
      let tranship2AgentId = new Set();
      let volumeWt = new Set();
      let businessSegmentId = new Set();
      let polAgentBranchId = new Set();
      let podAgentBranchId = new Set();
      let detentionId = new Set();
      let transitTime = new Set();
      let slabCount = new Set();
      let routeId = new Set();
      let dpdId = new Set();
      let surveyorBranchId = new Set();
      let slotPaidById = new Set();
      let switchAgentId = new Set();
      let switchAgentBranchId = new Set();
      let tranship1AgentBranchId = new Set();
      let tranship2AgentBranchId = new Set();
      let plrAgentId = new Set();
      let plrAgentBranchId = new Set();
      let originDemurrageFreeDays = new Set();
      let destinationDemurrageFreeDays = new Set();
      let podHsnCode = new Set();
      let tranship1LoadVesselId = new Set();
      let tranship1LoadVoyageId = new Set();
      let thirdCfsId = new Set();
      let BLNomStatusId = new Set();
      let tranship3PortId = new Set();
      let tranship3AgentId = new Set();
      let tranship3AgentBranchId = new Set();
      let tranship2LoadVesselId = new Set();
      let tranship2LoadVoyageId = new Set();
      let tradeTermsId = new Set();
      let paymentCollAgentId = new Set();

      //tblBlContainer
      let sizeId = new Set();
      let typeId = new Set();
      let refTemp = new Set();
      let refTempUnitId = new Set();
      let packageId = new Set();
      let tareWt = new Set();
      let tareWtUnitId = new Set();
      let length = new Set();
      let width = new Set();
      let height = new Set();
      let dimensionUnitId = new Set();
      let containerId = new Set();
      let tranship1SlotOwnerId = new Set();
      let tranship2SlotOwnerId = new Set();
      let tranship3SlotOwnerId = new Set();
      let sealTypeId = new Set();
      let vgm = new Set();

      //tblBlPackingList
      let wtUnitId = new Set();
      let qty = new Set();
      let blContainerId = new Set();

      //tblBlCharge
      let chargeId = new Set();
      let buyRate = new Set();
      let sellRate = new Set();
      let unitId = new Set();
      let sellPrepaidCollectid = new Set();
      let buyAmount = new Set();
      let sellAmount = new Set();
      let buyCurrencyId = new Set();
      let buyexchangeRate = new Set();
      let buyNetAmount = new Set();
      let sellexchangeRate = new Set();
      let sellNetAmount = new Set();
      let bookingChargeId = new Set();
      let sellCurrencyId = new Set();
      let buyTotalAmountHc = new Set();
      let sellTotalAmountHc = new Set();
      let buyPrepaidCollectId = new Set();
      let sellPartyId = new Set();
      let buyPartyId = new Set();
      let buyTaxAmount = new Set();
      let sellTaxAmount = new Set();
      let dueToId = new Set();

      //tblBlClause
      let tblClauseId = new Set();

      data.forEach((item) => {
        plrId.add(createObjectId(item.plrId));
        containerStatusId.add(createObjectId(item.containerStatusId));
        blTypeId.add(createObjectId(item.blTypeId));
        noOfBl.add(createObjectId(item.noOfBl));
        shipperId.add(createObjectId(item.shipperId));
        shipperBranchId.add(createObjectId(item.shipperBranchId));
        consigneeId.add(createObjectId(item.consigneeId));
        consigneeBranchId.add(createObjectId(item.consigneeBranchId));
        notifyPartyId.add(createObjectId(item.notifyPartyId));
        notifyPartyBranchId.add(createObjectId(item.notifyPartyBranchId));
        notifyParty2Id.add(createObjectId(item.notifyParty2Id));
        notifyParty2BranchId.add(createObjectId(item.notifyParty2BranchId));
        notifyParty3Id.add(createObjectId(item.notifyParty3Id));
        notifyParty3BranchId.add(createObjectId(item.notifyParty3BranchId));
        blOf.add(createObjectId(item.blOf));
        fpdAgentId.add(createObjectId(item.fpdAgentId));
        polAgentId.add(createObjectId(item.polAgentId));
        customBrokerId.add(createObjectId(item.customBrokerId));
        podAgentId.add(createObjectId(item.podAgentId));
        polVesselId.add(createObjectId(item.polVesselId));
        polVoyageId.add(createObjectId(item.polVoyageId));
        plrId.add(createObjectId(item.plrId));
        polId.add(createObjectId(item.polId));
        podId.add(createObjectId(item.podId));
        fpdId.add(createObjectId(item.fpdId));
        preCarriageId.add(createObjectId(item.preCarriageId));
        freightPrepaidCollect.add(createObjectId(item.freightPrepaidCollect));
        noOfPackages.add(createObjectId(item.noOfPackages));
        PackageId.add(createObjectId(item.PackageId));
        grossWt.add(createObjectId(item.grossWt));
        grossWtUnitId.add(createObjectId(item.grossWtUnitId));
        netWt.add(createObjectId(item.netWt));
        netWtUnitId.add(createObjectId(item.netWtUnitId));
        volume.add(createObjectId(item.volume));
        volumeUnitId.add(createObjectId(item.volumeUnitId));
        cargoTypeId.add(createObjectId(item.cargoTypeId));
        imoId.add(createObjectId(item.imoId));
        shippingLineAirLineId.add(createObjectId(item.shippingLineAirLineId));
        tranship1PortId.add(createObjectId(item.tranship1PortId));
        igmNo.add(createObjectId(item.igmNo));
        nominatedAreaId.add(createObjectId(item.nominatedAreaId));
        lineNo.add(createObjectId(item.lineNo));
        subLineNo.add(createObjectId(item.subLineNo));
        natureOfCargoId.add(createObjectId(item.natureOfCargoId));
        shipmentTypeId.add(createObjectId(item.shipmentTypeId));
        movementTypeId.add(createObjectId(item.movementTypeId));
        companyId.add(createObjectId(item.companyId));
        companyBranchId.add(createObjectId(item.companyBranchId));
        mblId.add(createObjectId(item.mblId));
        tranship2PortId.add(createObjectId(item.tranship2PortId));
        emptyDepotId.add(createObjectId(item.emptyDepotId));
        movementCarrierId.add(createObjectId(item.movementCarrierId));
        doNo.add(createObjectId(item.doNo));
        podVesselId.add(createObjectId(item.podVesselId));
        podVoyageId.add(createObjectId(item.podVoyageId));
        originFreeDays.add(createObjectId(item.originFreeDays));
        destinationFreeDays.add(createObjectId(item.destinationFreeDays));
        originDemurrageRate.add(createObjectId(item.originDemurrageRate));
        destinationDemurrageRate.add(
          createObjectId(item.destinationDemurrageRate)
        );
        demurrageCurrencyId.add(createObjectId(item.demurrageCurrencyId));
        finYearId.add(createObjectId(item.finYearId));
        commodityTypeId.add(createObjectId(item.commodityTypeId));
        postCarriageId.add(createObjectId(item.postCarriageId));
        mloId.add(createObjectId(item.mloId));
        slotOwnerId.add(createObjectId(item.slotOwnerId));
        deliveryAgentBranchId.add(createObjectId(item.deliveryAgentBranchId));
        surveyorId.add(createObjectId(item.surveyorId));
        GRentFreeDays.add(createObjectId(item.GRentFreeDays));
        srNo.add(createObjectId(item.srNo));
        createdByCompanyBranchId.add(
          createObjectId(item.createdByCompanyBranchId)
        );
        createdByCompanyId.add(createObjectId(item.createdByCompanyId));
        blSlNo.add(createObjectId(item.blSlNo));
        chargeableWt.add(createObjectId(item.chargeableWt));
        chargeableWtUnitId.add(createObjectId(item.chargeableWtUnitId));
        tranship1AgentId.add(createObjectId(item.tranship1AgentId));
        tranship2AgentId.add(createObjectId(item.tranship2AgentId));
        volumeWt.add(createObjectId(item.volumeWt));
        businessSegmentId.add(createObjectId(item.businessSegmentId));
        polAgentBranchId.add(createObjectId(item.polAgentBranchId));
        podAgentBranchId.add(createObjectId(item.podAgentBranchId));
        detentionId.add(createObjectId(item.detentionId));
        transitTime.add(createObjectId(item.transitTime));
        slabCount.add(createObjectId(item.slabCount));
        routeId.add(createObjectId(item.routeId));
        dpdId.add(createObjectId(item.dpdId));
        surveyorBranchId.add(createObjectId(item.surveyorBranchId));
        slotPaidById.add(createObjectId(item.slotPaidById));
        switchAgentId.add(createObjectId(item.switchAgentId));
        switchAgentBranchId.add(createObjectId(item.switchAgentBranchId));
        tranship1AgentBranchId.add(createObjectId(item.tranship1AgentBranchId));
        tranship2AgentBranchId.add(createObjectId(item.tranship2AgentBranchId));
        plrAgentId.add(createObjectId(item.plrAgentId));
        plrAgentBranchId.add(createObjectId(item.plrAgentBranchId));
        originDemurrageFreeDays.add(
          createObjectId(item.originDemurrageFreeDays)
        );
        destinationDemurrageFreeDays.add(
          createObjectId(item.destinationDemurrageFreeDays)
        );
        podHsnCode.add(createObjectId(item.podHsnCode));
        tranship1LoadVesselId.add(createObjectId(item.tranship1LoadVesselId));
        tranship1LoadVoyageId.add(createObjectId(item.tranship1LoadVoyageId));
        thirdCfsId.add(createObjectId(item.thirdCfsId));
        BLNomStatusId.add(createObjectId(item.BLNomStatusId));
        tranship3PortId.add(createObjectId(item.tranship3PortId));
        tranship3AgentId.add(createObjectId(item.tranship3AgentId));
        tranship3AgentBranchId.add(createObjectId(item.tranship3AgentBranchId));
        tranship2LoadVesselId.add(createObjectId(item.tranship2LoadVesselId));
        tranship2LoadVoyageId.add(createObjectId(item.tranship2LoadVoyageId));
        tradeTermsId.add(createObjectId(item.tradeTermsId));
        paymentCollAgentId.add(createObjectId(item.paymentCollAgentId));

        // tblBlContainer
        item.tblBlContainer &&
          item.tblBlContainer.map((x) => {
            console.log("x", x);
            sizeId.add(createObjectId(x.sizeId));
            typeId.add(createObjectId(x.typeId));
            refTemp.add(createObjectId(x.refTemp));
            refTempUnitId.add(createObjectId(x.refTempUnitId));
            packageId.add(createObjectId(x.packageId));
            tareWt.add(createObjectId(x.tareWt));
            tareWtUnitId.add(createObjectId(x.tareWtUnitId));
            length.add(createObjectId(x.length));
            width.add(createObjectId(x.width));
            height.add(createObjectId(x.height));
            dimensionUnitId.add(createObjectId(x.dimensionUnitId));
            containerId.add(createObjectId(x.containerId));
            tranship1SlotOwnerId.add(createObjectId(x.tranship1SlotOwnerId));
            tranship2SlotOwnerId.add(createObjectId(x.tranship2SlotOwnerId));
            tranship3SlotOwnerId.add(createObjectId(x.tranship3SlotOwnerId));
            sealTypeId.add(createObjectId(x.sealTypeId));
            vgm.add(createObjectId(x.vgm));
          });
        //  tblBlPackingList
        item.tblBlPackingList &&
          item.tblBlPackingList.map((x) => {
            wtUnitId.add(createObjectId(x.wtUnitId));
            qty.add(createObjectId(x.qty));
            blContainerId.add(createObjectId(x.blContainerId));
          });
        // tblBlCharge
        item.tblBlCharge &&
          item.tblBlCharge.map((x) => {
            chargeId.add(createObjectId(x.chargeId));
            buyRate.add(createObjectId(x.buyRate));
            sellRate.add(createObjectId(x.sellRate));
            unitId.add(createObjectId(x.unitId));
            sellPrepaidCollectid.add(createObjectId(x.sellPrepaidCollectid));
            buyAmount.add(createObjectId(x.buyAmount));
            sellAmount.add(createObjectId(x.sellAmount));
            buyCurrencyId.add(createObjectId(x.buyCurrencyId));
            buyexchangeRate.add(createObjectId(x.buyexchangeRate));
            buyNetAmount.add(createObjectId(x.buyNetAmount));
            sellexchangeRate.add(createObjectId(x.sellexchangeRate));
            sellNetAmount.add(createObjectId(x.sellNetAmount));
            bookingChargeId.add(createObjectId(x.bookingChargeId));
            sellCurrencyId.add(createObjectId(x.sellCurrencyId));
            buyTotalAmountHc.add(createObjectId(x.buyTotalAmountHc));
            sellTotalAmountHc.add(createObjectId(x.sellTotalAmountHc));
            buyPrepaidCollectId.add(createObjectId(x.buyPrepaidCollectId));
            sellPartyId.add(createObjectId(x.sellPartyId));
            buyPartyId.add(createObjectId(x.buyPartyId));
            buyTaxAmount.add(createObjectId(x.buyTaxAmount));
            sellTaxAmount.add(createObjectId(x.sellTaxAmount));
            dueToId.add(createObjectId(x.dueToId));
          });
        // tblBlClause
        item.tblBlClause &&
          item.tblBlClause.map((x) => {
            tblClauseId.add(createObjectId(x.tblClauseId));
          });
      });
      // return console.log(companyBranchId);
      const tables = [
        {
          tableName: "tblPort",
          query: [
            {
              $match: {
                $or: [
                  { portId: { $in: Array.from(plrId) } },
                  { portId: { $in: Array.from(polId) } },
                  { portId: { $in: Array.from(podId) } },
                  { portId: { $in: Array.from(fpdId) } },
                  { portId: { $in: Array.from(podVoyageId) } },
                ],
                status: Number(process.env.ACTIVE_STATUS),
              },
            },
          ],
        },
        {
          tableName: "tblPrepaidCollect",
          query: [
            {
              $match: {
                $or: [{ _id: { $in: Array.from(freightPrepaidCollect) } }],
              },
            },
          ],
        },
        {
          tableName: "tblCompany",
          query: [
            {
              $match: {
                $or: [
                  { _id: { $in: Array.from(shipperId) } },
                  { _id: { $in: Array.from(consigneeId) } },
                  { _id: { $in: Array.from(notifyPartyId) } },
                  { _id: { $in: Array.from(notifyParty2Id) } },
                  { _id: { $in: Array.from(notifyParty3Id) } },
                  { _id: { $in: Array.from(customBrokerId) } },
                  { _id: { $in: Array.from(slotOwnerId) } },
                  { _id: { $in: Array.from(mloId) } },
                  { _id: { $in: Array.from(createdByCompanyId) } },
                  { _id: { $in: Array.from(fpdAgentId) } },
                  { _id: { $in: Array.from(plrAgentId) } },
                  { _id: { $in: Array.from(surveyorId) } },
                ],
              },
            },
          ],
        },
        {
          tableName: "tblCompany",
          query: [
            {
              $unwind: {
                path: "$tblCompanyBranch",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                tblCompanyBranch: { $exists: true, $ne: null },
                $or: [
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(shipperBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(consigneeBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(notifyParty2BranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(notifyParty3BranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(notifyPartyBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(companyBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(createdByCompanyBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(polAgentBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(podAgentBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(surveyorBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(plrAgentBranchId),
                    },
                  },
                  // Add more conditions here if needed, each enclosed in {}
                ],
              },
            },
          ],
        },
        // {
        //     tableName: "tblCompany",
        //     query: [
        //         {
        //             $unwind: {
        //                 path: "$tblCompanyBranch",
        //                 preserveNullAndEmptyArrays: true,
        //             }
        //         },
        //         {
        //             $unwind: {
        //                 path: "$tblCompanyBranch.tblCompanyBranchPerson",
        //                 preserveNullAndEmptyArrays: true,
        //             }
        //         },
        //         {
        //             $match: {
        //                 status: Number(process.env.ACTIVE_STATUS),
        //                 "tblCompanyBranch.tblCompanyBranchPerson": { $exists: true, $ne: null },
        //                 $or: [
        //                     { "tblCompanyBranch.tblCompanyBranchPerson._id": { $in: Array.from(salesExecutiveId) } },
        //                     { "tblCompanyBranch.tblCompanyBranchPerson._id": { $in: Array.from(pricingPersonId) } },
        //                     { "tblCompanyBranch.tblCompanyBranchPerson._id": { $in: Array.from(backOfficePersonId) } },
        //                     { "tblCompanyBranch.tblCompanyBranchPerson._id": { $in: Array.from(sellPersonId) } },
        //                     { "tblCompanyBranch.tblCompanyBranchPerson._id": { $in: Array.from(customerServicePersonId) } },
        //                     { "tblCompanyBranch.tblCompanyBranchPerson._id": { $in: Array.from(customerClearancePersonId) } },
        //                     { "tblCompanyBranch.tblCompanyBranchPerson._id": { $in: Array.from(activityPersonId) } },
        //                     Add more conditions here if needed, each enclosed in {}
        //                 ]
        //             }
        //         }
        //     ]

        // },
        {
          tableName: "tblFinancialYear",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(finYearId) } }],
              },
            },
          ],
        },
        //     {
        //         tableName: "tblCountry",
        //         query: [
        //             {
        //                 $match: {
        //                     status: Number(process.env.ACTIVE_STATUS),
        //                     $or: [

        //                         { _id: { $in: Array.from(destinationCountryId) } },
        //                         { _id: { $in: Array.from(originCountryId) } },

        //                     ]
        //                 }
        //             }
        //         ]
        //     },
        {
          tableName: "tblMasterData",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [
                  { _id: { $in: Array.from(tradeTermsId) } },
                  { _id: { $in: Array.from(natureOfCargoId) } },
                  { _id: { $in: Array.from(containerStatusId) } },
                  { _id: { $in: Array.from(preCarriageId) } },
                  { _id: { $in: Array.from(cargoTypeId) } },
                  { _id: { $in: Array.from(packageId) } },
                  { _id: { $in: Array.from(volumeUnitId) } },
                  { _id: { $in: Array.from(chargeableWtUnitId) } },
                  { _id: { $in: Array.from(routeId) } },
                  { _id: { $in: Array.from(netWtUnitId) } },
                  { _id: { $in: Array.from(demurrageCurrencyId) } },
                  { _id: { $in: Array.from(sizeId) } },
                  { _id: { $in: Array.from(typeId) } },
                  { _id: { $in: Array.from(dimensionUnitId) } },
                  { _id: { $in: Array.from(wtUnitId) } },
                  { _id: { $in: Array.from(grossWtUnitId) } },
                  { _id: { $in: Array.from(tareWtUnitId) } },
                  { _id: { $in: Array.from(refTemp) } },
                  { _id: { $in: Array.from(refTempUnitId) } },
                  // //{ _id: { $in: Array.from(TransporterId) } },
                  // { _id: { $in: Array.from(unitId) } },
                  // { _id: { $in: Array.from(buyCurrencyId) } },
                  // { _id: { $in: Array.from(sellCurrencyId) } },
                  // { _id: { $in: Array.from(buyPrepaidCollectId) } },
                  // { _id: { $in: Array.from(sellPrepaidCollectid) } },
                  // { _id: { $in: Array.from(dueToId) } },
                  // { _id: { $in: Array.from(activityId) } },
                ],
              },
            },
          ],
        },
        {
          tableName: "tblVesselFlight",
          query: [
            {
              $unwind: {
                path: "$tblVoyage",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                tblVoyage: { $exists: true, $ne: null },
                $or: [{ "tblVoyage._id": { $in: Array.from(polVoyageId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblVesselFlight",
          query: [
            {
              $match: {
                $or: [
                  { _id: { $in: Array.from(polVesselId) } },
                  { _id: { $in: Array.from(podVesselId) } },
                ],
              },
            },
          ],
        },
        //     {
        //         tableName: "tblPort",
        //         query: [
        //             {
        //                 $unwind: {
        //                     path: "$tblBerth",
        //                     preserveNullAndEmptyArrays: true,
        //                 }
        //             },
        //             {
        //                 $match: {
        //                     status: Number(process.env.ACTIVE_STATUS),
        //                     "tblBert": { $exists: true, $ne: null },
        //                     $or: [
        //                         { "tblBert._id": { $in: Array.from(polTerminalId) } },

        //                     ]
        //                 }
        //             }
        //         ]
        //     }
        //     ,
        {
          tableName: "tblBusinessSegment",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(businessSegmentId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblBl",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(mblId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblContainer",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(containerId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblCharge",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(chargeId) } }],
              },
            },
          ],
        },
        //     ,
        //     {
        //         tableName: "tblGeneralLedger",
        //         query: [
        //             {
        //                 $match: {
        //                     status: Number(process.env.ACTIVE_STATUS),
        //                     $or: [
        //                         { _id: { $in: Array.from(buyPartyId) } },
        //                         { _id: { $in: Array.from(sellPartyId) } },
        //                     ]
        //                 }
        //             }
        //         ]
        //     }
      ];
      // return console.log("tables", tables.length);

      const dataToQuery = tables.map((iterator) =>
        model.AggregateFetchData(
          iterator.tableName,
          iterator.tableName,
          iterator.query,
          res
        )
      );

      const resultOfQueryData = await Promise.all(dataToQuery);
      const portMap = new Map();
      const customerMap = new Map();
      const CompanyBranchMap = new Map();
      const CompanyBranchPerson = new Map();
      const finYearMap = new Map();
      const CountryMap = new Map();
      const MasterDataMap = new Map();
      const VoyageMap = new Map();
      const VesselMap = new Map();
      const polTerminalMap = new Map();
      const businessSegmentMap = new Map();
      const rateRequestMap = new Map();
      const JobMap = new Map();
      const containerMap = new Map();
      const chargeMap = new Map();
      const generalLedgerMap = new Map();
      const PrepaidCollectMap = new Map();

      // Optimizing portMap construction
      for (const item of resultOfQueryData[0]) {
        if (item.portId !== undefined && item.name !== undefined) {
          portMap.set(item.portId, item.name);
        }
      }
      // console.log("company length", resultOfQueryData[1][0]._id.toString());
      // Optimizing customerMap construction
      for (const item of resultOfQueryData[1]) {
        if (item.oldId !== undefined) {
          customerMap.set(item._id.toString(), {
            name: item.name,
            branch: item.tblCompanyBranch,
          });
        }
      }

      // Optimizing CompanyBranchMap construction
      for (const item of resultOfQueryData[2]) {
        // Check if tblCompanyBranch exists and has the oldId property
        if (
          item.tblCompanyBranch &&
          item.tblCompanyBranch.oldId !== undefined
        ) {
          CompanyBranchMap.set(item.tblCompanyBranch?._id.toString(), {
            name: item.tblCompanyBranch.name,
          });
        }
      }

      for (const item of resultOfQueryData[3]) {
        // Check if tblCompanyBranch exists and has the oldId property
        if (
          item.tblCompanyBranch &&
          item.tblCompanyBranch.tblCompanyBranchPerson &&
          item.tblCompanyBranch.tblCompanyBranchPerson._id !== undefined
        ) {
          CompanyBranchPerson.set(
            item.tblCompanyBranch.tblCompanyBranchPerson._id.toString(),
            { name: item.tblCompanyBranch.tblCompanyBranchPerson.name }
          );
        }
      }
      console.log("CompanyBranchPerson", resultOfQueryData[3].length);
      for (const item of resultOfQueryData[4]) {
        if (item._id !== undefined && item.financialYear !== undefined) {
          finYearMap.set(item._id.toString(), {
            financialYear: item.financialYear,
          });
        }
      }
      for (const item of resultOfQueryData[5]) {
        if (
          item.freightPrepaidCollect !== undefined &&
          item.name !== undefined
        ) {
          PrepaidCollectMap.set(item.freightPrepaidCollect, item.name);
        }
      }
      // console.log("finYearMap", finYearMap);
      for (const item of resultOfQueryData[6]) {
        if (item._id !== undefined && item.name !== undefined) {
          CountryMap.set(item._id.toString(), { name: item.name });
        }
      }
      // console.log("resultOfQueryData[6].length", resultOfQueryData[6].length);
      for (const item of resultOfQueryData[7]) {
        if (item._id !== undefined && item.name !== undefined) {
          MasterDataMap.set(item._id.toString(), { name: item.name });
        }
      }
      // console.log("MasterDataMap", MasterDataMap);
      for (const item of resultOfQueryData[8]) {
        if (
          item.tblVoyage &&
          item.tblVoyage._id !== undefined &&
          item.name !== undefined
        ) {
          VoyageMap.set(item.tblVoyage._id, { name: item.tblVoyage.name });
        }
      }
      for (const item of resultOfQueryData[9]) {
        if (item._id !== undefined && item.name !== undefined) {
          VesselMap.set(item._id, { name: item.name });
        }
      }
      for (const item of resultOfQueryData[10]) {
        if (
          item.tblBerth &&
          item.tblBerth._id !== undefined &&
          item.name !== undefined
        ) {
          polTerminalMap.set(item.tblBerth._id, { name: item.tblBerth.name });
        }
      }
      for (const item of resultOfQueryData[11]) {
        if (item._id !== undefined && item.name !== undefined) {
          businessSegmentMap.set(item._id, { name: item.name });
        }
      }
      // for (const item of resultOfQueryData[12]) {
      //     if (item._id !== undefined && item.name !== undefined) {
      //         containerMap.set(item._id, { name: item.name });
      //     }
      // }
      // for (const item of resultOfQueryData[13]) {
      //     if (item._id !== undefined && item.name !== undefined) {
      //         chargeMap.set(item._id, { name: item.name });
      //     }
      // }
      // for (const item of resultOfQueryData[14]) {
      //     if (item._id !== undefined && item.name !== undefined) {
      //         generalLedgerMap.set(item._id, { name: item.name });
      //     }
      // }

      data.forEach((item) => {
        console.log(CompanyBranchMap.get(item.shipperBranchId));
        console.log(
          "MasterDataMap.get(item.cargoTypeId)?.name",
          MasterDataMap.get(item.cargoTypeId)
        );
        item["plrName"] = portMap.get(item.plrId)?.name || "";
        item["polName"] = portMap.get(item.polId) || "";
        item["podName"] = portMap.get(item.podId) || "";
        item["fpdName"] = portMap.get(item.fpdId) || "";
        item["podVoyageName"] = portMap.get(item.podVoyageId) || "";

        // //const customerInfo = customerMap.get(item.customerId);
        // // console.log("customerInfo", customerInfo.flat(2));
        item["consigneeName"] = customerMap.get(item.consigneeId)?.name || "";
        item["shipperName"] = customerMap.get(item.shipperId)?.name || "";
        item["shippinglineName"] =
          customerMap.get(item.shippingLineAirLineId)?.name || "";
        item["companyName"] = customerMap.get(item.companyId)?.name || "";
        item["podAgentName"] = customerMap.get(item.podAgentId)?.name || "";
        item["polAgentName"] = customerMap.get(item.polAgentId)?.name || "";
        // //item["agentName"] = customerMap.get(item.agentId)?.name || "";
        item["notifyPartyName"] =
          customerMap.get(item.notifyPartyId)?.name || "";
        item["customBrokerName"] =
          customerMap.get(item.customBrokerId)?.name || "";
        // //item["transporterName"] = customerMap.get(item.transporterId)?.name || "";
        // //item["podCustomBrokerName"] = customerMap.get(item.podCustomBrokerId)?.name || "";
        // //item["shippingAgentName"] = customerMap.get(item.shippingAgentId)?.name || "";
        item["slotOwnerName"] = customerMap.get(item.slotOwnerId)?.name || "";
        item["mloName"] = customerMap.get(item.mloId)?.name || "";
        item["createdByCompanyName"] =
          customerMap.get(item.createdByCompanyId)?.name || "";
        item["fpdAgentName"] = customerMap.get(item.fpdAgentId)?.name || "";
        item["surveyorName"] = customerMap.get(item.surveyorId)?.name || "";
        item["plrAgentName"] = customerMap.get(item.plrAgentId)?.name || "";
        // // Assuming you want to extract the branch name for the customer
        item["companyBranchName"] =
          CompanyBranchMap.get(item.companybranchId)?.name || "";
        item["consigneeBranchName"] =
          CompanyBranchMap.get(item.consigneeBranchId)?.name || "";
        item["shipperBranchName"] =
          CompanyBranchMap.get(item.shipperBranchId)?.name || "";
        // //item["customerBranchName"] = CompanyBranchMap.get(item.customerBranchId)?.name || "";
        // //item["agentBranchName"] = CompanyBranchMap.get(item.agentBranchId)?.name || "";
        item["notifyPartyBranchName"] =
          CompanyBranchMap.get(item.notifyPartyBranchId)?.name || "";
        item["createdByCompanyBranchName"] =
          CompanyBranchMap.get(item.createdByCompanyBranchId)?.name || "";
        item["polAgentBranchName"] =
          CompanyBranchMap.get(item.polAgentBranchId)?.name || "";
        item["podAgentBranchName"] =
          CompanyBranchMap.get(item.podAgentBranchId)?.name || "";
        item["surveyorBranchName"] =
          CompanyBranchMap.get(item.surveyorBranchId)?.name || "";
        // //item["fpdAgentBranchName"] = CompanyBranchMap.get(item.fpdAgentBranchId)?.name || "";
        item["plrAgentBranchName"] =
          CompanyBranchMap.get(item.plrAgentBranchId)?.name || "";

        // //company branch person
        // //item["salesExecutiveName"] = CompanyBranchPerson.get(item.salesExecutiveId)?.name || "";
        // //item["pricingPersonName"] = CompanyBranchPerson.get(item.pricingPersonId)?.name || "";
        // //item["customerServicePersonName"] = CompanyBranchPerson.get(item.customerServicePersonId)?.name || "";
        // //item["backOfficePersonName"] = CompanyBranchPerson.get(item.backOfficePersonId)?.name || "";
        // //item["sellPersonName"] = CompanyBranchPerson.get(item.sellPersonId)?.name || "";
        // //item["customerClearancePersonName"] = CompanyBranchPerson.get(item.customerClearancePersonId)?.name || "";

        // // financial year
        item["financialYear"] =
          finYearMap.get(item.finYearId)?.financialYear || "";

        // // PrepaidCollectMap
        item["freightPrepaidCollect"] =
          finYearMap.get(item.freightPrepaidCollect)?.freightPrepaidCollect ||
          "";

        // //countryMap
        // //item["destinationCountryName"] = CountryMap.get(item.destinationCountryId)?.name || "";
        // //item["originCountryName"] = CountryMap.get(item.originCountryId)?.name || "";

        // //MasterData
        item["tradeTermsName"] =
          MasterDataMap.get(item.tradeTermsId)?.name || "";
        item["natureOfCargoName"] =
          MasterDataMap.get(item.natureOfCargoId)?.name || "";
        // //item["stuffingTypeName"] = MasterDataMap.get(item.stuffingTypeId)?.name || "";
        item["containerStatusName"] =
          MasterDataMap.get(item.containerStatusId)?.name || "";
        item["preCarriageName"] =
          MasterDataMap.get(item.preCarriageId)?.name || "";
        // //item["destuffingTypeName"] = MasterDataMap.get(item.destuffingTypeId)?.name || "";
        item["cargoTypeName"] = MasterDataMap.get(item.cargoTypeId)?.name || "";
        // //item["cargoWtUnitName"] = MasterDataMap.get(item.cargoWtUnitId)?.name || "";
        item["packageName"] = MasterDataMap.get(item.packageId)?.name || "";
        item["commodityTypeName"] =
          MasterDataMap.get(item.commodityTypeId)?.name || "";
        item["volumeUnitName"] =
          MasterDataMap.get(item.volumeUnitId)?.name || "";
        item["chargeableWtUnitName"] =
          MasterDataMap.get(item.chargeableWtUnitId)?.name || "";
        // //item["postCarriageName"] = MasterDataMap.get(item.postCarriage)?.name || "";
        item["netWtUnitName"] = MasterDataMap.get(item.netWtUnitId)?.name || "";
        item["routeName"] = MasterDataMap.get(item.routeId)?.name || "";
        item["demmuragecurrencyName"] =
          MasterDataMap.get(item.demurrageCurrencyId)?.name || "";

        //voyage
        item["polVoyageName"] = VoyageMap.get(item.polVoyageId)?.name || "";
        //vessel
        item["polVesselName"] = VesselMap.get(item.polVesselId)?.name || "";
        item["podVesselName"] = VesselMap.get(item.podVesselId)?.name || "";
        // //pol terminal
        // //item["polTerminalName"] = polTerminalMap.get(item.polTerminalId)?.name || "";
        // business segment
        item["businessSegmentName"] =
          businessSegmentMap.get(item.businessSegmentId)?.name || "";
        // // rate request
        // item["rateRequestName"] = rateRequestMap.get(item.rateRequestId)?.name || "";
        // // Job map
        // //item["masterJobName"] = JobMap.get(item.masterJobId)?.name || "";
        // // tblJobQty
        // item.tblJobQty && item.tblJobQty.map((item) => {
        //maserData
        item["sizeName"] = MasterDataMap.get(item.sizeId)?.name || "";
        item["typeName"] = MasterDataMap.get(item.typeId)?.name || "";
        item["dimensionUnitName"] =
          MasterDataMap.get(item.dimensionUnitId)?.name || "";
        item["wtUnitName"] = MasterDataMap.get(item.wtUnitId)?.name || "";
        item["volumeUnitName"] =
          MasterDataMap.get(item.volumeUnitId)?.name || "";
        //     //item["depotName"] = portMap.get(item.depotId)?.name || "";
        item["containerName"] = containerMap.get(item.containerId)?.name || "";

        // })
        // // tblBlContainer
        item.tblBlContainer &&
          item.tblBlContainer.map((item) => {
            // item["sizeName"] = MasterDataMap.get(item.sizeId)?.name || "";
            // item["typeName"] = MasterDataMap.get(item.typeId)?.name || "";
            item["refTempUnitName"] =
              MasterDataMap.get(item.refTempUnitId)?.name || "";
            item["packageName"] = MasterDataMap.get(item.packageId)?.name || "";
            item["tareWtUnitName"] =
              MasterDataMap.get(item.tareWtUnitId)?.name || "";
            item["dimensionUnitName"] =
              MasterDataMap.get(item.dimensionUnitId)?.name || "";
            item["containerStatusName"] =
              MasterDataMap.get(item.containerStatusId)?.name || "";
            item["grossWtUnitName"] =
              MasterDataMap.get(item.grossWtUnitId)?.name || "";
            //     //item["TransporterName"] = MasterDataMap.get(item.TransporterId)?.name || "";
            item["volumeUnitName"] =
              MasterDataMap.get(item.volumeUnitId)?.name || "";
            item["cargoTypeName"] =
              MasterDataMap.get(item.cargoTypeId)?.name || "";
            item["slotOwnerName"] =
              customerMap.get(item.cargoTypeId)?.name || "";
          });
        // tblBlCharge
        item.tblBlCharge &&
          item.tblBlCharge.map((item) => {
            item["chargeName"] = chargeMap.get(item.chargeId)?.name || "";
            // item["sizeName"] = MasterDataMap.get(item.sizeId)?.name || "";
            //     item["typeName"] = MasterDataMap.get(item.typeId)?.name || "";
            //     item["unitName"] = MasterDataMap.get(item.unitId)?.name || "";
            //     item["buyCurrencyName"] = MasterDataMap.get(item.buyCurrencyId)?.name || "";
            //     item["sellCurrencyName"] = MasterDataMap.get(item.sellCurrencyId)?.name || "";
            //     item["buyPrepaidCollectName"] = MasterDataMap.get(item.buyPrepaidCollectId)?.name || "";
            //     item["sellPrepaidCollectName"] = MasterDataMap.get(item.sellPrepaidCollectid)?.name || "";
            //     item["dueToName"] = MasterDataMap.get(item.dueToId)?.name || "";
            //     item["buyPartyName"] = chargeMap.get(item.buyPartyId)?.name || "";
            //     item["sellPartyName"] = chargeMap.get(item.sellPartyId)?.name || "";
          });
        // // tblJobActivity
        // item.tblJobActivity && item.tblJobActivity.map((item) => {
        //     //item["activityPersonId"] = CompanyBranchPerson.get(item.activityPersonId)?.name || "";
        //     //item["activityName"] = MasterDataMap.get(item.activityId)?.name || "";
        // })
      });

      if (data.length > 0) {
        res.send({
          success: true,
          message: "Data fetched successfully",
          data: data,
        });
      } else {
        res.send({
          success: false,
          message: "Data not fetched successfully",
          data: data,
        });
      }
    } catch (error) {
      res.status(500).send({
        success: false,
        message: "Something went wrong",
        data: error.message,
      });
    }
  },
  Enquiry: async (req, res) => {
    try {
      let matchData = { status: Number(process.env.ACTIVE_STATUS) };
      let { body } = req;
      FilterCondition(matchData, req.body);
      if (body.id && body.id != "undefined" && body.id !== "") {
        matchData["id"] = Number(body.id);
      }
      if (body._id && body._id != "undefined" && body._id !== "") {
        matchData["_id"] = new mongoose.Types.ObjectId(body._id);
      }
      if (
        body.customerId &&
        body.customerId != "undefined" &&
        body.customerId !== ""
      ) {
        matchData["customerId"] = Number(body.customerId);
      }
      if (
        body.finYearId &&
        body.finYearId != "undefined" &&
        body.finYearId !== ""
      ) {
        matchData["finYearId"] = String(body.finYearId);
      }
      if (
        body.shipperId &&
        body.shipperId != "undefined" &&
        body.shipperId !== ""
      ) {
        matchData["shipperId"] = Number(body.shipperId);
      }
      if (
        body.consigneeId &&
        body.consigneeId != "undefined" &&
        body.consigneeId !== ""
      ) {
        matchData["consigneeId"] = Number(body.consigneeId);
      }
      if (
        body.shippingLineId &&
        body.shippingLineId != "undefined" &&
        body.shippingLineId !== ""
      ) {
        matchData["shippingLineId"] = Number(body.shippingLineId);
      }
      if (body.plrId && body.plrId != "undefined" && body.plrId !== "") {
        matchData["plrId"] = Number(body.plrId);
      }
      if (body.polId && body.polId != "undefined" && body.polId !== "") {
        matchData["polId"] = Number(body.polId);
      }
      if (body.podId && body.podId != "undefined" && body.podId !== "") {
        matchData["podId"] = Number(body.podId);
      }
      if (body.fpdId && body.fpdId != "undefined" && body.fpdId !== "") {
        matchData["fpdId"] = Number(body.fpdId);
      }
      if (
        body.fromDate &&
        body.fromDate != "undefined" &&
        body.fromDate !== "" &&
        body.toDate &&
        body.toDate != "undefined" &&
        body.toDate !== ""
      ) {
        matchData["jobDate"] = {
          $gte: new Date(body.fromDate),
          $lte: new Date(body.toDate),
        };
      } else if (
        body.fromDate &&
        body.fromDate != "undefined" &&
        body.fromDate !== ""
      ) {
        matchData["jobDate"] = { $gte: new Date(body.fromDate) };
      } else if (
        body.toDate &&
        body.toDate != "undefined" &&
        body.toDate !== ""
      ) {
        matchData["jobDate"] = { $lte: new Date(body.toDate) };
      }
      let page = parseInt(req.query.page, 10) || 1;
      let pageSize = parseInt(req.query.pageSize, 100) || 1000;

      let skipCount = (page - 1) * pageSize;
      let query = [
        {
          $match: matchData,
        },
        {
          $sort: {
            id: 1,
          },
        },
        {
          $skip: skipCount,
        },
        {
          $limit: pageSize,
        },
      ];
      let project = {};
      if (body.projection && Object.keys(body.projection).length > 0) {
        project = body.projection;
      }
      if (Object.keys(project).length > 0) {
        query.push({ $project: project });
      }

      let data = await model.AggregateFetchData(
        "tblEnquiry",
        "tblEnquiry",
        query,
        res
      );
      console.log("Fetched data:", data);

      let businessSegmentId = new Set();
      let shipperId = new Set();
      let consigneeId = new Set();
      let shippingLineId = new Set();
      let plrId = new Set();
      let polId = new Set();
      let podId = new Set();
      let fpdId = new Set();
      let containerStatusId = new Set();
      let natureOfCargoId = new Set();
      let cargoTypeId = new Set();
      let cargoWtUnitId = new Set();
      let volumeUnitId = new Set();
      let tradeTermsId = new Set();
      let pacakgeId = new Set();
      let destinationCountryId = new Set();
      let originCountryId = new Set();
      let sizeId = new Set();
      let typeId = new Set();
      let wtUnitId = new Set();

      data.forEach((item) => {
        businessSegmentId.add(createObjectId(item.businessSegmentId));
        shipperId.add(createObjectId(item.shipperId));
        consigneeId.add(createObjectId(item.consigneeId));
        shippingLineId.add(createObjectId(item.shippingLineId));
        plrId.add(createObjectId(item.plrId));
        polId.add(createObjectId(item.polId));
        podId.add(createObjectId(item.podId));
        fpdId.add(createObjectId(item.fpdId));
        containerStatusId.add(createObjectId(item.containerStatusId));
        natureOfCargoId.add(createObjectId(item.natureOfCargoId));
        cargoTypeId.add(createObjectId(item.cargoTypeId));
        cargoWtUnitId.add(createObjectId(item.cargoWtUnitId));
        volumeUnitId.add(createObjectId(item.volumeUnitId));
        tradeTermsId.add(createObjectId(item.tradeTermsId));
        pacakgeId.add(createObjectId(item.pacakgeId));
        destinationCountryId.add(createObjectId(item.destinationCountryId));
        originCountryId.add(createObjectId(item.originCountryId));
        item.tblEnquiryQty &&
          item.tblEnquiryQty.map((item) => {
            sizeId.add(createObjectId(item.sizeId));
            typeId.add(createObjectId(item.typeId));
            wtUnitId.add(createObjectId(item.wtUnitId));
          });
      });

      const tables = [
        {
          tableName: "tblPort",
          query: [
            {
              $match: {
                $or: [
                  { _id: { $in: Array.from(plrId) } },
                  { _id: { $in: Array.from(polId) } },
                  { _id: { $in: Array.from(podId) } },
                  { _id: { $in: Array.from(fpdId) } },
                ],
                status: Number(process.env.ACTIVE_STATUS),
              },
            },
          ],
        },
        {
          tableName: "tblBusinessSegment",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(businessSegmentId) } }],
                status: Number(process.env.ACTIVE_STATUS),
              },
            },
          ],
        },
        {
          tableName: "tblCompany",
          query: [
            {
              $match: {
                $or: [
                  { _id: { $in: Array.from(shipperId) } },
                  { _id: { $in: Array.from(consigneeId) } },
                  { _id: { $in: Array.from(shippingLineId) } },
                ],
                status: Number(process.env.ACTIVE_STATUS),
              },
            },
          ],
        },
        {
          tableName: "tblMasterData",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [
                  { _id: { $in: Array.from(containerStatusId) } },
                  { _id: { $in: Array.from(natureOfCargoId) } },
                  { _id: { $in: Array.from(cargoTypeId) } },
                  { _id: { $in: Array.from(cargoWtUnitId) } },
                  { _id: { $in: Array.from(volumeUnitId) } },
                  { _id: { $in: Array.from(sizeId) } },
                  { _id: { $in: Array.from(typeId) } },
                  { _id: { $in: Array.from(wtUnitId) } },
                  { _id: { $in: Array.from(pacakgeId) } },
                ],
              },
            },
          ],
        },
        {
          tableName: "tblCountry",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [
                  { _id: { $in: Array.from(destinationCountryId) } },
                  { _id: { $in: Array.from(originCountryId) } },
                ],
              },
            },
          ],
        },
      ];

      const dataToQuery = tables.map((iterator) =>
        model.AggregateFetchData(
          iterator.tableName,
          iterator.tableName,
          iterator.query,
          res
        )
      );

      const resultOfQueryData = await Promise.all(dataToQuery);
      const portMap = new Map();
      const customerMap = new Map();
      const businessSegmentMap = new Map();
      const MasterDataMap = new Map();
      const CountryMap = new Map();

      for (const item of resultOfQueryData[0]) {
        if (item._id !== undefined && item.name !== undefined) {
          portMap.set(item._id.toString(), item.name);
        }
      }

      for (const item of resultOfQueryData[1]) {
        if (item._id !== undefined && item.name !== undefined) {
          businessSegmentMap.set(item._id.toString(), item.name);
        }
      }

      for (const item of resultOfQueryData[2]) {
        if (item._id !== undefined && item.name !== undefined) {
          customerMap.set(item._id.toString(), item.name);
        }
      }
      for (const item of resultOfQueryData[3]) {
        if (item._id !== undefined && item.name !== undefined) {
          MasterDataMap.set(item._id.toString(), { name: item.name });
        }
      }
      for (const item of resultOfQueryData[4]) {
        if (item._id !== undefined && item.name !== undefined) {
          CountryMap.set(item._id.toString(), { name: item.name });
        }
      }

      data.forEach((item) => {
        item["plrName"] = portMap.get(item.plrId) || "";
        item["polName"] = portMap.get(item.polId) || "";
        item["podName"] = portMap.get(item.podId) || "";
        item["fpdName"] = portMap.get(item.fpdId) || "";
        item["businessSegmentName"] =
          businessSegmentMap.get(item.businessSegmentId) || "";
        item["shipperName"] = customerMap.get(item.shipperId) || "";
        item["consigneeName"] = customerMap.get(item.consigneeId) || "";
        item["shippingLineName"] = customerMap.get(item.shippingLineId) || "";
        item["containerStatusName"] =
          MasterDataMap.get(item.containerStatusId)?.name || "";
        item["natureOfCargoName"] =
          MasterDataMap.get(item.natureOfCargoId)?.name || "";
        item["cargoTypeName"] = MasterDataMap.get(item.cargoTypeId)?.name || "";
        item["cargoWtUnitName"] =
          MasterDataMap.get(item.cargoWtUnitId)?.name || "";
        item["volumeUnitName"] =
          MasterDataMap.get(item.volumeUnitId)?.name || "";
        item["tradeTermsName"] =
          MasterDataMap.get(item.tradeTermsId)?.name || "";
        item["packageName"] = MasterDataMap.get(item.pacakgeId)?.name || "";
        item["destinationCountryName"] =
          CountryMap.get(item.destinationCountryId)?.name || "";
        item["originCountryName"] =
          CountryMap.get(item.originCountryId)?.name || "";
        item.tblEnquiryQty &&
          item.tblEnquiryQty.map((item) => {
            item["sizeName"] = MasterDataMap.get(item.sizeId)?.name || "";
            item["typeName"] = MasterDataMap.get(item.typeId)?.name || "";
            item["wtUnitName"] = MasterDataMap.get(item.wtUnitId)?.name || "";
          });
      });

      if (data.length > 0) {
        res.send({
          success: true,
          message: "Data fetched successfully",
          count: data.length,
          data: data,
        });
      } else {
        res.send({
          success: false,
          message: "Failed to fetch data",
          data: data,
        });
      }
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send({
        success: false,
        message: "Something went wrong",
        data: error.message,
      });
    }
  },
  WhTransaction: async (req, res) => {
    //s Updated New
    try {
      let matchData = { status: Number(process.env.ACTIVE_STATUS) };
      let { body } = req;
      FilterCondition(matchData, req.body);
      if (body.id && body.id != "undefined" && body.id !== "") {
        matchData["id"] = Number(body.id);
      }
      if (body._id && body._id != "undefined" && body._id !== "") {
        matchData["_id"] = new mongoose.Types.ObjectId(body._id);
      }
      if (
        body.customerId &&
        body.customerId != "undefined" &&
        body.customerId !== ""
      ) {
        matchData["customerId"] = Number(body.customerId);
      }
      if (
        body.finYearId &&
        body.finYearId != "undefined" &&
        body.finYearId !== ""
      ) {
        matchData["finYearId"] = String(body.finYearId);
      }
      if (
        body.shipperId &&
        body.shipperId != "undefined" &&
        body.shipperId !== ""
      ) {
        matchData["shipperId"] = Number(body.shipperId);
      }
      if (
        body.consigneeId &&
        body.consigneeId != "undefined" &&
        body.consigneeId !== ""
      ) {
        matchData["consigneeId"] = Number(body.consigneeId);
      }
      if (
        body.shippingLineId &&
        body.shippingLineId != "undefined" &&
        body.shippingLineId !== ""
      ) {
        matchData["shippingLineId"] = Number(body.shippingLineId);
      }
      if (body.plrId && body.plrId != "undefined" && body.plrId !== "") {
        matchData["plrId"] = Number(body.plrId);
      }
      if (body.polId && body.polId != "undefined" && body.polId !== "") {
        matchData["polId"] = Number(body.polId);
      }
      if (body.podId && body.podId != "undefined" && body.podId !== "") {
        matchData["podId"] = Number(body.podId);
      }
      if (body.fpdId && body.fpdId != "undefined" && body.fpdId !== "") {
        matchData["fpdId"] = Number(body.fpdId);
      }
      if (
        body.fromDate &&
        body.fromDate != "undefined" &&
        body.fromDate !== "" &&
        body.toDate &&
        body.toDate != "undefined" &&
        body.toDate !== ""
      ) {
        matchData["jobDate"] = {
          $gte: new Date(body.fromDate),
          $lte: new Date(body.toDate),
        };
      } else if (
        body.fromDate &&
        body.fromDate != "undefined" &&
        body.fromDate !== ""
      ) {
        matchData["jobDate"] = { $gte: new Date(body.fromDate) };
      } else if (
        body.toDate &&
        body.toDate != "undefined" &&
        body.toDate !== ""
      ) {
        matchData["jobDate"] = { $lte: new Date(body.toDate) };
      }
      let page = parseInt(req.query.page, 10) || 1;
      let pageSize = parseInt(req.query.pageSize, 100) || 1000;

      let skipCount = (page - 1) * pageSize;
      let query = [
        {
          $match: matchData,
        },
        {
          $sort: {
            id: 1,
          },
        },
        {
          $skip: skipCount,
        },
        {
          $limit: pageSize,
        },
      ];
      let project = {};
      if (body.projection && Object.keys(body.projection).length > 0) {
        project = body.projection;
      }
      if (Object.keys(project).length > 0) {
        query.push({ $project: project });
      }

      let data = await model.AggregateFetchData(
        "tblWhTransaction",
        "tblWhTransaction",
        query,
        res
      );

      let customerId = new Set();
      let customerBranchId = new Set();
      let companyId = new Set();
      let brachId = new Set();
      let defaultFinYearId = new Set();
      let transporterId = new Set();
      let warehouseId = new Set();
      let warehousePerson = new Set();
      let parentReferenceNoId = new Set();
      let sectionId = new Set();
      let loginCompany = new Set();

      let cargoTypeId = new Set();
      let currencyId = new Set();
      let wtUnitId = new Set();
      let volumeUnitId = new Set();
      let dimensionUnitId = new Set();
      let typeOfPackagesId = new Set();
      let itemTypeId = new Set();
      let itemId = new Set();
      let subSectionId = new Set();
      let statusId = new Set();

      data.forEach((item) => {
        customerId.add(createObjectId(item.customerId));
        customerBranchId.add(createObjectId(item.customerBranchId));
        companyId.add(createObjectId(item.companyId));
        brachId.add(createObjectId(item.brachId));
        defaultFinYearId.add(createObjectId(item.defaultFinYearId));
        transporterId.add(createObjectId(item.transporterId));
        warehouseId.add(createObjectId(item.warehouseId));
        warehousePerson.add(createObjectId(item.warehousePerson));
        parentReferenceNoId.add(createObjectId(item.parentReferenceNoId));
        loginCompany.add(createObjectId(item.loginCompany));

        item.tblWhTransactionDetails &&
          item.tblWhTransactionDetails.map((x) => {
            cargoTypeId.add(createObjectId(x.cargoTypeId));
            currencyId.add(createObjectId(x.currencyId));
            wtUnitId.add(createObjectId(x.wtUnitId));
            volumeUnitId.add(createObjectId(x.volumeUnitId));
            dimensionUnitId.add(createObjectId(x.dimensionUnitId));
            typeOfPackagesId.add(createObjectId(x.typeOfPackagesId));
            itemTypeId.add(createObjectId(x.itemTypeId));
            itemId.add(createObjectId(x.itemId));
            sectionId.add(createObjectId(x.sectionId));
            subSectionId.add(createObjectId(x.subSectionId));
            statusId.add(createObjectId(x.statusId));
          });
      });

      const tables = [
        {
          tableName: "tblCompany",
          query: [
            {
              $match: {
                $or: [
                  { _id: { $in: Array.from(customerId) } },
                  { _id: { $in: Array.from(companyId) } },
                  { _id: { $in: Array.from(transporterId) } },
                  { _id: { $in: Array.from(loginCompany) } },
                ],
              },
            },
          ],
        },
        {
          tableName: "tblCompany",
          query: [
            {
              $unwind: {
                path: "$tblCompanyBranch",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                tblCompanyBranch: { $exists: true, $ne: null },
                $or: [
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(customerBranchId),
                    },
                  },
                  { "tblCompanyBranch._id": { $in: Array.from(brachId) } },
                ],
              },
            },
          ],
        },
        {
          tableName: "tblFinancialYear",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(defaultFinYearId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblMasterData",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [
                  { _id: { $in: Array.from(cargoTypeId) } },
                  { _id: { $in: Array.from(currencyId) } },
                  { _id: { $in: Array.from(wtUnitId) } },
                  { _id: { $in: Array.from(volumeUnitId) } },
                  { _id: { $in: Array.from(dimensionUnitId) } },
                  { _id: { $in: Array.from(typeOfPackagesId) } },
                  { _id: { $in: Array.from(itemTypeId) } },
                  { _id: { $in: Array.from(statusId) } },
                ],
              },
            },
          ],
        },
        {
          tableName: "tblWarehouse",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(warehouseId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblItem",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(itemId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblWhTransaction",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(parentReferenceNoId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblCompany",
          query: [
            {
              $unwind: {
                path: "$tblCompanyBranch",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $unwind: {
                path: "$tblCompanyBranch.tblCompanyBranchPerson",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                "tblCompanyBranch.tblCompanyBranchPerson": {
                  $exists: true,
                  $ne: null,
                },
                $or: [
                  {
                    "tblCompanyBranch.tblCompanyBranchPerson._id": {
                      $in: Array.from(warehousePerson),
                    },
                  },
                  // Add more conditions here if needed, each enclosed in {}
                ],
              },
            },
          ],
        },
        {
          tableName: "tblWarehouse",
          query: [
            {
              $unwind: {
                path: "$tblWarehouseSection",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                tblWarehouseSection: { $exists: true, $ne: null },
                $or: [
                  { "tblWarehouseSection._id": { $in: Array.from(sectionId) } },
                ],
              },
            },
          ],
        },
        {
          tableName: "tblWarehouse",
          query: [
            {
              $unwind: {
                path: "$tblWarehouseSection",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $unwind: {
                path: "$tblWarehouseSection.tblWarehouseSubSection",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                "tblWarehouseSection.tblWarehouseSubSection": {
                  $exists: true,
                  $ne: null,
                },
                $or: [
                  {
                    "tblWarehouseSection.tblWarehouseSubSection._id": {
                      $in: Array.from(subSectionId),
                    },
                  },
                  // Add more conditions here if needed, each enclosed in {}
                ],
              },
            },
          ],
        },
      ];

      const dataToQuery = tables.map((iterator) =>
        model.AggregateFetchData(
          iterator.tableName,
          iterator.tableName,
          iterator.query,
          res
        )
      );

      const resultOfQueryData = await Promise.all(dataToQuery);

      const customerMap = new Map();
      const CompanyBranchMap = new Map();
      const finYearMap = new Map();
      const MasterDataMap = new Map();
      const WarehouseMap = new Map();
      const ItemMap = new Map();
      const WhTransactionMap = new Map();
      const CompanyBranchPerson = new Map();
      const WarehouseSectionMap = new Map();
      const WarehouseSubSectionMap = new Map();

      for (const item of resultOfQueryData[0]) {
        if (item.oldId !== undefined) {
          customerMap.set(item._id.toString(), {
            name: item.name,
            branch: item.tblCompanyBranch,
            address: item.address,
            telephoneNo: item.telephoneNo,
            emailId: item.emailId,
          });
        }
      }
      for (const item of resultOfQueryData[1]) {
        if (
          item.tblCompanyBranch &&
          item.tblCompanyBranch.oldId !== undefined
        ) {
          CompanyBranchMap.set(item.tblCompanyBranch?._id.toString(), {
            name: item.tblCompanyBranch.name,
          });
        }
      }
      for (const item of resultOfQueryData[2]) {
        if (item._id !== undefined && item.financialYear !== undefined) {
          finYearMap.set(item._id.toString(), {
            financialYear: item.financialYear,
          });
        }
      }
      for (const item of resultOfQueryData[3]) {
        if (item._id !== undefined && item.name !== undefined) {
          MasterDataMap.set(item._id.toString(), {
            name: item.name,
            code: item.code,
          });
        }
      }
      for (const item of resultOfQueryData[4]) {
        if (item._id !== undefined && item.name !== undefined) {
          WarehouseMap.set(item._id.toString(), {
            name: item.name,
            address: item.address,
          });
        }
      }
      for (const item of resultOfQueryData[5]) {
        if (item._id !== undefined && item.ItemName !== undefined) {
          ItemMap.set(item._id.toString(), { ItemName: item.ItemName });
        }
      }
      for (const item of resultOfQueryData[6]) {
        if (item._id !== undefined && item.referenceNo !== undefined) {
          WhTransactionMap.set(item._id.toString(), {
            referenceNo: item.referenceNo,
          });
        }
      }
      for (const item of resultOfQueryData[7]) {
        if (
          item.tblCompanyBranch &&
          item.tblCompanyBranch.tblCompanyBranchPerson &&
          item.tblCompanyBranch.tblCompanyBranchPerson.name !== undefined
        ) {
          CompanyBranchPerson.set(
            item.tblCompanyBranch.tblCompanyBranchPerson._id.toString(),
            {
              name: item.tblCompanyBranch.tblCompanyBranchPerson.name,
              lastname: item.tblCompanyBranch.tblCompanyBranchPerson.lastname,
            }
          );
        }
      }
      for (const item of resultOfQueryData[8]) {
        // Check if tblCompanyBranch exists and has the oldId property
        if (
          item.tblWarehouseSection &&
          item.tblWarehouseSection.name !== undefined
        ) {
          WarehouseSectionMap.set(item.tblWarehouseSection?._id.toString(), {
            name: item.tblWarehouseSection.name,
          });
        }
      }
      for (const item of resultOfQueryData[9]) {
        // Check if tblCompanyBranch exists and has the oldId property
        if (
          item.tblWarehouseSection &&
          item.tblWarehouseSection.tblWarehouseSubSection &&
          item.tblWarehouseSection.tblWarehouseSubSection._id !== undefined
        ) {
          WarehouseSubSectionMap.set(
            item.tblWarehouseSection.tblWarehouseSubSection._id.toString(),
            { name: item.tblWarehouseSection.tblWarehouseSubSection.name }
          );
        }
      }

      data.forEach((item) => {
        const customerInfo = customerMap.get(item.customerId);
        item["customerName"] = customerInfo ? customerInfo.name : "";
        item["customerTelephoneNo"] = customerInfo
          ? customerInfo.telephoneNo
          : "";

        item["customerEmail"] = customerInfo ? customerInfo.emailId : "";
        item["customerAddress"] = customerInfo ? customerInfo.address : "";
        item["companyName"] = customerMap.get(item.companyId)?.name || "";
        item["ownCompanyName"] = customerMap.get(item.loginCompany)?.name || "";
        item["transporterName"] =
          customerMap.get(item.transporterId)?.name || "";
        item["customerBranchName"] =
          CompanyBranchMap.get(item.customerBranchId)?.name || "";
        item["companyBranchName"] =
          CompanyBranchMap.get(item.brachId)?.name || "";
        item["financialYear"] =
          finYearMap.get(item.defaultFinYearId)?.financialYear || "";
        item["WarehouseName"] = WarehouseMap.get(item.warehouseId)?.name || "";
        item["WarehouseAddress"] =
          WarehouseMap.get(item.warehouseId)?.address || "";
        item["parentReferenceNo"] =
          WhTransactionMap.get(item.parentReferenceNoId)?.referenceNo || "";
        item["warehousePersonName"] =
          CompanyBranchPerson.get(item.warehousePerson)?.name || "";
        item["warehousePersonlastnameName"] =
          CompanyBranchPerson.get(item.warehousePerson)?.lastname || "";

        item.tblWhTransactionDetails &&
          item.tblWhTransactionDetails.map((item) => {
            item["cargoTypeName"] =
              MasterDataMap.get(item.cargoTypeId)?.name || "";
            item["currency"] = MasterDataMap.get(item.currencyId)?.name || "";
            item["currencyCode"] =
              MasterDataMap.get(item.currencyId)?.code || "";
            item["wtUnitName"] = MasterDataMap.get(item.wtUnitId)?.name || "";
            item["wtUnitCode"] = MasterDataMap.get(item.wtUnitId)?.code || "";
            item["volumeUnitName"] =
              MasterDataMap.get(item.volumeUnitId)?.name || "";
            item["volumeUnitNameCode"] =
              MasterDataMap.get(item.volumeUnitId)?.code || "";
            item["dimensionUnitName"] =
              MasterDataMap.get(item.dimensionUnitId)?.name || "";
            item["dimensionUnitNameCode"] =
              MasterDataMap.get(item.dimensionUnitId)?.code || "";
            item["typeOfPackagesName"] =
              MasterDataMap.get(item.typeOfPackagesId)?.name || "";
            item["statusName"] = MasterDataMap.get(item.statusId)?.name || "";
            item["typeOfPackagesNameCode"] =
              MasterDataMap.get(item.typeOfPackagesId)?.code || "";
            item["itemTypeName"] =
              MasterDataMap.get(item.itemTypeId)?.name || "";
            item["itemTypeNameCode"] =
              MasterDataMap.get(item.itemTypeId)?.code || "";
            item["ItemName"] = ItemMap.get(item.itemId)?.ItemName || "";
            item["sectionName"] =
              WarehouseSectionMap.get(item.sectionId)?.name || "";
            item["sectionName"] =
              WarehouseSectionMap.get(item.sectionId)?.name || "";
            item["subSectionName"] =
              WarehouseSubSectionMap.get(item.subSectionId)?.name || "";
            // __ combined keys Values
            item["qtyWtUnitCode"] = `${item.qty} ${item["wtUnitCode"]}`;
            item[
              "noOfPackagesTypeOfPackagesName"
            ] = `${item["noOfPackages"]} ${item["typeOfPackagesName"]}`;
            item[
              "grossWtWtUnitCode"
            ] = `${item["grossWt"]} ${item["wtUnitCode"]}`;
          });
      });

      if (data.length > 0) {
        res.send({
          success: true,
          message: "Data fetched successfully",
          data: data,
        });
      } else {
        res.send({
          success: false,
          message: "Data not fetched successfully",
          data: data,
        });
      }
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send({
        success: false,
        message: "Something went wrong",
        data: error.message,
      });
    }
  },
  WarehouseStock: async (req, res) => {
    try {
      let matchData = { status: Number(process.env.ACTIVE_STATUS) };
      let { body } = req;
      FilterCondition(matchData, req.body);
      if (body.id && body.id !== "undefined" && body.id !== "") {
        matchData["id"] = Number(body.id);
      }
      if (
        body._id &&
        body._id !== "undefined" &&
        mongoose.Types.ObjectId.isValid(body._id)
      ) {
        matchData["_id"] = new mongoose.Types.ObjectId(body._id);
      }
      if (
        body.customerId &&
        body.customerId !== "undefined" &&
        mongoose.Types.ObjectId.isValid(body.customerId)
      ) {
        matchData["customerId"] = new mongoose.Types.ObjectId(body.customerId);
      }

      let page = parseInt(req.query.page, 10) || 1;
      let pageSize = parseInt(req.query.pageSize, 100) || 1000;

      let skipCount = (page - 1) * pageSize;
      let query = [
        { $match: matchData },
        { $sort: { id: 1 } },
        { $skip: skipCount },
        { $limit: pageSize },
      ];

      let project = {};
      if (body.projection && Object.keys(body.projection).length > 0) {
        project = body.projection;
      }
      if (Object.keys(project).length > 0) {
        query.push({ $project: project });
      }

      let data = await model.AggregateFetchData(
        "tblWhTransaction",
        "tblWhTransaction",
        query,
        res
      );

      const customerMap = new Map();
      const warehouseMap = new Map();
      const masterDataMap = new Map();
      const itemMap = new Map();

      // Check customer IDs
      const customerIds = [...new Set(data.map((item) => item.customerId))];
      const validCustomerIds = customerIds.filter((id) =>
        mongoose.Types.ObjectId.isValid(id)
      );
      if (validCustomerIds.length) {
        const customers = await model.AggregateFetchData(
          "tblCompany",
          "tblCompany",
          [
            {
              $match: {
                _id: {
                  $in: validCustomerIds.map(
                    (id) => new mongoose.Types.ObjectId(id)
                  ),
                },
              },
            },
          ],
          res
        );
        customers.forEach((customer) => {
          customerMap.set(customer._id.toString(), { name: customer.name });
        });
      }

      // Check warehouse IDs
      const warehouseIds = [...new Set(data.map((item) => item.warehouseId))];
      const validWarehouseIds = warehouseIds.filter((id) =>
        mongoose.Types.ObjectId.isValid(id)
      );
      if (validWarehouseIds.length) {
        const warehouses = await model.AggregateFetchData(
          "tblWarehouse",
          "tblWarehouse",
          [
            {
              $match: {
                _id: {
                  $in: validWarehouseIds.map(
                    (id) => new mongoose.Types.ObjectId(id)
                  ),
                },
              },
            },
          ],
          res
        );
        warehouses.forEach((warehouse) => {
          warehouseMap.set(warehouse._id.toString(), { name: warehouse.name });
        });
      }

      // Populate itemMap with valid data
      const tblItemData = await model.AggregateFetchData(
        "tblItem",
        "tblItem",
        [{ $match: { status: Number(process.env.ACTIVE_STATUS) } }],
        res
      );
      tblItemData.forEach((item) => {
        itemMap.set(item._id.toString(), {
          name: item.ItemName,
          code: item.itemCode,
          model: item.model,
          brand: item.brand,
          manufacturer: item.manufacturer,
          typeofPackage: item.typeofPackage,
          category1: item.category1,
          category2: item.category2,
          category3: item.category3,
        });
      });

      // Flattening logic
      const flattenedData = [];
      data.forEach((item) => {
        const customerInfo = customerMap.get(item.customerId);
        const cargoOwnerInfo = customerMap.get(item.cargoOwnerId);
        const warehouseInfo = warehouseMap.get(item.warehouseId);

        item.tblWhTransactionDetails.forEach((detail) => {
          const itemInfo = itemMap.get(detail.itemId);

          flattenedData.push({
            _id: item._id,
            id: item.id,
            status: item.status,
            createdDate: item.createdDate,
            createdBy: item.createdBy,
            updatedDate: item.updatedDate,
            updatedBy: item.updatedBy,
            companyId: item.companyId,
            customerRefNo: item.customerRefNo,
            brachId: item.brachId,
            defaultFinYearId: item.defaultFinYearId,
            clientCode: item.clientCode,
            srNo: item.srNo,
            referenceNo: item.referenceNo,
            referenceDate: item.referenceDate,
            parentReferenceNoId: item.parentReferenceNoId,
            warehouseId: item.warehouseId,
            customerId: item.customerId,
            customerBranchId: item.customerBranchId,
            customerAddress: item.customerAddress,
            cargoOwnerId: item.cargoOwnerId,
            cargoValue: item.cargoValue,
            placeOfOrigin: item.placeOfOrigin,
            customCleared: item.customCleared,
            remarks: item.remarks,
            handlingRemarks: item.handlingRemarks,
            customerSop: item.customerSop,
            transactionType: item.transactionType,
            ucnNo: item.ucnNo,
            warehousePerson: item.warehousePerson,
            deliverToId: item.deliverToId,
            deliveryAddress: item.deliveryAddress,
            customerName: customerInfo ? customerInfo.name : "",
            warehouseName: warehouseInfo ? warehouseInfo.name : "",
            cargoOwnerName: cargoOwnerInfo ? cargoOwnerInfo.name : "",

            detailId: detail._id,
            itemId: detail.itemId,
            itemTypeNameCode: masterDataMap.get(detail.itemTypeId)?.name || "",
            itemQty: detail.qty,
            itemName: itemInfo?.name || "",
            itemCode: itemInfo?.code || "",
            itemModel: itemInfo?.model || "",
            itemBrand: itemInfo?.brand || "",
            itemManufacturer: itemInfo?.manufacturer || "",
            itemTypeOfPackage: itemInfo?.typeofPackage || "",
            itemCategory1: itemInfo?.category1 || "",
            itemCategory2: itemInfo?.category2 || "",
            itemCategory3: itemInfo?.category3 || "",
            cargoTypeId: detail.cargoTypeId,
            reefer: detail.reefer,
            rate: detail.rate,
            currencyId: detail.currencyId,
            amount: detail.amount,
            noOfPackages: detail.noOfPackages,
            typeOfPackagesId: detail.typeOfPackagesId,
            grossWt: detail.grossWt,
            netWt: detail.netWt,
            wtUnitId: detail.wtUnitId,
            volume: detail.volume,
            volumeUnitId: detail.volumeUnitId,
            length: detail.length,
            width: detail.width,
            height: detail.height,
            dimensionUnitId: detail.dimensionUnitId,
            QRCode: detail.QRCode,
            customerbatchNo: detail.customerbatchNo,
            statusId: detail.statusId,
            sectionId: detail.sectionId,
            subSectionId: detail.subSectionId,
            isChecked: detail.isChecked,
          });
        });
      });

      res.send({
        success: true,
        message: "Data fetched successfully",
        data: flattenedData,
      });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send({
        success: false,
        message: "Something went wrong",
        data: error.message,
      });
    }
  },
  JobRegistrationDynamicReport: async (req, res) => {
    try {
      let matchData = { status: Number(process.env.ACTIVE_STATUS) };
      let { body } = req;
      FilterCondition(matchData, body);
      // if (body.id && body.id != "undefined" && body.id !== "") {
      //     matchData['id'] = Number(body.id)
      // }
      // if (body._id && body._id != "undefined" && body._id !== "") {
      //     matchData['_id'] = new mongoose.Types.ObjectId(body._id);
      // }
      // if (body.customerId && body.customerId != "undefined" && body.customerId !== "") {
      //     matchData['customerId'] = Number(body.customerId)
      // }
      // if (body.finYearId && body.finYearId != "undefined" && body.finYearId !== "") {
      //     matchData['finYearId'] = String(body.finYearId)
      // }
      // if (body.shipperId && body.shipperId != "undefined" && body.shipperId !== "") {
      //     matchData['shipperId'] = Number(body.shipperId)
      // }
      // if (body.consigneeId && body.consigneeId != "undefined" && body.consigneeId !== "") {
      //     matchData['consigneeId'] = Number(body.consigneeId)
      // }
      // if (body.shippingLineId && body.shippingLineId != "undefined" && body.shippingLineId !== "") {
      //     matchData['shippingLineId'] = Number(body.shippingLineId)
      // }
      // if (body.plrId && body.plrId != "undefined" && body.plrId !== "") {
      //     matchData['plrId'] = Number(body.plrId)
      // }
      // if (body.polId && body.polId != "undefined" && body.polId !== "") {
      //     matchData['polId'] = Number(body.polId)
      // }
      // if (body.podId && body.podId != "undefined" && body.podId !== "") {
      //     matchData['podId'] = Number(body.podId)
      // }
      // if (body.fpdId && body.fpdId != "undefined" && body.fpdId !== "") {
      //     matchData['fpdId'] = Number(body.fpdId)
      // }
      if (
        body.fromDate &&
        body.fromDate != "undefined" &&
        body.fromDate !== "" &&
        body.toDate &&
        body.toDate != "undefined" &&
        body.toDate !== ""
      ) {
        matchData["jobDate"] = {
          $gte: new Date(body.fromDate),
          $lte: new Date(body.toDate),
        };
      } else if (
        body.fromDate &&
        body.fromDate != "undefined" &&
        body.fromDate !== ""
      ) {
        matchData["jobDate"] = { $gte: new Date(body.fromDate) };
      } else if (
        body.toDate &&
        body.toDate != "undefined" &&
        body.toDate !== ""
      ) {
        matchData["jobDate"] = { $lte: new Date(body.toDate) };
      }
      let page = parseInt(req.query.page, 10) || 1; // Default to page 1 if not specified
      let pageSize = parseInt(req.query.pageSize, 100) || 1000; // Default to 10 items per page if not specified

      // Calculate the number of documents to skip
      let skipCount = (page - 1) * pageSize;
      let query = [
        {
          $match: matchData,
        },
        {
          $sort: {
            id: 1,
          },
        },
        {
          $skip: skipCount,
        },
        {
          $limit: pageSize,
        },
      ];
      let project = {};
      if (body.projection && Object.keys(body.projection).length > 0) {
        project = body.projection;
      }
      if (Object.keys(project).length > 0) {
        query.push({ $project: project });
      }

      let data = await model.AggregateFetchData("tblJob", "tblJob", query, res);
      let plrId = new Set();
      let polId = new Set();
      let podId = new Set();
      let fpdId = new Set();
      let customerId = new Set();
      let shipperId = new Set();
      let consigneeId = new Set();
      let companyBranchId = new Set();
      let shippingLineId = new Set();
      let consigneeBranchId = new Set();
      let shipperBranchId = new Set();
      let salesExecutiveId = new Set();
      let companyId = new Set();
      let podAgentId = new Set();
      let polAgentId = new Set();
      let customerBranchId = new Set();
      let agentId = new Set();
      let agentBranchId = new Set();
      let notifyPartyId = new Set();
      let notifyPartyBranchId = new Set();
      let customBrokerId = new Set();
      let finYearId = new Set();
      let destinationCountryId = new Set();
      let originCountryId = new Set();
      let tradeTermsId = new Set();
      let natureOfCargoId = new Set();
      let stuffingTypeId = new Set();
      let containerStatusId = new Set();
      let preCarriageId = new Set();
      let destuffingTypeId = new Set();
      let cargoTypeId = new Set();
      let cargoWtUnitId = new Set();
      let packageId = new Set();
      let commodityTypeId = new Set();
      let volumeUnitId = new Set();
      let chargeableWtUnitId = new Set();
      let businessSegmentId = new Set();
      let polVoyageId = new Set();
      let polVesselId = new Set();
      let polTerminalId = new Set();
      let transporterId = new Set();
      let podCustomBrokerId = new Set();
      let shippingAgentId = new Set();
      let slotOwnerId = new Set();
      let mloId = new Set();
      let createdByCompanyId = new Set();
      let fpdAgentId = new Set();
      let surveyorId = new Set();
      let plrAgentId = new Set();
      let postCarriage = new Set();
      let routeId = new Set();
      let netWtUnitId = new Set();
      let createdByCompanyBranchId = new Set();
      let polAgentBranchId = new Set();
      let podAgentBranchId = new Set();
      let surveyorBranchId = new Set();
      let fpdAgentBranchId = new Set();
      let plrAgentBranchId = new Set();
      let pricingPersonId = new Set();
      let customerServicePersonId = new Set();
      let demmuragecurrency = new Set();
      let backOfficePersonId = new Set();
      let sellPersonId = new Set();
      let customerClearancePersonId = new Set();
      let depotId = new Set();
      let podTerminalId = new Set();
      let podVoyageId = new Set();
      let podVesselId = new Set();
      let rateRequestId = new Set();
      let masterJobId = new Set();
      // tblJobContainer
      let sizeId = new Set();
      let typeId = new Set();
      let dimensionUnitId = new Set();
      let wtUnitId = new Set();
      let containerId = new Set();

      // tblJobQuantity
      let grossWtUnitId = new Set();
      let tareWtUnitId = new Set();
      let refTempUnitId = new Set();
      let TransporterId = new Set();
      // tblJobCharge
      let unitId = new Set();
      let buyCurrencyId = new Set();
      let sellCurrencyId = new Set();
      let buyPrepaidCollectId = new Set();
      let sellPrepaidCollectid = new Set();
      let dueToId = new Set();
      // tblJobActivity
      let activityPersonId = new Set();
      let activityId = new Set();
      let chargeId = new Set();
      let buyPartyId = new Set();
      let sellPartyId = new Set();

      data.forEach((item) => {
        plrId.add(createObjectId(item.plrId));
        polId.add(createObjectId(item.polId));
        podId.add(createObjectId(item.podId));
        fpdId.add(createObjectId(item.fpdId));
        customerId.add(createObjectId(item.customerId));
        shipperId.add(createObjectId(item.shipperId));
        consigneeId.add(createObjectId(item.consigneeId));
        companyBranchId.add(createObjectId(item.companybranchId));
        shippingLineId.add(createObjectId(item.shippingLineId));
        consigneeBranchId.add(createObjectId(item.consigneeBranchId));
        shipperBranchId.add(createObjectId(item.shipperBranchId));
        salesExecutiveId.add(item.salesExecutiveId);
        companyId.add(createObjectId(item.companyId));
        podAgentId.add(createObjectId(item.podAgentId));
        polAgentId.add(createObjectId(item.polAgentId));
        customerBranchId.add(createObjectId(item.customerBranchId));
        agentId.add(createObjectId(item.agentId));
        agentBranchId.add(createObjectId(item.agentBranchId));
        notifyPartyId.add(createObjectId(item.notifyPartyId));
        notifyPartyBranchId.add(createObjectId(item.notifyPartyBranchId));
        customBrokerId.add(createObjectId(item.customBrokerId));
        finYearId.add(createObjectId(item.finYearId));
        destinationCountryId.add(createObjectId(item.destinationCountryId));
        originCountryId.add(createObjectId(item.originCountryId));
        tradeTermsId.add(createObjectId(item.tradeTermsId));
        natureOfCargoId.add(createObjectId(item.natureOfCargoId));
        stuffingTypeId.add(createObjectId(item.stuffingTypeId));
        containerStatusId.add(createObjectId(item.containerStatusId));
        preCarriageId.add(createObjectId(item.preCarriageId));
        // preCarriageId.add(item.preCarriageId);
        destuffingTypeId.add(createObjectId(item.destuffingTypeId));
        cargoTypeId.add(createObjectId(item.cargoTypeId));
        cargoWtUnitId.add(createObjectId(item.cargoWtUnitId));
        packageId.add(createObjectId(item.packageId));
        commodityTypeId.add(createObjectId(item.commodityTypeId));
        volumeUnitId.add(createObjectId(item.volumeUnitId));
        chargeableWtUnitId.add(createObjectId(item.chargeableWtUnitId));
        businessSegmentId.add(createObjectId(item.businessSegmentId));
        polVoyageId.add(createObjectId(item.polVoyageId));
        polVesselId.add(createObjectId(item.polVesselId));
        polTerminalId.add(createObjectId(item.polTerminalId));
        transporterId.add(createObjectId(item.transporterId));
        podCustomBrokerId.add(createObjectId(item.podCustomBrokerId));
        shippingAgentId.add(createObjectId(item.shippingAgentId));
        slotOwnerId.add(createObjectId(item.slotOwnerId));
        mloId.add(createObjectId(item.mloId));
        createdByCompanyId.add(createObjectId(item.createdByCompanyId));
        fpdAgentId.add(createObjectId(item.fpdAgentId));
        plrAgentId.add(createObjectId(item.plrAgentId));
        surveyorId.add(createObjectId(item.surveyorId));
        postCarriage.add(createObjectId(item.postCarriage));
        routeId.add(createObjectId(item.routeId));
        netWtUnitId.add(createObjectId(item.netWtUnitId));
        createdByCompanyBranchId.add(
          createObjectId(item.createdByCompanyBranchId)
        );
        polAgentBranchId.add(createObjectId(item.polAgentBranchId));
        podAgentBranchId.add(createObjectId(item.podAgentBranchId));
        surveyorBranchId.add(createObjectId(item.surveyorBranchId));
        fpdAgentBranchId.add(createObjectId(item.fpdAgentBranchId));
        plrAgentBranchId.add(createObjectId(item.plrAgentBranchId));
        pricingPersonId.add(createObjectId(item.pricingPersonId));
        customerServicePersonId.add(
          createObjectId(item.customerServicePersonId)
        );
        demmuragecurrency.add(createObjectId(item.demmuragecurrency));
        backOfficePersonId.add(createObjectId(item.backOfficePersonId));
        sellPersonId.add(createObjectId(item.sellPersonId));
        customerClearancePersonId.add(
          createObjectId(item.customerClearancePersonId)
        );
        depotId.add(createObjectId(item.depotId));
        podTerminalId.add(createObjectId(item.podTerminalId));
        podVoyageId.add(createObjectId(item.podVoyageId));
        podVesselId.add(createObjectId(item.podVesselId));
        rateRequestId.add(createObjectId(item.rateRequestId));
        masterJobId.add(createObjectId(item.masterJobId));
        // tblJobQty
        item.tblJobQty &&
          item.tblJobQty.map((x) => {
            console.log("x", x);
            sizeId.add(createObjectId(x.sizeId));
            typeId.add(createObjectId(x.typeId));
            dimensionUnitId.add(createObjectId(x.dimensionUnitId));
            wtUnitId.add(createObjectId(x.wtUnitId));
            volumeUnitId.add(createObjectId(x.volumeUnitId));
            depotId.add(createObjectId(x.depotId));
            containerId.add(createObjectId(x.containerId));
          });
        //  tblJobContainer
        item.tblJobContainer &&
          item.tblJobContainer.map((x) => {
            sizeId.add(createObjectId(x.sizeId));
            typeId.add(createObjectId(x.typeId));
            containerStatusId.add(createObjectId(x.containerStatusId));
            grossWtUnitId.add(createObjectId(x.grossWtUnitId));
            tareWtUnitId.add(createObjectId(x.tareWtUnitId));
            refTempUnitId.add(createObjectId(x.refTempUnitId));
            packageId.add(createObjectId(x.packageId));
            dimensionUnitId.add(createObjectId(x.dimensionUnitId));
            TransporterId.add(createObjectId(x.TransporterId));
            volumeUnitId.add(createObjectId(x.volumeUnitId));
            cargoTypeId.add(createObjectId(x.cargoTypeId));
            slotOwnerId.add(createObjectId(x.slotOwnerId));
          });
        // tblJobCharge
        item.tblJobCharge &&
          item.tblJobCharge.map((x) => {
            sizeId.add(createObjectId(x.sizeId));
            typeId.add(createObjectId(x.typeId));
            unitId.add(createObjectId(x.unitId));
            buyCurrencyId.add(createObjectId(x.buyCurrencyId));
            sellCurrencyId.add(createObjectId(x.sellCurrencyId));
            buyPrepaidCollectId.add(createObjectId(x.buyPrepaidCollectId));
            sellPrepaidCollectid.add(createObjectId(x.sellPrepaidCollectid));
            dueToId.add(createObjectId(x.dueToId));
            chargeId.add(createObjectId(x.chargeId));
            buyPartyId.add(createObjectId(x.buyPartyId));
            sellPartyId.add(createObjectId(x.sellPartyId));
          });
        // tblJobActivity
        item.tblJobActivity &&
          item.tblJobActivity.map((x) => {
            activityPersonId.add(createObjectId(x.activityPersonId));
            activityId.add(createObjectId(x.activityId));
          });
      });
      // return console.log(companyBranchId);
      const tables = [
        {
          tableName: "tblPort",
          query: [
            {
              $match: {
                $or: [
                  { _id: { $in: Array.from(plrId) } },
                  { _id: { $in: Array.from(polId) } },
                  { _id: { $in: Array.from(podId) } },
                  { _id: { $in: Array.from(fpdId) } },
                  { _id: { $in: Array.from(depotId) } },
                  { _id: { $in: Array.from(podTerminalId) } },
                  { _id: { $in: Array.from(podVoyageId) } },
                ],
                status: Number(process.env.ACTIVE_STATUS),
              },
            },
          ],
        },
        {
          tableName: "tblCompany",
          query: [
            {
              $match: {
                $or: [
                  { _id: { $in: Array.from(customerId) } },
                  { _id: { $in: Array.from(shipperId) } },
                  { _id: { $in: Array.from(consigneeId) } },
                  { _id: { $in: Array.from(shippingLineId) } },
                  { _id: { $in: Array.from(companyId) } },
                  { _id: { $in: Array.from(podAgentId) } },
                  { _id: { $in: Array.from(polAgentId) } },
                  { _id: { $in: Array.from(agentId) } },
                  { _id: { $in: Array.from(notifyPartyId) } },
                  { _id: { $in: Array.from(customBrokerId) } },
                  { _id: { $in: Array.from(transporterId) } },
                  { _id: { $in: Array.from(podCustomBrokerId) } },
                  { _id: { $in: Array.from(shippingAgentId) } },
                  { _id: { $in: Array.from(slotOwnerId) } },
                  { _id: { $in: Array.from(mloId) } },
                  { _id: { $in: Array.from(createdByCompanyId) } },
                  { _id: { $in: Array.from(fpdAgentId) } },
                  { _id: { $in: Array.from(plrAgentId) } },
                  { _id: { $in: Array.from(surveyorId) } },
                ],
              },
            },
          ],
        },
        {
          tableName: "tblCompany",
          query: [
            {
              $unwind: {
                path: "$tblCompanyBranch",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                tblCompanyBranch: { $exists: true, $ne: null },
                $or: [
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(companyBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(consigneeBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(shipperBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(customerBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": { $in: Array.from(agentBranchId) },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(notifyPartyBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(createdByCompanyBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(polAgentBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(podAgentBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(surveyorBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(plrAgentBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(fpdAgentBranchId),
                    },
                  },
                  // Add more conditions here if needed, each enclosed in {}
                ],
              },
            },
          ],
        },
        {
          tableName: "tblCompany",
          query: [
            {
              $unwind: {
                path: "$tblCompanyBranch",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $unwind: {
                path: "$tblCompanyBranch.tblCompanyBranchPerson",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                "tblCompanyBranch.tblCompanyBranchPerson": {
                  $exists: true,
                  $ne: null,
                },
                $or: [
                  {
                    "tblCompanyBranch.tblCompanyBranchPerson._id": {
                      $in: Array.from(salesExecutiveId),
                    },
                  },
                  {
                    "tblCompanyBranch.tblCompanyBranchPerson._id": {
                      $in: Array.from(pricingPersonId),
                    },
                  },
                  {
                    "tblCompanyBranch.tblCompanyBranchPerson._id": {
                      $in: Array.from(backOfficePersonId),
                    },
                  },
                  {
                    "tblCompanyBranch.tblCompanyBranchPerson._id": {
                      $in: Array.from(sellPersonId),
                    },
                  },
                  {
                    "tblCompanyBranch.tblCompanyBranchPerson._id": {
                      $in: Array.from(customerServicePersonId),
                    },
                  },
                  {
                    "tblCompanyBranch.tblCompanyBranchPerson._id": {
                      $in: Array.from(customerClearancePersonId),
                    },
                  },
                  {
                    "tblCompanyBranch.tblCompanyBranchPerson._id": {
                      $in: Array.from(activityPersonId),
                    },
                  },
                  // Add more conditions here if needed, each enclosed in {}
                ],
              },
            },
          ],
        },
        {
          tableName: "tblFinancialYear",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(finYearId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblCountry",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [
                  { _id: { $in: Array.from(destinationCountryId) } },
                  { _id: { $in: Array.from(originCountryId) } },
                ],
              },
            },
          ],
        },
        {
          tableName: "tblMasterData",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [
                  { _id: { $in: Array.from(tradeTermsId) } },
                  { _id: { $in: Array.from(natureOfCargoId) } },
                  { _id: { $in: Array.from(stuffingTypeId) } },
                  { _id: { $in: Array.from(containerStatusId) } },
                  { _id: { $in: Array.from(preCarriageId) } },
                  { _id: { $in: Array.from(destuffingTypeId) } },
                  { _id: { $in: Array.from(cargoTypeId) } },
                  { _id: { $in: Array.from(cargoWtUnitId) } },
                  { _id: { $in: Array.from(packageId) } },
                  { _id: { $in: Array.from(commodityTypeId) } },
                  { _id: { $in: Array.from(volumeUnitId) } },
                  { _id: { $in: Array.from(chargeableWtUnitId) } },
                  { _id: { $in: Array.from(postCarriage) } },
                  { _id: { $in: Array.from(routeId) } },
                  { _id: { $in: Array.from(netWtUnitId) } },
                  { _id: { $in: Array.from(demmuragecurrency) } },
                  { _id: { $in: Array.from(sizeId) } },
                  { _id: { $in: Array.from(typeId) } },
                  { _id: { $in: Array.from(dimensionUnitId) } },
                  { _id: { $in: Array.from(wtUnitId) } },
                  { _id: { $in: Array.from(grossWtUnitId) } },
                  { _id: { $in: Array.from(tareWtUnitId) } },
                  { _id: { $in: Array.from(refTempUnitId) } },
                  { _id: { $in: Array.from(TransporterId) } },
                  { _id: { $in: Array.from(unitId) } },
                  { _id: { $in: Array.from(buyCurrencyId) } },
                  { _id: { $in: Array.from(sellCurrencyId) } },
                  { _id: { $in: Array.from(buyPrepaidCollectId) } },
                  { _id: { $in: Array.from(sellPrepaidCollectid) } },
                  { _id: { $in: Array.from(dueToId) } },
                  { _id: { $in: Array.from(activityId) } },
                ],
              },
            },
          ],
        },
        {
          tableName: "tblVesselFlight",
          query: [
            {
              $unwind: {
                path: "$tblVoyage",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                tblVoyage: { $exists: true, $ne: null },
                $or: [{ "tblVoyage._id": { $in: Array.from(polVoyageId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblVesselFlight",
          query: [
            {
              $match: {
                $or: [
                  { _id: { $in: Array.from(polVesselId) } },
                  { _id: { $in: Array.from(podVesselId) } },
                ],
              },
            },
          ],
        },
        {
          tableName: "tblPort",
          query: [
            {
              $unwind: {
                path: "$tblBerth",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                tblBert: { $exists: true, $ne: null },
                $or: [{ "tblBert._id": { $in: Array.from(polTerminalId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblBusinessSegment",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(businessSegmentId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblRateRequest",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(rateRequestId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblJob",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(masterJobId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblContainer",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(containerId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblCharge",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(chargeId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblGeneralLedger",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [
                  { _id: { $in: Array.from(buyPartyId) } },
                  { _id: { $in: Array.from(sellPartyId) } },
                ],
              },
            },
          ],
        },
      ];
      // return console.log("tables", tables.length);

      const dataToQuery = tables.map((iterator) =>
        model.AggregateFetchData(
          iterator.tableName,
          iterator.tableName,
          iterator.query,
          res
        )
      );

      const resultOfQueryData = await Promise.all(dataToQuery);
      const portMap = new Map();
      const customerMap = new Map();
      const CompanyBranchMap = new Map();
      const CompanyBranchPerson = new Map();
      const finYearMap = new Map();
      const CountryMap = new Map();
      const MasterDataMap = new Map();
      const VoyageMap = new Map();
      const VesselMap = new Map();
      const polTerminalMap = new Map();
      const businessSegmentMap = new Map();
      const rateRequestMap = new Map();
      const JobMap = new Map();
      const containerMap = new Map();
      const chargeMap = new Map();
      const generalLedgerMap = new Map();

      // Optimizing portMap construction
      for (const item of resultOfQueryData[0]) {
        if (item._id !== undefined && item.name !== undefined) {
          portMap.set(item._id.toString(), item.name);
        }
      }
      // console.log("company length", resultOfQueryData[1][0]._id.toString());
      // Optimizing customerMap construction
      for (const item of resultOfQueryData[1]) {
        if (item.oldId !== undefined) {
          customerMap.set(item._id.toString(), {
            name: item.name,
            branch: item.tblCompanyBranch,
          });
        }
      }

      // Optimizing CompanyBranchMap construction
      for (const item of resultOfQueryData[2]) {
        // Check if tblCompanyBranch exists and has the oldId property
        if (
          item.tblCompanyBranch &&
          item.tblCompanyBranch.oldId !== undefined
        ) {
          CompanyBranchMap.set(item.tblCompanyBranch?._id.toString(), {
            name: item.tblCompanyBranch.name,
          });
        }
      }

      for (const item of resultOfQueryData[3]) {
        // Check if tblCompanyBranch exists and has the oldId property
        if (
          item.tblCompanyBranch &&
          item.tblCompanyBranch.tblCompanyBranchPerson &&
          item.tblCompanyBranch.tblCompanyBranchPerson._id !== undefined
        ) {
          CompanyBranchPerson.set(
            item.tblCompanyBranch.tblCompanyBranchPerson._id.toString(),
            { name: item.tblCompanyBranch.tblCompanyBranchPerson.name }
          );
        }
      }
      console.log("CompanyBranchPerson", resultOfQueryData[3].length);
      for (const item of resultOfQueryData[4]) {
        if (item._id !== undefined && item.financialYear !== undefined) {
          finYearMap.set(item._id.toString(), {
            financialYear: item.financialYear,
          });
        }
      }
      // console.log("finYearMap", finYearMap);
      for (const item of resultOfQueryData[5]) {
        if (item._id !== undefined && item.name !== undefined) {
          CountryMap.set(item._id.toString(), { name: item.name });
        }
      }
      // console.log("resultOfQueryData[6].length", resultOfQueryData[6].length);
      for (const item of resultOfQueryData[6]) {
        if (item._id !== undefined && item.name !== undefined) {
          MasterDataMap.set(item._id.toString(), { name: item.name });
        }
      }
      // console.log("MasterDataMap", MasterDataMap);
      for (const item of resultOfQueryData[7]) {
        if (
          item.tblVoyage &&
          item.tblVoyage._id !== undefined &&
          item.name !== undefined
        ) {
          VoyageMap.set(item.tblVoyage._id, { name: item.tblVoyage.name });
        }
      }
      for (const item of resultOfQueryData[8]) {
        if (item._id !== undefined && item.name !== undefined) {
          VesselMap.set(item._id, { name: item.name });
        }
      }
      for (const item of resultOfQueryData[9]) {
        if (
          item.tblBerth &&
          item.tblBerth._id !== undefined &&
          item.name !== undefined
        ) {
          polTerminalMap.set(item.tblBerth._id, { name: item.tblBerth.name });
        }
      }
      for (const item of resultOfQueryData[10]) {
        if (item._id !== undefined && item.name !== undefined) {
          businessSegmentMap.set(item._id, { name: item.name });
        }
      }
      for (const item of resultOfQueryData[11]) {
        if (item._id !== undefined && item.name !== undefined) {
          rateRequestMap.set(item._id, { name: item.name });
        }
      }
      for (const item of resultOfQueryData[12]) {
        if (item._id !== undefined && item.name !== undefined) {
          JobMap.set(item._id, { name: item.name });
        }
      }
      for (const item of resultOfQueryData[13]) {
        if (item._id !== undefined && item.name !== undefined) {
          containerMap.set(item._id, { name: item.name });
        }
      }
      for (const item of resultOfQueryData[14]) {
        if (item._id !== undefined && item.name !== undefined) {
          chargeMap.set(item._id.toString(), { name: item.name });
        }
      }

      for (const item of resultOfQueryData[15]) {
        if (item._id !== undefined && item.name !== undefined) {
          generalLedgerMap.set(item._id, { name: item.name });
        }
      }
      data.forEach((item) => {
        // console.log(CompanyBranchMap.get(item.shipperBranchId));
        // console.log("MasterDataMap.get(item.cargoTypeId)?.name", MasterDataMap.get(item.cargoTypeId));
        item["plrName"] = portMap.get(item.plrId) || "";
        item["polName"] = portMap.get(item.polId) || "";
        item["podName"] = portMap.get(item.podId) || "";
        item["fpdName"] = portMap.get(item.fpdId) || "";
        item["depotName"] = portMap.get(item.depotId) || "";
        item["podTerminalName"] = portMap.get(item.podTerminalId) || "";
        item["podVoyageName"] = portMap.get(item.podVoyageId) || "";
        // item["podVoyageName"] = portMap.get(item.podVoyageId) || "";

        const customerInfo = customerMap.get(item.customerId);
        // console.log("customerInfo", customerInfo.flat(2));
        item["consigneeName"] = customerMap.get(item.consigneeId)?.name || "";
        item["customerName"] = customerInfo ? customerInfo.name : "";
        item["shipperName"] = customerMap.get(item.shipperId)?.name || "";
        item["shippinglineName"] =
          customerMap.get(item.shippingLineId)?.name || "";
        item["companyName"] = customerMap.get(item.companyId)?.name || "";
        item["podAgentName"] = customerMap.get(item.podAgentId)?.name || "";
        item["polAgentName"] = customerMap.get(item.polAgentId)?.name || "";
        item["agentName"] = customerMap.get(item.agentId)?.name || "";
        item["notifyPartyName"] =
          customerMap.get(item.notifyPartyId)?.name || "";
        item["customBrokerName"] =
          customerMap.get(item.customBrokerId)?.name || "";
        item["transporterName"] =
          customerMap.get(item.transporterId)?.name || "";
        item["podCustomBrokerName"] =
          customerMap.get(item.podCustomBrokerId)?.name || "";
        item["shippingAgentName"] =
          customerMap.get(item.shippingAgentId)?.name || "";
        item["slotOwnerName"] = customerMap.get(item.slotOwnerId)?.name || "";
        item["mloName"] = customerMap.get(item.mloId)?.name || "";
        item["createdByCompanyName"] =
          customerMap.get(item.createdByCompanyId)?.name || "";
        item["fpdAgentName"] = customerMap.get(item.fpdAgentId)?.name || "";
        item["surveyorName"] = customerMap.get(item.surveyorId)?.name || "";
        item["plrAgentName"] = customerMap.get(item.plrAgentId)?.name || "";
        // Assuming you want to extract the branch name for the customer
        item["companyBranchName"] =
          CompanyBranchMap.get(item.companybranchId)?.name || "";
        item["consigneeBranchName"] =
          CompanyBranchMap.get(item.consigneeBranchId)?.name || "";
        item["shipperBranchName"] =
          CompanyBranchMap.get(item.shipperBranchId)?.name || "";
        item["customerBranchName"] =
          CompanyBranchMap.get(item.customerBranchId)?.name || "";
        item["agentBranchName"] =
          CompanyBranchMap.get(item.agentBranchId)?.name || "";
        item["notifyPartyBranchName"] =
          CompanyBranchMap.get(item.notifyPartyBranchId)?.name || "";
        item["createdByCompanyBranchName"] =
          CompanyBranchMap.get(item.createdByCompanyBranchId)?.name || "";
        item["polAgentBranchName"] =
          CompanyBranchMap.get(item.polAgentBranchId)?.name || "";
        item["podAgentBranchName"] =
          CompanyBranchMap.get(item.podAgentBranchId)?.name || "";
        item["surveyorBranchName"] =
          CompanyBranchMap.get(item.surveyorBranchId)?.name || "";
        item["fpdAgentBranchName"] =
          CompanyBranchMap.get(item.fpdAgentBranchId)?.name || "";
        item["plrAgentBranchName"] =
          CompanyBranchMap.get(item.plrAgentBranchId)?.name || "";

        //company branch person
        item["salesExecutiveName"] =
          CompanyBranchPerson.get(item.salesExecutiveId)?.name || "";
        item["pricingPersonName"] =
          CompanyBranchPerson.get(item.pricingPersonId)?.name || "";
        item["customerServicePersonName"] =
          CompanyBranchPerson.get(item.customerServicePersonId)?.name || "";
        item["backOfficePersonName"] =
          CompanyBranchPerson.get(item.backOfficePersonId)?.name || "";
        item["sellPersonName"] =
          CompanyBranchPerson.get(item.sellPersonId)?.name || "";
        item["customerClearancePersonName"] =
          CompanyBranchPerson.get(item.customerClearancePersonId)?.name || "";
        // financial year
        item["financialYear"] =
          finYearMap.get(item.finYearId)?.financialYear || "";

        //countryMap
        item["destinationCountryName"] =
          CountryMap.get(item.destinationCountryId)?.name || "";
        item["originCountryName"] =
          CountryMap.get(item.originCountryId)?.name || "";

        //MasterData
        item["tradeTermsName"] =
          MasterDataMap.get(item.tradeTermsId)?.name || "";
        item["natureOfCargoName"] =
          MasterDataMap.get(item.natureOfCargoId)?.name || "";
        item["stuffingTypeName"] =
          MasterDataMap.get(item.stuffingTypeId)?.name || "";
        item["containerStatusName"] =
          MasterDataMap.get(item.containerStatusId)?.name || "";
        item["preCarriageName"] =
          MasterDataMap.get(item.preCarriageId)?.name || "";
        item["destuffingTypeName"] =
          MasterDataMap.get(item.destuffingTypeId)?.name || "";
        item["cargoTypeName"] = MasterDataMap.get(item.cargoTypeId)?.name || "";
        item["cargoWtUnitName"] =
          MasterDataMap.get(item.cargoWtUnitId)?.name || "";
        item["packageName"] = MasterDataMap.get(item.packageId)?.name || "";
        item["commodityTypeName"] =
          MasterDataMap.get(item.commodityTypeId)?.name || "";
        item["volumeUnitName"] =
          MasterDataMap.get(item.volumeUnitId)?.name || "";
        item["chargeableWtUnitName"] =
          MasterDataMap.get(item.chargeableWtUnitId)?.name || "";
        item["postCarriageName"] =
          MasterDataMap.get(item.postCarriage)?.name || "";
        item["netWtUnitName"] = MasterDataMap.get(item.netWtUnitId)?.name || "";
        item["routeName"] = MasterDataMap.get(item.routeId)?.name || "";
        item["demmuragecurrencyName"] =
          MasterDataMap.get(item.demmuragecurrency)?.name || "";

        //voyage
        item["polVoyageName"] = VoyageMap.get(item.polVoyageId)?.name || "";
        //vessel
        item["polVesselName"] = VesselMap.get(item.polVesselId)?.name || "";
        item["podVesselName"] = VesselMap.get(item.podVesselId)?.name || "";
        //pol terminal
        item["polTerminalName"] =
          polTerminalMap.get(item.polTerminalId)?.name || "";
        // business segment
        item["businessSegmentName"] =
          businessSegmentMap.get(item.businessSegmentId)?.name || "";
        // rate request
        item["rateRequestName"] =
          rateRequestMap.get(item.rateRequestId)?.name || "";
        // Job map
        item["masterJobName"] = JobMap.get(item.masterJobId)?.name || "";
        // tblJobQty
        item.tblJobQty &&
          item.tblJobQty.map((item) => {
            //maserData
            item["sizeName"] = MasterDataMap.get(item.sizeId)?.name || "";
            item["typeName"] = MasterDataMap.get(item.typeId)?.name || "";
            item["dimensionUnitName"] =
              MasterDataMap.get(item.dimensionUnitId)?.name || "";
            item["wtUnitName"] = MasterDataMap.get(item.wtUnitId)?.name || "";
            item["volumeUnitName"] =
              MasterDataMap.get(item.volumeUnitId)?.name || "";
            item["depotName"] = portMap.get(item.depotId)?.name || "";
            item["containerName"] =
              containerMap.get(item.containerId)?.name || "";
          });
        // tblJobContainer
        item.tblJobContainer &&
          item.tblJobContainer.map((item) => {
            item["sizeName"] = MasterDataMap.get(item.sizeId)?.name || "";
            item["typeName"] = MasterDataMap.get(item.typeId)?.name || "";
            item["containerStatusName"] =
              MasterDataMap.get(item.containerStatusId)?.name || "";
            item["grossWtUnitName"] =
              MasterDataMap.get(item.grossWtUnitId)?.name || "";
            item["tareWtUnitName"] =
              MasterDataMap.get(item.tareWtUnitId)?.name || "";
            item["refTempUnitName"] =
              MasterDataMap.get(item.refTempUnitId)?.name || "";
            item["packageName"] = MasterDataMap.get(item.packageId)?.name || "";
            item["dimensionUnitName"] =
              MasterDataMap.get(item.dimensionUnitId)?.name || "";
            item["TransporterName"] =
              MasterDataMap.get(item.TransporterId)?.name || "";
            item["volumeUnitName"] =
              MasterDataMap.get(item.volumeUnitId)?.name || "";
            item["cargoTypeName"] =
              MasterDataMap.get(item.cargoTypeId)?.name || "";
            item["slotOwnerName"] =
              customerMap.get(item.cargoTypeId)?.name || "";
          });
        // tblJobCharge
        item.tblJobCharge &&
          item.tblJobCharge.map((item) => {
            item["sizeName"] = MasterDataMap.get(item.sizeId)?.name || "";
            item["typeName"] = MasterDataMap.get(item.typeId)?.name || "";
            item["unitName"] = MasterDataMap.get(item.unitId)?.name || "";
            item["buyCurrencyName"] =
              MasterDataMap.get(item.buyCurrencyId)?.name || "";
            item["sellCurrencyName"] =
              MasterDataMap.get(item.sellCurrencyId)?.name || "";
            item["buyPrepaidCollectName"] =
              MasterDataMap.get(item.buyPrepaidCollectId)?.name || "";
            item["sellPrepaidCollectName"] =
              MasterDataMap.get(item.sellPrepaidCollectid)?.name || "";
            item["dueToName"] = MasterDataMap.get(item.dueToId)?.name || "";
            item["chargeName"] = chargeMap.get(item.chargeId)?.name || "";
            item["buyPartyName"] = chargeMap.get(item.buyPartyId)?.name || "";
            item["sellPartyName"] = chargeMap.get(item.sellPartyId)?.name || "";
          });
        // tblJobActivity
        item.tblJobActivity &&
          item.tblJobActivity.map((item) => {
            item["activityPersonId"] =
              CompanyBranchPerson.get(item.activityPersonId)?.name || "";
            item["activityName"] =
              MasterDataMap.get(item.activityId)?.name || "";
          });
      });

      if (data.length > 0) {
        res.send({
          success: true,
          message: "Data fetched successfully",
          // reultofQueryData: resultOfqueryData,
          data: data,
        });
      } else {
        res.send({
          success: false,
          message: "Data not fetched successfully",
          data: data,
        });
      }
    } catch (error) {
      res.status(500).send({
        success: false,
        message: "Something went wrong",
        data: error.message,
      });
    }
  },
  JobRegistrationTestDynamicReport: async (req, res) => {
    try {
      let matchData = { status: Number(process.env.ACTIVE_STATUS) };
      let { body } = req;
      FilterCondition(matchData, body);
      // if (body.id && body.id != "undefined" && body.id !== "") {
      //     matchData['id'] = Number(body.id)
      // }
      // if (body._id && body._id != "undefined" && body._id !== "") {
      //     matchData['_id'] = new mongoose.Types.ObjectId(body._id);
      // }
      // if (body.customerId && body.customerId != "undefined" && body.customerId !== "") {
      //     matchData['customerId'] = Number(body.customerId)
      // }
      // if (body.finYearId && body.finYearId != "undefined" && body.finYearId !== "") {
      //     matchData['finYearId'] = String(body.finYearId)
      // }
      // if (body.shipperId && body.shipperId != "undefined" && body.shipperId !== "") {
      //     matchData['shipperId'] = Number(body.shipperId)
      // }
      // if (body.consigneeId && body.consigneeId != "undefined" && body.consigneeId !== "") {
      //     matchData['consigneeId'] = Number(body.consigneeId)
      // }
      // if (body.shippingLineId && body.shippingLineId != "undefined" && body.shippingLineId !== "") {
      //     matchData['shippingLineId'] = Number(body.shippingLineId)
      // }
      // if (body.plrId && body.plrId != "undefined" && body.plrId !== "") {
      //     matchData['plrId'] = Number(body.plrId)
      // }
      // if (body.polId && body.polId != "undefined" && body.polId !== "") {
      //     matchData['polId'] = Number(body.polId)
      // }
      // if (body.podId && body.podId != "undefined" && body.podId !== "") {
      //     matchData['podId'] = Number(body.podId)
      // }
      // if (body.fpdId && body.fpdId != "undefined" && body.fpdId !== "") {
      //     matchData['fpdId'] = Number(body.fpdId)
      // }
      if (
        body.fromDate &&
        body.fromDate != "undefined" &&
        body.fromDate !== "" &&
        body.toDate &&
        body.toDate != "undefined" &&
        body.toDate !== ""
      ) {
        matchData["jobDate"] = {
          $gte: new Date(body.fromDate),
          $lte: new Date(body.toDate),
        };
      } else if (
        body.fromDate &&
        body.fromDate != "undefined" &&
        body.fromDate !== ""
      ) {
        matchData["jobDate"] = { $gte: new Date(body.fromDate) };
      } else if (
        body.toDate &&
        body.toDate != "undefined" &&
        body.toDate !== ""
      ) {
        matchData["jobDate"] = { $lte: new Date(body.toDate) };
      }
      let page = parseInt(req.query.page, 10) || 1; // Default to page 1 if not specified
      let pageSize = parseInt(req.query.pageSize, 100) || 1000; // Default to 10 items per page if not specified

      // Calculate the number of documents to skip
      let skipCount = (page - 1) * pageSize;
      let query = [
        {
          $match: matchData,
        },
        {
          $sort: {
            id: 1,
          },
        },
        {
          $skip: skipCount,
        },
        {
          $limit: pageSize,
        },
      ];
      let project = {};
      if (body.projection && Object.keys(body.projection).length > 0) {
        project = body.projection;
      }
      if (Object.keys(project).length > 0) {
        query.push({ $project: project });
      }

      // let data = await model.AggregateFetchData("tblTestJob", "tblTestJob", query, res)
      let data = await model.AggregateFetchData("tblJob", "tblJob", query, res);
      let plrId = new Set();
      let polId = new Set();
      let podId = new Set();
      let fpdId = new Set();
      let customerId = new Set();
      let shipperId = new Set();
      let consigneeId = new Set();
      let companyBranchId = new Set();
      let shippingLineId = new Set();
      let consigneeBranchId = new Set();
      let shipperBranchId = new Set();
      let salesExecutiveId = new Set();
      let companyId = new Set();
      let podAgentId = new Set();
      let polAgentId = new Set();
      let customerBranchId = new Set();
      let agentId = new Set();
      let agentBranchId = new Set();
      let notifyPartyId = new Set();
      let notifyPartyBranchId = new Set();
      let customBrokerId = new Set();
      let finYearId = new Set();
      let destinationCountryId = new Set();
      let originCountryId = new Set();
      let tradeTermsId = new Set();
      let natureOfCargoId = new Set();
      let stuffingTypeId = new Set();
      let containerStatusId = new Set();
      let preCarriageId = new Set();
      let destuffingTypeId = new Set();
      let cargoTypeId = new Set();
      let cargoWtUnitId = new Set();
      let packageId = new Set();
      let commodityTypeId = new Set();
      let volumeUnitId = new Set();
      let chargeableWtUnitId = new Set();
      let businessSegmentId = new Set();
      let polVoyageId = new Set();
      let polVesselId = new Set();
      let polTerminalId = new Set();
      let transporterId = new Set();
      let podCustomBrokerId = new Set();
      let shippingAgentId = new Set();
      let slotOwnerId = new Set();
      let mloId = new Set();
      let createdByCompanyId = new Set();
      let fpdAgentId = new Set();
      let surveyorId = new Set();
      let plrAgentId = new Set();
      let postCarriage = new Set();
      let routeId = new Set();
      let netWtUnitId = new Set();
      let createdByCompanyBranchId = new Set();
      let polAgentBranchId = new Set();
      let podAgentBranchId = new Set();
      let surveyorBranchId = new Set();
      let fpdAgentBranchId = new Set();
      let plrAgentBranchId = new Set();
      let pricingPersonId = new Set();
      let customerServicePersonId = new Set();
      let demmuragecurrency = new Set();
      let backOfficePersonId = new Set();
      let sellPersonId = new Set();
      let customerClearancePersonId = new Set();
      let depotId = new Set();
      let podTerminalId = new Set();
      let podVoyageId = new Set();
      let podVesselId = new Set();
      let rateRequestId = new Set();
      let masterJobId = new Set();
      // tblJobContainer
      let sizeId = new Set();
      let typeId = new Set();
      let dimensionUnitId = new Set();
      let wtUnitId = new Set();
      let containerId = new Set();

      // tblJobQuantity
      let grossWtUnitId = new Set();
      let tareWtUnitId = new Set();
      let refTempUnitId = new Set();
      let TransporterId = new Set();
      // tblJobCharge
      let unitId = new Set();
      let buyCurrencyId = new Set();
      let sellCurrencyId = new Set();
      let buyPrepaidCollectId = new Set();
      let sellPrepaidCollectid = new Set();
      let dueToId = new Set();
      // tblJobActivity
      let activityPersonId = new Set();
      let activityId = new Set();
      let chargeId = new Set();
      let buyPartyId = new Set();
      let sellPartyId = new Set();

      data.forEach((item) => {
        plrId.add(createObjectId(item.plrId));
        polId.add(createObjectId(item.polId));
        podId.add(createObjectId(item.podId));
        fpdId.add(createObjectId(item.fpdId));
        customerId.add(createObjectId(item.customerId));
        shipperId.add(createObjectId(item.shipperId));
        consigneeId.add(createObjectId(item.consigneeId));
        companyBranchId.add(createObjectId(item.companybranchId));
        shippingLineId.add(createObjectId(item.shippingLineId));
        consigneeBranchId.add(createObjectId(item.consigneeBranchId));
        shipperBranchId.add(createObjectId(item.shipperBranchId));
        salesExecutiveId.add(item.salesExecutiveId);
        companyId.add(createObjectId(item.companyId));
        podAgentId.add(createObjectId(item.podAgentId));
        polAgentId.add(createObjectId(item.polAgentId));
        customerBranchId.add(createObjectId(item.customerBranchId));
        agentId.add(createObjectId(item.agentId));
        agentBranchId.add(createObjectId(item.agentBranchId));
        notifyPartyId.add(createObjectId(item.notifyPartyId));
        notifyPartyBranchId.add(createObjectId(item.notifyPartyBranchId));
        customBrokerId.add(createObjectId(item.customBrokerId));
        finYearId.add(createObjectId(item.finYearId));
        destinationCountryId.add(createObjectId(item.destinationCountryId));
        originCountryId.add(createObjectId(item.originCountryId));
        tradeTermsId.add(createObjectId(item.tradeTermsId));
        natureOfCargoId.add(createObjectId(item.natureOfCargoId));
        stuffingTypeId.add(createObjectId(item.stuffingTypeId));
        containerStatusId.add(createObjectId(item.containerStatusId));
        preCarriageId.add(createObjectId(item.preCarriageId));
        // preCarriageId.add(item.preCarriageId);
        destuffingTypeId.add(createObjectId(item.destuffingTypeId));
        cargoTypeId.add(createObjectId(item.cargoTypeId));
        cargoWtUnitId.add(createObjectId(item.cargoWtUnitId));
        packageId.add(createObjectId(item.packageId));
        commodityTypeId.add(createObjectId(item.commodityTypeId));
        volumeUnitId.add(createObjectId(item.volumeUnitId));
        chargeableWtUnitId.add(createObjectId(item.chargeableWtUnitId));
        businessSegmentId.add(createObjectId(item.businessSegmentId));
        polVoyageId.add(createObjectId(item.polVoyageId));
        polVesselId.add(createObjectId(item.polVesselId));
        polTerminalId.add(createObjectId(item.polTerminalId));
        transporterId.add(createObjectId(item.transporterId));
        podCustomBrokerId.add(createObjectId(item.podCustomBrokerId));
        shippingAgentId.add(createObjectId(item.shippingAgentId));
        slotOwnerId.add(createObjectId(item.slotOwnerId));
        mloId.add(createObjectId(item.mloId));
        createdByCompanyId.add(createObjectId(item.createdByCompanyId));
        fpdAgentId.add(createObjectId(item.fpdAgentId));
        plrAgentId.add(createObjectId(item.plrAgentId));
        surveyorId.add(createObjectId(item.surveyorId));
        postCarriage.add(createObjectId(item.postCarriage));
        routeId.add(createObjectId(item.routeId));
        netWtUnitId.add(createObjectId(item.netWtUnitId));
        createdByCompanyBranchId.add(
          createObjectId(item.createdByCompanyBranchId)
        );
        polAgentBranchId.add(createObjectId(item.polAgentBranchId));
        podAgentBranchId.add(createObjectId(item.podAgentBranchId));
        surveyorBranchId.add(createObjectId(item.surveyorBranchId));
        fpdAgentBranchId.add(createObjectId(item.fpdAgentBranchId));
        plrAgentBranchId.add(createObjectId(item.plrAgentBranchId));
        pricingPersonId.add(createObjectId(item.pricingPersonId));
        customerServicePersonId.add(
          createObjectId(item.customerServicePersonId)
        );
        demmuragecurrency.add(createObjectId(item.demmuragecurrency));
        backOfficePersonId.add(createObjectId(item.backOfficePersonId));
        sellPersonId.add(createObjectId(item.sellPersonId));
        customerClearancePersonId.add(
          createObjectId(item.customerClearancePersonId)
        );
        depotId.add(createObjectId(item.depotId));
        podTerminalId.add(createObjectId(item.podTerminalId));
        podVoyageId.add(createObjectId(item.podVoyageId));
        podVesselId.add(createObjectId(item.podVesselId));
        rateRequestId.add(createObjectId(item.rateRequestId));
        masterJobId.add(createObjectId(item.masterJobId));
        // tblJobQty
        item.tblJobQty &&
          item.tblJobQty.map((x) => {
            console.log("x", x);
            sizeId.add(createObjectId(x.sizeId));
            typeId.add(createObjectId(x.typeId));
            dimensionUnitId.add(createObjectId(x.dimensionUnitId));
            wtUnitId.add(createObjectId(x.wtUnitId));
            volumeUnitId.add(createObjectId(x.volumeUnitId));
            depotId.add(createObjectId(x.depotId));
            containerId.add(createObjectId(x.containerId));
          });
        //  tblJobContainer
        item.tblJobContainer &&
          item.tblJobContainer.map((x) => {
            sizeId.add(createObjectId(x.sizeId));
            typeId.add(createObjectId(x.typeId));
            containerStatusId.add(createObjectId(x.containerStatusId));
            grossWtUnitId.add(createObjectId(x.grossWtUnitId));
            tareWtUnitId.add(createObjectId(x.tareWtUnitId));
            refTempUnitId.add(createObjectId(x.refTempUnitId));
            packageId.add(createObjectId(x.packageId));
            dimensionUnitId.add(createObjectId(x.dimensionUnitId));
            TransporterId.add(createObjectId(x.TransporterId));
            volumeUnitId.add(createObjectId(x.volumeUnitId));
            cargoTypeId.add(createObjectId(x.cargoTypeId));
            slotOwnerId.add(createObjectId(x.slotOwnerId));
          });
        // tblJobCharge
        item.tblJobCharge &&
          item.tblJobCharge.map((x) => {
            sizeId.add(createObjectId(x.sizeId));
            typeId.add(createObjectId(x.typeId));
            unitId.add(createObjectId(x.unitId));
            buyCurrencyId.add(createObjectId(x.buyCurrencyId));
            sellCurrencyId.add(createObjectId(x.sellCurrencyId));
            buyPrepaidCollectId.add(createObjectId(x.buyPrepaidCollectId));
            sellPrepaidCollectid.add(createObjectId(x.sellPrepaidCollectid));
            dueToId.add(createObjectId(x.dueToId));
            chargeId.add(createObjectId(x.chargeId));
            buyPartyId.add(createObjectId(x.buyPartyId));
            sellPartyId.add(createObjectId(x.sellPartyId));
          });
        // tblJobActivity
        item.tblJobActivity &&
          item.tblJobActivity.map((x) => {
            activityPersonId.add(createObjectId(x.activityPersonId));
            activityId.add(createObjectId(x.activityId));
          });
      });
      // return console.log(companyBranchId);
      const tables = [
        {
          tableName: "tblPort",
          query: [
            {
              $match: {
                $or: [
                  { _id: { $in: Array.from(plrId) } },
                  { _id: { $in: Array.from(polId) } },
                  { _id: { $in: Array.from(podId) } },
                  { _id: { $in: Array.from(fpdId) } },
                  { _id: { $in: Array.from(depotId) } },
                  { _id: { $in: Array.from(podTerminalId) } },
                  { _id: { $in: Array.from(podVoyageId) } },
                ],
                status: Number(process.env.ACTIVE_STATUS),
              },
            },
          ],
        },
        {
          tableName: "tblCompany",
          query: [
            {
              $match: {
                $or: [
                  { _id: { $in: Array.from(customerId) } },
                  { _id: { $in: Array.from(shipperId) } },
                  { _id: { $in: Array.from(consigneeId) } },
                  { _id: { $in: Array.from(shippingLineId) } },
                  { _id: { $in: Array.from(companyId) } },
                  { _id: { $in: Array.from(podAgentId) } },
                  { _id: { $in: Array.from(polAgentId) } },
                  { _id: { $in: Array.from(agentId) } },
                  { _id: { $in: Array.from(notifyPartyId) } },
                  { _id: { $in: Array.from(customBrokerId) } },
                  { _id: { $in: Array.from(transporterId) } },
                  { _id: { $in: Array.from(podCustomBrokerId) } },
                  { _id: { $in: Array.from(shippingAgentId) } },
                  { _id: { $in: Array.from(slotOwnerId) } },
                  { _id: { $in: Array.from(mloId) } },
                  { _id: { $in: Array.from(createdByCompanyId) } },
                  { _id: { $in: Array.from(fpdAgentId) } },
                  { _id: { $in: Array.from(plrAgentId) } },
                  { _id: { $in: Array.from(surveyorId) } },
                ],
              },
            },
          ],
        },
        {
          tableName: "tblCompany",
          query: [
            {
              $unwind: {
                path: "$tblCompanyBranch",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                tblCompanyBranch: { $exists: true, $ne: null },
                $or: [
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(companyBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(consigneeBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(shipperBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(customerBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": { $in: Array.from(agentBranchId) },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(notifyPartyBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(createdByCompanyBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(polAgentBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(podAgentBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(surveyorBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(plrAgentBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(fpdAgentBranchId),
                    },
                  },
                  // Add more conditions here if needed, each enclosed in {}
                ],
              },
            },
          ],
        },
        {
          tableName: "tblCompany",
          query: [
            {
              $unwind: {
                path: "$tblCompanyBranch",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $unwind: {
                path: "$tblCompanyBranch.tblCompanyBranchPerson",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                "tblCompanyBranch.tblCompanyBranchPerson": {
                  $exists: true,
                  $ne: null,
                },
                $or: [
                  {
                    "tblCompanyBranch.tblCompanyBranchPerson._id": {
                      $in: Array.from(salesExecutiveId),
                    },
                  },
                  {
                    "tblCompanyBranch.tblCompanyBranchPerson._id": {
                      $in: Array.from(pricingPersonId),
                    },
                  },
                  {
                    "tblCompanyBranch.tblCompanyBranchPerson._id": {
                      $in: Array.from(backOfficePersonId),
                    },
                  },
                  {
                    "tblCompanyBranch.tblCompanyBranchPerson._id": {
                      $in: Array.from(sellPersonId),
                    },
                  },
                  {
                    "tblCompanyBranch.tblCompanyBranchPerson._id": {
                      $in: Array.from(customerServicePersonId),
                    },
                  },
                  {
                    "tblCompanyBranch.tblCompanyBranchPerson._id": {
                      $in: Array.from(customerClearancePersonId),
                    },
                  },
                  {
                    "tblCompanyBranch.tblCompanyBranchPerson._id": {
                      $in: Array.from(activityPersonId),
                    },
                  },
                  // Add more conditions here if needed, each enclosed in {}
                ],
              },
            },
          ],
        },
        {
          tableName: "tblFinancialYear",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(finYearId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblCountry",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [
                  { _id: { $in: Array.from(destinationCountryId) } },
                  { _id: { $in: Array.from(originCountryId) } },
                ],
              },
            },
          ],
        },
        {
          tableName: "tblMasterData",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [
                  { _id: { $in: Array.from(tradeTermsId) } },
                  { _id: { $in: Array.from(natureOfCargoId) } },
                  { _id: { $in: Array.from(stuffingTypeId) } },
                  { _id: { $in: Array.from(containerStatusId) } },
                  { _id: { $in: Array.from(preCarriageId) } },
                  { _id: { $in: Array.from(destuffingTypeId) } },
                  { _id: { $in: Array.from(cargoTypeId) } },
                  { _id: { $in: Array.from(cargoWtUnitId) } },
                  { _id: { $in: Array.from(packageId) } },
                  { _id: { $in: Array.from(commodityTypeId) } },
                  { _id: { $in: Array.from(volumeUnitId) } },
                  { _id: { $in: Array.from(chargeableWtUnitId) } },
                  { _id: { $in: Array.from(postCarriage) } },
                  { _id: { $in: Array.from(routeId) } },
                  { _id: { $in: Array.from(netWtUnitId) } },
                  { _id: { $in: Array.from(demmuragecurrency) } },
                  { _id: { $in: Array.from(sizeId) } },
                  { _id: { $in: Array.from(typeId) } },
                  { _id: { $in: Array.from(dimensionUnitId) } },
                  { _id: { $in: Array.from(wtUnitId) } },
                  { _id: { $in: Array.from(grossWtUnitId) } },
                  { _id: { $in: Array.from(tareWtUnitId) } },
                  { _id: { $in: Array.from(refTempUnitId) } },
                  { _id: { $in: Array.from(TransporterId) } },
                  { _id: { $in: Array.from(unitId) } },
                  { _id: { $in: Array.from(buyCurrencyId) } },
                  { _id: { $in: Array.from(sellCurrencyId) } },
                  { _id: { $in: Array.from(buyPrepaidCollectId) } },
                  { _id: { $in: Array.from(sellPrepaidCollectid) } },
                  { _id: { $in: Array.from(dueToId) } },
                  { _id: { $in: Array.from(activityId) } },
                ],
              },
            },
          ],
        },
        {
          tableName: "tblVesselFlight",
          query: [
            {
              $unwind: {
                path: "$tblVoyage",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                tblVoyage: { $exists: true, $ne: null },
                $or: [{ "tblVoyage._id": { $in: Array.from(polVoyageId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblVesselFlight",
          query: [
            {
              $match: {
                $or: [
                  { _id: { $in: Array.from(polVesselId) } },
                  { _id: { $in: Array.from(podVesselId) } },
                ],
              },
            },
          ],
        },
        {
          tableName: "tblPort",
          query: [
            {
              $unwind: {
                path: "$tblBerth",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                tblBert: { $exists: true, $ne: null },
                $or: [{ "tblBert._id": { $in: Array.from(polTerminalId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblBusinessSegment",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(businessSegmentId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblRateRequest",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(rateRequestId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblJob",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(masterJobId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblContainer",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(containerId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblCharge",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(chargeId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblGeneralLedger",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [
                  { _id: { $in: Array.from(buyPartyId) } },
                  { _id: { $in: Array.from(sellPartyId) } },
                ],
              },
            },
          ],
        },
      ];
      // return console.log("tables", tables.length);

      const dataToQuery = tables.map((iterator) =>
        model.AggregateFetchData(
          iterator.tableName,
          iterator.tableName,
          iterator.query,
          res
        )
      );

      const resultOfQueryData = await Promise.all(dataToQuery);
      const portMap = new Map();
      const customerMap = new Map();
      const CompanyBranchMap = new Map();
      const CompanyBranchPerson = new Map();
      const finYearMap = new Map();
      const CountryMap = new Map();
      const MasterDataMap = new Map();
      const VoyageMap = new Map();
      const VesselMap = new Map();
      const polTerminalMap = new Map();
      const businessSegmentMap = new Map();
      const rateRequestMap = new Map();
      const JobMap = new Map();
      const containerMap = new Map();
      const chargeMap = new Map();
      const generalLedgerMap = new Map();

      // Optimizing portMap construction
      for (const item of resultOfQueryData[0]) {
        if (item._id !== undefined && item.name !== undefined) {
          portMap.set(item._id.toString(), item.name);
        }
      }
      // console.log("company length", resultOfQueryData[1][0]._id.toString());
      // Optimizing customerMap construction
      for (const item of resultOfQueryData[1]) {
        if (item.oldId !== undefined) {
          customerMap.set(item._id.toString(), {
            name: item.name,
            branch: item.tblCompanyBranch,
          });
        }
      }

      // Optimizing CompanyBranchMap construction
      for (const item of resultOfQueryData[2]) {
        // Check if tblCompanyBranch exists and has the oldId property
        if (
          item.tblCompanyBranch &&
          item.tblCompanyBranch.oldId !== undefined
        ) {
          CompanyBranchMap.set(item.tblCompanyBranch?._id.toString(), {
            name: item.tblCompanyBranch.name,
          });
        }
      }

      for (const item of resultOfQueryData[3]) {
        // Check if tblCompanyBranch exists and has the oldId property
        if (
          item.tblCompanyBranch &&
          item.tblCompanyBranch.tblCompanyBranchPerson &&
          item.tblCompanyBranch.tblCompanyBranchPerson._id !== undefined
        ) {
          CompanyBranchPerson.set(
            item.tblCompanyBranch.tblCompanyBranchPerson._id.toString(),
            { name: item.tblCompanyBranch.tblCompanyBranchPerson.name }
          );
        }
      }
      console.log("CompanyBranchPerson", resultOfQueryData[3].length);
      for (const item of resultOfQueryData[4]) {
        if (item._id !== undefined && item.financialYear !== undefined) {
          finYearMap.set(item._id.toString(), {
            financialYear: item.financialYear,
          });
        }
      }
      // console.log("finYearMap", finYearMap);
      for (const item of resultOfQueryData[5]) {
        if (item._id !== undefined && item.name !== undefined) {
          CountryMap.set(item._id.toString(), { name: item.name });
        }
      }
      // console.log("resultOfQueryData[6].length", resultOfQueryData[6].length);
      for (const item of resultOfQueryData[6]) {
        if (item._id !== undefined && item.name !== undefined) {
          MasterDataMap.set(item._id.toString(), { name: item.name });
        }
      }
      // console.log("MasterDataMap", MasterDataMap);
      for (const item of resultOfQueryData[7]) {
        if (
          item.tblVoyage &&
          item.tblVoyage._id !== undefined &&
          item.name !== undefined
        ) {
          VoyageMap.set(item.tblVoyage._id, { name: item.tblVoyage.name });
        }
      }
      for (const item of resultOfQueryData[8]) {
        if (item._id !== undefined && item.name !== undefined) {
          VesselMap.set(item._id, { name: item.name });
        }
      }
      for (const item of resultOfQueryData[9]) {
        if (
          item.tblBerth &&
          item.tblBerth._id !== undefined &&
          item.name !== undefined
        ) {
          polTerminalMap.set(item.tblBerth._id, { name: item.tblBerth.name });
        }
      }
      for (const item of resultOfQueryData[10]) {
        if (item._id !== undefined && item.name !== undefined) {
          businessSegmentMap.set(item._id, { name: item.name });
        }
      }
      for (const item of resultOfQueryData[11]) {
        if (item._id !== undefined && item.name !== undefined) {
          rateRequestMap.set(item._id, { name: item.name });
        }
      }
      for (const item of resultOfQueryData[12]) {
        if (item._id !== undefined && item.name !== undefined) {
          JobMap.set(item._id, { name: item.name });
        }
      }
      for (const item of resultOfQueryData[13]) {
        if (item._id !== undefined && item.name !== undefined) {
          containerMap.set(item._id, { name: item.name });
        }
      }
      for (const item of resultOfQueryData[14]) {
        if (item._id !== undefined && item.name !== undefined) {
          chargeMap.set(item._id.toString(), { name: item.name });
        }
      }

      for (const item of resultOfQueryData[15]) {
        if (item._id !== undefined && item.name !== undefined) {
          generalLedgerMap.set(item._id, { name: item.name });
        }
      }
      data.forEach((item) => {
        // console.log(CompanyBranchMap.get(item.shipperBranchId));
        // console.log("MasterDataMap.get(item.cargoTypeId)?.name", MasterDataMap.get(item.cargoTypeId));
        item["plrName"] = portMap.get(item.plrId) || "";
        item["polName"] = portMap.get(item.polId) || "";
        item["podName"] = portMap.get(item.podId) || "";
        item["fpdName"] = portMap.get(item.fpdId) || "";
        item["depotName"] = portMap.get(item.depotId) || "";
        item["podTerminalName"] = portMap.get(item.podTerminalId) || "";
        item["podVoyageName"] = portMap.get(item.podVoyageId) || "";
        // item["podVoyageName"] = portMap.get(item.podVoyageId) || "";

        const customerInfo = customerMap.get(item.customerId);
        // console.log("customerInfo", customerInfo.flat(2));
        item["consigneeName"] = customerMap.get(item.consigneeId)?.name || "";
        item["customerName"] = customerInfo ? customerInfo.name : "";
        item["shipperName"] = customerMap.get(item.shipperId)?.name || "";
        item["shippinglineName"] =
          customerMap.get(item.shippingLineId)?.name || "";
        item["companyName"] = customerMap.get(item.companyId)?.name || "";
        item["podAgentName"] = customerMap.get(item.podAgentId)?.name || "";
        item["polAgentName"] = customerMap.get(item.polAgentId)?.name || "";
        item["agentName"] = customerMap.get(item.agentId)?.name || "";
        item["notifyPartyName"] =
          customerMap.get(item.notifyPartyId)?.name || "";
        item["customBrokerName"] =
          customerMap.get(item.customBrokerId)?.name || "";
        item["transporterName"] =
          customerMap.get(item.transporterId)?.name || "";
        item["podCustomBrokerName"] =
          customerMap.get(item.podCustomBrokerId)?.name || "";
        item["shippingAgentName"] =
          customerMap.get(item.shippingAgentId)?.name || "";
        item["slotOwnerName"] = customerMap.get(item.slotOwnerId)?.name || "";
        item["mloName"] = customerMap.get(item.mloId)?.name || "";
        item["createdByCompanyName"] =
          customerMap.get(item.createdByCompanyId)?.name || "";
        item["fpdAgentName"] = customerMap.get(item.fpdAgentId)?.name || "";
        item["surveyorName"] = customerMap.get(item.surveyorId)?.name || "";
        item["plrAgentName"] = customerMap.get(item.plrAgentId)?.name || "";
        // Assuming you want to extract the branch name for the customer
        item["companyBranchName"] =
          CompanyBranchMap.get(item.companybranchId)?.name || "";
        item["consigneeBranchName"] =
          CompanyBranchMap.get(item.consigneeBranchId)?.name || "";
        item["shipperBranchName"] =
          CompanyBranchMap.get(item.shipperBranchId)?.name || "";
        item["customerBranchName"] =
          CompanyBranchMap.get(item.customerBranchId)?.name || "";
        item["agentBranchName"] =
          CompanyBranchMap.get(item.agentBranchId)?.name || "";
        item["notifyPartyBranchName"] =
          CompanyBranchMap.get(item.notifyPartyBranchId)?.name || "";
        item["createdByCompanyBranchName"] =
          CompanyBranchMap.get(item.createdByCompanyBranchId)?.name || "";
        item["polAgentBranchName"] =
          CompanyBranchMap.get(item.polAgentBranchId)?.name || "";
        item["podAgentBranchName"] =
          CompanyBranchMap.get(item.podAgentBranchId)?.name || "";
        item["surveyorBranchName"] =
          CompanyBranchMap.get(item.surveyorBranchId)?.name || "";
        item["fpdAgentBranchName"] =
          CompanyBranchMap.get(item.fpdAgentBranchId)?.name || "";
        item["plrAgentBranchName"] =
          CompanyBranchMap.get(item.plrAgentBranchId)?.name || "";

        //company branch person
        item["salesExecutiveName"] =
          CompanyBranchPerson.get(item.salesExecutiveId)?.name || "";
        item["pricingPersonName"] =
          CompanyBranchPerson.get(item.pricingPersonId)?.name || "";
        item["customerServicePersonName"] =
          CompanyBranchPerson.get(item.customerServicePersonId)?.name || "";
        item["backOfficePersonName"] =
          CompanyBranchPerson.get(item.backOfficePersonId)?.name || "";
        item["sellPersonName"] =
          CompanyBranchPerson.get(item.sellPersonId)?.name || "";
        item["customerClearancePersonName"] =
          CompanyBranchPerson.get(item.customerClearancePersonId)?.name || "";
        // financial year
        item["financialYear"] =
          finYearMap.get(item.finYearId)?.financialYear || "";

        //countryMap
        item["destinationCountryName"] =
          CountryMap.get(item.destinationCountryId)?.name || "";
        item["originCountryName"] =
          CountryMap.get(item.originCountryId)?.name || "";

        //MasterData
        item["tradeTermsName"] =
          MasterDataMap.get(item.tradeTermsId)?.name || "";
        item["natureOfCargoName"] =
          MasterDataMap.get(item.natureOfCargoId)?.name || "";
        item["stuffingTypeName"] =
          MasterDataMap.get(item.stuffingTypeId)?.name || "";
        item["containerStatusName"] =
          MasterDataMap.get(item.containerStatusId)?.name || "";
        item["preCarriageName"] =
          MasterDataMap.get(item.preCarriageId)?.name || "";
        item["destuffingTypeName"] =
          MasterDataMap.get(item.destuffingTypeId)?.name || "";
        item["cargoTypeName"] = MasterDataMap.get(item.cargoTypeId)?.name || "";
        item["cargoWtUnitName"] =
          MasterDataMap.get(item.cargoWtUnitId)?.name || "";
        item["packageName"] = MasterDataMap.get(item.packageId)?.name || "";
        item["commodityTypeName"] =
          MasterDataMap.get(item.commodityTypeId)?.name || "";
        item["volumeUnitName"] =
          MasterDataMap.get(item.volumeUnitId)?.name || "";
        item["chargeableWtUnitName"] =
          MasterDataMap.get(item.chargeableWtUnitId)?.name || "";
        item["postCarriageName"] =
          MasterDataMap.get(item.postCarriage)?.name || "";
        item["netWtUnitName"] = MasterDataMap.get(item.netWtUnitId)?.name || "";
        item["routeName"] = MasterDataMap.get(item.routeId)?.name || "";
        item["demmuragecurrencyName"] =
          MasterDataMap.get(item.demmuragecurrency)?.name || "";

        //voyage
        item["polVoyageName"] = VoyageMap.get(item.polVoyageId)?.name || "";
        //vessel
        item["polVesselName"] = VesselMap.get(item.polVesselId)?.name || "";
        item["podVesselName"] = VesselMap.get(item.podVesselId)?.name || "";
        //pol terminal
        item["polTerminalName"] =
          polTerminalMap.get(item.polTerminalId)?.name || "";
        // business segment
        item["businessSegmentName"] =
          businessSegmentMap.get(item.businessSegmentId)?.name || "";
        // rate request
        item["rateRequestName"] =
          rateRequestMap.get(item.rateRequestId)?.name || "";
        // Job map
        item["masterJobName"] = JobMap.get(item.masterJobId)?.name || "";
        // tblJobQty
        item.tblJobQty &&
          item.tblJobQty.map((item) => {
            //maserData
            item["sizeName"] = MasterDataMap.get(item.sizeId)?.name || "";
            item["typeName"] = MasterDataMap.get(item.typeId)?.name || "";
            item["dimensionUnitName"] =
              MasterDataMap.get(item.dimensionUnitId)?.name || "";
            item["wtUnitName"] = MasterDataMap.get(item.wtUnitId)?.name || "";
            item["volumeUnitName"] =
              MasterDataMap.get(item.volumeUnitId)?.name || "";
            item["depotName"] = portMap.get(item.depotId)?.name || "";
            item["containerName"] =
              containerMap.get(item.containerId)?.name || "";
          });
        // tblJobContainer
        item.tblJobContainer &&
          item.tblJobContainer.map((item) => {
            item["sizeName"] = MasterDataMap.get(item.sizeId)?.name || "";
            item["typeName"] = MasterDataMap.get(item.typeId)?.name || "";
            item["containerStatusName"] =
              MasterDataMap.get(item.containerStatusId)?.name || "";
            item["grossWtUnitName"] =
              MasterDataMap.get(item.grossWtUnitId)?.name || "";
            item["tareWtUnitName"] =
              MasterDataMap.get(item.tareWtUnitId)?.name || "";
            item["refTempUnitName"] =
              MasterDataMap.get(item.refTempUnitId)?.name || "";
            item["packageName"] = MasterDataMap.get(item.packageId)?.name || "";
            item["dimensionUnitName"] =
              MasterDataMap.get(item.dimensionUnitId)?.name || "";
            item["TransporterName"] =
              MasterDataMap.get(item.TransporterId)?.name || "";
            item["volumeUnitName"] =
              MasterDataMap.get(item.volumeUnitId)?.name || "";
            item["cargoTypeName"] =
              MasterDataMap.get(item.cargoTypeId)?.name || "";
            item["slotOwnerName"] =
              customerMap.get(item.cargoTypeId)?.name || "";
          });
        // tblJobCharge
        item.tblJobCharge &&
          item.tblJobCharge.map((item) => {
            item["sizeName"] = MasterDataMap.get(item.sizeId)?.name || "";
            item["typeName"] = MasterDataMap.get(item.typeId)?.name || "";
            item["unitName"] = MasterDataMap.get(item.unitId)?.name || "";
            item["buyCurrencyName"] =
              MasterDataMap.get(item.buyCurrencyId)?.name || "";
            item["sellCurrencyName"] =
              MasterDataMap.get(item.sellCurrencyId)?.name || "";
            item["buyPrepaidCollectName"] =
              MasterDataMap.get(item.buyPrepaidCollectId)?.name || "";
            item["sellPrepaidCollectName"] =
              MasterDataMap.get(item.sellPrepaidCollectid)?.name || "";
            item["dueToName"] = MasterDataMap.get(item.dueToId)?.name || "";
            item["chargeName"] = chargeMap.get(item.chargeId)?.name || "";
            item["buyPartyName"] = chargeMap.get(item.buyPartyId)?.name || "";
            item["sellPartyName"] = chargeMap.get(item.sellPartyId)?.name || "";
          });
        // tblJobActivity
        item.tblJobActivity &&
          item.tblJobActivity.map((item) => {
            item["activityPersonId"] =
              CompanyBranchPerson.get(item.activityPersonId)?.name || "";
            item["activityName"] =
              MasterDataMap.get(item.activityId)?.name || "";
          });
      });

      if (data.length > 0) {
        res.send({
          success: true,
          message: "Data fetched successfully",
          // reultofQueryData: resultOfqueryData,
          data: data,
        });
      } else {
        res.send({
          success: false,
          message: "Data not fetched successfully",
          data: data,
        });
      }
    } catch (error) {
      res.status(500).send({
        success: false,
        message: "Something went wrong",
        data: error.message,
      });
    }
  },
  AuditTrailLogDynamicReport: async (req, res) => {
    const validationRule = {
      tableName: "required",
    };
    validate(req.body, validationRule, {}, async (err, status) => {
      if (!status) {
        res.status(403).send({
          success: false,
          message: "validation error",
          data: err,
        });
      } else {
        try {
          const {
            tableName,
            fromDate,
            toDate,
            companyId,
            companyBranchId,
            finYearId,
            ipAddress,
          } = req.body;
          let matchData = { clientCode: req.clientCode };
          FilterCondition(matchData, body);
          if (tableName) {
            matchData["tableName"] = tableName;
          }
          if (fromDate && toDate) {
            matchData["createdDate"] = {
              $gte: new Date(fromDate),
              $lte: new Date(toDate),
            };
          } else if (fromDate) {
            matchData["createdDate"] = {
              $gte: new Date(fromDate),
            };
          } else if (toDate) {
            matchData["createdDate"] = {
              $lte: new Date(toDate),
            };
          }
          if (companyId && companyId != "") {
            matchData["companyId"] = companyId;
          }
          if (companyBranchId && companyBranchId != "") {
            matchData["companyBranchId"] = companyBranchId;
          }
          if (finYearId && finYearId != "") {
            matchData["finYearId"] = finYearId;
          }
          if (ipAddress && ipAddress != "") {
            matchData["ipAddress"] = ipAddress;
          }
          let query = [
            {
              $match: matchData,
            },
            { $project: { previousField: 0, updateFields: 0 } },
            {
              $sort: { _id: -1 },
            },
          ];
          let data = await model.AggregateFetchData(
            "tblAuditLog",
            "tblAuditLog",
            query,
            res
          );
          //                    // console.log(data.length);
          res.send({
            success: true,
            message: "Data fetched successfully",
            data: data,
          }); // model.AuditTrailLog(req.body, res)
        } catch (error) {
          errorLogger(error, req);
          res.status(500).send({
            success: false,
            message: "Something went wrong",
            data: error.message,
          });
        }
      }
    });
  },
  RateRequestDynamicReport: async (req, res) => {
    try {
      let matchData = { status: Number(process.env.ACTIVE_STATUS) };
      let { body } = req;
      FilterCondition(matchData, body);
      if (req.query.status) {
        matchData["status"] = Number(req.query.status);
      }
      if (body.plrId && body.plrId != "undefined" && body.plrId !== "") {
        matchData["plrId"] = Number(body.plrId);
      }
      if (body._id && body._id != "undefined" && body._id !== "") {
        matchData["_id"] = new mongoose.Types.ObjectId(body._id);
      }
      if (body.polID && body.polID != "undefined" && body.polID !== "") {
        matchData["polId"] = Number(body.polID);
      }
      if (body.podId && body.podId != "undefined" && body.podId !== "") {
        matchData["podId"] = Number(body.podId);
      }
      if (body.fpdID && body.fpdID != "undefined" && body.fpdID !== "") {
        matchData["fpdID"] = Number(body.fpdID);
      }
      if (body.id && body.id != "undefined" && body.id !== "") {
        matchData["id"] = Number(body.id);
      }
      if (
        body.shipperId &&
        body.shipperId != "undefined" &&
        body.shipperId !== ""
      ) {
        matchData["shipperId"] = Number(body.shipperId);
      }
      if (
        body.consigneeId &&
        body.consigneeId != "undefined" &&
        body.consigneeId !== ""
      ) {
        matchData["consigneeId"] = Number(body.consigneeId);
      }

      let page = parseInt(req.query.page, 10) || 1;
      let pageSize = parseInt(req.query.pageSize, 10) || 200;
      let skipCount = (page - 1) * pageSize;

      let projection = req.body.projection || {};
      let query = [
        {
          $match: matchData,
        },
        {
          $sort: {
            id: 1,
          },
        },
        {
          $skip: skipCount,
        },
        {
          $limit: 100,
        },
      ];

      if (Object.keys(projection).length > 0) {
        query.push({
          $project: projection,
        });
      }

      let data = await model.AggregateFetchData(
        "tblRateRequest",
        "tblRateRequest",
        query,
        res
      );
      //console.log(data.length);

      let plrId = new Set();
      let polId = new Set();
      let podId = new Set();
      let fpdId = new Set();
      //
      let brachId = new Set();
      let destinationFreeDays = new Set();
      let srNo = new Set();
      let enquiryId = new Set();
      let preparedById = new Set();
      let commodityType = new Set();
      let containerStatusId = new Set();
      let validityTo = new Set();
      let cargoWt = new Set();
      let chargeableWt = new Set();

      let customerId = new Set();
      let shipperId = new Set();
      let consigneeId = new Set();
      let CurrencyId = new Set();
      let agentId = new Set();
      let natureOfCargoId = new Set();
      let slotOwnerId = new Set();
      let companyId = new Set();
      let companyBranchId = new Set();
      let finYearId = new Set();
      let salesExecutiveId = new Set();
      let cargoTypeId = new Set();
      let agentBranchId = new Set();
      let podAgentId = new Set();
      let podAgentBranchId = new Set();
      let fpdAgentId = new Set();
      let fpdAgentBranchId = new Set();
      let routeId = new Set();
      let plrAgentId = new Set();
      let plrAgentBranchId = new Set();
      let polAgentId = new Set();
      let cargoWtUnitId = new Set();
      let volumeUnitId = new Set();
      let tradeTermsId = new Set();
      let packageId = new Set();
      let originCountryId = new Set();
      let destinationCountryId = new Set();
      let mlo = new Set();

      let customStationId = new Set();
      let businessSegmentId = new Set();

      //tblRateRequestQty
      let sizeId = new Set();
      let typeId = new Set();
      let dimensionUnitId = new Set();
      let wtUnitId = new Set();

      let chargeId = new Set();
      let sellCurrencyId = new Set();
      let buyCurrencyId = new Set();
      let PrepaidCollectId = new Set();
      let vendorId = new Set();

      data.forEach((item) => {
        plrId.add(createObjectId(item.plrId));
        polId.add(createObjectId(item.polId));
        podId.add(createObjectId(item.podId));
        fpdId.add(createObjectId(item.fpdId));
        brachId.add(createObjectId(item.brachId));
        finYearId.add(createObjectId(item.finYearId));
        shipperId.add(createObjectId(item.shipperId));
        consigneeId.add(createObjectId(item.consigneeId));
        agentId.add(createObjectId(item.agentId));
        natureOfCargoId.add(createObjectId(item.natureOfCargoId));
        slotOwnerId.add(createObjectId(item.slotOwnerId));
        companyId.add(createObjectId(item.companyId));
        customerId.add(createObjectId(item.customerId));
        companyBranchId.add(createObjectId(item.companyBranchId));
        cargoWtUnitId.add(createObjectId(item.cargoWtUnitId));
        volumeUnitId.add(createObjectId(item.volumeUnitId));
        tradeTermsId.add(createObjectId(item.tradeTermsId));
        packageId.add(createObjectId(item.packageId));
        originCountryId.add(createObjectId(item.originCountryId));
        destinationCountryId.add(createObjectId(item.destinationCountryId));
        CurrencyId.add(createObjectId(item.CurrencyId));
        salesExecutiveId.add(item.salesExecutiveId);
        cargoTypeId.add(createObjectId(item.cargoTypeId));
        agentBranchId.add(createObjectId(item.agentBranchId));
        mlo.add(createObjectId(item.mlo));
        podAgentBranchId.add(createObjectId(item.podAgentBranchId));
        fpdAgentBranchId.add(createObjectId(item.fpdAgentBranchId));
        plrAgentBranchId.add(createObjectId(item.plrAgentBranchId));

        // Schema Columns

        businessSegmentId.add(createObjectId(item.businessSegmentId));
        srNo.add(createObjectId(item.srNo));
        enquiryId.add(createObjectId(item.enquiryId));
        destinationFreeDays.add(createObjectId(item.destinationFreeDays));
        preparedById.add(createObjectId(item.preparedById));
        commodityType.add(createObjectId(item.commodityType));
        containerStatusId.add(createObjectId(item.containerStatusId));
        routeId.add(createObjectId(item.routeId));
        cargoWt.add(createObjectId(item.cargoWt));
        chargeableWt.add(createObjectId(item.chargeableWt));

        //tblRateRequestQty
        item.tblRateRequestQty &&
          item.tblRateRequestQty.map((x) => {
            // console.log("x", x);
            sizeId.add(createObjectId(x.sizeId));
            typeId.add(createObjectId(x.typeId));
            dimensionUnitId.add(createObjectId(x.dimensionUnitId));
            wtUnitId.add(createObjectId(x.wtUnitId));
            volumeUnitId.add(createObjectId(x.volumeUnitId));
            packageId.add(createObjectId(x.packageId));
          });
        item.tblRateRequestCharge &&
          item.tblRateRequestCharge.map((x) => {
            chargeId.add(createObjectId(x.chargeId));
            sizeId.add(createObjectId(x.sizeId));
            typeId.add(createObjectId(x.typeId));
            sellCurrencyId.add(createObjectId(x.sellCurrencyId));
            buyCurrencyId.add(createObjectId(x.buyCurrencyId));
            PrepaidCollectId.add(createObjectId(x.PrepaidCollectId));
            vendorId.add(createObjectId(x.vendorId));
          });
        item.tblRateRequestPlan &&
          item.tblRateRequestPlan.map((x) => {
            vendorId.add(createObjectId(x.vendorId));
          });
      });
      const tables = [
        {
          tableName: "tblPort",
          query: [
            {
              $match: {
                $or: [
                  { _id: { $in: Array.from(plrId) } },
                  { _id: { $in: Array.from(polId) } },
                  { _id: { $in: Array.from(podId) } },
                  { _id: { $in: Array.from(fpdId) } },
                ],
                status: Number(process.env.ACTIVE_STATUS),
              },
            },
          ],
        },
        {
          tableName: "tblCompany",
          query: [
            {
              $match: {
                $or: [
                  { _id: { $in: Array.from(customerId) } },
                  { _id: { $in: Array.from(shipperId) } },
                  { _id: { $in: Array.from(consigneeId) } },
                  { _id: { $in: Array.from(companyId) } },
                  { _id: { $in: Array.from(podAgentId) } },
                  { _id: { $in: Array.from(polAgentId) } },
                  { _id: { $in: Array.from(agentId) } },
                  { _id: { $in: Array.from(slotOwnerId) } },
                  { _id: { $in: Array.from(fpdAgentId) } },
                  { _id: { $in: Array.from(plrAgentId) } },
                  { _id: { $in: Array.from(mlo) } },
                  { _id: { $in: Array.from(customStationId) } },
                  { _id: { $in: Array.from(vendorId) } },
                ],
              },
            },
          ],
        },
        {
          tableName: "tblCompany",
          query: [
            {
              $unwind: {
                path: "$tblCompanyBranch",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                tblCompanyBranch: { $exists: true, $ne: null },
                $or: [
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(companyBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": { $in: Array.from(agentBranchId) },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(podAgentBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(fpdAgentBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(plrAgentBranchId),
                    },
                  },
                  { "tblCompanyBranch._id": { $in: Array.from(brachId) } },
                  // Add more conditions here if needed, each enclosed in {}
                ],
              },
            },
          ],
        },
        {
          tableName: "tblCompany",
          query: [
            {
              $unwind: {
                path: "$tblCompanyBranch",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $unwind: {
                path: "$tblCompanyBranch.tblCompanyBranchPerson",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                "tblCompanyBranch.tblCompanyBranchPerson": {
                  $exists: true,
                  $ne: null,
                },
                $or: [
                  {
                    "tblCompanyBranch.tblCompanyBranchPerson._id": {
                      $in: Array.from(salesExecutiveId),
                    },
                  },
                  // Add more conditions here if needed, each enclosed in {}
                ],
              },
            },
          ],
        },
        {
          tableName: "tblMasterData",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [
                  { _id: { $in: Array.from(cargoWtUnitId) } },
                  { _id: { $in: Array.from(cargoWt) } },
                  { _id: { $in: Array.from(volumeUnitId) } },
                  { _id: { $in: Array.from(tradeTermsId) } },
                  { _id: { $in: Array.from(packageId) } },
                  { _id: { $in: Array.from(CurrencyId) } },
                  { _id: { $in: Array.from(cargoTypeId) } },
                  { _id: { $in: Array.from(sizeId) } },
                  { _id: { $in: Array.from(typeId) } },
                  { _id: { $in: Array.from(dimensionUnitId) } },
                  { _id: { $in: Array.from(wtUnitId) } },
                  { _id: { $in: Array.from(buyCurrencyId) } },
                  { _id: { $in: Array.from(enquiryId) } },
                  { _id: { $in: Array.from(commodityType) } },
                  { _id: { $in: Array.from(containerStatusId) } },
                  { _id: { $in: Array.from(routeId) } },
                  { _id: { $in: Array.from(chargeableWt) } },
                  { _id: { $in: Array.from(PrepaidCollectId) } },
                  { _id: { $in: Array.from(sellCurrencyId) } },
                ],
              },
            },
          ],
        },
        {
          tableName: "tblCountry",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [
                  { _id: { $in: Array.from(destinationCountryId) } },
                  { _id: { $in: Array.from(originCountryId) } },
                ],
              },
            },
          ],
        },
        {
          tableName: "tblFinancialYear",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(finYearId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblCharge",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(chargeId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblBusinessSegment",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(businessSegmentId) } }],
              },
            },
          ],
        },
      ];
      const dataToQuery = tables.map((iterator) =>
        model.AggregateFetchData(
          iterator.tableName,
          iterator.tableName,
          iterator.query,
          res
        )
      );

      const resultOfQueryData = await Promise.all(dataToQuery);

      const portMap = new Map();
      const customerMap = new Map();
      const MasterDataMap = new Map();
      const finYearMap = new Map();
      const CompanyBranchMap = new Map();
      const CompanyBranchPerson = new Map();
      const CountryMap = new Map();
      const chargeMap = new Map();
      const businessSegmentMap = new Map();

      // tbl Port
      for (const item of resultOfQueryData[0]) {
        if (item._id !== undefined && item.name !== undefined) {
          portMap.set(item._id.toString(), item.name);
        }
      }
      // TBL customer
      for (const item of resultOfQueryData[1]) {
        if (item.oldId !== undefined) {
          customerMap.set(item._id.toString(), {
            name: item.name,
            branch: item.tblCompanyBranch,
          });
        }
      }
      // TBL CompanyBranchMap construction
      for (const item of resultOfQueryData[2]) {
        // Check if tblCompanyBranch exists and has the oldId property
        if (
          item.tblCompanyBranch &&
          item.tblCompanyBranch.oldId !== undefined
        ) {
          CompanyBranchMap.set(item.tblCompanyBranch?._id.toString(), {
            name: item.tblCompanyBranch.name,
          });
        }
      }
      for (const item of resultOfQueryData[3]) {
        // Check if tblCompanyBranch exists and has the oldId property
        if (
          item.tblCompanyBranch &&
          item.tblCompanyBranch.tblCompanyBranchPerson &&
          item.tblCompanyBranch.tblCompanyBranchPerson.oldId !== undefined
        ) {
          CompanyBranchPerson.set(
            item.tblCompanyBranch.tblCompanyBranchPerson._id.toString(),
            { name: item.tblCompanyBranch.tblCompanyBranchPerson.name }
          );
        }
      }
      // TBL masterdata
      for (const item of resultOfQueryData[4]) {
        if (item._id !== undefined && item.name !== undefined) {
          MasterDataMap.set(item._id.toString(), {
            name: item.name,
            code: item.code,
          });
        }
      }
      // TBL CountryMap
      for (const item of resultOfQueryData[5]) {
        if (item.oldId !== undefined && item.name !== undefined) {
          CountryMap.set(item._id.toString(), { name: item.name });
        }
      }
      // tBL FINANCIAL
      for (const item of resultOfQueryData[6]) {
        if (item._id !== undefined && item.financialYear !== undefined) {
          finYearMap.set(item._id.toString(), {
            financialYear: item.financialYear,
          });
        }
      }
      for (const item of resultOfQueryData[7]) {
        if (item._id !== undefined && item.name !== undefined) {
          chargeMap.set(item._id.toString(), { name: item.name });
        }
      }
      for (const item of resultOfQueryData[8]) {
        if (item._id !== undefined && item.name !== undefined) {
          businessSegmentMap.set(item._id.toString(), { name: item.name });
        }
      }

      data.forEach((item) => {
        //item["plrName"] = portMap.get(item.plrId)?.name || "";
        item["plrName"] = portMap.get(item.plrId) || "";
        item["polName"] = portMap.get(item.polId) || "";
        item["podName"] = portMap.get(item.podId) || "";
        item["fpdName"] = portMap.get(item.fpdId) || "";
        item["companyBranchName"] =
          CompanyBranchMap.get(item.brachId)?.name || "";

        //TBL customerMap
        const customerInfo = customerMap.get(item.customerId);

        item["customerName"] = customerInfo ? customerInfo.name : "";
        item["shipperName"] = customerMap.get(item.shipperId)?.name || "";
        item["agentName"] = customerMap.get(item.agentId)?.name || "";
        item["consigneeName"] = customerMap.get(item.consigneeId)?.name || "";
        item["podAgentName"] = customerMap.get(item.podAgentId)?.name || "";
        item["fpdAgentName"] = customerMap.get(item.fpdAgentId)?.name || "";
        item["plrAgentName"] = customerMap.get(item.plrAgentId)?.name || "";
        item["mloName"] = customerMap.get(item.mlo)?.name || "";
        item["customStationName"] =
          customerMap.get(item.customStationId)?.name || "";

        // TBL MasterDataMap
        item["natureOfCargoName"] =
          MasterDataMap.get(item.natureOfCargoId)?.name || "";
        item["cargoWtUnitName"] =
          MasterDataMap.get(item.cargoWtUnitId)?.name || "";
        item["volumeUnitName"] =
          MasterDataMap.get(item.volumeUnitId)?.name || "";
        item["volumeUnitNameCode"] =
          MasterDataMap.get(item.volumeUnitId)?.code || ""; //Komal

        item["tradeTermsName"] =
          MasterDataMap.get(item.tradeTermsId)?.name || "";
        item["packageName"] = MasterDataMap.get(item.packageId)?.name || "";
        item["CurrencyName"] = MasterDataMap.get(item.CurrencyId)?.name || "";
        item["cargoTypeName"] = MasterDataMap.get(item.cargoTypeId)?.name || "";
        //___________________
        item["enquiryName"] = MasterDataMap.get(item.enquiryId)?.name || "";
        item["commodityTypeName"] =
          MasterDataMap.get(item.commodityType)?.name || "";
        item["containerStatusName"] =
          MasterDataMap.get(item.containerStatusId)?.name || "";
        item["routeName"] = MasterDataMap.get(item.routeId)?.name || "";
        item["cargoWtUnitName"] = MasterDataMap.get(item.cargoWt)?.name || "";
        item["chargeableWtName"] =
          MasterDataMap.get(item.chargeableWt)?.name || "";

        // TBL company
        item["slotOwnerName"] = customerMap.get(item.slotOwnerId)?.name || "";
        item["companyName"] = customerMap.get(item.companyId)?.name || "";
        item["vendorName"] = customerMap.get(item.vendorId)?.name || "";

        // TBL companybranch
        //item["companyBranchName"] = CompanyBranchMap.get(item.companyBranchId)?.name || "";
        item["agentBranchName"] =
          CompanyBranchMap.get(item.agentBranchId)?.name || "";
        item["podAgentBranchName"] =
          CompanyBranchMap.get(item.podAgentBranchId)?.name || "";
        item["fpdAgentBranchName"] =
          CompanyBranchMap.get(item.fpdAgentBranchId)?.name || "";
        item["plrAgentBranchName"] =
          CompanyBranchMap.get(item.plrAgentBranchId)?.name || "";

        //  TBL CompanyBranchPerson
        item["salesExecutiveName"] =
          CompanyBranchPerson.get(item.salesExecutiveId)?.name || "";

        //TBL Country
        item["originCountryName"] =
          CountryMap.get(item.originCountryId)?.name || "";
        item["destinationCountryName"] =
          CountryMap.get(item.destinationCountryId)?.name || "";

        // financial year
        item["financialYear"] =
          finYearMap.get(item.finYearId)?.financialYear || "";
        item["businessSegmentName"] =
          businessSegmentMap.get(item.businessSegmentId)?.name || "";

        // tblRateRequestQty
        item.tblRateRequestQty &&
          item.tblRateRequestQty.map((item) => {
            //maserData
            item["sizeName"] = MasterDataMap.get(item.sizeId)?.name || "";
            item["typeName"] = MasterDataMap.get(item.typeId)?.name || "";
            item["dimensionUnitName"] =
              MasterDataMap.get(item.dimensionUnitId)?.name || "";
            item["wtUnitName"] = MasterDataMap.get(item.wtUnitId)?.code || "";
            item["volumeUnitName"] =
              MasterDataMap.get(item.volumeUnitId)?.name || "";
            item["packageName"] = MasterDataMap.get(item.packageId)?.name || "";
          });
        item.tblRateRequestCharge &&
          item.tblRateRequestCharge.map((item) => {
            item["chargeName"] = chargeMap.get(item.chargeId)?.name || "";
            item["sizeName"] = MasterDataMap.get(item.sizeId)?.name || "";
            item["typeName"] = MasterDataMap.get(item.typeId)?.name || "";
            item["typeCode"] = MasterDataMap.get(item.typeId)?.code || "";
            item["sellCurrencyName"] =
              MasterDataMap.get(item.sellCurrencyId)?.code || "";
            item["buyCurrencyName"] =
              MasterDataMap.get(item.buyCurrencyId)?.name || "";
            item["PrepaidCollectName"] =
              MasterDataMap.get(item.PrepaidCollectId)?.name || "";
            item["vendorName"] = customerMap.get(item.vendorId)?.name || "";
          });
        item.tblRateRequestPlan &&
          item.tblRateRequestPlan.map((item) => {
            item["vendorNamePlan"] = customerMap.get(item.vendorId)?.name || "";
          });
      });

      if (data && data.length > 0) {
        // plrId.add(createObjectId(item.plrId));
        res.send({
          success: true,
          message: "Data fetched successfully",
          data: data,
        });
      } else {
        res.send({
          success: false,
          message: "No data found",
          data: [],
        });
      }
    } catch (error) {
      res.status(500).send({
        success: false,
        message: "Something went wrong",
        data: error.message,
      });
    }
  },
  VoucherDynamicReport: async (req, res) => {
    try {
      let matchData = { status: Number(process.env.ACTIVE_STATUS) };
      let { body } = req;
      FilterCondition(matchData, body);
      if (req.query.status) {
        matchData["status"] = Number(req.query.status);
      }
      if (body.plrId && body.plrId != "undefined" && body.plrId !== "") {
        matchData["plrId"] = Number(body.plrId);
      }
      if (body._id && body._id != "undefined" && body._id !== "") {
        matchData["_id"] = new mongoose.Types.ObjectId(body._id);
      }
      if (body.polID && body.polID != "undefined" && body.polID !== "") {
        matchData["polId"] = Number(body.polID);
      }
      if (body.podId && body.podId != "undefined" && body.podId !== "") {
        matchData["podId"] = Number(body.podId);
      }
      if (body.fpdID && body.fpdID != "undefined" && body.fpdID !== "") {
        matchData["fpdID"] = Number(body.fpdID);
      }
      if (body.id && body.id != "undefined" && body.id !== "") {
        matchData["id"] = Number(body.id);
      }
      if (
        body.shipperId &&
        body.shipperId != "undefined" &&
        body.shipperId !== ""
      ) {
        matchData["shipperId"] = Number(body.shipperId);
      }
      if (
        body.consigneeId &&
        body.consigneeId != "undefined" &&
        body.consigneeId !== ""
      ) {
        matchData["consigneeId"] = Number(body.consigneeId);
      }

      let page = parseInt(req.query.page, 10) || 1;
      let pageSize = parseInt(req.query.pageSize, 10) || 200;
      let skipCount = (page - 1) * pageSize;

      let projection = req.body.projection || {};
      let query = [
        {
          $match: matchData,
        },
        {
          $sort: {
            id: 1,
          },
        },
        {
          $skip: skipCount,
        },
        {
          $limit: 100,
        },
      ];

      if (Object.keys(projection).length > 0) {
        query.push({
          $project: projection,
        });
      }

      let data = await model.AggregateFetchData(
        "tblVoucher",
        "tblVoucher",
        query,
        res
      );
      //console.log(data.length);

      let srNo = new Set();
      let voucherTypeId = new Set();
      let finYearId = new Set();
      let companyId = new Set();
      let companyBranchId = new Set();
      let currencyId = new Set();
      let createdByCompanyId = new Set();
      let createdByCompanyBranchId = new Set();

      // tblVoucherLedger
      let glId = new Set();
      let glTypeId = new Set(); // not join

      //  tblVoucherLedgerDetails
      let jobId = new Set();
      let companyBranchPersonId = new Set();
      let chargeId = new Set();
      let containerId = new Set();

      data.forEach((item) => {
        srNo.add(createObjectId(item.srNo));
        voucherTypeId.add(createObjectId(item.voucherTypeId));
        finYearId.add(createObjectId(item.finYearId));
        companyId.add(createObjectId(item.companyId));
        companyBranchId.add(createObjectId(item.companyBranchId));
        currencyId.add(createObjectId(item.currencyId));
        createdByCompanyId.add(createObjectId(item.createdByCompanyId));
        createdByCompanyBranchId.add(
          createObjectId(item.createdByCompanyBranchId)
        );

        item.tblVoucherLedger &&
          item.tblVoucherLedger.map((ledger) => {
            glId.add(createObjectId(ledger.glId));
            glTypeId.add(createObjectId(ledger.glTypeId));
            currencyId.add(createObjectId(ledger.currencyId));

            ledger.tblVoucherLedgerDetails &&
              ledger.tblVoucherLedgerDetails.map((detail) => {
                currencyId.add(createObjectId(detail.currencyId));
                jobId.add(createObjectId(detail.jobId));
                companyId.add(createObjectId(detail.companyId));
                companyBranchPersonId.add(
                  createObjectId(detail.companyBranchPersonId)
                );
                chargeId.add(createObjectId(detail.chargeId));
                containerId.add(createObjectId(detail.containerId));
              });
          });
      });
      // return console.log(companyBranchId);
      //const sizeIdArray = Array.from(sizeIds).map(id => mongoose.Types.ObjectId(id));
      const tables = [
        // 0  tblFinancialYear
        {
          tableName: "tblFinancialYear",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(finYearId) } }],
              },
            },
          ],
        },
        // 1  tblCompany
        {
          tableName: "tblCompany",
          query: [
            {
              $match: {
                $or: [
                  { _id: { $in: Array.from(companyId) } },
                  { _id: { $in: Array.from(createdByCompanyId) } },
                ],
              },
            },
          ],
        },
        // 2 tblCompanyBranch
        {
          tableName: "tblCompany",
          query: [
            {
              $unwind: {
                path: "$tblCompanyBranch",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                tblCompanyBranch: { $exists: true, $ne: null },
                $or: [
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(companyBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(createdByCompanyBranchId),
                    },
                  },
                ],
              },
            },
          ],
        },
        // 3 tblCompanyBranchPerson
        {
          tableName: "tblCompany",
          query: [
            {
              $unwind: {
                path: "$tblCompanyBranch",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $unwind: {
                path: "$tblCompanyBranch.tblCompanyBranchPerson",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                "tblCompanyBranch.tblCompanyBranchPerson": {
                  $exists: true,
                  $ne: null,
                },
                $or: [
                  {
                    "tblCompanyBranch.tblCompanyBranchPerson._id": {
                      $in: Array.from(companyBranchPersonId),
                    },
                  },
                  // Add more conditions here if needed, each enclosed in {}
                ],
              },
            },
          ],
        },
        // 4 tblVoucherType
        {
          tableName: "tblVoucherType",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(voucherTypeId) } }],
              },
            },
          ],
        },
        // 5 tblMasterData
        {
          tableName: "tblMasterData",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [
                  { _id: { $in: Array.from(currencyId) } },
                  { _id: { $in: Array.from(glTypeId) } },
                ],
              },
            },
          ],
        },
        // 6  tblGeneralLedger
        {
          tableName: "tblGeneralLedger",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(glId) } }],
              },
            },
          ],
        },
        // 7 tblJob
        {
          tableName: "tblJob",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(jobId) } }],
              },
            },
          ],
        },
        // 8 tblCharge
        {
          tableName: "tblCharge",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(chargeId) } }],
              },
            },
          ],
        },
        // 9  tblContainer
        {
          tableName: "tblContainer",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(containerId) } }],
              },
            },
          ],
        },
      ];
      const dataToQuery = tables.map((iterator) =>
        model.AggregateFetchData(
          iterator.tableName,
          iterator.tableName,
          iterator.query,
          res
        )
      );

      const resultOfQueryData = await Promise.all(dataToQuery);

      const finYearMap = new Map();
      const customerMap = new Map();
      const CompanyBranchMap = new Map();
      const VoucherTypeMap = new Map();
      const MasterDataMap = new Map();
      const GeneralLedgerMap = new Map();
      const JobMap = new Map();
      const CompanyBranchPerson = new Map();
      const chargeMap = new Map();
      const containerMap = new Map();

      //  finYearMap - 1
      for (const item of resultOfQueryData[0]) {
        if (item._id !== undefined && item.financialYear !== undefined) {
          finYearMap.set(item._id.toString(), {
            financialYear: item.financialYear,
          });
        }
      }
      // tblCompany - 2
      for (const item of resultOfQueryData[1]) {
        if (item.oldId !== undefined) {
          customerMap.set(item._id.toString(), { name: item.name });
        }
      }
      // tblCompanyBranch - 3
      for (const item of resultOfQueryData[2]) {
        // Check if tblCompanyBranch exists and has the oldId property
        if (
          item.tblCompanyBranch &&
          item.tblCompanyBranch.oldId !== undefined
        ) {
          CompanyBranchMap.set(item.tblCompanyBranch?._id.toString(), {
            name: item.tblCompanyBranch.name,
          });
        }
      }
      // tblCompanyBranchPerson - 4
      for (const item of resultOfQueryData[3]) {
        // Check if tblCompanyBranch exists and has the oldId property
        if (
          item.tblCompanyBranch &&
          item.tblCompanyBranch.tblCompanyBranchPerson &&
          item.tblCompanyBranch.tblCompanyBranchPerson.oldId !== undefined
        ) {
          CompanyBranchPerson.set(
            item.tblCompanyBranch.tblCompanyBranchPerson._id.toString(),
            { name: item.tblCompanyBranch.tblCompanyBranchPerson.name }
          );
        }
      }
      // tblVoucherType - 5
      for (const item of resultOfQueryData[4]) {
        if (item._id !== undefined && item.name !== undefined) {
          VoucherTypeMap.set(item._id.toString(), { name: item.name });
        }
      }
      // TBL masterdata - 6
      for (const item of resultOfQueryData[5]) {
        if (item._id !== undefined && item.name !== undefined) {
          MasterDataMap.set(item._id.toString(), { name: item.name });
        }
      }
      // GeneralLedgerMap - 7
      for (const item of resultOfQueryData[6]) {
        if (item._id !== undefined && item.name !== undefined) {
          GeneralLedgerMap.set(item._id.toString(), { name: item.name });
        }
      }
      // TBLJob - 8
      for (const item of resultOfQueryData[7]) {
        // Ensure the _id and jobNo properties are defined
        if (item._id !== undefined && item.jobNo !== undefined) {
          JobMap.set(item._id.toString(), { jobNo: item.jobNo });
        }
      }

      //  chargeMap - 9
      for (const item of resultOfQueryData[8]) {
        if (item._id !== undefined && item.name !== undefined) {
          chargeMap.set(item._id, { name: item.name });
        }
      }
      // containerMap - 10
      for (const item of resultOfQueryData[9]) {
        if (item._id !== undefined && item.name !== undefined) {
          containerMap.set(item._id, { name: item.name });
        }
      }

      data.forEach((item) => {
        //  finYearMap
        item["financialYear"] =
          finYearMap.get(item.finYearId)?.financialYear || "";

        // customerMap
        item["companyName"] = customerMap.get(item.companyId)?.name || "";
        item["createdByCompanyName"] =
          customerMap.get(item.createdByCompanyId)?.name || "";

        // CompanyBranchMap
        item["companyBranchName"] =
          CompanyBranchMap.get(item.companyBranchId)?.name || "";
        item["createdByCompanyBranchName"] =
          CompanyBranchMap.get(item.createdByCompanyBranchId)?.name || "";

        // VoucherTypeMap
        item["voucherTypeName"] =
          VoucherTypeMap.get(item.voucherTypeId)?.name || "";

        // MasterDataMap
        item["CurrencyName"] = MasterDataMap.get(item.currencyId)?.name || "";

        // tblVoucherLedger
        item.tblVoucherLedger &&
          item.tblVoucherLedger.map((item) => {
            // MasterDataMap
            item["CurrencyName"] =
              MasterDataMap.get(item.currencyId)?.name || "";
            item["glTypeName"] = MasterDataMap.get(item.glTypeId)?.name || "";
            item["glName"] = GeneralLedgerMap.get(item.glId)?.name || "";
            item.tblVoucherLedgerDetails &&
              item.tblVoucherLedgerDetails.map((item) => {
                // MasterDataMap
                item["CurrencyName"] =
                  MasterDataMap.get(item.currencyId)?.name || "";

                item["JobName"] = JobMap.get(item.jobId)?.jobNo || ""; // Not found

                item["companyName"] =
                  customerMap.get(item.companyId)?.name || "";
                item["companyBranchName"] =
                  CompanyBranchMap.get(item.companyBranchId)?.name || "";

                item["companyBranchPersonName"] =
                  CompanyBranchPerson.get(item.companyBranchPersonId)?.name ||
                  ""; // not found
                item["chargeName"] = chargeMap.get(item.chargeId)?.name || ""; // not found
                item["containerName"] =
                  containerMap.get(item.containerId)?.name || "";
              });
          });
      });

      if (data && data.length > 0) {
        // plrId.add(createObjectId(item.plrId));
        res.send({
          success: true,
          message: "Data fetched successfully",
          data: data,
        });
      } else {
        res.send({
          success: false,
          message: "No data found",
          data: [],
        });
      }
    } catch (error) {
      res.status(500).send({
        success: false,
        message: "Something went wrong",
        data: error.message,
      });
    }
  },
  InvoicesDynamicReport: async (req, res) => {
    try {
      let matchData = { status: Number(process.env.ACTIVE_STATUS) };
      let { body } = req;
      FilterCondition(matchData, body);
      if (req.query.status) {
        matchData["status"] = Number(req.query.status);
      }
      if (body.id && body.id != "undefined" && body.id !== "") {
        matchData["id"] = Number(body.id);
      }
      if (body.plrId && body.plrId != "undefined" && body.plrId !== "") {
        matchData["plrId"] = Number(body.plrId);
      }
      if (body.polID && body.polID != "undefined" && body.polID !== "") {
        matchData["polID"] = Number(body.polID);
      }
      if (body.podId && body.podId != "undefined" && body.podId !== "") {
        matchData["podId"] = Number(body.podId);
      }
      if (body.fpdID && body.fpdID != "undefined" && body.fpdID !== "") {
        matchData["fpdID"] = Number(body.fpdID);
      }
      if (body.id && body.id != "undefined" && body.id !== "") {
        matchData["id"] = Number(body.id);
      }
      if (
        body.voucherTypeId &&
        body.voucherTypeId != "undefined" &&
        body.voucherTypeId !== ""
      ) {
        matchData["voucherTypeId"] = Number(body.voucherTypeId);
      }
      if (
        body.billingPartyId &&
        body.billingPartyId != "undefined" &&
        body.billingPartyId !== ""
      ) {
        matchData["billingPartyId"] = Number(body.billingPartyId);
      }
      if (body.srNo && body.srNo != "undefined" && body.srNo !== "") {
        matchData["srNo"] = Number(body.srNo);
      }
      if (
        body.billingPartyStateId &&
        body.billingPartyStateId != "undefined" &&
        body.billingPartyStateId !== ""
      ) {
        matchData["billingPartyStateId"] = Number(body.billingPartyStateId);
      }
      if (
        body.countryId &&
        body.countryId != "undefined" &&
        body.countryId !== ""
      ) {
        matchData["countryId"] = Number(body.countryId);
      }
      if (
        body.invoiceDate &&
        body.invoiceDate != "undefined" &&
        body.invoiceDate !== ""
      ) {
        matchData["invoiceDate"] = Number(body.invoiceDate);
      }

      let page = parseInt(req.query.page, 10) || 1;
      let pageSize = parseInt(req.query.pageSize, 10) || 200;
      let skipCount = (page - 1) * pageSize;
      let projection = req.body.projection || {};
      let query = [
        {
          $match: matchData,
        },
        {
          $sort: {
            id: 1,
          },
        },
        {
          $skip: skipCount,
        },
        {
          $limit: 100,
        },
      ];

      // Check if the projection object is not empty
      if (Object.keys(projection).length > 0) {
        query.push({
          $project: projection,
        });
      }

      let data = await model.AggregateFetchData(
        "tblInvoice",
        "tblInvoice",
        query,
        res
      );
      console.log(data.length);

      let plrId = new Set();
      let polId = new Set();
      let podId = new Set();
      let fpdId = new Set();
      let voucherTypeId = new Set();
      let billingPartyId = new Set();
      let srNo = new Set();
      let billingPartyStateId = new Set();
      let countryId = new Set();
      let invoiceDate = new Set();
      let finYearId = new Set();
      let jobId = new Set();
      let currencyId = new Set();
      let formControlId = new Set();
      let invoiceNo = new Set();
      let companyBranchId = new Set();
      let companyId = new Set();
      let vesselId = new Set();
      let voyageId = new Set();
      let blId = new Set();
      let voucherId = new Set();
      let parentInvoiceId = new Set();
      let fromLocationId = new Set();
      let toLocationId = new Set();
      let billingPartyBranchId = new Set();
      let bankId = new Set();
      let departmentId = new Set();
      let agentId = new Set();
      let depotId = new Set();
      let createdByCompanyId = new Set();
      let createdByCompanyBranchId = new Set();
      let billingPartyGstinNoId = new Set();
      let ownStateId = new Set();
      let polTerminalId = new Set();
      let placeOfSupplyStateId = new Set();
      let proformaInvoiceId = new Set();
      let principalId = new Set();
      let ownGstinNoId = new Set();

      //tblInvoiceCharge
      let chargeId = new Set();
      let sizeId = new Set();
      let typeId = new Set();
      let unitId = new Set();
      let chargeGlId = new Set();

      //tblInvoiceChargeTax
      let taxId = new Set();
      let taxDetailId = new Set();

      //tblInvoiceChargeTds
      let tdsId = new Set();
      let tdsDetailId = new Set();

      //tblInvoiceChargeDetails
      let containerId = new Set();

      data.forEach((item) => {
        console.log(createObjectId(item.jobId));
        plrId.add(createObjectId(item.plrId));
        polId.add(createObjectId(item.polId));
        podId.add(createObjectId(item.podId));
        fpdId.add(createObjectId(item.fpdId));
        voucherTypeId.add(createObjectId(item.voucherTypeId));
        billingPartyId.add(createObjectId(item.billingPartyId));
        srNo.add(createObjectId(item.srNo));
        billingPartyStateId.add(createObjectId(item.billingPartyStateId));
        countryId.add(createObjectId(item.countryId));
        invoiceDate.add(createObjectId(item.invoiceDate));
        jobId.add(createObjectId(item.jobId));
        finYearId.add(createObjectId(item.finYearId));
        currencyId.add(createObjectId(item.currencyId));
        formControlId.add(createObjectId(item.formControlId));
        invoiceNo.add(createObjectId(item.invoiceNo));
        companyBranchId.add(createObjectId(item.companyBranchId));
        companyId.add(createObjectId(item.companyId));

        vesselId.add(createObjectId(item.vesselId));
        voyageId.add(createObjectId(item.voyageId));
        blId.add(createObjectId(item.blId));
        voucherId.add(createObjectId(item.voucherId));
        parentInvoiceId.add(createObjectId(item.parentInvoiceId));
        fromLocationId.add(createObjectId(item.fromLocationId));
        toLocationId.add(createObjectId(item.toLocationId));
        billingPartyBranchId.add(createObjectId(item.billingPartyBranchId));
        bankId.add(createObjectId(item.bankId));
        departmentId.add(createObjectId(item.departmentId));
        depotId.add(createObjectId(item.depotId));
        agentId.add(createObjectId(item.agentId));
        principalId.add(createObjectId(item.principalId));
        createdByCompanyId.add(createObjectId(item.createdByCompanyId));
        createdByCompanyBranchId.add(
          createObjectId(item.createdByCompanyBranchId)
        );
        billingPartyGstinNoId.add(createObjectId(item.billingPartyGstinNoId));
        ownStateId.add(createObjectId(item.ownStateId));
        ownGstinNoId.add(createObjectId(item.ownGstinNoId));
        placeOfSupplyStateId.add(createObjectId(item.placeOfSupplyStateId));
        polTerminalId.add(createObjectId(item.polTerminalId));
        proformaInvoiceId.add(createObjectId(item.proformaInvoiceId));

        ///tblInvoiceCharge
        item.tblInvoiceCharge &&
          item.tblInvoiceCharge.map((x) => {
            console.log("x", x);
            chargeId.add(createObjectId(x.chargeId));
            unitId.add(createObjectId(x.unitId));
            sizeId.add(createObjectId(x.sizeId));
            typeId.add(createObjectId(x.typeId));
            chargeGlId.add(createObjectId(x.chargeGlId));
          }),
          //tblInvoiceChargeTax
          item.tblInvoiceChargeTax &&
            item.tblInvoiceChargeTax.map((x) => {
              console.log("x", x);
              taxId.add(createObjectId(x.taxId));
              taxDetailId.add(createObjectId(x.taxDetailId));
            });
        ///tblInvoiceChargeDetails
        item.tblInvoiceChargeDetails &&
          item.tblInvoiceChargeDetails.map((x) => {
            console.log("x", x);
            containerId.add(createObjectId(x.containerId));
          });
      });
      const tables = [
        //0
        {
          tableName: "tblPort",
          query: [
            {
              $match: {
                $or: [
                  { portId: { $in: Array.from(plrId) } },
                  { portId: { $in: Array.from(polId) } },
                  { portId: { $in: Array.from(podId) } },
                  { portId: { $in: Array.from(fpdId) } },
                ],
                status: Number(process.env.ACTIVE_STATUS),
              },
            },
          ],
        },
        //1
        {
          tableName: "tblCompany",
          query: [
            {
              $match: {
                $or: [
                  { _id: { $in: Array.from(companyId) } },
                  { _id: { $in: Array.from(principalId) } },
                  { _id: { $in: Array.from(agentId) } },
                  { _id: { $in: Array.from(billingPartyId) } },
                ],
              },
            },
          ],
        },
        //2
        {
          tableName: "tblCompany",
          query: [
            {
              $unwind: {
                path: "$tblCompanyBranch",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                tblCompanyBranch: { $exists: true, $ne: null },
                $or: [
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(companyBranchId),
                    },
                  },
                ],
              },
            },
          ],
        },
        //3
        {
          tableName: "tblCharge",
          query: [
            {
              $match: {
                $or: [{ _id: { $in: Array.from(chargeId) } }],
              },
            },
          ],
        },
        //4
        {
          tableName: "tblMasterData",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [
                  { _id: { $in: Array.from(sizeId) } },
                  { _id: { $in: Array.from(typeId) } },
                  { _id: { $in: Array.from(unitId) } },
                  { _id: { $in: Array.from(currencyId) } },
                ],
              },
            },
          ],
        },
        //5
        {
          tableName: "tblGeneralLedger",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(chargeGlId) } }],
              },
            },
          ],
        },
        //6
        {
          tableName: "tblTax",
          query: [
            {
              $unwind: {
                path: "$tblTaxDetails",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                tblTaxDetails: { $exists: true, $ne: null },
                $or: [
                  { "tblTaxDetails._id": { $in: Array.from(taxDetailId) } },
                ],
              },
            },
          ],
        },
        //7
        {
          tableName: "tblTds",
          query: [
            {
              $unwind: {
                path: "$tblTdsDetails",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                tblTdsDetails: { $exists: true, $ne: null },
                $or: [
                  { "tblTdsDetails._id": { $in: Array.from(tdsDetailId) } },
                ],
              },
            },
          ],
        },
        //8
        {
          tableName: "tblVesselFlight",
          query: [
            {
              $unwind: {
                path: "$tblVoyage",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                tblVoyage: { $exists: true, $ne: null },
                $or: [{ "tblVoyage._id": { $in: Array.from(voyageId) } }],
              },
            },
          ],
        },
        //9
        {
          tableName: "tblFinancialYear",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(finYearId) } }],
              },
            },
          ],
        },
        //10
        {
          tableName: "tblContainer",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(containerId) } }],
              },
            },
          ],
        },
        //11
        {
          tableName: "tblCountry",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(countryId) } }],
              },
            },
          ],
        },
        //12
        {
          tableName: "tblCountry",
          query: [
            {
              $unwind: {
                path: "$tblState",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                tblState: { $exists: true, $ne: null },
                $or: [
                  { "tblState._id": { $in: Array.from(billingPartyStateId) } },
                  { "tblState._id": { $in: Array.from(placeOfSupplyStateId) } },
                ],
              },
            },
          ],
        },
        //13
        {
          tableName: "tblVoucherType",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(voucherTypeId) } }],
              },
            },
          ],
        },
        //14
        {
          tableName: "tblJob",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(jobId) } }],
              },
            },
          ],
        },
        //15
        {
          tableName: "tblBl",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(blId) } }],
              },
            },
          ],
        },
      ];

      const dataToQuery = tables.map((iterator) =>
        model.AggregateFetchData(
          iterator.tableName,
          iterator.tableName,
          iterator.query,
          res
        )
      );

      const resultOfQueryData = await Promise.all(dataToQuery);
      const portMap = new Map(); //0
      const customerMap = new Map(); //1
      const CompanyBranchMap = new Map(); //2
      const chargeMap = new Map(); //3
      const MasterDataMap = new Map(); //4
      const generalLedgerMap = new Map(); //5
      const tax = new Map(); //6
      const tds = new Map(); //7
      const VoyageMap = new Map(); //8
      const finYearMap = new Map(); //9
      const containerMap = new Map(); //10
      const CountryMap = new Map(); //11
      const CountryStateMap = new Map(); //12
      const voucherType = new Map(); //13
      const jobMap = new Map(); //14
      const blMap = new Map(); //15
      //0
      for (const item of resultOfQueryData[0]) {
        if (item.portId !== undefined && item.name !== undefined) {
          portMap.set(item.portId, item.name);
        }
      }
      //1
      for (const item of resultOfQueryData[1]) {
        if (item.oldId !== undefined) {
          customerMap.set(item._id.toString(), {
            name: item.name,
            branch: item.tblCompanyBranch,
            pan: item.panNo,
          });
        }
      }
      //2
      for (const item of resultOfQueryData[2]) {
        // Check if tblCompanyBranch exists and has the oldId property
        if (
          item.tblCompanyBranch &&
          item.tblCompanyBranch.oldId !== undefined
        ) {
          CompanyBranchMap.set(item.tblCompanyBranch?._id.toString(), {
            name: item.tblCompanyBranch.name,
          });
        }
      }
      //3
      for (const item of resultOfQueryData[3]) {
        if (item._id !== undefined && item.name !== undefined) {
          chargeMap.set(item._id, { name: item.name });
        }
      }
      //4
      for (const item of resultOfQueryData[4]) {
        if (item._id !== undefined && item.name !== undefined) {
          MasterDataMap.set(item._id.toString(), { name: item.name });
        }
      }
      //5
      for (const item of resultOfQueryData[5]) {
        if (item._id !== undefined && item.name !== undefined) {
          generalLedgerMap.set(item._id, { name: item.name });
        }
      }
      //6
      for (const item of resultOfQueryData[6]) {
        if (item._id !== undefined && item.name !== undefined) {
          tax.set(item._id, { name: item.name });
        }
      }
      //7
      for (const item of resultOfQueryData[7]) {
        if (item._id !== undefined && item.name !== undefined) {
          tds.set(item._id, { name: item.name });
        }
      }
      //8
      for (const item of resultOfQueryData[8]) {
        if (
          item.tblVoyage &&
          item.tblVoyage._id !== undefined &&
          item.name !== undefined
        ) {
          VoyageMap.set(item.tblVoyage._id, { name: item.tblVoyage.name });
        }
      }
      //9
      for (const item of resultOfQueryData[9]) {
        if (item._id !== undefined && item.financialYear !== undefined) {
          finYearMap.set(item._id.toString(), {
            financialYear: item.financialYear,
          });
        }
      }
      //10
      for (const item of resultOfQueryData[10]) {
        if (item._id !== undefined && item.name !== undefined) {
          containerMap.set(item._id, { name: item.name });
        }
      }
      //11
      for (const item of resultOfQueryData[11]) {
        if (item.oldId !== undefined) {
          CountryMap.set(item._id.toString(), {
            name: item.name,
            branch: item.name,
          });
        }
      }
      //12

      for (const item of resultOfQueryData[12]) {
        if (item.oldId !== undefined) {
          CountryStateMap.set(item._id.toString(), {
            name: item.name,
            branch: item.tblState,
          });
        }
      }
      //13
      for (const item of resultOfQueryData[13]) {
        if (item._id !== undefined && item.name !== undefined) {
          voucherType.set(item._id.toString(), { name: item.name });
        }
      }
      //14
      for (const item of resultOfQueryData[14]) {
        if (item._id !== undefined && item.name !== undefined) {
          jobMap.set(item._id.toString(), { name: item.name });
        }
      }
      //15
      for (const item of resultOfQueryData[15]) {
        if (item._id !== undefined && item.name !== undefined) {
          blMap.set(item._id.toString(), { name: item.name });
        }
      }

      data.forEach((item) => {
        item["plrName"] = portMap.get(item.plrId) || "";
        item["polName"] = portMap.get(item.polId) || "";
        item["podName"] = portMap.get(item.podId) || "";
        item["fpdName"] = portMap.get(item.fpdId) || "";
        //item["polVoyage"] = VoyageMap.get(item.voyageId)?.name || "";
        item["financialYear"] =
          finYearMap.get(item.finYearId)?.financialYear || "";
        //
        item["VoucherType"] = voucherType.get(item.voucherTypeId)?.name || "";
        item["companyBranchName"] =
          CompanyBranchMap.get(item.companyBranchId)?.name || "";
        item["companyName"] = customerMap.get(item.companyId)?.name || "";
        item["principal"] = customerMap.get(item.principalId)?.name || "";
        item["agentName"] = customerMap.get(item.agentId)?.name || "";
        // item["panNo"] = customerMap.get(item.companyId)?.pan || "";
        item["placeOfSupply"] =
          CountryMap.get(item.placeOfSupplyStateId)?.name || "";
        item["country"] = CountryMap.get(item.countryId)?.name || "";
        item["BillingState"] =
          CountryStateMap.get(item.billingPartyStateId)?.name || "";
        item["BillingStateCode"] =
          CountryStateMap.get(item.billingPartyStateId)?.code || "";
        item["Job"] = jobMap.get(item.jobId)?.name || "";
        const customerInfo = customerMap.get(item.billingPartyId);
        item["customerName"] = customerInfo ? customerInfo.name : "";
        item["panNo"] = customerInfo ? customerInfo.pan : "";
        item["gstinNo"] = customerInfo ? customerInfo.gstinNo : "";
        item["currency"] = MasterDataMap.get(item.currencyId)?.name || "";
        item["blNo"] = blMap.get(item.blId)?.name || "";

        // tblInvoiceCharge
        item.tblInvoiceCharge &&
          item.tblInvoiceCharge.map((item) => {
            item["size"] = MasterDataMap.get(item.sizeId)?.name || "";
            item["unit"] = MasterDataMap.get(item.unitId)?.name || "";
            item["type"] = MasterDataMap.get(item.typeId)?.name || "";
            item["chargeGl"] = MasterDataMap.get(item.chargeGlId)?.name || "";
            item["chargeName"] = chargeMap.get(item.chargeId)?.name || "";
          });

        //tblInvoiceChargeTax
        item.tblInvoiceChargeTax &&
          item.tblInvoiceChargeTax.map((item) => {
            item["taxDetails"] = tax.get(item.taxDetailId)?.name || "";
          });
        //tblInvoiceChargeTds
        item.tblInvoiceChargeTds &&
          item.tblInvoiceChargeTds.map((item) => {
            item["tdsDetails"] = tds.get(item.tdsDetailId)?.name || "";
          });
        //tblInvoiceChargeDetails
        item.tblInvoiceChargeDetails &&
          item.tblInvoiceChargeDetails.map((item) => {
            item["containerName"] =
              containerMap.get(item.containerId)?.name || "";
          });
      });
      if (data.length > 0) {
        res.send({
          success: true,
          message: "Data fetched successfully",
          // reultofQueryData: resultOfqueryData,
          data: data,
        });
      } else {
        res.send({
          success: false,
          message: "Data not fetched successfully",
          data: data,
        });
      }
    } catch (error) {
      res.status(500).send({
        success: false,
        message: "Something went wrong",
        data: error.message,
      });
    }
  },
  BlRegistrationDynamicReport: async (req, res) => {
    try {
      let matchData = {
        status: Number(process.env.ACTIVE_STATUS),
        id: { $gt: 444 },
      };
      let { body } = req;
      FilterCondition(matchData, body);
      if (
        body.shipperId &&
        body.shipperId != "undefined" &&
        body.shipperId !== ""
      ) {
        matchData["shipperId"] = Number(body.shipperId);
      }
      if (
        body.consigneeId &&
        body.consigneeId != "undefined" &&
        body.consigneeId !== ""
      ) {
        matchData["consigneeId"] = Number(body.consigneeId);
      }
      if (
        body.shippingLineId &&
        body.shippingLineId != "undefined" &&
        body.shippingLineId !== ""
      ) {
        matchData["shippingLineId"] = Number(body.shippingLineId);
      }
      if (body.plrId && body.plrId != "undefined" && body.plrId !== "") {
        matchData["plrId"] = Number(body.plrId);
      }
      if (body.polID && body.polID != "undefined" && body.polID !== "") {
        matchData["polID"] = Number(body.polID);
      }
      if (body.podId && body.podId != "undefined" && body.podId !== "") {
        matchData["podId"] = Number(body.podId);
      }
      if (body.fpdID && body.fpdID != "undefined" && body.fpdID !== "") {
        matchData["fpdID"] = Number(body.fpdID);
      }
      if (
        body.fromDate &&
        body.fromDate != "undefined" &&
        body.fromDate !== "" &&
        body.toDate &&
        body.toDate != "undefined" &&
        body.toDate !== ""
      ) {
        matchData["blDate"] = {
          $gte: new Date(body.fromDate),
          $lte: new Date(body.toDate),
        };
      } else if (
        body.fromDate &&
        body.fromDate != "undefined" &&
        body.fromDate !== ""
      ) {
        matchData["blDate"] = { $gte: new Date(body.fromDate) };
      } else if (
        body.toDate &&
        body.toDate != "undefined" &&
        body.toDate !== ""
      ) {
        matchData["blDate"] = { $lte: new Date(body.toDate) };
      }
      let page = parseInt(req.query.page, 10) || 1; // Default to page 1 if not specified
      let pageSize = parseInt(req.query.pageSize, 10) || 100; // Default to 10 items per page if not specified

      // Calculate the number of documents to skip
      let skipCount = (page - 1) * pageSize;
      let query = [
        {
          $match: matchData,
        },
        {
          $sort: {
            id: 1,
          },
        },
        {
          $skip: skipCount,
        },
        {
          $limit: pageSize,
        },
      ];
      let project = {};
      if (body.projection && Object.keys(body.projection).length > 0) {
        project = body.projection;
      }
      if (Object.keys(project).length > 0) {
        query.push({ $project: project });
      }

      let data = await model.AggregateFetchData("tblBl", "tblBl", query, res);
      //tblBl
      let containerStatusId = new Set();
      let blTypeId = new Set();
      let noOfBl = new Set();
      let shipperId = new Set();
      let shipperBranchId = new Set();
      let consigneeId = new Set();
      let consigneeBranchId = new Set();
      let notifyPartyId = new Set();
      let notifyPartyBranchId = new Set();
      let notifyParty2Id = new Set();
      let notifyParty2BranchId = new Set();
      let notifyParty3Id = new Set();
      let notifyParty3BranchId = new Set();
      let blOf = new Set();
      let fpdAgentId = new Set();
      let polAgentId = new Set();
      let customBrokerId = new Set();
      let podAgentId = new Set();
      let polVesselId = new Set();
      let polVoyageId = new Set();
      let plrId = new Set();
      let polId = new Set();
      let podId = new Set();
      let fpdId = new Set();
      let preCarriageId = new Set();
      let freightPrepaidCollect = new Set();
      let noOfPackages = new Set();
      let PackageId = new Set();
      let grossWt = new Set();
      let grossWtUnitId = new Set();
      let netWt = new Set();
      let netWtUnitId = new Set();
      let volume = new Set();
      let volumeUnitId = new Set();
      let cargoTypeId = new Set();
      let imoId = new Set();
      let shippingLineAirLineId = new Set();
      let tranship1PortId = new Set();
      let igmNo = new Set();
      let nominatedAreaId = new Set();
      let lineNo = new Set();
      let subLineNo = new Set();
      let natureOfCargoId = new Set();
      let shipmentTypeId = new Set();
      let movementTypeId = new Set();
      let companyId = new Set();
      let companyBranchId = new Set();
      let mblId = new Set();
      let tranship2PortId = new Set();
      let emptyDepotId = new Set();
      let movementCarrierId = new Set();
      let doNo = new Set();
      let podVesselId = new Set();
      let podVoyageId = new Set();
      let originFreeDays = new Set();
      let destinationFreeDays = new Set();
      let originDemurrageRate = new Set();
      let destinationDemurrageRate = new Set();
      let demurrageCurrencyId = new Set();
      let finYearId = new Set();
      let commodityTypeId = new Set();
      let postCarriageId = new Set();
      let mloId = new Set();
      let slotOwnerId = new Set();
      let deliveryAgentBranchId = new Set();
      let surveyorId = new Set();
      let GRentFreeDays = new Set();
      let srNo = new Set();
      let createdByCompanyBranchId = new Set();
      let createdByCompanyId = new Set();
      let blSlNo = new Set();
      let chargeableWt = new Set();
      let chargeableWtUnitId = new Set();
      let tranship1AgentId = new Set();
      let tranship2AgentId = new Set();
      let volumeWt = new Set();
      let businessSegmentId = new Set();
      let polAgentBranchId = new Set();
      let podAgentBranchId = new Set();
      let detentionId = new Set();
      let transitTime = new Set();
      let slabCount = new Set();
      let routeId = new Set();
      let dpdId = new Set();
      let surveyorBranchId = new Set();
      let slotPaidById = new Set();
      let switchAgentId = new Set();
      let switchAgentBranchId = new Set();
      let tranship1AgentBranchId = new Set();
      let tranship2AgentBranchId = new Set();
      let plrAgentId = new Set();
      let plrAgentBranchId = new Set();
      let originDemurrageFreeDays = new Set();
      let destinationDemurrageFreeDays = new Set();
      let podHsnCode = new Set();
      let tranship1LoadVesselId = new Set();
      let tranship1LoadVoyageId = new Set();
      let thirdCfsId = new Set();
      let BLNomStatusId = new Set();
      let tranship3PortId = new Set();
      let tranship3AgentId = new Set();
      let tranship3AgentBranchId = new Set();
      let tranship2LoadVesselId = new Set();
      let tranship2LoadVoyageId = new Set();
      let tradeTermsId = new Set();
      let paymentCollAgentId = new Set();

      //tblBlContainer
      let sizeId = new Set();
      let typeId = new Set();
      let refTemp = new Set();
      let refTempUnitId = new Set();
      let packageId = new Set();
      let tareWt = new Set();
      let tareWtUnitId = new Set();
      let length = new Set();
      let width = new Set();
      let height = new Set();
      let dimensionUnitId = new Set();
      let containerId = new Set();
      let tranship1SlotOwnerId = new Set();
      let tranship2SlotOwnerId = new Set();
      let tranship3SlotOwnerId = new Set();
      let sealTypeId = new Set();
      let vgm = new Set();

      //tblBlPackingList
      let wtUnitId = new Set();
      let qty = new Set();
      let blContainerId = new Set();

      //tblBlCharge
      let chargeId = new Set();
      let buyRate = new Set();
      let sellRate = new Set();
      let unitId = new Set();
      let sellPrepaidCollectid = new Set();
      let buyAmount = new Set();
      let sellAmount = new Set();
      let buyCurrencyId = new Set();
      let buyexchangeRate = new Set();
      let buyNetAmount = new Set();
      let sellexchangeRate = new Set();
      let sellNetAmount = new Set();
      let bookingChargeId = new Set();
      let sellCurrencyId = new Set();
      let buyTotalAmountHc = new Set();
      let sellTotalAmountHc = new Set();
      let buyPrepaidCollectId = new Set();
      let sellPartyId = new Set();
      let buyPartyId = new Set();
      let buyTaxAmount = new Set();
      let sellTaxAmount = new Set();
      let dueToId = new Set();

      //tblBlClause
      let tblClauseId = new Set();

      data.forEach((item) => {
        plrId.add(createObjectId(item.plrId));
        containerStatusId.add(createObjectId(item.containerStatusId));
        blTypeId.add(createObjectId(item.blTypeId));
        noOfBl.add(createObjectId(item.noOfBl));
        shipperId.add(createObjectId(item.shipperId));
        shipperBranchId.add(createObjectId(item.shipperBranchId));
        consigneeId.add(createObjectId(item.consigneeId));
        consigneeBranchId.add(createObjectId(item.consigneeBranchId));
        notifyPartyId.add(createObjectId(item.notifyPartyId));
        notifyPartyBranchId.add(createObjectId(item.notifyPartyBranchId));
        notifyParty2Id.add(createObjectId(item.notifyParty2Id));
        notifyParty2BranchId.add(createObjectId(item.notifyParty2BranchId));
        notifyParty3Id.add(createObjectId(item.notifyParty3Id));
        notifyParty3BranchId.add(createObjectId(item.notifyParty3BranchId));
        blOf.add(createObjectId(item.blOf));
        fpdAgentId.add(createObjectId(item.fpdAgentId));
        polAgentId.add(createObjectId(item.polAgentId));
        customBrokerId.add(createObjectId(item.customBrokerId));
        podAgentId.add(createObjectId(item.podAgentId));
        polVesselId.add(createObjectId(item.polVesselId));
        polVoyageId.add(createObjectId(item.polVoyageId));
        plrId.add(createObjectId(item.plrId));
        polId.add(createObjectId(item.polId));
        podId.add(createObjectId(item.podId));
        fpdId.add(createObjectId(item.fpdId));
        preCarriageId.add(createObjectId(item.preCarriageId));
        freightPrepaidCollect.add(createObjectId(item.freightPrepaidCollect));
        noOfPackages.add(createObjectId(item.noOfPackages));
        PackageId.add(createObjectId(item.PackageId));
        grossWt.add(createObjectId(item.grossWt));
        grossWtUnitId.add(createObjectId(item.grossWtUnitId));
        netWt.add(createObjectId(item.netWt));
        netWtUnitId.add(createObjectId(item.netWtUnitId));
        volume.add(createObjectId(item.volume));
        volumeUnitId.add(createObjectId(item.volumeUnitId));
        cargoTypeId.add(createObjectId(item.cargoTypeId));
        imoId.add(createObjectId(item.imoId));
        shippingLineAirLineId.add(createObjectId(item.shippingLineAirLineId));
        tranship1PortId.add(createObjectId(item.tranship1PortId));
        igmNo.add(createObjectId(item.igmNo));
        nominatedAreaId.add(createObjectId(item.nominatedAreaId));
        lineNo.add(createObjectId(item.lineNo));
        subLineNo.add(createObjectId(item.subLineNo));
        natureOfCargoId.add(createObjectId(item.natureOfCargoId));
        shipmentTypeId.add(createObjectId(item.shipmentTypeId));
        movementTypeId.add(createObjectId(item.movementTypeId));
        companyId.add(createObjectId(item.companyId));
        companyBranchId.add(createObjectId(item.companyBranchId));
        mblId.add(createObjectId(item.mblId));
        tranship2PortId.add(createObjectId(item.tranship2PortId));
        emptyDepotId.add(createObjectId(item.emptyDepotId));
        movementCarrierId.add(createObjectId(item.movementCarrierId));
        doNo.add(createObjectId(item.doNo));
        podVesselId.add(createObjectId(item.podVesselId));
        podVoyageId.add(createObjectId(item.podVoyageId));
        originFreeDays.add(createObjectId(item.originFreeDays));
        destinationFreeDays.add(createObjectId(item.destinationFreeDays));
        originDemurrageRate.add(createObjectId(item.originDemurrageRate));
        destinationDemurrageRate.add(
          createObjectId(item.destinationDemurrageRate)
        );
        demurrageCurrencyId.add(createObjectId(item.demurrageCurrencyId));
        finYearId.add(createObjectId(item.finYearId));
        commodityTypeId.add(createObjectId(item.commodityTypeId));
        postCarriageId.add(createObjectId(item.postCarriageId));
        mloId.add(createObjectId(item.mloId));
        slotOwnerId.add(createObjectId(item.slotOwnerId));
        deliveryAgentBranchId.add(createObjectId(item.deliveryAgentBranchId));
        surveyorId.add(createObjectId(item.surveyorId));
        GRentFreeDays.add(createObjectId(item.GRentFreeDays));
        srNo.add(createObjectId(item.srNo));
        createdByCompanyBranchId.add(
          createObjectId(item.createdByCompanyBranchId)
        );
        createdByCompanyId.add(createObjectId(item.createdByCompanyId));
        blSlNo.add(createObjectId(item.blSlNo));
        chargeableWt.add(createObjectId(item.chargeableWt));
        chargeableWtUnitId.add(createObjectId(item.chargeableWtUnitId));
        tranship1AgentId.add(createObjectId(item.tranship1AgentId));
        tranship2AgentId.add(createObjectId(item.tranship2AgentId));
        volumeWt.add(createObjectId(item.volumeWt));
        businessSegmentId.add(createObjectId(item.businessSegmentId));
        polAgentBranchId.add(createObjectId(item.polAgentBranchId));
        podAgentBranchId.add(createObjectId(item.podAgentBranchId));
        detentionId.add(createObjectId(item.detentionId));
        transitTime.add(createObjectId(item.transitTime));
        slabCount.add(createObjectId(item.slabCount));
        routeId.add(createObjectId(item.routeId));
        dpdId.add(createObjectId(item.dpdId));
        surveyorBranchId.add(createObjectId(item.surveyorBranchId));
        slotPaidById.add(createObjectId(item.slotPaidById));
        switchAgentId.add(createObjectId(item.switchAgentId));
        switchAgentBranchId.add(createObjectId(item.switchAgentBranchId));
        tranship1AgentBranchId.add(createObjectId(item.tranship1AgentBranchId));
        tranship2AgentBranchId.add(createObjectId(item.tranship2AgentBranchId));
        plrAgentId.add(createObjectId(item.plrAgentId));
        plrAgentBranchId.add(createObjectId(item.plrAgentBranchId));
        originDemurrageFreeDays.add(
          createObjectId(item.originDemurrageFreeDays)
        );
        destinationDemurrageFreeDays.add(
          createObjectId(item.destinationDemurrageFreeDays)
        );
        podHsnCode.add(createObjectId(item.podHsnCode));
        tranship1LoadVesselId.add(createObjectId(item.tranship1LoadVesselId));
        tranship1LoadVoyageId.add(createObjectId(item.tranship1LoadVoyageId));
        thirdCfsId.add(createObjectId(item.thirdCfsId));
        BLNomStatusId.add(createObjectId(item.BLNomStatusId));
        tranship3PortId.add(createObjectId(item.tranship3PortId));
        tranship3AgentId.add(createObjectId(item.tranship3AgentId));
        tranship3AgentBranchId.add(createObjectId(item.tranship3AgentBranchId));
        tranship2LoadVesselId.add(createObjectId(item.tranship2LoadVesselId));
        tranship2LoadVoyageId.add(createObjectId(item.tranship2LoadVoyageId));
        tradeTermsId.add(createObjectId(item.tradeTermsId));
        paymentCollAgentId.add(createObjectId(item.paymentCollAgentId));

        // tblBlContainer
        item.tblBlContainer &&
          item.tblBlContainer.map((x) => {
            console.log("x", x);
            sizeId.add(createObjectId(x.sizeId));
            typeId.add(createObjectId(x.typeId));
            refTemp.add(createObjectId(x.refTemp));
            refTempUnitId.add(createObjectId(x.refTempUnitId));
            packageId.add(createObjectId(x.packageId));
            tareWt.add(createObjectId(x.tareWt));
            tareWtUnitId.add(createObjectId(x.tareWtUnitId));
            length.add(createObjectId(x.length));
            width.add(createObjectId(x.width));
            height.add(createObjectId(x.height));
            dimensionUnitId.add(createObjectId(x.dimensionUnitId));
            containerId.add(createObjectId(x.containerId));
            tranship1SlotOwnerId.add(createObjectId(x.tranship1SlotOwnerId));
            tranship2SlotOwnerId.add(createObjectId(x.tranship2SlotOwnerId));
            tranship3SlotOwnerId.add(createObjectId(x.tranship3SlotOwnerId));
            sealTypeId.add(createObjectId(x.sealTypeId));
            vgm.add(createObjectId(x.vgm));
          });
        //  tblBlPackingList
        item.tblBlPackingList &&
          item.tblBlPackingList.map((x) => {
            wtUnitId.add(createObjectId(x.wtUnitId));
            qty.add(createObjectId(x.qty));
            blContainerId.add(createObjectId(x.blContainerId));
          });
        // tblBlCharge
        item.tblBlCharge &&
          item.tblBlCharge.map((x) => {
            chargeId.add(createObjectId(x.chargeId));
            buyRate.add(createObjectId(x.buyRate));
            sellRate.add(createObjectId(x.sellRate));
            unitId.add(createObjectId(x.unitId));
            sellPrepaidCollectid.add(createObjectId(x.sellPrepaidCollectid));
            buyAmount.add(createObjectId(x.buyAmount));
            sellAmount.add(createObjectId(x.sellAmount));
            buyCurrencyId.add(createObjectId(x.buyCurrencyId));
            buyexchangeRate.add(createObjectId(x.buyexchangeRate));
            buyNetAmount.add(createObjectId(x.buyNetAmount));
            sellexchangeRate.add(createObjectId(x.sellexchangeRate));
            sellNetAmount.add(createObjectId(x.sellNetAmount));
            bookingChargeId.add(createObjectId(x.bookingChargeId));
            sellCurrencyId.add(createObjectId(x.sellCurrencyId));
            buyTotalAmountHc.add(createObjectId(x.buyTotalAmountHc));
            sellTotalAmountHc.add(createObjectId(x.sellTotalAmountHc));
            buyPrepaidCollectId.add(createObjectId(x.buyPrepaidCollectId));
            sellPartyId.add(createObjectId(x.sellPartyId));
            buyPartyId.add(createObjectId(x.buyPartyId));
            buyTaxAmount.add(createObjectId(x.buyTaxAmount));
            sellTaxAmount.add(createObjectId(x.sellTaxAmount));
            dueToId.add(createObjectId(x.dueToId));
          });
        // tblBlClause
        item.tblBlClause &&
          item.tblBlClause.map((x) => {
            tblClauseId.add(createObjectId(x.tblClauseId));
          });
      });
      // return console.log(companyBranchId);
      const tables = [
        {
          tableName: "tblPort",
          query: [
            {
              $match: {
                $or: [
                  { portId: { $in: Array.from(plrId) } },
                  { portId: { $in: Array.from(polId) } },
                  { portId: { $in: Array.from(podId) } },
                  { portId: { $in: Array.from(fpdId) } },
                  { portId: { $in: Array.from(podVoyageId) } },
                ],
                status: Number(process.env.ACTIVE_STATUS),
              },
            },
          ],
        },
        {
          tableName: "tblPrepaidCollect",
          query: [
            {
              $match: {
                $or: [{ _id: { $in: Array.from(freightPrepaidCollect) } }],
              },
            },
          ],
        },
        {
          tableName: "tblCompany",
          query: [
            {
              $match: {
                $or: [
                  { _id: { $in: Array.from(shipperId) } },
                  { _id: { $in: Array.from(consigneeId) } },
                  { _id: { $in: Array.from(notifyPartyId) } },
                  { _id: { $in: Array.from(notifyParty2Id) } },
                  { _id: { $in: Array.from(notifyParty3Id) } },
                  { _id: { $in: Array.from(customBrokerId) } },
                  { _id: { $in: Array.from(slotOwnerId) } },
                  { _id: { $in: Array.from(mloId) } },
                  { _id: { $in: Array.from(createdByCompanyId) } },
                  { _id: { $in: Array.from(fpdAgentId) } },
                  { _id: { $in: Array.from(plrAgentId) } },
                  { _id: { $in: Array.from(surveyorId) } },
                ],
              },
            },
          ],
        },
        {
          tableName: "tblCompany",
          query: [
            {
              $unwind: {
                path: "$tblCompanyBranch",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                tblCompanyBranch: { $exists: true, $ne: null },
                $or: [
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(shipperBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(consigneeBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(notifyParty2BranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(notifyParty3BranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(notifyPartyBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(companyBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(createdByCompanyBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(polAgentBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(podAgentBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(surveyorBranchId),
                    },
                  },
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(plrAgentBranchId),
                    },
                  },
                  // Add more conditions here if needed, each enclosed in {}
                ],
              },
            },
          ],
        },
        // {
        //     tableName: "tblCompany",
        //     query: [
        //         {
        //             $unwind: {
        //                 path: "$tblCompanyBranch",
        //                 preserveNullAndEmptyArrays: true,
        //             }
        //         },
        //         {
        //             $unwind: {
        //                 path: "$tblCompanyBranch.tblCompanyBranchPerson",
        //                 preserveNullAndEmptyArrays: true,
        //             }
        //         },
        //         {
        //             $match: {
        //                 status: Number(process.env.ACTIVE_STATUS),
        //                 "tblCompanyBranch.tblCompanyBranchPerson": { $exists: true, $ne: null },
        //                 $or: [
        //                     { "tblCompanyBranch.tblCompanyBranchPerson._id": { $in: Array.from(salesExecutiveId) } },
        //                     { "tblCompanyBranch.tblCompanyBranchPerson._id": { $in: Array.from(pricingPersonId) } },
        //                     { "tblCompanyBranch.tblCompanyBranchPerson._id": { $in: Array.from(backOfficePersonId) } },
        //                     { "tblCompanyBranch.tblCompanyBranchPerson._id": { $in: Array.from(sellPersonId) } },
        //                     { "tblCompanyBranch.tblCompanyBranchPerson._id": { $in: Array.from(customerServicePersonId) } },
        //                     { "tblCompanyBranch.tblCompanyBranchPerson._id": { $in: Array.from(customerClearancePersonId) } },
        //                     { "tblCompanyBranch.tblCompanyBranchPerson._id": { $in: Array.from(activityPersonId) } },
        //                     Add more conditions here if needed, each enclosed in {}
        //                 ]
        //             }
        //         }
        //     ]

        // },
        {
          tableName: "tblFinancialYear",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(finYearId) } }],
              },
            },
          ],
        },
        //     {
        //         tableName: "tblCountry",
        //         query: [
        //             {
        //                 $match: {
        //                     status: Number(process.env.ACTIVE_STATUS),
        //                     $or: [

        //                         { _id: { $in: Array.from(destinationCountryId) } },
        //                         { _id: { $in: Array.from(originCountryId) } },

        //                     ]
        //                 }
        //             }
        //         ]
        //     },
        {
          tableName: "tblMasterData",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [
                  { _id: { $in: Array.from(tradeTermsId) } },
                  { _id: { $in: Array.from(natureOfCargoId) } },
                  { _id: { $in: Array.from(containerStatusId) } },
                  { _id: { $in: Array.from(preCarriageId) } },
                  { _id: { $in: Array.from(cargoTypeId) } },
                  { _id: { $in: Array.from(packageId) } },
                  { _id: { $in: Array.from(volumeUnitId) } },
                  { _id: { $in: Array.from(chargeableWtUnitId) } },
                  { _id: { $in: Array.from(routeId) } },
                  { _id: { $in: Array.from(netWtUnitId) } },
                  { _id: { $in: Array.from(demurrageCurrencyId) } },
                  { _id: { $in: Array.from(sizeId) } },
                  { _id: { $in: Array.from(typeId) } },
                  { _id: { $in: Array.from(dimensionUnitId) } },
                  { _id: { $in: Array.from(wtUnitId) } },
                  { _id: { $in: Array.from(grossWtUnitId) } },
                  { _id: { $in: Array.from(tareWtUnitId) } },
                  { _id: { $in: Array.from(refTemp) } },
                  { _id: { $in: Array.from(refTempUnitId) } },
                  // //{ _id: { $in: Array.from(TransporterId) } },
                  // { _id: { $in: Array.from(unitId) } },
                  // { _id: { $in: Array.from(buyCurrencyId) } },
                  // { _id: { $in: Array.from(sellCurrencyId) } },
                  // { _id: { $in: Array.from(buyPrepaidCollectId) } },
                  // { _id: { $in: Array.from(sellPrepaidCollectid) } },
                  // { _id: { $in: Array.from(dueToId) } },
                  // { _id: { $in: Array.from(activityId) } },
                ],
              },
            },
          ],
        },
        {
          tableName: "tblVesselFlight",
          query: [
            {
              $unwind: {
                path: "$tblVoyage",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                tblVoyage: { $exists: true, $ne: null },
                $or: [{ "tblVoyage._id": { $in: Array.from(polVoyageId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblVesselFlight",
          query: [
            {
              $match: {
                $or: [
                  { _id: { $in: Array.from(polVesselId) } },
                  { _id: { $in: Array.from(podVesselId) } },
                ],
              },
            },
          ],
        },
        //     {
        //         tableName: "tblPort",
        //         query: [
        //             {
        //                 $unwind: {
        //                     path: "$tblBerth",
        //                     preserveNullAndEmptyArrays: true,
        //                 }
        //             },
        //             {
        //                 $match: {
        //                     status: Number(process.env.ACTIVE_STATUS),
        //                     "tblBert": { $exists: true, $ne: null },
        //                     $or: [
        //                         { "tblBert._id": { $in: Array.from(polTerminalId) } },

        //                     ]
        //                 }
        //             }
        //         ]
        //     }
        //     ,
        {
          tableName: "tblBusinessSegment",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(businessSegmentId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblBl",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(mblId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblContainer",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(containerId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblCharge",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(chargeId) } }],
              },
            },
          ],
        },
        //     ,
        //     {
        //         tableName: "tblGeneralLedger",
        //         query: [
        //             {
        //                 $match: {
        //                     status: Number(process.env.ACTIVE_STATUS),
        //                     $or: [
        //                         { _id: { $in: Array.from(buyPartyId) } },
        //                         { _id: { $in: Array.from(sellPartyId) } },
        //                     ]
        //                 }
        //             }
        //         ]
        //     }
      ];
      // return console.log("tables", tables.length);

      const dataToQuery = tables.map((iterator) =>
        model.AggregateFetchData(
          iterator.tableName,
          iterator.tableName,
          iterator.query,
          res
        )
      );

      const resultOfQueryData = await Promise.all(dataToQuery);
      const portMap = new Map();
      const customerMap = new Map();
      const CompanyBranchMap = new Map();
      const CompanyBranchPerson = new Map();
      const finYearMap = new Map();
      const CountryMap = new Map();
      const MasterDataMap = new Map();
      const VoyageMap = new Map();
      const VesselMap = new Map();
      const polTerminalMap = new Map();
      const businessSegmentMap = new Map();
      const rateRequestMap = new Map();
      const JobMap = new Map();
      const containerMap = new Map();
      const chargeMap = new Map();
      const generalLedgerMap = new Map();
      const PrepaidCollectMap = new Map();

      // Optimizing portMap construction
      for (const item of resultOfQueryData[0]) {
        if (item.portId !== undefined && item.name !== undefined) {
          portMap.set(item.portId, item.name);
        }
      }
      // console.log("company length", resultOfQueryData[1][0]._id.toString());
      // Optimizing customerMap construction
      for (const item of resultOfQueryData[1]) {
        if (item.oldId !== undefined) {
          customerMap.set(item._id.toString(), {
            name: item.name,
            branch: item.tblCompanyBranch,
          });
        }
      }

      // Optimizing CompanyBranchMap construction
      for (const item of resultOfQueryData[2]) {
        // Check if tblCompanyBranch exists and has the oldId property
        if (
          item.tblCompanyBranch &&
          item.tblCompanyBranch.oldId !== undefined
        ) {
          CompanyBranchMap.set(item.tblCompanyBranch?._id.toString(), {
            name: item.tblCompanyBranch.name,
          });
        }
      }

      for (const item of resultOfQueryData[3]) {
        // Check if tblCompanyBranch exists and has the oldId property
        if (
          item.tblCompanyBranch &&
          item.tblCompanyBranch.tblCompanyBranchPerson &&
          item.tblCompanyBranch.tblCompanyBranchPerson._id !== undefined
        ) {
          CompanyBranchPerson.set(
            item.tblCompanyBranch.tblCompanyBranchPerson._id.toString(),
            { name: item.tblCompanyBranch.tblCompanyBranchPerson.name }
          );
        }
      }
      console.log("CompanyBranchPerson", resultOfQueryData[3].length);
      for (const item of resultOfQueryData[4]) {
        if (item._id !== undefined && item.financialYear !== undefined) {
          finYearMap.set(item._id.toString(), {
            financialYear: item.financialYear,
          });
        }
      }
      for (const item of resultOfQueryData[5]) {
        if (
          item.freightPrepaidCollect !== undefined &&
          item.name !== undefined
        ) {
          PrepaidCollectMap.set(item.freightPrepaidCollect, item.name);
        }
      }
      // console.log("finYearMap", finYearMap);
      for (const item of resultOfQueryData[6]) {
        if (item._id !== undefined && item.name !== undefined) {
          CountryMap.set(item._id.toString(), { name: item.name });
        }
      }
      // console.log("resultOfQueryData[6].length", resultOfQueryData[6].length);
      for (const item of resultOfQueryData[7]) {
        if (item._id !== undefined && item.name !== undefined) {
          MasterDataMap.set(item._id.toString(), { name: item.name });
        }
      }
      // console.log("MasterDataMap", MasterDataMap);
      for (const item of resultOfQueryData[8]) {
        if (
          item.tblVoyage &&
          item.tblVoyage._id !== undefined &&
          item.name !== undefined
        ) {
          VoyageMap.set(item.tblVoyage._id, { name: item.tblVoyage.name });
        }
      }
      for (const item of resultOfQueryData[9]) {
        if (item._id !== undefined && item.name !== undefined) {
          VesselMap.set(item._id, { name: item.name });
        }
      }
      for (const item of resultOfQueryData[10]) {
        if (
          item.tblBerth &&
          item.tblBerth._id !== undefined &&
          item.name !== undefined
        ) {
          polTerminalMap.set(item.tblBerth._id, { name: item.tblBerth.name });
        }
      }
      for (const item of resultOfQueryData[11]) {
        if (item._id !== undefined && item.name !== undefined) {
          businessSegmentMap.set(item._id, { name: item.name });
        }
      }
      // for (const item of resultOfQueryData[12]) {
      //     if (item._id !== undefined && item.name !== undefined) {
      //         containerMap.set(item._id, { name: item.name });
      //     }
      // }
      // for (const item of resultOfQueryData[13]) {
      //     if (item._id !== undefined && item.name !== undefined) {
      //         chargeMap.set(item._id, { name: item.name });
      //     }
      // }
      // for (const item of resultOfQueryData[14]) {
      //     if (item._id !== undefined && item.name !== undefined) {
      //         generalLedgerMap.set(item._id, { name: item.name });
      //     }
      // }

      data.forEach((item) => {
        console.log(CompanyBranchMap.get(item.shipperBranchId));
        console.log(
          "MasterDataMap.get(item.cargoTypeId)?.name",
          MasterDataMap.get(item.cargoTypeId)
        );
        item["plrName"] = portMap.get(item.plrId)?.name || "";
        item["polName"] = portMap.get(item.polId) || "";
        item["podName"] = portMap.get(item.podId) || "";
        item["fpdName"] = portMap.get(item.fpdId) || "";
        item["podVoyageName"] = portMap.get(item.podVoyageId) || "";

        // //const customerInfo = customerMap.get(item.customerId);
        // // console.log("customerInfo", customerInfo.flat(2));
        item["consigneeName"] = customerMap.get(item.consigneeId)?.name || "";
        item["shipperName"] = customerMap.get(item.shipperId)?.name || "";
        item["shippinglineName"] =
          customerMap.get(item.shippingLineAirLineId)?.name || "";
        item["companyName"] = customerMap.get(item.companyId)?.name || "";
        item["podAgentName"] = customerMap.get(item.podAgentId)?.name || "";
        item["polAgentName"] = customerMap.get(item.polAgentId)?.name || "";
        // //item["agentName"] = customerMap.get(item.agentId)?.name || "";
        item["notifyPartyName"] =
          customerMap.get(item.notifyPartyId)?.name || "";
        item["customBrokerName"] =
          customerMap.get(item.customBrokerId)?.name || "";
        // //item["transporterName"] = customerMap.get(item.transporterId)?.name || "";
        // //item["podCustomBrokerName"] = customerMap.get(item.podCustomBrokerId)?.name || "";
        // //item["shippingAgentName"] = customerMap.get(item.shippingAgentId)?.name || "";
        item["slotOwnerName"] = customerMap.get(item.slotOwnerId)?.name || "";
        item["mloName"] = customerMap.get(item.mloId)?.name || "";
        item["createdByCompanyName"] =
          customerMap.get(item.createdByCompanyId)?.name || "";
        item["fpdAgentName"] = customerMap.get(item.fpdAgentId)?.name || "";
        item["surveyorName"] = customerMap.get(item.surveyorId)?.name || "";
        item["plrAgentName"] = customerMap.get(item.plrAgentId)?.name || "";
        // // Assuming you want to extract the branch name for the customer
        item["companyBranchName"] =
          CompanyBranchMap.get(item.companybranchId)?.name || "";
        item["consigneeBranchName"] =
          CompanyBranchMap.get(item.consigneeBranchId)?.name || "";
        item["shipperBranchName"] =
          CompanyBranchMap.get(item.shipperBranchId)?.name || "";
        // //item["customerBranchName"] = CompanyBranchMap.get(item.customerBranchId)?.name || "";
        // //item["agentBranchName"] = CompanyBranchMap.get(item.agentBranchId)?.name || "";
        item["notifyPartyBranchName"] =
          CompanyBranchMap.get(item.notifyPartyBranchId)?.name || "";
        item["createdByCompanyBranchName"] =
          CompanyBranchMap.get(item.createdByCompanyBranchId)?.name || "";
        item["polAgentBranchName"] =
          CompanyBranchMap.get(item.polAgentBranchId)?.name || "";
        item["podAgentBranchName"] =
          CompanyBranchMap.get(item.podAgentBranchId)?.name || "";
        item["surveyorBranchName"] =
          CompanyBranchMap.get(item.surveyorBranchId)?.name || "";
        // //item["fpdAgentBranchName"] = CompanyBranchMap.get(item.fpdAgentBranchId)?.name || "";
        item["plrAgentBranchName"] =
          CompanyBranchMap.get(item.plrAgentBranchId)?.name || "";

        // //company branch person
        // //item["salesExecutiveName"] = CompanyBranchPerson.get(item.salesExecutiveId)?.name || "";
        // //item["pricingPersonName"] = CompanyBranchPerson.get(item.pricingPersonId)?.name || "";
        // //item["customerServicePersonName"] = CompanyBranchPerson.get(item.customerServicePersonId)?.name || "";
        // //item["backOfficePersonName"] = CompanyBranchPerson.get(item.backOfficePersonId)?.name || "";
        // //item["sellPersonName"] = CompanyBranchPerson.get(item.sellPersonId)?.name || "";
        // //item["customerClearancePersonName"] = CompanyBranchPerson.get(item.customerClearancePersonId)?.name || "";

        // // financial year
        item["financialYear"] =
          finYearMap.get(item.finYearId)?.financialYear || "";

        // // PrepaidCollectMap
        item["freightPrepaidCollect"] =
          finYearMap.get(item.freightPrepaidCollect)?.freightPrepaidCollect ||
          "";

        // //countryMap
        // //item["destinationCountryName"] = CountryMap.get(item.destinationCountryId)?.name || "";
        // //item["originCountryName"] = CountryMap.get(item.originCountryId)?.name || "";

        // //MasterData
        item["tradeTermsName"] =
          MasterDataMap.get(item.tradeTermsId)?.name || "";
        item["natureOfCargoName"] =
          MasterDataMap.get(item.natureOfCargoId)?.name || "";
        // //item["stuffingTypeName"] = MasterDataMap.get(item.stuffingTypeId)?.name || "";
        item["containerStatusName"] =
          MasterDataMap.get(item.containerStatusId)?.name || "";
        item["preCarriageName"] =
          MasterDataMap.get(item.preCarriageId)?.name || "";
        // //item["destuffingTypeName"] = MasterDataMap.get(item.destuffingTypeId)?.name || "";
        item["cargoTypeName"] = MasterDataMap.get(item.cargoTypeId)?.name || "";
        // //item["cargoWtUnitName"] = MasterDataMap.get(item.cargoWtUnitId)?.name || "";
        item["packageName"] = MasterDataMap.get(item.packageId)?.name || "";
        item["commodityTypeName"] =
          MasterDataMap.get(item.commodityTypeId)?.name || "";
        item["volumeUnitName"] =
          MasterDataMap.get(item.volumeUnitId)?.name || "";
        item["chargeableWtUnitName"] =
          MasterDataMap.get(item.chargeableWtUnitId)?.name || "";
        // //item["postCarriageName"] = MasterDataMap.get(item.postCarriage)?.name || "";
        item["netWtUnitName"] = MasterDataMap.get(item.netWtUnitId)?.name || "";
        item["routeName"] = MasterDataMap.get(item.routeId)?.name || "";
        item["demmuragecurrencyName"] =
          MasterDataMap.get(item.demurrageCurrencyId)?.name || "";

        //voyage
        item["polVoyageName"] = VoyageMap.get(item.polVoyageId)?.name || "";
        //vessel
        item["polVesselName"] = VesselMap.get(item.polVesselId)?.name || "";
        item["podVesselName"] = VesselMap.get(item.podVesselId)?.name || "";
        // //pol terminal
        // //item["polTerminalName"] = polTerminalMap.get(item.polTerminalId)?.name || "";
        // business segment
        item["businessSegmentName"] =
          businessSegmentMap.get(item.businessSegmentId)?.name || "";
        // // rate request
        // item["rateRequestName"] = rateRequestMap.get(item.rateRequestId)?.name || "";
        // // Job map
        // //item["masterJobName"] = JobMap.get(item.masterJobId)?.name || "";
        // // tblJobQty
        // item.tblJobQty && item.tblJobQty.map((item) => {
        //maserData
        item["sizeName"] = MasterDataMap.get(item.sizeId)?.name || "";
        item["typeName"] = MasterDataMap.get(item.typeId)?.name || "";
        item["dimensionUnitName"] =
          MasterDataMap.get(item.dimensionUnitId)?.name || "";
        item["wtUnitName"] = MasterDataMap.get(item.wtUnitId)?.name || "";
        item["volumeUnitName"] =
          MasterDataMap.get(item.volumeUnitId)?.name || "";
        //     //item["depotName"] = portMap.get(item.depotId)?.name || "";
        item["containerName"] = containerMap.get(item.containerId)?.name || "";

        // })
        // // tblBlContainer
        item.tblBlContainer &&
          item.tblBlContainer.map((item) => {
            // item["sizeName"] = MasterDataMap.get(item.sizeId)?.name || "";
            // item["typeName"] = MasterDataMap.get(item.typeId)?.name || "";
            item["refTempUnitName"] =
              MasterDataMap.get(item.refTempUnitId)?.name || "";
            item["packageName"] = MasterDataMap.get(item.packageId)?.name || "";
            item["tareWtUnitName"] =
              MasterDataMap.get(item.tareWtUnitId)?.name || "";
            item["dimensionUnitName"] =
              MasterDataMap.get(item.dimensionUnitId)?.name || "";
            item["containerStatusName"] =
              MasterDataMap.get(item.containerStatusId)?.name || "";
            item["grossWtUnitName"] =
              MasterDataMap.get(item.grossWtUnitId)?.name || "";
            //     //item["TransporterName"] = MasterDataMap.get(item.TransporterId)?.name || "";
            item["volumeUnitName"] =
              MasterDataMap.get(item.volumeUnitId)?.name || "";
            item["cargoTypeName"] =
              MasterDataMap.get(item.cargoTypeId)?.name || "";
            item["slotOwnerName"] =
              customerMap.get(item.cargoTypeId)?.name || "";
          });
        // tblBlCharge
        item.tblBlCharge &&
          item.tblBlCharge.map((item) => {
            item["chargeName"] = chargeMap.get(item.chargeId)?.name || "";
            // item["sizeName"] = MasterDataMap.get(item.sizeId)?.name || "";
            //     item["typeName"] = MasterDataMap.get(item.typeId)?.name || "";
            //     item["unitName"] = MasterDataMap.get(item.unitId)?.name || "";
            //     item["buyCurrencyName"] = MasterDataMap.get(item.buyCurrencyId)?.name || "";
            //     item["sellCurrencyName"] = MasterDataMap.get(item.sellCurrencyId)?.name || "";
            //     item["buyPrepaidCollectName"] = MasterDataMap.get(item.buyPrepaidCollectId)?.name || "";
            //     item["sellPrepaidCollectName"] = MasterDataMap.get(item.sellPrepaidCollectid)?.name || "";
            //     item["dueToName"] = MasterDataMap.get(item.dueToId)?.name || "";
            //     item["buyPartyName"] = chargeMap.get(item.buyPartyId)?.name || "";
            //     item["sellPartyName"] = chargeMap.get(item.sellPartyId)?.name || "";
          });
        // // tblJobActivity
        // item.tblJobActivity && item.tblJobActivity.map((item) => {
        //     //item["activityPersonId"] = CompanyBranchPerson.get(item.activityPersonId)?.name || "";
        //     //item["activityName"] = MasterDataMap.get(item.activityId)?.name || "";
        // })
      });

      if (data.length > 0) {
        res.send({
          success: true,
          message: "Data fetched successfully",
          data: data,
        });
      } else {
        res.send({
          success: false,
          message: "Data not fetched successfully",
          data: data,
        });
      }
    } catch (error) {
      res.status(500).send({
        success: false,
        message: "Something went wrong",
        data: error.message,
      });
    }
  },
  EnquiryDynamicReport: async (req, res) => {
    try {
      let matchData = { status: Number(process.env.ACTIVE_STATUS) };
      let { body } = req;
      FilterCondition(matchData, body);
      if (body.id && body.id != "undefined" && body.id !== "") {
        matchData["id"] = Number(body.id);
      }
      if (body._id && body._id != "undefined" && body._id !== "") {
        matchData["_id"] = new mongoose.Types.ObjectId(body._id);
      }
      if (
        body.customerId &&
        body.customerId != "undefined" &&
        body.customerId !== ""
      ) {
        matchData["customerId"] = Number(body.customerId);
      }
      if (
        body.finYearId &&
        body.finYearId != "undefined" &&
        body.finYearId !== ""
      ) {
        matchData["finYearId"] = String(body.finYearId);
      }
      if (
        body.shipperId &&
        body.shipperId != "undefined" &&
        body.shipperId !== ""
      ) {
        matchData["shipperId"] = Number(body.shipperId);
      }
      if (
        body.consigneeId &&
        body.consigneeId != "undefined" &&
        body.consigneeId !== ""
      ) {
        matchData["consigneeId"] = Number(body.consigneeId);
      }
      if (
        body.shippingLineId &&
        body.shippingLineId != "undefined" &&
        body.shippingLineId !== ""
      ) {
        matchData["shippingLineId"] = Number(body.shippingLineId);
      }
      if (body.plrId && body.plrId != "undefined" && body.plrId !== "") {
        matchData["plrId"] = Number(body.plrId);
      }
      if (body.polId && body.polId != "undefined" && body.polId !== "") {
        matchData["polId"] = Number(body.polId);
      }
      if (body.podId && body.podId != "undefined" && body.podId !== "") {
        matchData["podId"] = Number(body.podId);
      }
      if (body.fpdId && body.fpdId != "undefined" && body.fpdId !== "") {
        matchData["fpdId"] = Number(body.fpdId);
      }
      if (
        body.fromDate &&
        body.fromDate != "undefined" &&
        body.fromDate !== "" &&
        body.toDate &&
        body.toDate != "undefined" &&
        body.toDate !== ""
      ) {
        matchData["jobDate"] = {
          $gte: new Date(body.fromDate),
          $lte: new Date(body.toDate),
        };
      } else if (
        body.fromDate &&
        body.fromDate != "undefined" &&
        body.fromDate !== ""
      ) {
        matchData["jobDate"] = { $gte: new Date(body.fromDate) };
      } else if (
        body.toDate &&
        body.toDate != "undefined" &&
        body.toDate !== ""
      ) {
        matchData["jobDate"] = { $lte: new Date(body.toDate) };
      }
      let page = parseInt(req.query.page, 10) || 1;
      let pageSize = parseInt(req.query.pageSize, 100) || 1000;

      let skipCount = (page - 1) * pageSize;
      let query = [
        {
          $match: matchData,
        },
        {
          $sort: {
            id: 1,
          },
        },
        {
          $skip: skipCount,
        },
        {
          $limit: pageSize,
        },
      ];
      let project = {};
      if (body.projection && Object.keys(body.projection).length > 0) {
        project = body.projection;
      }
      if (Object.keys(project).length > 0) {
        query.push({ $project: project });
      }

      let data = await model.AggregateFetchData(
        "tblEnquiry",
        "tblEnquiry",
        query,
        res
      );
      console.log("Fetched data:", data);

      let businessSegmentId = new Set();
      let shipperId = new Set();
      let consigneeId = new Set();
      let shippingLineId = new Set();
      let plrId = new Set();
      let polId = new Set();
      let podId = new Set();
      let fpdId = new Set();
      let containerStatusId = new Set();
      let natureOfCargoId = new Set();
      let cargoTypeId = new Set();
      let cargoWtUnitId = new Set();
      let volumeUnitId = new Set();
      let tradeTermsId = new Set();
      let pacakgeId = new Set();
      let destinationCountryId = new Set();
      let originCountryId = new Set();
      let sizeId = new Set();
      let typeId = new Set();
      let wtUnitId = new Set();

      data.forEach((item) => {
        businessSegmentId.add(createObjectId(item.businessSegmentId));
        shipperId.add(createObjectId(item.shipperId));
        consigneeId.add(createObjectId(item.consigneeId));
        shippingLineId.add(createObjectId(item.shippingLineId));
        plrId.add(createObjectId(item.plrId));
        polId.add(createObjectId(item.polId));
        podId.add(createObjectId(item.podId));
        fpdId.add(createObjectId(item.fpdId));
        containerStatusId.add(createObjectId(item.containerStatusId));
        natureOfCargoId.add(createObjectId(item.natureOfCargoId));
        cargoTypeId.add(createObjectId(item.cargoTypeId));
        cargoWtUnitId.add(createObjectId(item.cargoWtUnitId));
        volumeUnitId.add(createObjectId(item.volumeUnitId));
        tradeTermsId.add(createObjectId(item.tradeTermsId));
        pacakgeId.add(createObjectId(item.pacakgeId));
        destinationCountryId.add(createObjectId(item.destinationCountryId));
        originCountryId.add(createObjectId(item.originCountryId));
        item.tblEnquiryQty &&
          item.tblEnquiryQty.map((item) => {
            sizeId.add(createObjectId(item.sizeId));
            typeId.add(createObjectId(item.typeId));
            wtUnitId.add(createObjectId(item.wtUnitId));
          });
      });

      const tables = [
        {
          tableName: "tblPort",
          query: [
            {
              $match: {
                $or: [
                  { _id: { $in: Array.from(plrId) } },
                  { _id: { $in: Array.from(polId) } },
                  { _id: { $in: Array.from(podId) } },
                  { _id: { $in: Array.from(fpdId) } },
                ],
                status: Number(process.env.ACTIVE_STATUS),
              },
            },
          ],
        },
        {
          tableName: "tblBusinessSegment",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(businessSegmentId) } }],
                status: Number(process.env.ACTIVE_STATUS),
              },
            },
          ],
        },
        {
          tableName: "tblCompany",
          query: [
            {
              $match: {
                $or: [
                  { _id: { $in: Array.from(shipperId) } },
                  { _id: { $in: Array.from(consigneeId) } },
                  { _id: { $in: Array.from(shippingLineId) } },
                ],
                status: Number(process.env.ACTIVE_STATUS),
              },
            },
          ],
        },
        {
          tableName: "tblMasterData",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [
                  { _id: { $in: Array.from(containerStatusId) } },
                  { _id: { $in: Array.from(natureOfCargoId) } },
                  { _id: { $in: Array.from(cargoTypeId) } },
                  { _id: { $in: Array.from(cargoWtUnitId) } },
                  { _id: { $in: Array.from(volumeUnitId) } },
                  { _id: { $in: Array.from(sizeId) } },
                  { _id: { $in: Array.from(typeId) } },
                  { _id: { $in: Array.from(wtUnitId) } },
                  { _id: { $in: Array.from(pacakgeId) } },
                ],
              },
            },
          ],
        },
        {
          tableName: "tblCountry",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [
                  { _id: { $in: Array.from(destinationCountryId) } },
                  { _id: { $in: Array.from(originCountryId) } },
                ],
              },
            },
          ],
        },
      ];

      const dataToQuery = tables.map((iterator) =>
        model.AggregateFetchData(
          iterator.tableName,
          iterator.tableName,
          iterator.query,
          res
        )
      );

      const resultOfQueryData = await Promise.all(dataToQuery);
      const portMap = new Map();
      const customerMap = new Map();
      const businessSegmentMap = new Map();
      const MasterDataMap = new Map();
      const CountryMap = new Map();

      for (const item of resultOfQueryData[0]) {
        if (item._id !== undefined && item.name !== undefined) {
          portMap.set(item._id.toString(), item.name);
        }
      }

      for (const item of resultOfQueryData[1]) {
        if (item._id !== undefined && item.name !== undefined) {
          businessSegmentMap.set(item._id.toString(), item.name);
        }
      }

      for (const item of resultOfQueryData[2]) {
        if (item._id !== undefined && item.name !== undefined) {
          customerMap.set(item._id.toString(), item.name);
        }
      }
      for (const item of resultOfQueryData[3]) {
        if (item._id !== undefined && item.name !== undefined) {
          MasterDataMap.set(item._id.toString(), { name: item.name });
        }
      }
      for (const item of resultOfQueryData[4]) {
        if (item._id !== undefined && item.name !== undefined) {
          CountryMap.set(item._id.toString(), { name: item.name });
        }
      }

      data.forEach((item) => {
        item["plrName"] = portMap.get(item.plrId) || "";
        item["polName"] = portMap.get(item.polId) || "";
        item["podName"] = portMap.get(item.podId) || "";
        item["fpdName"] = portMap.get(item.fpdId) || "";
        item["businessSegmentName"] =
          businessSegmentMap.get(item.businessSegmentId) || "";
        item["shipperName"] = customerMap.get(item.shipperId) || "";
        item["consigneeName"] = customerMap.get(item.consigneeId) || "";
        item["shippingLineName"] = customerMap.get(item.shippingLineId) || "";
        item["containerStatusName"] =
          MasterDataMap.get(item.containerStatusId)?.name || "";
        item["natureOfCargoName"] =
          MasterDataMap.get(item.natureOfCargoId)?.name || "";
        item["cargoTypeName"] = MasterDataMap.get(item.cargoTypeId)?.name || "";
        item["cargoWtUnitName"] =
          MasterDataMap.get(item.cargoWtUnitId)?.name || "";
        item["volumeUnitName"] =
          MasterDataMap.get(item.volumeUnitId)?.name || "";
        item["tradeTermsName"] =
          MasterDataMap.get(item.tradeTermsId)?.name || "";
        item["packageName"] = MasterDataMap.get(item.pacakgeId)?.name || "";
        item["destinationCountryName"] =
          CountryMap.get(item.destinationCountryId)?.name || "";
        item["originCountryName"] =
          CountryMap.get(item.originCountryId)?.name || "";
        item.tblEnquiryQty &&
          item.tblEnquiryQty.map((item) => {
            item["sizeName"] = MasterDataMap.get(item.sizeId)?.name || "";
            item["typeName"] = MasterDataMap.get(item.typeId)?.name || "";
            item["wtUnitName"] = MasterDataMap.get(item.wtUnitId)?.name || "";
          });
      });

      if (data.length > 0) {
        res.send({
          success: true,
          message: "Data fetched successfully",
          count: data.length,
          data: data,
        });
      } else {
        res.send({
          success: false,
          message: "Failed to fetch data",
          data: data,
        });
      }
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send({
        success: false,
        message: "Something went wrong",
        data: error.message,
      });
    }
  },
  WhTransactionDynamicReport: async (req, res) => {
    try {
      let matchData = { status: Number(process.env.ACTIVE_STATUS) };
      let { body } = req;
      FilterCondition(matchData, body);
      if (body.id && body.id != "undefined" && body.id !== "") {
        matchData["id"] = Number(body.id);
      }
      if (body._id && body._id != "undefined" && body._id !== "") {
        matchData["_id"] = new mongoose.Types.ObjectId(body._id);
      }
      if (
        body.customerId &&
        body.customerId != "undefined" &&
        body.customerId !== ""
      ) {
        matchData["customerId"] = Number(body.customerId);
      }
      if (
        body.finYearId &&
        body.finYearId != "undefined" &&
        body.finYearId !== ""
      ) {
        matchData["finYearId"] = String(body.finYearId);
      }
      if (
        body.shipperId &&
        body.shipperId != "undefined" &&
        body.shipperId !== ""
      ) {
        matchData["shipperId"] = Number(body.shipperId);
      }
      if (
        body.consigneeId &&
        body.consigneeId != "undefined" &&
        body.consigneeId !== ""
      ) {
        matchData["consigneeId"] = Number(body.consigneeId);
      }
      if (
        body.shippingLineId &&
        body.shippingLineId != "undefined" &&
        body.shippingLineId !== ""
      ) {
        matchData["shippingLineId"] = Number(body.shippingLineId);
      }
      if (body.plrId && body.plrId != "undefined" && body.plrId !== "") {
        matchData["plrId"] = Number(body.plrId);
      }
      if (body.polId && body.polId != "undefined" && body.polId !== "") {
        matchData["polId"] = Number(body.polId);
      }
      if (body.podId && body.podId != "undefined" && body.podId !== "") {
        matchData["podId"] = Number(body.podId);
      }
      if (body.fpdId && body.fpdId != "undefined" && body.fpdId !== "") {
        matchData["fpdId"] = Number(body.fpdId);
      }
      if (
        body.fromDate &&
        body.fromDate != "undefined" &&
        body.fromDate !== "" &&
        body.toDate &&
        body.toDate != "undefined" &&
        body.toDate !== ""
      ) {
        matchData["jobDate"] = {
          $gte: new Date(body.fromDate),
          $lte: new Date(body.toDate),
        };
      } else if (
        body.fromDate &&
        body.fromDate != "undefined" &&
        body.fromDate !== ""
      ) {
        matchData["jobDate"] = { $gte: new Date(body.fromDate) };
      } else if (
        body.toDate &&
        body.toDate != "undefined" &&
        body.toDate !== ""
      ) {
        matchData["jobDate"] = { $lte: new Date(body.toDate) };
      }
      let page = parseInt(req.query.page, 10) || 1;
      let pageSize = parseInt(req.query.pageSize, 100) || 1000;

      let skipCount = (page - 1) * pageSize;
      let query = [
        {
          $match: matchData,
        },
        {
          $sort: {
            id: 1,
          },
        },
        {
          $skip: skipCount,
        },
        {
          $limit: pageSize,
        },
      ];
      let project = {};
      if (body.projection && Object.keys(body.projection).length > 0) {
        project = body.projection;
      }
      if (Object.keys(project).length > 0) {
        query.push({ $project: project });
      }

      let data = await model.AggregateFetchData(
        "tblWhTransaction",
        "tblWhTransaction",
        query,
        res
      );
      console.log("Fetched data:", data);

      let customerId = new Set();
      let customerBranchId = new Set();
      let companyId = new Set();
      let brachId = new Set();
      let defaultFinYearId = new Set();
      let transporterId = new Set();

      let cargoTypeId = new Set();
      let currencyId = new Set();
      let wtUnitId = new Set();
      let volumeUnitId = new Set();
      let dimensionUnitId = new Set();
      let typeOfPackagesId = new Set();
      let itemTypeId = new Set();

      data.forEach((item) => {
        customerId.add(createObjectId(item.customerId));
        customerBranchId.add(createObjectId(item.customerBranchId));
        companyId.add(createObjectId(item.companyId));
        brachId.add(createObjectId(item.brachId));
        defaultFinYearId.add(createObjectId(item.defaultFinYearId));
        transporterId.add(createObjectId(item.transporterId));

        item.tblWhTransactionDetails &&
          item.tblWhTransactionDetails.map((x) => {
            cargoTypeId.add(createObjectId(x.cargoTypeId));
            currencyId.add(createObjectId(x.currencyId));
            wtUnitId.add(createObjectId(x.wtUnitId));
            volumeUnitId.add(createObjectId(x.volumeUnitId));
            dimensionUnitId.add(createObjectId(x.dimensionUnitId));
            typeOfPackagesId.add(createObjectId(x.typeOfPackagesId));
            itemTypeId.add(createObjectId(x.itemTypeId));
          });
      });

      const tables = [
        {
          tableName: "tblCompany",
          query: [
            {
              $match: {
                $or: [
                  { _id: { $in: Array.from(customerId) } },
                  { _id: { $in: Array.from(companyId) } },
                  { _id: { $in: Array.from(transporterId) } },
                ],
              },
            },
          ],
        },
        {
          tableName: "tblCompany",
          query: [
            {
              $unwind: {
                path: "$tblCompanyBranch",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                tblCompanyBranch: { $exists: true, $ne: null },
                $or: [
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(customerBranchId),
                    },
                  },
                  { "tblCompanyBranch._id": { $in: Array.from(brachId) } },
                ],
              },
            },
          ],
        },
        {
          tableName: "tblFinancialYear",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(defaultFinYearId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblMasterData",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [
                  { _id: { $in: Array.from(cargoTypeId) } },
                  { _id: { $in: Array.from(currencyId) } },
                  { _id: { $in: Array.from(wtUnitId) } },
                  { _id: { $in: Array.from(volumeUnitId) } },
                  { _id: { $in: Array.from(dimensionUnitId) } },
                  { _id: { $in: Array.from(typeOfPackagesId) } },
                  { _id: { $in: Array.from(itemTypeId) } },
                ],
              },
            },
          ],
        },
      ];

      const dataToQuery = tables.map((iterator) =>
        model.AggregateFetchData(
          iterator.tableName,
          iterator.tableName,
          iterator.query,
          res
        )
      );

      const resultOfQueryData = await Promise.all(dataToQuery);

      const customerMap = new Map();
      const CompanyBranchMap = new Map();
      const finYearMap = new Map();
      const MasterDataMap = new Map();

      for (const item of resultOfQueryData[0]) {
        if (item.oldId !== undefined) {
          customerMap.set(item._id.toString(), {
            name: item.name,
            branch: item.tblCompanyBranch,
          });
        }
      }
      for (const item of resultOfQueryData[1]) {
        if (
          item.tblCompanyBranch &&
          item.tblCompanyBranch.oldId !== undefined
        ) {
          CompanyBranchMap.set(item.tblCompanyBranch?._id.toString(), {
            name: item.tblCompanyBranch.name,
          });
        }
      }
      for (const item of resultOfQueryData[2]) {
        if (item._id !== undefined && item.financialYear !== undefined) {
          finYearMap.set(item._id.toString(), {
            financialYear: item.financialYear,
          });
        }
      }
      for (const item of resultOfQueryData[3]) {
        if (item._id !== undefined && item.name !== undefined) {
          MasterDataMap.set(item._id.toString(), {
            name: item.name,
            code: item.code,
          });
        }
      }

      data.forEach((item) => {
        const customerInfo = customerMap.get(item.customerId);
        item["customerName"] = customerInfo ? customerInfo.name : "";
        item["companyName"] = customerMap.get(item.companyId)?.name || "";
        item["transporterName"] =
          customerMap.get(item.transporterId)?.name || "";
        item["customerBranchName"] =
          CompanyBranchMap.get(item.customerBranchId)?.name || "";
        item["companyBranchName"] =
          CompanyBranchMap.get(item.brachId)?.name || "";
        item["financialYear"] =
          finYearMap.get(item.defaultFinYearId)?.financialYear || "";

        item.tblWhTransactionDetails &&
          item.tblWhTransactionDetails.map((item) => {
            item["cargoTypeName"] =
              MasterDataMap.get(item.cargoTypeId)?.name || "";
            item["currency"] = MasterDataMap.get(item.currencyId)?.name || "";
            item["currencyCode"] =
              MasterDataMap.get(item.currencyId)?.code || "";
            item["wtUnitName"] = MasterDataMap.get(item.wtUnitId)?.name || "";
            item["volumeUnitName"] =
              MasterDataMap.get(item.volumeUnitId)?.name || "";
            item["volumeUnitNameCode"] =
              MasterDataMap.get(item.volumeUnitId)?.code || "";
            item["dimensionUnitName"] =
              MasterDataMap.get(item.dimensionUnitId)?.name || "";
            item["dimensionUnitNameCode"] =
              MasterDataMap.get(item.dimensionUnitId)?.code || "";
            item["typeOfPackagesName"] =
              MasterDataMap.get(item.typeOfPackagesId)?.name || "";
            item["typeOfPackagesNameCode"] =
              MasterDataMap.get(item.typeOfPackagesId)?.code || "";
            item["itemTypeIdName"] =
              MasterDataMap.get(item.itemTypeId)?.name || "";
            item["itemTypeNameCode"] =
              MasterDataMap.get(item.itemTypeId)?.code || "";
          });
      });

      if (data.length > 0) {
        res.send({
          success: true,
          count: data.lenth,
          message: "Data fetched successfully",
          data: data,
        });
      } else {
        res.send({
          success: false,
          message: "Data not fetched successfully",
          data: data,
        });
      }
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send({
        success: false,
        message: "Something went wrong",
        data: error.message,
      });
    }
  },
  WarehouseStockDynamicReport: async (req, res) => {
    try {
      const matchData = { status: Number(process.env.ACTIVE_STATUS) };
      const { body } = req;
      console.log("body.filterCondition", Object.keys(body.filterCondition));

      FilterCondition(matchData, body);

      // Building the match criteria
      const idFields = ["id", "_id", "customerId", "customerBranchId"];
      idFields.forEach((field) => {
        if (body[field] && mongoose.Types.ObjectId.isValid(body[field])) {
          matchData[field === "_id" ? "_id" : field] =
            new mongoose.Types.ObjectId(body[field]);
        }
      });

      // Handle filterCondition
      if (
        body.filterCondition?.itemId &&
        mongoose.Types.ObjectId.isValid(body.filterCondition.itemId)
      ) {
        matchData["tblWhTransactionDetails.itemId"] =
          body.filterCondition.itemId;

        delete matchData.itemId;
      }

      console.log("Match Data:", matchData);

      // Pagination
      const page = parseInt(req.query.page, 10) || 1;
      const pageSize = parseInt(req.query.pageSize, 10) || 1000;
      const skipCount = (page - 1) * pageSize;

      const query = [
        { $match: matchData },
        { $sort: { id: 1 } },
        { $skip: skipCount },
        { $limit: pageSize },
      ];

      if (body.projection && Object.keys(body.projection).length) {
        query.push({ $project: body.projection });
      }

      const data = await model.AggregateFetchData(
        "tblWhTransaction",
        "tblWhTransaction",
        query,
        res
      );

      const customerMap = new Map();
      const customerBranchMap = new Map();
      const warehouseMap = new Map();
      const masterDataMap = new Map();
      const WhTransactionMap = new Map();
      const itemMap = new Map();
      const PortMap = new Map();

      // Check customer IDs
      const customerIds = [...new Set(data.map((item) => item.customerId))];
      const customerBranchIds = [
        ...new Set(data.map((item) => item.customerBranchId)),
      ];
      const validCustomerIds = customerIds.filter((id) =>
        mongoose.Types.ObjectId.isValid(id)
      );
      const validCustomerBranchIds = customerBranchIds.filter((id) =>
        mongoose.Types.ObjectId.isValid(id)
      );
      if (validCustomerIds.length) {
        const customers = await model.AggregateFetchData(
          "tblCompany",
          "tblCompany",
          [
            {
              $match: {
                _id: {
                  $in: validCustomerIds.map(
                    (id) => new mongoose.Types.ObjectId(id)
                  ),
                },
              },
            },
          ],
          res
        );
        customers.forEach((customer) => {
          customerMap.set(customer._id.toString(), { name: customer.name });
        });
      }
      if (validCustomerBranchIds.length) {
        const customersBranch = await model.AggregateFetchData(
          "tblCompany",
          "tblCompany",
          [
            {
              $match: {
                "tblCompanyBranch._id": {
                  $in: validCustomerBranchIds.map(
                    (id) => new mongoose.Types.ObjectId(id)
                  ),
                },
              },
            },
          ],
          res
        );
        customersBranch.forEach((company) => {
          company.tblCompanyBranch.forEach((branch) => {
            customerBranchMap.set(branch._id.toString(), {
              name: branch.name,
            });
          });
        });
      }

      // Check warehouse IDs
      const warehouseIds = [...new Set(data.map((item) => item.warehouseId))];
      const validWarehouseIds = warehouseIds.filter((id) =>
        mongoose.Types.ObjectId.isValid(id)
      );
      if (validWarehouseIds.length) {
        const warehouses = await model.AggregateFetchData(
          "tblWarehouse",
          "tblWarehouse",
          [
            {
              $match: {
                _id: {
                  $in: validWarehouseIds.map(
                    (id) => new mongoose.Types.ObjectId(id)
                  ),
                },
              },
            },
          ],
          res
        );
        warehouses.forEach((warehouse) => {
          warehouseMap.set(warehouse._id.toString(), { name: warehouse.name });
        });
      }

      // Populate masterDataMap with valid data
      const masterData = await model.AggregateFetchData(
        "tblMasterData",
        "tblMasterData",
        [{ $match: { status: Number(process.env.ACTIVE_STATUS) } }],
        res
      );
      masterData.forEach((item) => {
        masterDataMap.set(item._id.toString(), {
          name: item.name,
          code: item.code,
        });
      });

      // Populate PortMap with valid data
      const Port = await model.AggregateFetchData(
        "tblPort",
        "tblPort",
        [
          {
            $match: {
              status: Number(process.env.ACTIVE_STATUS),
              clientCode: body.clientCode,
            },
          },
        ],
        res
      );
      Port.forEach((item) => {
        PortMap.set(item._id.toString(), {
          name: item.name,
        });
      });

      // Populate WHTransactionMap with valid data
      const WhTransaction = await model.AggregateFetchData(
        "tblWhTransaction",
        "tblWhTransaction",
        [{ $match: { status: Number(process.env.ACTIVE_STATUS) } }],
        res
      );

      WhTransaction.forEach((item) => {
        WhTransactionMap.set(item._id.toString(), {
          referenceNo: item.referenceNo,
        });
      });

      // Populate itemMap with valid data
      const itemIds = [
        ...new Set(
          data.flatMap((item) =>
            item.tblWhTransactionDetails.map((detail) => detail.itemId)
          )
        ),
      ];
      const validitemIds = itemIds.filter((id) =>
        mongoose.Types.ObjectId.isValid(id)
      );
      if (validitemIds.length) {
        const tblItemData = await model.AggregateFetchData(
          "tblItem",
          "tblItem",
          [
            {
              $match: {
                _id: {
                  $in: validitemIds.map(
                    (id) => new mongoose.Types.ObjectId(id)
                  ),
                },
              },
            },
          ],
          res
        );
        tblItemData.forEach((item) => {
          itemMap.set(item._id.toString(), {
            name: item.ItemName,
            code: item.itemCode,
            model: item.model,
            brand: item.brand,
            manufacturer: item.manufacturer,
            typeofPackage: item.typeofPackage,
            category1: item.category1,
            category2: item.category2,
            category3: item.category3,
          });
        });
      }

      // Flattening data
      const flattenedData = [];
      const seenDetails = new Set();

      data.forEach((item) => {
        const customerInfo = customerMap.get(item.customerId);
        const customerBranch = customerBranchMap.get(item.customerBranchId);
        const cargoOwnerInfo = customerMap.get(item.cargoOwnerId);
        const warehouseInfo = warehouseMap.get(item.warehouseId);

        if (item.tblWhTransactionDetails?.length > 0) {
          item.tblWhTransactionDetails.forEach((detail) => {
            const itemInfo = itemMap.get(detail.itemId);
            const parentReferenceNoIds = item.parentReferenceNoId
              ? item.parentReferenceNoId.split(",").map((id) => id.trim())
              : [];

            // Initialize an array to store all reference numbers
            const parentReferenceNos = parentReferenceNoIds.map((id) => {
              const referenceNo = WhTransactionMap.get(id);
              // Log an error if the referenceNo is missing
              if (!referenceNo) {
                console.error(
                  `Reference number not found for parentReferenceNoId: ${id}`
                );
              }
              return referenceNo ? referenceNo.referenceNo : null;
            });

            // Filter out any empty reference numbers and concatenate them with a comma separator
            detail.parentReferenceNo = parentReferenceNos
              .filter((refNo) => refNo)
              .join(", ");

            const uniqueKey = `${detail.itemId}-${detail._id}`;
            if (!seenDetails.has(uniqueKey)) {
              seenDetails.add(uniqueKey);
              flattenedData.push({
                _id: item._id,
                id: item.id,
                status: item.status,
                createdDate: item.createdDate,
                createdBy: item.createdBy,
                updatedDate: item.updatedDate,
                updatedBy: item.updatedBy,
                companyId: item.companyId,
                customerRefNo: item.customerRefNo,
                brachId: item.brachId,
                defaultFinYearId: item.defaultFinYearId,
                clientCode: item.clientCode,
                srNo: item.srNo,
                referenceNo: item.referenceNo,
                referenceDate: item.referenceDate,
                parentReferenceNoId: item.parentReferenceNoId,
                parentReferenceNo: parentReferenceNos.join(", ") || "",
                warehouseId: item.warehouseId,
                customerId: item.customerId,
                customerBranchId: item.customerBranchId,
                customerAddress: item.customerAddress,
                cargoOwnerId: item.cargoOwnerId,
                cargoValue: item.cargoValue,
                placeOfOrigin: item.placeOfOrigin || "",
                customCleared: item.customCleared,
                remarks: item.remarks,
                handlingRemarks: item.handlingRemarks,
                customerSop: item.customerSop,
                transactionType: item.transactionType,
                ucnNo: item.ucnNo,
                warehousePerson: item.warehousePerson,
                deliverToId: item.deliverToId,
                deliveryAddress: item.deliveryAddress,
                customerName: customerInfo?.name || "",
                customerBranchName: customerBranch?.name || "",
                warehouseName: warehouseInfo?.name || "",
                cargoOwnerName: cargoOwnerInfo?.name || "",
                detailId: detail._id,
                itemId: detail.itemId,
                itemQty: detail.qty,
                itemTypeId: detail.itemTypeId,
                itemTypeName: masterDataMap.get(detail.itemTypeId)?.name || "",
                itemName: itemMap.get(detail.itemId)?.name || "",
                itemCode: itemMap.get(detail.itemId)?.code || "",
                itemModel: itemMap.get(detail.itemId)?.model || "",
                itemBrand: itemMap.get(detail.itemId)?.brand || "",
                itemManufacturer:
                  itemMap.get(detail.itemId)?.manufacturer || "",
                itemTypeOfPackage:
                  itemMap.get(detail.itemId)?.typeofPackage || "",
                itemCategory1: itemMap.get(detail.itemId)?.category1 || "",
                itemCategory2: itemMap.get(detail.itemId)?.category2 || "",
                itemCategory3: itemMap.get(detail.itemId)?.category3 || "",
                cargoTypeId: detail.cargoTypeId,
                cargoTypeName:
                  masterDataMap.get(detail.cargoTypeId)?.name || "",
                reefer: detail.reefer,
                rate: detail.rate,
                currencyId: detail.currencyId,
                currencyName: masterDataMap.get(detail.currencyId)?.name || "",
                amount: detail.amount,
                noOfPackages: detail.noOfPackages,
                typeOfPackagesId: detail.typeOfPackagesId,
                grossWt: detail.grossWt,
                netWt: detail.netWt,
                wtUnitId: detail.wtUnitId,
                volume: detail.volume,
                volumeUnitId: detail.volumeUnitId,
                length: detail.length,
                width: detail.width,
                height: detail.height,
                dimensionUnitId: detail.dimensionUnitId,
                QRCode: detail.QRCode,
                customerbatchNo: detail.customerbatchNo,
                statusId: detail.statusId,
                sectionId: detail.sectionId,
                subSectionId: detail.subSectionId,
                isChecked: detail.isChecked,
              });
            }
          });
        } else {
          flattenedData.push({
            _id: item._id,
            id: item.id,
            status: item.status,
            createdDate: item.createdDate,
            createdBy: item.createdBy,
            updatedDate: item.updatedDate,
            updatedBy: item.updatedBy,
            companyId: item.companyId,
            customerRefNo: item.customerRefNo,
            brachId: item.brachId,
            defaultFinYearId: item.defaultFinYearId,
            clientCode: item.clientCode,
            srNo: item.srNo,
            referenceNo: item.referenceNo,
            referenceDate: item.referenceDate,
            parentReferenceNoId: item.parentReferenceNoId,
            warehouseId: item.warehouseId,
            customerId: item.customerId,
            customerBranchId: item.customerBranchId,
            customerAddress: item.customerAddress,
            cargoOwnerId: item.cargoOwnerId,
            cargoValue: item.cargoValue,
            placeOfOrigin: item.placeOfOrigin || "",
            customCleared: item.customCleared,
            remarks: item.remarks,
            handlingRemarks: item.handlingRemarks,
            customerSop: item.customerSop,
            transactionType: item.transactionType,
            ucnNo: item.ucnNo,
            warehousePerson: item.warehousePerson,
            deliverToId: item.deliverToId,
            deliveryAddress: item.deliveryAddress,
            customerName: customerInfo?.name || "",
            warehouseName: warehouseInfo?.name || "",
            cargoOwnerName: cargoOwnerInfo?.name || "",
            detailId: null,
            itemId: null,
            itemQty: null,
            itemTypeId: null,
            itemTypeName: "",
            itemName: "",
            itemCode: "",
            itemModel: "",
            itemBrand: "",
            itemManufacturer: "",
            itemTypeOfPackage: "",
            itemCategory1: "",
            itemCategory2: "",
            itemCategory3: "",
            cargoTypeId: null,
            cargoTypeName: "",
            reefer: null,
            rate: null,
            currencyId: null,
            amount: null,
            noOfPackages: null,
            typeOfPackagesId: null,
            grossWt: null,
            netWt: null,
            wtUnitId: null,
            volume: null,
            volumeUnitId: null,
            length: null,
            width: null,
            height: null,
            dimensionUnitId: null,
            QRCode: null,
            customerbatchNo: null,
            statusId: null,
            sectionId: null,
            subSectionId: null,
            isChecked: null,
          });
        }
      });

      res.send({
        success: true,
        message: "Data fetched successfully",
        count: flattenedData.length,
        data: flattenedData,
      });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send({
        success: false,
        message: "Something went wrong",
        data: error.message,
      });
    }
  },
  VehicleRouteReport: async (req, res) => {
    try {
      let matchData = { status: Number(process.env.ACTIVE_STATUS) };
      let { body } = req;
      FilterCondition(matchData, req.body);
      if (body.id && body.id != "undefined" && body.id !== "") {
        matchData["id"] = Number(body.id);
      }
      if (body._id && body._id != "undefined" && body._id !== "") {
        matchData["_id"] = new mongoose.Types.ObjectId(body._id);
      }
      if (
        body.customerId &&
        body.customerId != "undefined" &&
        body.customerId !== ""
      ) {
        matchData["customerId"] = Number(body.customerId);
      }
      if (
        body.finYearId &&
        body.finYearId != "undefined" &&
        body.finYearId !== ""
      ) {
        matchData["finYearId"] = String(body.finYearId);
      }
      if (
        body.shipperId &&
        body.shipperId != "undefined" &&
        body.shipperId !== ""
      ) {
        matchData["shipperId"] = Number(body.shipperId);
      }
      if (
        body.consigneeId &&
        body.consigneeId != "undefined" &&
        body.consigneeId !== ""
      ) {
        matchData["consigneeId"] = Number(body.consigneeId);
      }
      if (
        body.shippingLineId &&
        body.shippingLineId != "undefined" &&
        body.shippingLineId !== ""
      ) {
        matchData["shippingLineId"] = Number(body.shippingLineId);
      }
      if (body.plrId && body.plrId != "undefined" && body.plrId !== "") {
        matchData["plrId"] = Number(body.plrId);
      }
      if (body.polId && body.polId != "undefined" && body.polId !== "") {
        matchData["polId"] = Number(body.polId);
      }
      if (body.podId && body.podId != "undefined" && body.podId !== "") {
        matchData["podId"] = Number(body.podId);
      }
      if (body.fpdId && body.fpdId != "undefined" && body.fpdId !== "") {
        matchData["fpdId"] = Number(body.fpdId);
      }
      if (
        body.fromDate &&
        body.fromDate != "undefined" &&
        body.fromDate !== "" &&
        body.toDate &&
        body.toDate != "undefined" &&
        body.toDate !== ""
      ) {
        matchData["jobDate"] = {
          $gte: new Date(body.fromDate),
          $lte: new Date(body.toDate),
        };
      } else if (
        body.fromDate &&
        body.fromDate != "undefined" &&
        body.fromDate !== ""
      ) {
        matchData["jobDate"] = { $gte: new Date(body.fromDate) };
      } else if (
        body.toDate &&
        body.toDate != "undefined" &&
        body.toDate !== ""
      ) {
        matchData["jobDate"] = { $lte: new Date(body.toDate) };
      }
      let page = parseInt(req.query.page, 10) || 1;
      let pageSize = parseInt(req.query.pageSize, 100) || 1000;

      let skipCount = (page - 1) * pageSize;
      let query = [
        {
          $match: matchData,
        },
        {
          $sort: {
            id: 1,
          },
        },
        {
          $skip: skipCount,
        },
        {
          $limit: pageSize,
        },
      ];
      let project = {};
      if (body.projection && Object.keys(body.projection).length > 0) {
        project = body.projection;
      }
      if (Object.keys(project).length > 0) {
        query.push({ $project: project });
      }

      let data = await model.AggregateFetchData(
        "tblVehicleRoute",
        "tblVehicleRoute",
        query,
        res
      );

      let vehicleId = new Set();
      let driverId = new Set();
      let routeType = new Set();
      let routeDistanceUnit = new Set();
      let vehicleOrderId = new Set();
      let orderCompletionStatus = new Set();
      let deliverToIdSet = new Set(); // For tblCompany

      data.forEach((item) => {
        vehicleId.add(createObjectId(item.vehicleId));
        driverId.add(createObjectId(item.driverId));
        routeType.add(createObjectId(item.routeType));
        routeDistanceUnit.add(createObjectId(item.routeDistanceUnit));
        item.tblVehicleRouteDetails &&
          item.tblVehicleRouteDetails.map((x) => {
            console.log("x", x);
            vehicleOrderId.add(createObjectId(x.vehicleOrderId));
            orderCompletionStatus.add(createObjectId(x.orderCompletionStatus));
            deliverToIdSet.add(createObjectId(x.deliverToId)); // Add this line
          });
      });

      const tables = [
        {
          tableName: "tblVehicle",
          query: [
            {
              $match: {
                $or: [{ _id: { $in: Array.from(vehicleId) } }],
                status: Number(process.env.ACTIVE_STATUS),
              },
            },
          ],
        },
        {
          tableName: "tblEmployee",
          query: [
            {
              $match: {
                $or: [{ _id: { $in: Array.from(driverId) } }],
              },
            },
          ],
        },
        {
          tableName: "tblMasterData",
          query: [
            {
              $match: {
                $or: [
                  { _id: { $in: Array.from(routeType) } },
                  { _id: { $in: Array.from(routeDistanceUnit) } },
                  { _id: { $in: Array.from(orderCompletionStatus) } },
                ],
                status: Number(process.env.ACTIVE_STATUS),
              },
            },
          ],
        },
        {
          tableName: "tblVehicleOrder",
          query: [
            {
              $match: {
                $or: [{ _id: { $in: Array.from(vehicleOrderId) } }],
                status: Number(process.env.ACTIVE_STATUS),
              },
            },
          ],
        },
        {
          tableName: "tblCompany", // Add the tblCompany query
          query: [
            {
              $match: {
                _id: { $in: Array.from(deliverToIdSet) },
                status: Number(process.env.ACTIVE_STATUS), // Optional: filter by active status
              },
            },
          ],
        },
      ];

      const dataToQuery = tables.map((iterator) =>
        model.AggregateFetchData(
          iterator.tableName,
          iterator.tableName,
          iterator.query,
          res
        )
      );

      const resultOfQueryData = await Promise.all(dataToQuery);

      const vehicleMap = new Map();
      const employeeMap = new Map();
      const masterDataMap = new Map();
      const VehicleOrderMap = new Map();
      const companyMap = new Map(); // Map for company names

      for (const item of resultOfQueryData[0]) {
        if (item._id !== undefined) {
          vehicleMap.set(item._id.toString(), {
            name: item.vehicleName,
          });
        }
      }
      for (const item of resultOfQueryData[1]) {
        if (item._id !== undefined) {
          employeeMap.set(item._id.toString(), {
            name: item.employeeName,
          });
        }
      }
      for (const item of resultOfQueryData[2]) {
        if (item._id !== undefined) {
          masterDataMap.set(item._id.toString(), {
            name: item.name,
          });
        }
      }
      for (const item of resultOfQueryData[3]) {
        if (item._id !== undefined) {
          VehicleOrderMap.set(item._id.toString(), {
            name: item.vehicleOrderNo,
            date: item.vehicleOrderDate,
            address: item.pickupLocationAddress,
            zipCode: item.pickupLocationZipcode,
            deliveryLocationAddress: item.deliveryLocationAddress,
            deliveryLocationZipcode: item.deliveryLocationZipcode,
            noOfPackages: item.noOfPackages,
            deliverToId: item.deliverToId,
          });
        }
        for (const item of resultOfQueryData[4]) {
          // Now we process tblCompany
          if (item._id !== undefined) {
            companyMap.set(item._id.toString(), {
              name: item.name,
            });
          }
        }
        console.log("Company Data: =>>>>>>>", resultOfQueryData[4]); // Add this line
      }

      data.forEach((item) => {
        item["vehicleName"] = vehicleMap.get(item.vehicleId)?.name || "";
        item["driverName"] = employeeMap.get(item.driverId)?.name || "";
        item["routeTypeName"] = masterDataMap.get(item.routeType)?.name || "";
        item["routeDistanceUnitName"] =
          masterDataMap.get(item.routeDistanceUnit)?.name || "";
        item.tblVehicleRouteDetails &&
          item.tblVehicleRouteDetails.map((item) => {
            //tblVehicleRouteDetails
            item["vehicleOrderName"] =
              VehicleOrderMap.get(item.vehicleOrderId)?.name || "";
            item["vehicleOrderDate"] =
              VehicleOrderMap.get(item.vehicleOrderId)?.date || "";
            item["pickupLocationAddress"] =
              VehicleOrderMap.get(item.vehicleOrderId)?.address || "";
            item["pickupLocationZipCode"] =
              VehicleOrderMap.get(item.vehicleOrderId)?.zipCode || "";
            item["deliveryLocationAddress"] =
              VehicleOrderMap.get(item.vehicleOrderId)
                ?.deliveryLocationAddress || "";
            item["deliveryLocationZipcode"] =
              VehicleOrderMap.get(item.vehicleOrderId)
                ?.deliveryLocationZipcode || "";
            item["noOfPackages"] =
              VehicleOrderMap.get(item.vehicleOrderId)?.noOfPackages || "";
            item["deliverToId"] =
              VehicleOrderMap.get(item.vehicleOrderId)?.deliverToId || "";
            item["orderCompletionStatusName"] =
              masterDataMap.get(item.orderCompletionStatus)?.name || "";

            // Debugging deliverToId
            console.log("deliverToId !!!!!!!!!!!!!", item.deliverToId);

            // Add the company name based on deliverToId
            item["deliverToName"] =
              companyMap.get(item.deliverToId)?.name || "";

            // Log the company map to verify the values
            console.log("Company Map:", Array.from(companyMap.entries()));
          });
      });

      if (data.length > 0) {
        res.send({
          success: true,
          message: "Data fetched successfully",
          data: data,
        });
      } else {
        res.send({
          success: false,
          message: "Data not fetched successfully",
          data: data,
        });
      }
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send({
        success: false,
        message: "Something went wrong",
        data: error.message,
      });
    }
  },

  ContainerPlanner: async (req, res) => {
    try {
      let matchData = { status: Number(process.env.ACTIVE_STATUS) };
      let { body } = req;
      // let { body } = body.filterCondition .fromDate;
      //FilterCondition(matchData, req.body);
      if (body.id && body.id != "undefined" && body.id !== "") {
        matchData["id"] = Number(body.id);
      }
      if (body._id && body._id != "undefined" && body._id !== "") {
        matchData["_id"] = new mongoose.Types.ObjectId(body._id);
      }
      if (
        body.customerId &&
        body.customerId != "undefined" &&
        body.customerId !== ""
      ) {
        matchData["customerId"] = Number(body.customerId);
      }
      if (
        body.finYearId &&
        body.finYearId != "undefined" &&
        body.finYearId !== ""
      ) {
        matchData["finYearId"] = String(body.finYearId);
      }
      if (
        body.shipperId &&
        body.shipperId != "undefined" &&
        body.shipperId !== ""
      ) {
        matchData["shipperId"] = Number(body.shipperId);
      }
      if (
        body.consigneeId &&
        body.consigneeId != "undefined" &&
        body.consigneeId !== ""
      ) {
        matchData["consigneeId"] = Number(body.consigneeId);
      }
      if (
        body.shippingLineId &&
        body.shippingLineId != "undefined" &&
        body.shippingLineId !== ""
      ) {
        matchData["shippingLineId"] = Number(body.shippingLineId);
      }
      if (body.plrId && body.plrId != "undefined" && body.plrId !== "") {
        matchData["plrId"] = Number(body.plrId);
      }
      if (body.polId && body.polId != "undefined" && body.polId !== "") {
        matchData["polId"] = Number(body.polId);
      }
      if (body.podId && body.podId != "undefined" && body.podId !== "") {
        matchData["podId"] = Number(body.podId);
      }
      if (body.fpdId && body.fpdId != "undefined" && body.fpdId !== "") {
        matchData["fpdId"] = Number(body.fpdId);
      }
      if (
        body.filterCondition.fromDate &&
        body.filterCondition.fromDate != "undefined" &&
        body.filterCondition.fromDate !== "" &&
        body.filterCondition.toDate &&
        body.filterCondition.toDate != "undefined" &&
        body.filterCondition.toDate !== ""
      ) {
        matchData["containerPlanningDate"] = {
          $gte: new Date(body.filterCondition.fromDate),
          $lte: new Date(body.filterCondition.toDate),
        };
      } else if (
        body.filterCondition.fromDate &&
        body.filterCondition.fromDate != "undefined" &&
        body.filterCondition.fromDate !== ""
      ) {
        let formattedFromDate = body.filterCondition.fromDate
          .split("/")
          .reverse()
          .join("-");
        matchData["containerPlanningDate"] = {
          $gte: new Date(formattedFromDate),
        };
      } else if (
        body.filterCondition.toDate &&
        body.filterCondition.toDate != "undefined" &&
        body.filterCondition.toDate !== ""
      ) {
        let formattedToDate = body.filterCondition.toDate
          .split("/")
          .reverse()
          .join("-");
        matchData["containerPlanningDate"] = {
          $lte: new Date(formattedToDate),
        };
      }
      let page = parseInt(req.query.page, 10) || 1;
      let pageSize = parseInt(req.query.pageSize, 100) || 1000;
      console.log("matchData =>>>>", matchData);
      let skipCount = (page - 1) * pageSize;
      let query = [
        {
          $match: matchData,
        },
        {
          $sort: {
            id: 1,
          },
        },
        {
          $skip: skipCount,
        },
        {
          $limit: pageSize,
        },
      ];
      let project = {};
      if (body.projection && Object.keys(body.projection).length > 0) {
        project = body.projection;
      }
      if (Object.keys(project).length > 0) {
        query.push({ $project: project });
      }

      let data = await model.AggregateFetchData(
        "tblContainerPlanner",
        "tblContainerPlanner",
        query,
        res,
        { maxTimeMS: 30000 } // Increase timeout to 30 seconds
      );

      let loginCompany = new Set();
      let loginBranch = new Set();
      let loginfinYear = new Set();
      let customer = new Set();
      let size = new Set();
      let type = new Set();
      let vessel = new Set();
      let grossWtUnit = new Set();
      let shippingLine = new Set();

      data.forEach((item) => {
        loginCompany.add(createObjectId(item.loginCompany));
        loginBranch.add(createObjectId(item.loginBranch));
        loginfinYear.add(createObjectId(item.loginfinYear));
        customer.add(createObjectId(item.customer));
        size.add(createObjectId(item.size));
        type.add(createObjectId(item.type));
        vessel.add(createObjectId(item.vessel));
        grossWtUnit.add(createObjectId(item.grossWtUnit));
        shippingLine.add(createObjectId(item.shippingLine));
      });

      const tables = [
        //0
        {
          tableName: "tblCompany",
          query: [
            {
              $match: {
                $or: [
                  { _id: { $in: Array.from(shippingLine) } },
                  { _id: { $in: Array.from(loginCompany) } },
                  { _id: { $in: Array.from(customer) } },
                ],
              },
            },
          ],
        },
        //1
        {
          tableName: "tblCompany",
          query: [
            {
              $unwind: {
                path: "$tblCompanyBranch",
                preserveNullAndEmptyArrays: true,
              },
            },
            {
              $match: {
                tblCompanyBranch: { $exists: true, $ne: null },
                $or: [
                  {
                    "tblCompanyBranch._id": {
                      $in: Array.from(loginBranch),
                    },
                  },
                ],
              },
            },
          ],
        },
        //2
        {
          tableName: "tblFinancialYear",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [{ _id: { $in: Array.from(loginfinYear) } }],
              },
            },
          ],
        },
        //3
        {
          tableName: "tblMasterData",
          query: [
            {
              $match: {
                status: Number(process.env.ACTIVE_STATUS),
                $or: [
                  { _id: { $in: Array.from(size) } },
                  { _id: { $in: Array.from(type) } },
                  { _id: { $in: Array.from(grossWtUnit) } },
                ],
              },
            },
          ],
        },
        //4
        {
          tableName: "tblVesselFlight",
          query: [
            {
              $match: {
                $or: [{ _id: { $in: Array.from(vessel) } }],
              },
            },
          ],
        },
      ];

      const dataToQuery = tables.map((iterator) =>
        model.AggregateFetchData(
          iterator.tableName,
          iterator.tableName,
          iterator.query,
          res
        )
      );

      const resultOfQueryData = await Promise.all(dataToQuery);

      const companyMap = new Map(); // Map for company names
      const CompanyBranchMap = new Map();
      const finYearMap = new Map();
      const MasterDataMap = new Map();
      const vesselFlightMap = new Map();

      for (const item of resultOfQueryData[0]) {
        if (item._id !== undefined) {
          companyMap.set(item._id.toString(), {
            name: item.name,
          });
        }
      }
      for (const item of resultOfQueryData[1]) {
        if (item.tblCompanyBranch && item.tblCompanyBranch._id !== undefined) {
          CompanyBranchMap.set(item.tblCompanyBranch?._id.toString(), {
            name: item.tblCompanyBranch.name,
          });
        }
      }
      for (const item of resultOfQueryData[2]) {
        if (item._id !== undefined && item.financialYear !== undefined) {
          finYearMap.set(item._id.toString(), {
            financialYear: item.financialYear,
          });
        }
      }
      for (const item of resultOfQueryData[3]) {
        if (item._id !== undefined && item.name !== undefined) {
          MasterDataMap.set(item._id.toString(), { name: item.name });
        }
      }
      for (const item of resultOfQueryData[4]) {
        if (item._id !== undefined) {
          vesselFlightMap.set(item._id.toString(), {
            name: item.name,
          });
        }
      }
      data.forEach((item) => {
        item["shippingLineName"] =
          companyMap.get(item.shippingLine)?.name || "";
        item["loginCompanyName"] =
          companyMap.get(item.loginCompany)?.name || "";
        item["loginBranchName"] =
          CompanyBranchMap.get(item.loginBranch)?.name || "";
        item["financialYear"] =
          finYearMap.get(item.loginfinYear)?.financialYear || "";
        item["customerName"] = companyMap.get(item.customer)?.name || "";
        item["sizeName"] = MasterDataMap.get(item.size)?.name || "";
        item["typeName"] = MasterDataMap.get(item.type)?.name || "";
        item["grossWtUnitName"] =
          MasterDataMap.get(item.grossWtUnit)?.name || "";
        item["vesselName"] = vesselFlightMap.get(item.vessel)?.name || "";
        if (item.returnDate !== null) {
          // Item has a return date (completed return)
          item["colorCodeNew"] = "#C2FFC7"; // Green
        } else if (
          item.vbsBookingNo !== null &&
          item.returnVbsBookingNo === null
        ) {
          // Item has a VBS booking but no return VBS booking
          item["colorCodeNew"] = "#FCF596"; // Yellow
        } else if (item.collectionDate !== null && item.returnDate === null) {
          // Item has a collection date but no return date
          item["colorCodeNew"] = "#FFDDAE"; // Orange
        } else if (item.vbsBookingNo !== null) {
          // Item has a VBS booking (general case)
          item["colorCodeNew"] = "#B7E0FF"; // Blue
        } else {
          // Default case (no specific conditions met)
          item["colorCodeNew"] = "#FFFFFF"; // White
        }
      });

      if (data.length > 0) {
        res.send({
          success: true,
          message: "Data fetched successfully",
          count: data.length,
          data: data,
        });
      } else {
        res.send({
          success: false,
          message: "Data not fetched successfully",
          count: data.length,
          data: data,
        });
      }
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send({
        success: false,
        message: "Something went wrong",
        data: error.message,
      });
    }
  },
};
