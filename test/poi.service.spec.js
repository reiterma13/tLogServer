/**
 * Created by salho on 13.10.16.
 */
'use strict';

// import the `mongoose` helper utilities
let utils = require('./utils');
import chai from 'chai';
let should = chai.should();
import chaiHttp from 'chai-http';
import {port} from '../server.conf';
import {createTestUser, login, createSamplePOIs, standardUser} from './helpers';
import fs from "fs";

import POI from '../app/models/poi.model';

chai.use(chaiHttp);

let serverPort = port;

let serverInfo = {
  address: () => {
    return {address: '127.0.0.1', port: serverPort}
  }
};



const fakeOwner = {
      username: "poiowner",
      password: "topsecret",
      email: "po@test.com",
      roles: ["user"]
}

describe('POI API', ()=> {

  it('should allow to create new POI if we are logged in', done => {
    createTestUser()
      .then(user => login(serverInfo, 'johnny', 'topsecret'))
      .then(res => chai.request(serverInfo)
        .post('/api/poi')
        .set('authorization', `Bearer ${res.body.token}`)
        .send({
          name: "A POI",
          description: "A POI description",
          loc: {coordinates: [13.5, 45.2]}
        })
      )
      .then(res => {
        res.should.have.status(200);
        let poi = res.body;
        should.exist(poi._id);
        poi.creator.local.username.should.equal("johnny");
        should.not.exist(poi.creator.local.password);
        done();
      })
      .catch(done);
  });

  it('should not allow to create new POI if we are not logged in', done => {
    chai.request(serverInfo)
      .post('/api/poi')
      .send({
        name: "A POI",
        description: "A POI description",
        loc: {coordinates: [13.5, 45.2]}
      })
      .then(res => {
        done(new Error("This should not work!!"));
      })
      .catch(err => {
        err.response.should.have.status(401);
        done();
      });
  });

  it("should list the latest ten entries", (done) => {
    createTestUser()
      .then(user => createSamplePOIs(12,user))
      .then(()=>login(serverInfo, 'johnny', 'topsecret'))
      .then(res =>
        chai.request(serverInfo)
          .get('/api/poi')
          .set('authorization', `Bearer ${res.body.token}`))
      .then(res => {
        res.should.have.status(200);
        res.body.should.have.length(10);
        const pois = res.body;
        pois.forEach((poi,index) =>
          poi.name.should.be.equal("POI " + (12 - index))
        );
        done()
      })
      .catch(done)
  });

  it("should support pagination", (done) => {
    let token = null;
    const getPage = (page, size, numberOfPois,resultLength,token) =>
        chai.request(serverInfo)
          .get(`/api/poi?size=${size}&page=${page}`)
          .set('authorization', `Bearer ${token}`)
          .then(res => {
            res.should.have.status(200);
            const pois = res.body;
            pois.should.have.length(resultLength);
            pois.forEach((poi,index)=>
              poi.name.should.equal(`POI ${numberOfPois - index}`)
            );
            return Promise.resolve();
          }).catch(err=>Promise.reject(err))
    createTestUser()
      .then(user => createSamplePOIs(12,user))
      .then(pois => login(serverInfo, 'johnny', 'topsecret'))
      .then((res) => {
        token = res.body.token;
        return getPage(0, 8, 12, 8, token);
      })
      .then(() => getPage(1, 8, 4, 4, token))
      .then(()=>done())
      .catch(done);
  });

  it("should be possible to load a single POI by its id", done => {
    let poiToList = null;
    createTestUser()
      .then(user => createSamplePOIs(12,user))
      .then((pois)=>{
        poiToList = pois[4];
        return login(serverInfo, 'johnny', 'topsecret')
      })
      .then(res =>
        chai.request(serverInfo)
          .get(`/api/poi/${poiToList._id}`)
          .set('authorization', `Bearer ${res.body.token}`))
      .then(res => {
        res.should.have.status(200);
        let poi = res.body;
        poi.name.should.be.equal(poiToList.name);
        poi.description.should.be.equal(poiToList.description);
        should.exist(poi._id);
        poi.loc.coordinates.should.be.an('array').and.have.lengthOf(2);
        poi.loc.coordinates[0].should.be.equal(poiToList.loc.coordinates[0]).and.be.a.Number;
        poi.loc.coordinates[1].should.be.equal(poiToList.loc.coordinates[1]).and.be.a.Number;
        should.exist(poi.creator);
        poi.creator.local.username.should.be.equal("johnny");
        done()
      }).catch(done);
  });

  it("should produce an error, if the POI does not exist", done => {
    chai.request(serverInfo)
      .get(`/api/poi/42`)
      .then(()=>done(new Error("It should be impossible to read a POI that does not exit!")))
      .catch((err) => {
        err.response.should.have.status(400);
        err.response.body.message.should.be.equal('This POI could not be found');
        done();
      })
    });

  it("should reject the query for a single POI if the user is not logged in", done => {
    let poiToList = null;
    createTestUser()
      .then(user => createSamplePOIs(12,user))
      .then(pois =>
        chai.request(serverInfo)
          .get(`/api/poi/${pois[6]._id}`))
      .then(res =>
        done(new Error("This should not be allowed!"))
      ).catch((err) => {
        err.response.should.have.status(401);
        done()
      })
  });

  it("should be possible to update a single POI ", done => {
    let poiToList = null;
    createTestUser()
      .then(user => createSamplePOIs(12,user))
      .then((pois)=>{
        poiToList = pois[3];
        return login(serverInfo, 'johnny', 'topsecret')
      })
      .then(res =>
        chai.request(serverInfo)
          .patch(`/api/poi/${poiToList._id}`)
          .set('authorization', `Bearer ${res.body.token}`)
          .send({name: "POI Updated"}))
      .then(res => {
        res.should.have.status(200);
        let poi = res.body;
        poi.name.should.be.equal("POI Updated");
        poi.description.should.be.equal(poiToList.description);
        should.exist(poi._id);
        poi.loc.coordinates.should.be.an('array').and.have.lengthOf(2);
        poi.loc.coordinates[0].should.be.equal(poiToList.loc.coordinates[0]).and.be.a.Number;
        poi.loc.coordinates[1].should.be.equal(poiToList.loc.coordinates[1]).and.be.a.Number;
        should.exist(poi.creator);
        poi.creator.local.username.should.be.equal("johnny");
        done()
      }).catch(done);
  });

  it("should not be possible to update a single POI if the current user is not the creator", done => {
    let poiToList = null;
    createTestUser(fakeOwner)
      .then(() => createTestUser())
      .then(user => createSamplePOIs(12,user))
      .then((pois)=>{
        poiToList = pois[11];
        return login(serverInfo, fakeOwner.username, fakeOwner.password)
      })
      .then(res =>
        chai.request(serverInfo)
          .patch(`/api/poi/${poiToList._id}`)
          .set('authorization', `Bearer ${res.body.token}`)
          .send({name: "POI Updated"}))
      .then(res => {
        done(new Error("This should not be allowed!"));
      }).catch((err) => {
        err.should.have.status(403);
        err.response.body.message.should.be.equal("You are not allowed to change somebody else's POI");
        done();
    });
  });

  it("should be possible to delete a poi, if you are the creator or an admin", done => {
    let poiToDelete = null;
    createTestUser()
      .then(user => createSamplePOIs(12,user))
      .then((pois)=>{
        poiToDelete = pois[11];
        return login(serverInfo, 'johnny', 'topsecret')
      })
      .then(res =>
        chai.request(serverInfo)
          .delete(`/api/poi/${poiToDelete._id}`)
          .set('authorization', `Bearer ${res.body.token}`))
      .then(res => {
        res.should.have.status(200);
        let poi = res.body;
        poi.name.should.be.equal("POI 12");
        poi.description.should.be.equal("Description 12");
        should.exist(poi._id);
        poi.loc.coordinates.should.be.an('array').and.have.lengthOf(2);
        poi.loc.coordinates[0].should.be.equal(12).and.be.a.Number;
        poi.loc.coordinates[1].should.be.equal(12).and.be.a.Number;
        should.exist(poi.creator);
        poi.creator.local.username.should.be.equal("johnny");
        return POI.findOne({_id: poi._id})
      })
      .then(poi => (poi === null) ? done() : done(new Error("POI was not deleted!")))
      .catch(done);
  });

  it("should NOT be possible to delete a poi, if you are neither the creator nor an admin", done => {
    let poiToDelete = null;
    createTestUser(fakeOwner)
      .then(() => createTestUser())
      .then(user => createSamplePOIs(12,user))
      .then((pois)=>{
        poiToDelete = pois[3];
        return login(serverInfo, fakeOwner.username, fakeOwner.password)
      })
      .then(res =>
        chai.request(serverInfo)
          .delete(`/api/poi/${poiToDelete._id}`)
          .set('authorization', `Bearer ${res.body.token}`)
          .send({name: "POI Updated"}))
      .then(res => {
        done(new Error("This should not be allowed!"));
      }).catch((err) => {
      err.should.have.status(403);
      err.response.body.message.should.be.equal("You are not allowed to change somebody else's POI");
      done();
    });
  });

  it("should support adding images to POIs", done => {
    let poiToAddImage = null;
    let owner = null;
    createTestUser(standardUser)
      .then(user => {owner = user; return createSamplePOIs(1,owner)})
      .then(pois => {poiToAddImage = pois[0]; return login(serverInfo,standardUser.username,standardUser.password)})
      .then(res => chai.request(serverInfo)
        .post(`/api/poi/${poiToAddImage._id}/image`)
        .set('authorization', `Bearer ${res.body.token}`)
        .field("description","A Test Image")
        .attach('file',fs.createReadStream('test/images/test.png'))
      )
      .then(res => {
        res.should.have.status(200);
        const imgData = res.body;
        imgData.filename.should.be.equal('test.png');
        imgData.contentType.should.be.equal('image/png');
        imgData.metadata.poi.should.be.equal(poiToAddImage._id.toString());
        imgData.metadata.creator.should.be.equal(owner._id.toString());
        }
      )
      .then(() => POI.load(poiToAddImage._id))
      .then(poi => {
        poi.images.should.be.an('array');
        poi.images.should.have.lengthOf(1);
        const testImage = poi.images[0];
        testImage.description.should.be.equal("A Test Image");
        done();
      })
      .catch(done)
  });



});

