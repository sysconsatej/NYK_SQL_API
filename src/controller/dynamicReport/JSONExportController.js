module.exports = { 
    ExportToJson: async (req, res) => {
        res.send({name:"Akshaya", collegues:['Rohit','Khushboo','Omkar'], company:'Syscon'})
    },
    ExportToXML: async (req, res) => {
        res.send({name:"Akshaya", friend:{name:'Khushboo',age:22}, collegues:['Rohit','Khushboo','Omkar'], company:'Syscon'})
    },
    ExportToASCII: async (req,res) => {
        res.send({name:"Akshaya", friend:{name:'Kiran',age:25}, collegues:['Rohit','Khushboo','Omkar'], company:'Syscon'})
    }
 }