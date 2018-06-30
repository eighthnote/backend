const express = require('express');
const app = express();
const morgan = require('morgan');
const errorHandler = require('./utils/error-handler');

app.use(morgan('dev'));
app.use(express.static('./public'));
app.use(express.json());

const profile = require('./routes/profile');
const auth = require('./routes/auth');

app.use('/api', auth);
app.use('/api', profile);

app.use((req, res) => {
  res.sendFile('index.html', { root: './public'} );
});

app.use(errorHandler());

module.exports = app;