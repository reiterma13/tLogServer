/**
 * Created by salho on 17.10.16.
 */
'use strict';
let utils = require('./utils');
import chai from 'chai';
import {createTestUser,createSamplePOIs} from './helpers';
let should = chai.should();
import Trip from '../app/models/trip.model';

describe('Trip model', ()=> {

  it('should be possible to create new Trips', done => {
    createTestUser()
      .then(user => new Trip({
        name: "First Trip",
        description: "Description 1",
        creator: user
      }).save())
      .then((trip) => {
        trip.name.should.be.equal("First Trip");
        trip.pois.should.be.an("array");
        trip.pois.should.be.empty;
        should.exist(trip.createdAt);
        trip.createdAt.should.be.an("date");
        should.exist(trip._id);
        trip.description.should.be.equal("Description 1");
        done()})
      .catch(done)
  });

  it("Should populate POI's if loaded", done => {
      createTestUser()
        .then(user => createSamplePOIs(5,user))
        .then(pois => new Trip({
          name: "First Trip",
          description: "Description 1",
          creator: pois[0].creator,
          pois: pois
        }).save())
        .then(trip => Trip.load(trip._id))
        .then(trip => {
          trip.pois.should.be.an("array");
          trip.pois.should.have.lengthOf(5);
          trip.name.should.be.equal("First Trip");
          trip.description.should.be.equal("Description 1");
          trip.pois.forEach((poi,index) =>
            poi.name.should.be.equal(`POI ${index+1}`)
          );
          trip.creator.local.username.should.be.equal('johnny');
          should.not.exist(trip.creator.local.password);
          done();
        })
        .catch(done);
  });

});
