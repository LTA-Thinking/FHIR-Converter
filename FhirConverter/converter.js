
var path = require('path');
var fs = require('fs');
var HandlebarsConverter = require('./handlebars-converter/handlebars-converter');
var dataHandlerFactory = require('./dataHandler/dataHandlerFactory');
var constants = require('./constants/constants');
var errorCodes = require('./error/error').errorCodes;
var errorMessage = require('./error/error').errorMessage;


function GetHandlebarsInstance(dataTypeHandler, templatesMap) {
    var instance = HandlebarsConverter.instance(true,
        dataTypeHandler,
        path.join(constants.BASE_TEMPLATE_FILES_LOCATION, dataTypeHandler.dataType),
        templatesMap);

    return instance;
}

function generateResult(dataTypeHandler, dataContext, template) {
    var result = dataTypeHandler.postProcessResult(template(dataContext));
    return Object.assign(dataTypeHandler.getConversionResultMetadata(dataContext.msg), { 'fhirResource': result });
}

function getTemplate(templateName, handlebarInstance, dataTypeHandler) {
    return new Promise((fulfill, reject) => {
        fs.readFile(path.join(constants.BASE_TEMPLATE_FILES_LOCATION, dataTypeHandler.dataType, templateName), (err, templateContent) => {
            if (err) {
                reject({ 'status': 404, 'resultMsg': errorMessage(errorCodes.NotFound, "Template not found") });
            }
            else {
                try {
                    var template = handlebarInstance.compile(dataTypeHandler.preProcessTemplate(templateContent.toString()));
                    fulfill(template);
                }
                catch (convertErr) {
                    reject({
                        'status': 400,
                        'resultMsg': errorMessage(errorCodes.BadRequest,
                            "Error during template compilation. " + convertErr.toString())
                    });
                }
            }
        });
    });
}

module.exports.convert = function (dataType, templateName, msg) {
    return new Promise((fulfill, reject) => {
        try {
            const base64RegEx = /^[a-zA-Z0-9/\r\n+]*={0,2}$/;

            if (!base64RegEx.test(msg.srcDataBase64)) {
                reject({ 'status': 400, 'resultMsg': errorMessage(errorCodes.BadRequest, "srcData is not a base 64 encoded string.") });
            }

            /*
            if (!base64RegEx.test(msg.templateBase64)) {
                reject({ 'status': 400, 'resultMsg': errorMessage(errorCodes.BadRequest, "Template is not a base 64 encoded string.") });
            }

            var templatesMap = undefined;
            if (msg.templatesOverrideBase64) {
                if (!base64RegEx.test(msg.templatesOverrideBase64)) {
                    reject({ 'status': 400, 'resultMsg': errorMessage(errorCodes.BadRequest, "templatesOverride is not a base 64 encoded string.") });
                }
                templatesMap = JSON.parse(Buffer.from(msg.templatesOverrideBase64, 'base64').toString());
            }

            var templateString = "";
            
            if (msg.templateBase64) {
                templateString = Buffer.from(msg.templateBase64, 'base64').toString();
            }
            */

            try {
                var b = Buffer.from(msg.srcDataBase64, 'base64');
                var srcData = b.toString();
            }
            catch (err) {
                reject({ 'status': 400, 'resultMsg': errorMessage(errorCodes.BadRequest, `Unable to parse input data. ${err.message}`) });
            }
            var dataTypeHandler = dataHandlerFactory.createDataHandler(dataType);
            let handlebarInstance = GetHandlebarsInstance(dataTypeHandler);
            constants.SESSION_CONTEXT.dataTypeHandler = dataTypeHandler;
            constants.SESSION_CONTEXT.handlebarInstance = handlebarInstance;

            dataTypeHandler.parseSrcData(srcData)
                .then((parsedData) => {
                    var dataContext = { msg: parsedData };
                    getTemplate(templateName, handlebarInstance, dataTypeHandler)
                        .then((compiledTemplate) => {
                            try {
                                fulfill({
                                    'status': 200, 'resultMsg': generateResult(dataTypeHandler, dataContext, compiledTemplate)
                                });
                            }
                            catch (convertErr) {
                                reject({
                                    'status': 400,
                                    'resultMsg': errorMessage(errorCodes.BadRequest,
                                        "Error during template evaluation. " + convertErr.toString())
                                });
                            }
                        }, (err) => {
                            reject(err);
                        });
                })
                .catch(err => {
                    reject({ 'status': 400, 'resultMsg': errorMessage(errorCodes.BadRequest, `Unable to parse input data. ${err.toString()}`) });
                });
        }
        catch (err) {
            reject({ 'status': 400, 'resultMsg': errorMessage(errorCodes.BadRequest, `${err.toString()}`) });
        }
    });
}