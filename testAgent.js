var http = require('http');
var process = require('child_process');

var child_proc = process.execFile('aaa.bat', [], null, function(error, stdout, stderr){
	console.log(error);
	console.log(stdout);
});
