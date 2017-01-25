/**
 * Created by salho on 11.10.16.
 */
'use strict';

// import the `mongoose` helper utilities
let utils = require('./utils');
import chai from 'chai';
let should = chai.should();
import chaiHttp from 'chai-http';
import {port} from '../server.conf';
import jwt from 'jsonwebtoken';

import User from '../app/models/user.model';

chai.use(chaiHttp);

let serverPort = port;

let serverInfo = {
  address: () => {return {address:'127.0.0.1', port:serverPort}}
}

const createTestUser = () => {
  let user = new User();
  user.local.username = "johnny";
  user.local.password = user.generateHash("topsecret");
  user.local.email = "jd@test.com";
  user.roles = ['admin','user'];
  return user.save();
};

describe('Authentication API',()=> {

  it('should allow to check whether we are logged in', done => {
      chai.request(serverInfo)
        .get('/api/auth/loggedIn')
        .end((err, res) => {
          res.should.have.status(200);
          res.text.should.equal("0");
          done();
        });

    }
  );
  it('should support to sign up', done => {
    chai.request(serverInfo)
      .post('/api/auth/signup')
      .set('content-type','application/json')
      .send({username:"Jesse",email:"jj@test.com",password:"topsecret"})
      .then(res => {
        res.should.have.status(200);
        res.should.be.json;
        should.exist(res.body.token);
        let [header,payload] = res.body.token.split('.').slice(0,2).map(v => JSON.parse(new Buffer(v,'base64').toString()));
        header.typ.should.equal("JWT");
        payload.username.should.equal("jesse");
        payload.email.should.equal("jj@test.com");
        payload.roles.should.include.members(['user']);
        should.exist(payload.id);
        done();
      })
      .catch(done);
  });
  it('should not accept illegal email addresses', done => {
    chai.request(serverInfo)
      .post('/api/auth/signup')
      .set('content-type','application/json')
      .send({username:"Jesse",email:"no email",password:"topsecret"})
      .end((err, res) => {
        res.should.have.status(401);
        res.should.be.json;
        res.body.message.should.equal('Invalid email address.');
        done();
      });
  });

  it('should support login', done => {

    createTestUser()
      .then(u => chai.request(serverInfo)
        .post('/api/auth/login')
        .set('content-type','application/x-www-form-urlencoded')
        .type('form')
        .send('username=jd@test.com')
        .send('password=topsecret')
        .then(res => {
          res.should.have.status(200);
          res.should.be.json;
          should.exist(res.body.token);
          const token = res.body.token;
          const [header,payload] = token.split('.').slice(0,2).map(v => JSON.parse(new Buffer(v,'base64').toString()));
          header.typ.should.equal("JWT");
          payload.username.should.equal("johnny");
          payload.email.should.equal("jd@test.com");
          should.exist(payload.id);
          const user = jwt.verify(token, process.env.SESSION_SECRET);
          return chai.request(serverInfo)
            .get('/api/auth/loggedIn')
            .set('authorization', `Bearer ${token}`)
        })
        .then(res => {
          res.should.have.status(200);
          res.should.be.json;
          let user = res.body;
          user.username.should.equal("johnny");
          user.email.should.equal("jd@test.com");
          user.roles.should.include.members(['admin','user']);
          done();
        })
      )
      .catch(err => done(err));
  });

});
