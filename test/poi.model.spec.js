'use strict';

// import the `mongoose` helper utilities
    let utils = require('./utils');
    import chai from 'chai';
    import {createTestUser} from './helpers';
    let should = chai.should();

// import our `User` mongoose model
    import POI from '../app/models/poi.model';

    describe('POI: models', () => {

      describe('create()', () => {

        it('should create a new POI', (done) => {
          let newPOI = new POI();
          newPOI.name = "A test POI";
          newPOI.description = "A sample description";
          newPOI.loc.coordinates = [13.5,45.2];
          createTestUser()
            .then(u => {
              newPOI.creator = u._id;
              return newPOI.save();
            })
            .then(poi => {
              poi.name.should.equal("A test POI");
              poi.description.should.equal("A sample description");
              should.exist(poi.createdAt);
              poi.loc.type.should.equal("Point");
              poi.loc.coordinates.should.be.an('array');
              poi.loc.coordinates.should.have.length(2);
              poi.loc.coordinates.should.include.members([13.5,45.2]);
              done();
            })
            .catch(error => done(error));
        });

        it('should not allow for POI without properties',(done)=> {
          const newPOI = new POI();
          newPOI.save()
            .then( ()=> done("It should not be possible to save a POI without attributes!"))
            .catch(()=>done());
        });

        it('should load a POI along with the creators name', done => {
          createTestUser()
            .then(user => (new POI({name:"TEST",loc: {coordinates: [13.5,45.2]}, creator: user._id})).save())
            .then(poi => POI.load(poi._id))
            .then(p => {
              p.creator.local.username.should.equal("johnny");
              should.not.exist(p.creator.local.password);
              p.name.should.equal("TEST");
              p.loc.coordinates.should.be.an('array');
              p.loc.coordinates.should.have.length(2);
              p.loc.coordinates.should.include.members([13.5,45.2]);
              done();
            })
            .catch(done)
        });

        it('should create a new POI that can be found via nearSphere',done => {
          createTestUser()
            .then(user => (new POI({name:"Test",loc: {coordinates: [5, 4]}, creator: user._id})).save())
            .then(()=>POI.find({}).where('loc').nearSphere({
              center: [6, 3],
              maxDistance: 5
            }))
            .then(pois => {
              pois.should.have.a.lengthOf(1);
              pois = pois[0];
              pois.name.should.be.equal("Test");
              pois.loc.coordinates.should.have.a.lengthOf(2);
              pois.loc.coordinates.should.have.members([5, 4]);
              done()
            })
            .catch(done)
        });

      });
});
