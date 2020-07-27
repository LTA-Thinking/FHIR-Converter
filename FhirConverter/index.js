
var converter = require('./converter');

module.exports = async function (context, req) {
    return converter.convert(req.body)
        .then(response => {
            context.res = { body: response.resultMsg };
            context.done();
        })
        .catch(err => {
            context.res = { status: err.status, body: err.resultMsg };
            context.done();
        });
};