const router = require('express').Router();
const Plan = require('../models/Plan');
const errorHandler = require('../utils/error-handler');

module.exports = router
  .post('/plans', (req, res) => {
    const plan = req.body;
    return new Plan(plan).save()
      .then(plan => res.json(plan))
      .catch(err => errorHandler(err, req, res));
  })
  .get('/plans/:id', (req, res) => {
    Plan.findById(req.params.id)
      .lean()
      .then(plan => res.json(plan))
      .catch(err => errorHandler(err, req, res));
  });
// add own plan
// update own plan
// join friend's plan
// update friend's plan (leave the plan)
