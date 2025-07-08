var createError = require("http-errors");
require("dotenv").config();
var express = require("express");
const fileUpload = require("express-fileupload");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var { errorLogger } = require("./src/helper/loggerService");
var bodyParser = require("body-parser");
var session = require("express-session");
var status = require("express-status-monitor");
const sqllConnection = require("./src/config/sqlConfig");

var flash = require("connect-flash");
// const connection=require('./src/config/MongoConnection');
var cors = require("cors");
var app = express();
app.use(
  fileUpload({
    createParentPath: true,
  })
);
app.use(cors({ credentials: true, origin: true }));
app.use(cookieParser());
app.use(session({ secret: "123", resave: false, saveUninitialized: false }));

app.use(flash());
var sessionFlash = function (req, res, next) {
  res.locals.currentUser = req.user;
  res.locals.error = req.flash("error");
  res.locals.success = req.flash("success");
  next();
};
app.use(sessionFlash);
app.use(status());
app.set("views", path.join(__dirname, "views"));
app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");
app.use("/site", express.static("static"));
sqllConnection.connectToSql()

app.use(logger("dev"));
app.use(express.json({ limit: "100mb" }));
app.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));
app.use(bodyParser.json({ limit: "100mb" }));
app.use(express.static(path.join(__dirname, "public")));
const BalanceRouter = require("./src/routes/Balancereport");
const BalanceSheet = require("./src/routes/BalanceSheet");
const reportSearchCriteria = require("./src/routes/reportSearchCriteria");
const MasterRouter = require("./src/routes/master");
const FormRouter = require("./src/routes/FormRoute");
const menuRouter = require("./src/routes/menuRoute");
const roleRouter = require("./src/routes/roleRouter");
const userRouter = require("./src/routes/userRoute");
const NoGenerationRoutes = require("./src/routes/NoGenerationRoutes");
const ImageForLoing = require("./src/routes/ImageForLoing");
const Reports = require("./src/routes/Reports&sp");
const yearEnding = require("./src/routes/yearEnding");
const sp = require("./src/routes/storeProcedure ");
const dynamicRouterMiddleware = require("./src/routes/SingleinsertRoute"); // Adjust path as needed
const validations = require("./src/routes/validation");
const ReportsHtml = require("./src/routes/ReportsHtml"); //AKASH------
const SendEmail = require("./src/routes/Email"); //AKASH------
const loginNew = require("./src/routes/NewsRoutes");
const chartRoutes = require("./src/routes/chartRoutes");
const eInvoicing = require("./src/routes/eInvoicingRoute");
const DynamicReports = require("./src/routes/DynamicReports");
const balanceSheetRoute = require("./src/routes/BalanceSheetRoute");


// const redashQuery = require('./src/routes/redashRoutes');

// const { loggers } = require('winston');

// app.use((err, req, res, next) => {
//   errorLogger(err, req);
//    res.status(500).send({
//      success: false,
//      message: 'Something went wrong',
//      data: []
//    });
//  });
//const dynamicRouterMiddleware = require('./src/routes/SingleinsertRoute')

// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.post("/api/insertdata", dynamicRouterMiddleware);
app.use("/form", FormRouter);
app.use("/api/balancereport", BalanceRouter);
app.use("/api/reportSearchCriteria", reportSearchCriteria);
app.use("/api/master", MasterRouter);
app.use("/api/FormControl", FormRouter);
app.use("/api/menuControl", menuRouter);
app.use("/api/roleControl", roleRouter);
app.use("/api/userControl", userRouter);
app.use("/api/NoGeneration", NoGenerationRoutes);
app.use("/api/image", ImageForLoing);
app.use("/api/Reports", Reports);
app.use("/api/year", yearEnding);
app.use("/api/sp", sp);
app.use("/api/balanceSheet", balanceSheetRoute);
app.use("/api", BalanceSheet);

process.on("uncaughtException", (error) => {
  console.log(error);
  // logger.error('Uncaught Exception:', error);
  errorLogger(error);
  // Optionally, perform a graceful shutdown:
  // process.exit(1); // Exiting the process after logging an uncaught exception is a common practice
});
app.use("/api/validations", validations);
app.use("/api/News", loginNew);
app.use("/api/reports", ReportsHtml);
app.use("/api/send", SendEmail);
app.use("/api/Reports", Reports);
app.use("/api/chart", chartRoutes);
app.use("/api/eInvoicing", eInvoicing);
app.use("/api/DRpt", DynamicReports);

//++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// SQL Code Started

const SQlMenuRouter = require("./src/routesSQL/menuRoute");
const SQlFormRouter = require("./src/routesSQL/formRoute");
const SQlMasterRouter = require("./src/routesSQL/masterRoute");
const postInvoiceData = require("./src/routesSQL/invoiceRoute");
const postVoucherData = require("./src/routesSQL/voucherRoute");
const postInvoiceAckData = require("./src/routesSQL/invoiceAckRoute");
const postVoucherAckData = require("./src/routesSQL/voucherAckRoute");
const postVoucherNewData = require("./src/routesSQL/voucherNewRoute");
const postVoucherAckNewData = require("./src/routesSQL/voucherAckNewRoute");
const SQLDynamicRouterMiddleware = require("./src/routesSQL/sqlDynamicRouterMiddleware");

app.post("/Sql/api/insertdata", SQLDynamicRouterMiddleware);
app.use("/Sql/api/menuControl", SQlMenuRouter);
app.use("/Sql/api/FormControl", SQlFormRouter);
app.use("/Sql/api/master", SQlMasterRouter);
app.use("/Sql/api/invoice", postInvoiceData);
app.use("/Sql/api/voucher", postVoucherData);
app.use("/Sql/api/invoiceAck", postInvoiceAckData);
app.use("/Sql/api/voucherAck", postVoucherAckData);
app.use("/Sql/api/voucherNew", postVoucherNewData);
app.use("/Sql/api/voucherAckNew", postVoucherAckNewData);



app.use(function (req, res, next) {
  next(createError(404));
});
// console.log("connection", connect);
// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.removeHeader("X-Powered-By");
  res.set(
    "Cache-Control",
    "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"
  );

  res.locals.message = err.message;
  console.log(err.message);
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page

  res.status(err.status || 500);
  res.send({ success: false, message: "Api Not Found", data: [] });
});



module.exports = app;
