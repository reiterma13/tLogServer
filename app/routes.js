// ```
// routes.js
// (c) 2015 David Newman
// david.r.niciforovic@gmail.com
// routes.js may be freely distributed under the MIT license
// ```

// */app/routes.js*

// ## Node API Routes

// Define routes for the Node backend

// Load our API routes for user authentication
import authRoutes from './routes/_authentication.router.js';
import poiRoutes from './routes/_poi.router';
import tripRoutes from './routes/_trip.routes';
import ejwt from 'express-jwt';
import jwt from 'jsonwebtoken';


export default (app, router, passport) => {

  // ### Express Middlware to use for all requests
  router.use((req, res, next) => {

    console.log('I sense a disturbance in the force...'); // DEBUG

    // Make sure we go to the next routes and don't stop here...
    next();
  });

  //Middleware for all routes that need authentication
  const authenticate = ejwt({secret: process.env.SESSION_SECRET})

  const addUserFromToken = (req, res, next) => {
    try {
      const token = /Bearer (\w+?\.\w+?\.\S+)/.exec(req.header('authorization'))[1];
      const user = jwt.verify(token, process.env.SESSION_SECRET)
      req.user = user;
      next();
    } catch (err) {
      next();
    }
  };

  // Define a middleware function to be used for all secured administration
  // routes
  let admin = (req, res, next) => {

    if (!req.isAuthenticated() || !req.user.roles.includes('admin'))
      res.send(401);

    else
      next();
  };

  // ### Server Routes

  // Handle things like API calls,

  // #### Authentication routes

  // Pass in our Express app and Router.
  // Also pass in auth & admin middleware and Passport instance
  authRoutes(app, router, passport, authenticate, admin, addUserFromToken);
  poiRoutes(app,router,authenticate,admin);
  tripRoutes(app,router,authenticate,admin);

  // #### RESTful API Routes

  // All of our routes will be prefixed with /api
  app.use('/api', router);

  // ### Frontend Routes

  // Route to handle all Angular requests
  app.get('*', (req, res) => {

    // Load our src/app.html file
    //** Note that the root is set to the parent of this folder, ie the app root **
    res.sendFile('/dist/index.html', {root: __dirname + "/../"});
  });
};
