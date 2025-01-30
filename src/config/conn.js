// var mysql = require('mysql');
const MysqlCache = require('mysql-cache')

var connection = new MysqlCache({
	host     : process.env.DB_HOST,
	user     : process.env.DB_USER,
	password : process.env.DB_PASSWORD,
	connectionLimit : 1000, 
	database : process.env.DB,
	hashing: 'farmhash64',
	prettyError:true,
	stdoutErrors: true,
	verbose: true,
	TTL: 0,
	caching: true,
	cacheProvider:   'LRU',
	cacheProviderSetup: {
        // For example when we use memcached (checking the module configuration object) we can do this:
        serverLocation: 'localhost:3000',
        options: {
            retries:10,
            retry:10000,
            remove:true,
            failOverServers:['localhost:3000'],
        }
    }

});
connection.connect(function(err) {
    if (err) throw err;
    
});

module.exports = connection;