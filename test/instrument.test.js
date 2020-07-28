'use strict';

const expect = require('chai').expect;
const request = require('supertest');

let app;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

before((done) => {
  app = require('../server/server');
  done();
});

describe('Instrument', () => {
  const requestUrl = '/panosc-api/Instruments';
  describe('GET /instruments', () => {
    context('without filter', () => {
      it('should return an array of instruments', (done) => {
        request(app)
          .get(requestUrl)
          .set('Accept', 'application/json')
          .expect(200)
          .expect('Content-Type', /json/)
          .end((err, res) => {
            if (err) throw err;

            expect(res.body).to.be.an('array');
            res.body.forEach((instrument) => {
              expect(instrument).to.have.property('pid');
              expect(instrument).to.have.property('name');
              expect(instrument).to.have.property('facility');
              expect(instrument).to.have.property('score');
            });
            done();
          });
      });
    });

    context('where name is equal to LoKI', () => {
      it('should return an array of instruments matching the query', (done) => {
        const filter = JSON.stringify({
          where: {
            name: 'LoKI',
          },
        });
        request(app)
          .get(requestUrl + '?filter=' + filter)
          .set('Accept', 'application/json')
          .expect(200)
          .expect('Content-Type', /json/)
          .end((err, res) => {
            if (err) throw err;

            expect(res.body).to.be.an('array');
            res.body.forEach((instrument) => {
              expect(instrument).to.have.property('pid');
              expect(instrument).to.have.property('name');
              expect(instrument.name).to.equal('LoKI');
              expect(instrument).to.have.property('facility');
              expect(instrument).to.have.property('score');
            });
            done();
          });
      });
    });

    context('where facility is equal to ESS, with pagination', () => {
      it('should return an array of instruments matching the query', (done) => {
        const filter = JSON.stringify({
          where: {
            facility: 'ESS',
          },
          skip: 0,
          limit: 3,
        });
        request(app)
          .get(requestUrl + '?filter=' + filter)
          .set('Accept', 'application/json')
          .expect(200)
          .expect('Content-Type', /json/)
          .end((err, res) => {
            if (err) throw err;

            expect(res.body).to.be.an('array');
            expect(res.body.length).to.equal(3);
            res.body.forEach((instrument) => {
              expect(instrument).to.have.property('pid');
              expect(instrument).to.have.property('name');
              expect(instrument).to.have.property('facility');
              expect(instrument.facility).to.equal('ESS');
              expect(instrument).to.have.property('score');
            });
            done();
          });
      });
    });
  });

  describe('GET /instruments/{id}', () => {
    it('should return the instrument with the requested pid', (done) => {
      const pid = '125e8172-d0f4-4547-98be-a9db903a6269';
      request(app)
        .get(requestUrl + '/' + encodeURIComponent(pid))
        .set('Accept', 'application/json')
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) throw err;

          expect(res.body).to.have.property('pid');
          expect(res.body['pid']).to.equal(pid);
          expect(res.body).to.have.property('name');
          expect(res.body).to.have.property('facility');
          done();
        });
    });
  });
});
