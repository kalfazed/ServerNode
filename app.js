'use strict';

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function(req, res, next){
  var msg = req.session.success;
  delete req.session.error;
  delete req.session.success;
  res.locals.message = '';
  if (msg) res.locals.message = '<p>' + msg + '</p>';
  next();
});


app.get('/', function(req, res){
    res.render('homepage');
});

app.post('/', function(req, res){
     req.session.regenerate(function(){
        req.session.success = 'Authenticated as ' + res.body.session
          + ' click to <a href="/logout">logout</a>. '
          + ' You may now access <a href="/restricted">/restricted</a>.';
        res.redirect('back');
      });

});


app.listen(8888);
console.log('Test controller start on port 8888');

module.exports = app;

var http = require('http');
var StringDecoder = require('string_decoder').StringDecoder;
var TestSessionController = require('./session.js');
var BootTestFactory = require('./boot_test.js');
var html;
var testSession = TestSessionController.createNewTestSession("test","", 'COM4');

  
 /* 
http.createServer(function (request, response) { 
 
 dispatcher(request, response);   
  
}).listen(8000);

*/

function dispatcher(request, response) {
 
  var testSession;
  var url = request.url;
  
  console.log('url: ' + url);

  if (url.charAt(0) == '/') {
    url = url.slice(1);
  } 
  var url_array = url.split('/');
  console.log('url_array: ' + url_array);

  switch (request.method) {
    case "GET":
      //console.log('GET url: ' + request.url);
      switch (url_array[0]) {
        case "start_test":
          var test_case = new BootTestFactory.BootTest(4, 'COM4', 9600);
          testSession = TestSessionController.createNewTestSession(url_array[1], "", test_case);
          if (testSession == null) {
            response.writeHead(200, { 'Content-Type': 'text/plain' });
            response.end('fail createNewTestSession\n');
          } else {
            testSession.start(function (error) {
              if (error) {
                  TestSessionController.deleteNewTestSession(testSession, function (error) {
                  response.writeHead(200, { 'Content-Type': 'text/plain' });
                  response.end('fail start_test\n');
                });
              } else {
//                testSession.turnOnRelay();
                response.writeHead(200, { 'Content-Type': 'text/plain' });
                response.end('start_test\n');
              }
            });
          }
          break;
        case "status":
          response.writeHead(200, { 'Content-Type': 'text/plain' });
          response.end('status\n');
          break;

        case "relay_on":
          testSession = TestSessionController.getSession(url_array[1]);        
          testSession.action("relay_on", function (error) {
            response.writeHead(200, { 'Content-Type': 'text/plain' });
            if (error) {
              response.end('fail relay_on\n');
            } else {
              response.end('relay_on\n');
            }
          });
          break;
        case "relay_off":
          testSession = TestSessionController.getSession(url_array[1]);
          testSession.action("relay_off", function (error) {
            response.writeHead(200, { 'Content-Type': 'text/plain' });
            if (error) {
              response.end('fail relay_off\n');
            } else {
              response.end('relay_off\n');
            }
          });
          break;

        default:
         
 
          response.writeHead(200, { 'Content-Type': 'text/plain' }); 
//          response.write(html);
          response.end('GET default\n');
          break;
      }
      break;
    case "POST":
      
      if (url_array.length == 0) {
        response.writeHead(200, { 'Content-Type': 'text/plain' });
        response.end('invalid paramerter\n');
        return;
      } 

      // format 
      // POST http://hostname/command_name/test_name/
      //                      ^            ^
      // url_array            0            1
      //
      
      if (url_array.length >= 2) {
        switch (url_array[0]) {
          case "start_test":
            var test_case = new BootTestFactory.BootTest(4, 'COM4', 9600);
            testSession = TestSessionController.createNewTestSession(url_array[1], "", test_case);
            if (testSession == null) {
              response.writeHead(200, { 'Content-Type': 'text/plain' });
              response.end('fail createNewTestSession\n');
            } else {
              testSession.start(function (error) {
                if (error) {
                    TestSessionController.deleteNewTestSession(testSession, function (error) {
                    response.writeHead(200, { 'Content-Type': 'text/plain' });
                    response.end('fail start_test\n');
                  });
                } else {
    //                testSession.turnOnRelay();
                  response.writeHead(200, { 'Content-Type': 'text/plain' });
                  response.end('start_test\n');
                }
              });
            }
          break;
          
        //"Start_test" is used to creat a session, and then execute some commands from this session
        case "relay_on":
        
          testSession = TestSessionController.getSession(url_array[1]);  
          testSession.action("relay_on", function (error) {
            response.writeHead(200, { 'Content-Type': 'text/plain' });
            if (error) {
              response.end('fail relay_on\n');
            } else {
              response.end('relay_on\n');
            }
          });
          break;
          
        case "relay_off":
          testSession = TestSessionController.getSession(url_array[1]);
          testSession.action("relay_off", function (error) {
            response.writeHead(200, { 'Content-Type': 'text/plain' });
            if (error) {
              response.end('fail relay_off\n');
            } else {
              response.end('relay_off\n');
            }
          });
          break;
    
        case "push_power_switch":
          testSession = TestSessionController.getSession(url_array[1]);
          testSession.action("push_power_switch", function (error) {
            response.writeHead(200, { 'Content-Type': 'text/plain' });
            if (error) {
              response.end('fail power_on_off\n');
            } else {
              response.end('power_on_off\n');
            }
          });
          break;
         
        case "cold_boot":
          testSession = TestSessionController.getSession(url_array[1]);
          testSession.action("cold boot", function (error) {
            response.writeHead(200, { 'Content-Type': 'text/plain' });
            if (error) {
              response.end('fail cold boot\n');
            } else {
              response.end('cold boot\n');
            }
          });
          break; 
          
         case "power_on":
          testSession = TestSessionController.getSession(url_array[1]);
          testSession.action("power_on", function (error) {
            response.writeHead(200, { 'Content-Type': 'text/plain' });
            if (error) {
              response.end('fail power_on\n');
            } else {
              response.end('power_on\n');
            }
          });
          break;
          

          // for user
          case "abort":
            testSession = TestSessionController.getSession(url_array[1]);
            if (testSession == null) {
              response.writeHead(200, { 'Content-Type': 'text/plain' });
              response.end('fail getSession\n');
              return;
            }
            console.log('reach abort');
            testSession.abort();
            TestSessionController.deleteNewTestSession(testSession);
            response.writeHead(200, { 'Content-Type': 'text/plain' });
            response.end('abort\n');
            break;
          case "pause":
            testSession = TestSessionController.getSession(url_array[1]);
            if (testSession == null) {
              response.writeHead(200, { 'Content-Type': 'text/plain' });
              response.end('fail getSession\n');
              return;
            }
            console.log('reach pause');
            testSession.pause();
            response.writeHead(200, { 'Content-Type': 'text/plain' });
            response.end('pause\n');
            break;
          case "resume":
            testSession = TestSessionController.getSession(url_array[1]);
            if (testSession == null) {
              response.writeHead(200, { 'Content-Type': 'text/plain' });
              response.end('fail getSession\n');
              return;
            }
            console.log('reach resume');
            testSession.resume();
            response.writeHead(200, { 'Content-Type': 'text/plain' });
            response.end('resume\n');
            break;
            

          // from agent
          case "action":
            testSession = TestSessionController.getSession(url_array[1]);
            if (testSession == null) {
              response.writeHead(200, { 'Content-Type': 'text/plain' });
              response.end('fail getSession\n');
              return;
            }
            console.log('reach action');
            request.on('data', function (chunk) {
              var decoder = new StringDecoder('utf8');
              console.log('POST data:\'' + chunk + '\'');
              var action_name = decoder.write(chunk);;
              testSession.action(action_name, function (error) {
                if (error) {
                  response.writeHead(200, { 'Content-Type': 'text/plain' });
                  response.end('fail action\n');
                } else {
                  response.writeHead(200, { 'Content-Type': 'text/plain' });
                  response.end('action\n');
                }
              });
            });
            break;
          default:
            response.writeHead(200, { 'Content-Type': 'text/plain' });
            response.end('POST default\n');
            break;
        } // switch 
     } // if
  }
}


function checkPowerLed() {

}

console.log('Server running at http://127.0.0.1:8000/');
