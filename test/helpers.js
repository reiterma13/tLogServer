/**
 * Created by salho on 13.10.16.
 */
import User from '../app/models/user.model';
import POI from '../app/models/poi.model';
import chai from 'chai';
import chaiHttp from 'chai-http';
import Trip from '../app/models/trip.model';

chai.use(chaiHttp);

export const adminUser = {
  username: "johnny",
  password: "topsecret",
  email: "jd@test.com",
  roles: ['admin','user']
};

export const standardUser = {
  username: "standard",
  password: "topsecret",
  email: "su@test.com",
  roles: ['user']
};


export const createTestUser = (newUser = adminUser) => {
  let user = new User();
  user.local.username = newUser.username;
  user.local.password = user.generateHash(newUser.password);
  user.local.email = newUser.email;
  user.roles = newUser.roles;
  return user.save();
};

export const login = (server,username,password) => chai.request(server)
  .post('/api/auth/login')
  .set('content-type','application/`x-www-form-urlencoded')
  .type('form')
  .send(`username=${username}`)
  .send(`password=${password}`);

/**
 * creates on single POI identified by nr
 * @param nr identifier of the POI
 * @param user creator of the POI
 * @returns A promise for the saved POI
 */
const createSamplePOI = (nr,user,baseName='POI') => new POI({
  name: `${baseName} ${nr}`,
  description: `Description ${nr}`,
  loc: {coordinates: [nr,nr]},
  creator: user._id
}).save();

/**
 * Creates a series of POIs
 * @param nr number of POIs that should be created
 * @param user creator of the POIs
 * @returns A promise for an array of all created POIs
 */
export const createSamplePOIs =(nr,user,baseName='POI') =>
    Array.from(Array(nr).keys())
      .reduce((promise,number) => promise.then((array)=>
        createSamplePOI(number+1,user,baseName).then(poi => {array.push(poi);return Promise.resolve(array)}))
      ,Promise.resolve([]));


const createSampleTrip = (nr,user) =>
  createSamplePOIs(5,user,`Trip ${nr} - POI`)
    .then(pois => new Trip({
      name: `Trip ${nr}`,
      description: `Description ${nr}`,
      pois: pois,
      creator: user._id
    }).save());


export const createSampleTrips =(nr,user) =>
  Array.from(Array(nr).keys())
    .reduce((promise,number) => promise.then((array)=>
        createSampleTrip(number+1,user).then(trip => {array.push(trip);return Promise.resolve(array)}))
      ,Promise.resolve([]));
