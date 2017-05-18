var request = require('request');
var async = require('async');
var util = require('util');
var _ = require('lodash');
var argv = require('minimist')(process.argv.slice(2));

if (argv._.length !== 1) {
    console.log('An ASG name must be provided');
    process.exit(1);
}

var asgName=argv._[0];

var asgardHost;
if (argv.asgardHost) {
    asgardHost = argv.asgardHost;
}

if (!asgardHost) {
    console.log('An Asgard hostname is required. It can be supplied with the --asgardHost option');
    process.exit(1);
}

var region = 'us-east-1';
if (argv.region) {
    region = argv.region;
}

var targetSize = 0;
if (argv.targetSize) {
    targetSize = parseInt(argv.targetSize);
}

var rate = 1;
if (argv.rate) {
    rate = parseInt(argv.rate);
}

var delay = 5;
if (argv.delay) {
    delay = parseInt(argv.delay);
}

console.log('Shrinking ASG',asgName,'on',asgardHost,'in region',region,'down to',
  targetSize,'by',rate,'every',delay,'minutes');

var asgardBaseUrl = 'http://'+asgardHost+'/'+region+'/';

function resizeAsg(name, size, callback) {
    async.waterfall([
        function (callback) {
            var uri = asgardBaseUrl + 'cluster/resize';
            request.post({
                uri: uri,
                form: {
                    name: asgName,
                    minAndMaxSize: size
                }
            }, callback);
        },

        function (response, body, callback) {
            var redirect = response.headers['location'];
            var taskShow = /\/task\/show\//;
            if (response.statusCode !== 302 || !(taskShow.test(redirect))) {
                console.log('Failed to resizing ASG', response, body);
                callback(new Error('Failed to resize ASG'));
                return;
            }

            callback();
        }

    ], callback);
}

function isTerminateEnabled (body) {
    return body && _.includes(body.terminateStatus, 'Enabled');
}

function dropOneNode(name, callback) {
    async.waterfall([
        function (callback) {
            var infoURL = asgardBaseUrl +
                    'autoScaling/show/' + asgName + '.json';

            request.get({uri: infoURL, json: true}, callback);
        },

        function (response, body, callback) {
            if (response.statusCode !== 200) {
                console.log('Failed response from getting ASG info', response);
                callback(new Error('Failed to get ASG info'));
                return;
            }

            if (!(body.group) || !(_.has(body.group, 'maxSize'))) {
                console.log('Failed to find maxSize for ASG', body);
                callback(new Error('Failed to find maxSize for ASG'));
                return;
            }

            if (!isTerminateEnabled(body)) {
                return callback(new Error('ASG terminateStatus is ' + body.terminateStatus))
            }

            callback(null, body.group.maxSize);
        },

        function (maxSize, callback) {
            if (maxSize > targetSize) {
                var newSize = Math.max(0, maxSize-rate);
                async.waterfall([
                    function (callback) {
                        resizeAsg(asgName, newSize, callback);
                    },
                    function (callback) {
                        callback(null, newSize);
                    }
                ], callback);
            } else {
                callback(null, 0);
            }
        }

    ], callback);
}

var done = false;
async.whilst(function () {return !done;}, function (callback) {

    async.waterfall([
        function (callback) {
            console.log('Resizing',asgName, 'to have one less node');
            dropOneNode(asgName, callback);
        },

        function (countLeft, callback) {
            if (countLeft === 0) {
                done = true;
                callback();
            } else {
                console.log('ASG',asgName,'has',countLeft,'more nodes');
                setTimeout(callback, delay*60*1000);
            }
        }
    ], callback);

}, function (error) {
    if (error) {
        console.log('Error shrinking ASG', error);
    }
});
