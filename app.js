'use strict';

var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');


var bodyParser = require('body-parser');
var session = require('express-session');
var fs = require('fs');
var routes = require('./routes/index');
var users = require('./routes/users');
var busboy = require('connect-busboy');
var formidable = require('formidable');
var util = require('util');


var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(busboy());


var http = require('http');
var StringDecoder = require('string_decoder').StringDecoder;
var TestSessionController = require('./session.js');
var BootTestFactory = require('./boot_test.js');
var html;
var testSession = TestSessionController.createNewTestSession("test","", 'COM4');

var testTimes_reboot;
var testTimes_coldboot;
var target_url;
var agentIP_input;
var agentName = [];
var agentIP_http;
var agentCOM = [];
var Operation_log = "";
var kalfazed;

var session_array = [];
var session_name = [];
var session_number = 0;

var led_on = [1100, 1100, 110];
var led_off = [500, 500, 2];

var led_on_setted ;
var led_off_setted;

var cur_session_num;
var rebootTime = 0;
var cdiTime = 0;
var coldbootTime = 0;


app.get('/', function(req, res){
    res.render('mainPage');
});

app.post('/upload', function(req, res){

});
  

app.post('/bootTest', function(req, res){
//    res.render('bootTest');
    session_number++;
    
    agentCOM[session_number] = req.body.COM;
    agentName[session_number] = req.body.Name;
  
  
    agentIP_input = req.body.IP;
    agentIP_http = "http://" + agentIP_input + ":8000";
    Operation_log += "Hello " + agentName[session_number];
    res.render('bootTest', {title: ''});
    
 //   console.log(agentCOM[session_number]);
    
    if(agentName[session_number] == "Melon"){
        led_on_setted = led_on[0];
        led_off_setted = led_off[0];

    }
    if(agentName[session_number] == "pear"){
        led_on_setted = led_on[1];
        led_off_setted = led_off[1];

    }
    if(agentName[session_number] == "kalfazed"){
        led_on_setted = led_on[2];
        led_off_setted = led_off[2];

    }
    console.log("Agent "+ agentName[session_number] + " is ready now");
    
});


app.post('/start_test', function(req, res){
    
    //If some operations are going to run on the same agent,
    //a new session will be created, and some basic information are same as the last session
    
    if((agentName[session_number] == null) ||(agentCOM[session_number] == null)){
        agentName[session_number] = agentName[session_number-1];
        agentCOM[session_number] = agentCOM[session_number-1];
    }    
    
//    testTimes_coldboot = req.body.selection_coldBoot;
//    testTimes_reboot = req.body.selection_coldBoot;
//    console.log(agentCOM[session_number]);
          var test_case = new BootTestFactory.BootTest(agentCOM[session_number], 9600);
          testSession = TestSessionController.createNewTestSession(agentName[session_number], "", test_case, session_number);
          console.log(agentName[session_number] + " is created" )
 //         console.log(agentCOM[session_number] + " is created")
          cur_session_num = session_number;
          
          if (testSession == null) {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('fail createNewTestSession\n'); 
          } else {
            testSession.start(res, function (error) {
              if (error) {
                  TestSessionController.deleteNewTestSession(testSession, function (error) {
                  res.writeHead(200, { 'Content-Type': 'text/plain' });
                  res.end('fail start_test\n');
                });
              } else {

                session_number ++;   
    //            printSessionInfo(cur_session_num);  
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('start_test\n');
              }
            });
          }
 //    console.log(cur_session_num);     
     console.log("Agent "+agentName[cur_session_num]+" is running");
});


app.post('/pushPowerButton', function(req, res){
    console.log("waiting for agent standing by..")
   testSession = TestSessionController.getSession(cur_session_num);
          testSession.action("push_power_switch",res, function (error) {
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            if (error) {
              res.end('fail power_on_off\n');
            } else {
                  res.end('power_on_off\n');
                  console.log("Agent "+agentName[cur_session_num]+" Power on!");
            }
          });

});

app.post('/reBoot', function(req, res){
  testSession = TestSessionController.getSession(cur_session_num);
  testTimes_reboot = req.body.selection_reBoot;
  testSession.changeTime(testTimes_reboot, function(error) {
       if (error){
           console.log("fail to change times")
       } else {
  //         console.log("succeed in changing the times!")
       }
    });
  
  testSession.action("reboot", res, function (error) {
         if (error) {
            res.end('fail reboot\n');
            console.log("fail reboot");
          } else {
            console.log("reBooting... called from app" );
            res.end('rebooting\n');
          }
    });
  
  
  
  res.end("Agent is rebooting!");
 // res.end(agentIP);
  console.log("Running reboot");
});



app.get('/bootSucceed', function(req, res){
    testSession = TestSessionController.getSession(cur_session_num);
    
    var status = testSession.getStatus(function(error) {
       if (error){
           console.log("fail to get status ")
       } else {
  //         console.log("succeed in changing the times!")
       }
    })
    console.log("status in app is "+ BootTestFactory.tmp_status);
    
    if (status == "cold boot"){
           coldbootTime++;
           console.log("------------------------------");
           console.log("cold boot succeed time "+coldbootTime);
           console.log("------------------------------");  
           testSession.action("wait test", res, function (error){
           if (error) {
               res.end("fail to do the test");
               console.log("fail to do the test called from app");            
             } else {
              res.end("Agent is doing the test");
             console.log("Agent is doing the test called from app");              
           }
        });      
    }
    
    if (BootTestFactory.tmp_status == "reboot"){
          rebootTime++;
          console.log("------------------------------");
          console.log("reboot succeed time "+rebootTime);
          console.log("------------------------------");
          testSession.action("wait test", res, function (error){
           if (error) {
               res.end("fail to do the test");
               console.log("fail to do the test called from app");            
             } else {
              res.end("Agent is doing the test");
             console.log("Agent is doing the test called from app");              
           }
        });   
     }  else {
         console.log("Agent has stanby")
     } 
     

    

});

app.get('/cdiSucceed', function(req, res){
    cdiTime++;
    console.log("------------------------------");
    console.log("cdiTest succeed time "+cdiTime);
    console.log("------------------------------");
});


app.post('/coldBoot', function(req, res){
    testSession = TestSessionController.getSession(cur_session_num);
    testTimes_coldboot = req.body.selection_coldBoot;
    testSession.changeTime(testTimes_coldboot, function(error) {
       if (error){
           console.log("fail to change times")
       } else {
 //          console.log("succeed in changing the times!")
       }
    });
    testSession.action("cold boot", res, function (error) {
         if (error) {
            res.end('fail cold boot\n');
            console.log("fail cold boot");
          } else {
            console.log("Booting..." );

            setTimeout(function(){
                
                res.end('cold booting now');
                console.log("Agent "+agentName[cur_session_num]+" is doing the test..." );
    //             res.end(agentIP_http + "/cdiTest");
            },30000);
      
           
          }
    });
    res.end('cold booting now');
      
  
 //   console.log("end the post cold boot");           
});


app.post('/RealColdBoot', function(req, res){
    testTimes_coldboot = req.body.selection_coldBoot;
});


app.listen(8888);
console.log('Test controller start on port 8888');

module.exports = app;



function sleep(miliSeconds){
    var startTime = new Date().getTime();
    while (new Date().getTime() < startTime + miliSeconds);
    
};


exports.led_on_setted = function(){
    return led_on_setted;
}

exports.led_off_setted = function(){
    return led_off_setted;
}

exports.agent_ip = function(){
    return agentIP_http;
}

exports.resetAgent = function(){
    coldbootTime = 0;
    rebootTime = 0;
    cdiTime = 0; 
}

function printSessionInfo(session_num){
    session = TestSessionController.getSession(session_num);
    console.log("session numer: "+ session.test_num);
    console.log("session agent name: "+ session.test_name);
    console.log("session test state: "+ session.test_case.test_state);
    
}


 
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

