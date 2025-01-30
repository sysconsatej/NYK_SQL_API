const sql = require('./../../src/config/conn');
const moment = require('moment');
const now = moment();
const Logger = require('../../src/helper/loggerService');
const logger = new Logger('Model');
var path = require('path');
var handlebars =require('handlebars');
const mime=require("mime")
const UploadLink = process.env.HOST+process.env.PORT+'/';
const WEB_URL = process.env.WEB_URL; 
const request = require('request');
const ACTIVE_STATUS=process.env.ACTIVE_STATUS;
const IN_ACTIVE_STATUS=process.env.IN_ACTIVE_STATUS;
const fs=require("fs")


exports.QueryListData = async(query,data,res) => {
return new Promise( function(resolve , reject ){
	console.log(query);
	sql.query(query,data,(err, result,cache) => {
    	if(err) 
		{	
			console.log(result);
			console.log(err);
			logger.error(err);
		}
		console.log(typeof result);

		if(result) resolve(result);
			
		else resolve([]);
	});
  });
};
exports.CheckUnique = async(field,table,val,res,id_field='',id='') => {
return new Promise( function(resolve , reject ){
	let where ='';
	let data=[ACTIVE_STATUS,val];

	if(id!=undefined && id!='' && id_field!=undefined && id_field!='')
	{
		where=' AND '+id_field+'!=?';
		data.push(id);
	}
	let str=' AND '+field+'=?';
	let query = "SELECT `"+field+"` FROM "+table+" WHERE status=?"+str+where+"";
	console.log(query);
	sql.query(query,data,(err, result,cache) => {
    	if(err) 
		{
			console.log(err);
			logger.error(err);
		}
		console.log(typeof result);

		if(result && result.length) resolve(false);
			
		else resolve(true);
	});
  });
};
exports.CheckUniqueWithRef = async(field,table,val,res,id_field='',id='',ref_feild='',ref_id='') => {
return new Promise( function(resolve , reject ){
	let where ='';
	let data=[ACTIVE_STATUS,val];

	if(id!=undefined && id!='' && id_field!=undefined && id_field!='')
	{
		where+=' AND '+id_field+'!=?';
		data.push(id);
	}
	if(ref_feild!=undefined && ref_feild!='' && ref_id!=undefined && ref_id!='')
	{
		where+=' AND '+ref_feild+'=?';
		data.push(ref_id);
	}
	let str=' AND '+field+'=?';
	let query = "SELECT `"+field+"` FROM "+table+" WHERE status=?"+str+where+"";
	console.log(query);
	sql.query(query,data,(err, result,cache) => {
    	if(err) 
		{
			console.log(err);
			logger.error(err);
		}
		console.log(typeof result);

		if(result.length) resolve(false);
			
		else resolve(true);
	});
  });
};

exports.QueryPostData = async(query,data,res) => {
  return new Promise( function(resolve , reject ){
	sql.query(query,data,(err, result,cache) => {
    	if(err) 
		{
			console.log(err);
			logger.error(err);
		}
		
		if(result)
		{
			if(cache.isCache==false)
			{
				sql.flush();
			}
			resolve(result);
		} 
			
		else resolve([]);
	});
  });
};

exports.CheckForDelete = async(table_name,cond,data)=>{
	return new Promise(async function(resolve, reject){
		let query ="SELECT * FROM "+table_name+" WHERE "+cond;
		sql.query(query,data,(err, result,cache) => {
    	if(err) 
		{
			console.log(err);
			logger.error(err);
		}
		if(result && result.length>0)
		{
			resolve(false);
		}
		else
		{
			resolve(true);
		}
	});
	});
};

exports.UniqueMobileNo=(req)=>{
	return new Promise( function(resolve , reject ){
		
	let query ="SELECT `mobile_no` FROM `users` WHERE status=? AND `mobile_no`=? And verify_status=? ";
	let data = [ACTIVE_STATUS,req.body.mobile_no,'1'];
		sql.query(query,data,(err, result,cache) => {
			console.log(result);
			if(err) 
			{
				logger.error(err);
				resolve([]);
			}
			if(result) resolve(result);
			
			else resolve([]);
		});
	});
};


exports.QueryPostDataNew = async(query,data,res) => {
  return new Promise( function(resolve , reject ){
	sql.query(query,data,(err, result,cache) => {
    if(err) 
		{
			console.log(err);
			logger.error(err);
			reject(err)
		}
		
			if(cache && cache.isCache==false)
			{
				sql.flush();
			}
			resolve(result);
	
	});
  });
};

exports.QueryListDataNew = async(query,data,res) => {
return new Promise( function(resolve , reject ){
	console.log(query);
	sql.query(query,data,(err, result,cache) => {
    	if(err) 
		{
			console.log(err);
			logger.error(err);
			reject(err);
		}
		
		resolve(result);
	});
  });
};
exports.storeImage=(base64, path, res) => {
	
    const result = {};
    let matches = base64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let response = {};
    response.type = matches[1];
    response.data = new Buffer.from(matches[2], 'base64');

    let decodeImge = response;
    let imageBuffer = decodeImge.data;
	
    let type = decodeImge.type;
    let extensions = mime.getExtension(type);
	const now = moment();
	var todays_dt = now.format("YYYYMMDDHHmmss");
	console.log("tpodays_dt",todays_dt);

    var random = Math.floor(Math.random() * (999999 - 100000 + 1)) + 100000+todays_dt;
    path = path + random + '.' + extensions;
	console.log("base64",path)
	console.log("imagebuffer",imageBuffer);

    try {
       var image= fs.writeFileSync(path, imageBuffer, 'utf8');
		console.log("image",image);
        result.path = path.replace('public','');
    } catch (err) {
        result.path = false;
		result.err=err
    } finally {
        return result;
    }
}



