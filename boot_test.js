'use strict';

var NumatoControllerFactory = require('./numato.js');
var agentIP = require('./app.js');
var process = require('child_process');

function BootTestFactory() {

  var factory = this;

  function ChangeEndTime(times){
    this.end_num_trials = times;
  }

  function BootTest(port_name, baudrate) {
    this.test_state = "idle";
    this.current_num_trials = 0;
    this.end_num_trials = 1;
    this.test_result = "";
    this.numato_controller = new NumatoControllerFactory.NumatoController(port_name, baudrate);
  }

  // BootTest.prototype.start = function () {
  //   this.numato_controller.turnOnRelay(function (err, results) {
  //     console.log('turn on relay')
  //   });
  // }
  // BootTest.prototype.abort = function () {
  //   this.numato_controller.turnOffRelay(function (err, results) {
  //     console.log('turn off relay')
  //   });
  // }
  
  /*
  void callback (bool result);

  void fms (CTtest test, void * callback);
  */
  function gotoNextState(test, next_state, res, callback) {
    test.test_state = next_state;
    fms(test, res, callback);
  }

  function fms(test, res, callback) {
    var current_test = test;
    var completion_routine = callback;

    switch (current_test.test_state) {
      case "controller ready": // foreign event
        // clear status
        current_test.numato_controller.reset(function (error) {
          if (error) {
            console.log('fail to reset numato')
            gotoNextState(current_test, "error",res, function(error) {
              completion_routine(error);
            });
            return;
          } else {
            console.log('reset numato')
            // wait link up with agent
            current_test.test_state = "linkup_wait"
            completion_routine(false);
          }
        });
        break;
      case "agent ready": // foreign event
        setTimeout(function () {
          gotoNextState(current_test, "error", res, "cold boot");
        }, 5000);
        completion_routine(false);
        break;
      case "cold boot":
        console.log("cold boot "+current_test.end_num_trials+ " times in all");
        var time_show;
        time_show = current_test.current_num_trials + 1;
        console.log('start cold boot test ' + time_show);
        
        // power off
        current_test.numato_controller.powerOff(function (error) {
          if (error) {
            console.log('fail to powerOff')
            gotoNextState(current_test, "error",res, function (error) {
                      completion_routine(error);
            });
            return;
          }
          // wait power off
          current_test.numato_controller.waitPowerOff(function (error) {
            if (error) {
              gotoNextState(current_test, "error", res, function (error) {
                      completion_routine(error);
                    });
            } else {
              console.log('target power state is powered off')
              setTimeout(function () {
                // if (power off) power on
                console.log('5 seconds have passed, now we should power on');
                current_test.numato_controller.powerOn(function (error) {
                  if (error) {
                    console.log('fail to powerOn')
                    gotoNextState(current_test, "error", res, function (error) {
                      completion_routine(error);
                    });
                    return;
                  }
                  // power led check
                  console.log('POWERED ON');
                  
                  setTimeout(function() {
                      var cdiTest_ip = agentIP.agent_ip()+"/cdiTest"
                      var coldBootSucceedIP = "http://192.168.130.115:8888/coldbootSucceed"
                      var ColdbootTest = process.execFile('curl.bat',[coldBootSucceedIP], null, function(error, stdout, stderr)
                       {
                             console.log(error);
                      })
                                            
                      var CDITest = process.execFile('curl.bat',[cdiTest_ip], null, function(error, stdout, stderr)
                       {
                             console.log(error);
                      })
                      setTimeout(function(){
                           gotoNextState(current_test, "did cold boot", res, function (error) {
                            completion_routine(error);
                          });                         
                      },10000);
    //                  console.log("finish cold boot " + time_show)
                  },40000);
                  
                   completion_routine(error);
                });
                
              }, 5000);
            
            }
          });
        });
        break;
      case "wait did cold boot":
        break;
      case "did cold boot": // foreign event
        console.log("Did cold boot\n");
        
        current_test.current_num_trials = current_test.current_num_trials + 1;
        if (current_test.current_num_trials != current_test.end_num_trials) {

          gotoNextState(current_test, "cold boot",res, function (error) {
                      completion_routine(error);
                    });
        } else {
          gotoNextState(current_test, "finished",res,function (error) {
                      completion_routine(error);
                    });
        }
        break;        
      case "reboot":
        console.log("reboot "+current_test.end_num_trials+" times in all");
        var time_show_reboot;
        time_show_reboot = current_test.current_num_trials + 1;
        console.log('start reboot test ' + time_show_reboot);
   //     res.redirect(agentIP.agent_ip()+"/reboot");
        var reboot_ip = agentIP.agent_ip()+"/reboot"
        var cdiTest_ip = agentIP.agent_ip()+"/cdiTest"
        var rebootTest = process.execFile('curl.bat',[reboot_ip], null, function(error, stdout, stderr)
        {
            console.log(error);
        })


        console.log("rebooting...")
  
        
        // wait did reboot
        setTimeout(function(){
            var CDITest = process.execFile('curl.bat',[cdiTest_ip], null, function(error, stdout, stderr)
            {
                             console.log(error);
            })   
            setTimeout(function(){
                gotoNextState(current_test, "did reboot",res, function (error) {
                     completion_routine(error); 
                }); 
            },10000);
         
        },70000);
   
       
        break;
      case "did reboot": // foreign event
        console.log("Did reboot\n");
        current_test.current_num_trials = current_test.current_num_trials + 1;
        if (current_test.current_num_trials != current_test.end_num_trials) {

          gotoNextState(current_test, "reboot", res, function (error) {
                      completion_routine(error);
                    });
        } else {
          gotoNextState(current_test, "finished",res, function (error) {
                      completion_routine(error);
                    });
        }
        break;        
      
      case "aborted": // foreign event
        // save abort status
        // go idle
        console.log('Aborted test.');
        completion_routine(false);
        break;
      case "error":
        console.log('Finished test with error state.');
        completion_routine(false);
        break;
      case "finished":
        // save status
        // go idle
        console.log('Finished test without error state.');
        agentIP.resetAgent();
        current_test.current_num_trials = 0;
        completion_routine(false);
        break;
      case "relay_on":
        current_test.numato_controller.turnOnRelay(function (error) {
            completion_routine(error);
        });
        break;
      case "relay_off":
        current_test.numato_controller.turnOffRelay(function (error) {
            completion_routine(error);
        });
        break;
      case "push_power_switch":
      // Can`t power_on with just relay_on()
        current_test.numato_controller.pushPowerSwitch(function (error) {
            completion_routine(error);
        });
        break;
      case "power_on":
        current_test.numato_controller.powerOn(function (error) {
            completion_routine(error);
        });
        break;  
      default:
        console.log('Unknown test state = ' + current_test.test_status);
        if (completion_routine != fms) {
          completion_routine(true);
        }
        break;
    }
  }

  BootTest.prototype.reset = function (callback) {
    this.test_state = "idle";
    callback(false);
  }
  BootTest.prototype.start = function (res, callback) {
    this.test_state = "controller ready";
    fms(this, res, callback);
  }
  BootTest.prototype.action = function (action_name, res, callback) {
    this.test_state = action_name;
    fms(this, res, callback);
  }
  
  BootTest.prototype.changeTime = function (Times, callback) {
    this.end_num_trials = Times;
    callback(false);
  }
  
  BootTest.prototype.abort = function (callback) {
    console.log('NOT IMPLEMENTED abort');
  }
  BootTest.prototype.pause = function (callback) {
    console.log('NOT IMPLEMENTED pause');
  }
  BootTest.prototype.resume = function (callback) {
    console.log('NOT IMPLEMENTED resume');
  }
  BootTest.prototype.release = function (callback) {
    this.numato_controller.release(callback);
  }

  factory.BootTest = BootTest;
}

function sleep(miliSeconds){
    var startTime = new Date().getTime();
    while (new Date().getTime() < startTime + miliSeconds);
    
};




module.exports = new BootTestFactory();
