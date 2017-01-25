'use strict';

// import the `mongoose` helper utilities
let utils = require('./utils');
import chai from 'chai';
let should = chai.should();

// import our `User` mongoose model
import User from '../app/models/user.model';

describe('User: models', () => {

  describe('create()', () => {

    it('should create a new user', (done) => {

      // Create a `Todo` object to pass to `Todo.create()``
      let newUser = new User();
      newUser.local.username = "johnny"
      newUser.local.password = newUser.generateHash("topsecret")
      newUser.local.email = "jd@test.com"
      newUser.roles = ['admin','user']
      newUser.save()
        .then(u => {
          u.local.username.should.equal("johnny");
          u.roles.should.be.a('array');
          u.roles.should.contain.all('admin', 'user');
          should.exist(u._id);
          done();
        })
        .catch(error => done(error));

    });
  });
});
