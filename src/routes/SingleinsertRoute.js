// Main application file (e.g., index.js)

const express = require('express');
const bodyParser = require('body-parser');
const app = express();

const FormRouter = require('./FormRoute');
const roleRouter = require('./roleRouter');
// ... other router imports ...


const dynamicRouterMiddleware = (req, res, next) => {
    let routeName
    if (Array.isArray(req.body)) {
        routeName = req.body[0].routeName;   
    }else{
        routeName = req.body.routeName;
    }
    console.log(routeName);
    console.log('Received request............. on /api/insertdata with routeName:', routeName);

    switch (routeName) {
       
        
        case 'masterdata':
            //MasterRouter(req, res, next);
            req.url = '/api/master/MasterAdd';
            next('route');
            break;

        case 'mastervalue':
            //MasterRouter(req, res, next);
            req.url = '/api/master/Insert_into_master';
            next('route');
            break;


        case 'FormRoute':
            
            req.url = '/api/FormControl/add';  // Modify the URL to route to /add
            next('route');     // Continue to the next matching route
            break;

        case 'menucontrol':
            //menuRouter(req, res, next);
            req.url = '/api/menuControl/add'
            next('route');
            break;
        case 'roleRouter':

            console.log('ssssssssssss')
            //roleRouter(req, res, next);
            req.url = '/api/roleControl/add'
            next('route');  
            break;
        
        case 'usercontrol':
            //userRouter(req, res, next);
            req.url = '/api/userControl/add';
            next('route');
            break;
        case 'verifyotp':
                //userRouter(req, res, next);
                req.url = '/api/userControl/verifyOtp';
                next('route');
                break;
        case 'forgotpassword':
                //userRouter(req, res, next);
                req.url = '/api/userControl/forgotPassword';
                next('route');
                break;
        case 'changepassword':
                //userRouter(req, res, next);
                req.url = '/api/userControl/changePassword';
                next('route');
                break;
        default:
            res.status(404).send('Route not found');
    }
    
};

module.exports = dynamicRouterMiddleware;

// ... mount other routers ...

// Start the server

