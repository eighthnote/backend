/* eslint-disable-next-line no-console */
module.exports = function createErrorHandler(log = console.log) {

  /* eslint-disable-next-line no-unused-vars */
  return (err, req, res, next) => {
    let showLog = process.env.NODE_ENV !== 'production';
    let code = 500;
    let error = 'Internal Server Error';

    if(err.status || err.code) {
      code = err.status || err.code;
      error = err.error;
    }
    else if(err.name === 'CaseError') {
      code = 400;
      error = err.message;
    }
    else if(err.name === 'ValidationError') {
      code = 400;
      error = Object.values(err.errors).map(e => e.message);
    }
    else {
      showLog = true;
    }

    if(showLog) log(code, error);

    res.status(code).json({ error });
  };
};