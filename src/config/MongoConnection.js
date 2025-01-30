const mongoos = require("mongoose")
const colors = require("colors")
// let url=`mongodb+srv://sysconinfotech:syscon2024@sysconcluster.upeiehm.mongodb.net/sysconLSS`
//let url=`mongodb://syscon:syscon@173.212.214.215:27017/sysconLSS?authSource=admin`
//let url=`mongodb://syscon:jPNJmOC3r81w7G@94.136.187.171:27017/sysconLSS?authSource=admin`
let url=`mongodb://sysconAmin:syscon-u23r81w7G@94.136.187.171:28017/sysconLSS?authsource=admin`



// let url=`mongodb://localhost:27017/sysconLSS?authSource=admin`


// const connectionUrl = `mongodb://sysconAmin:syscon-u23r81w7G@94.136.187.171:28017/redashtestDb?authsource=admin`

mongoos.connect(url)
const db = mongoos.connection;
db.on("error", console.error.bind(console, "connection error: ".red));
db.once("open", function () {
  console.log("Connected successfully".green);
});
// mongoos.set("debug", true)
mongoos.pluralize(false)
module.exports = mongoos
