'use strict';

var NumatoControllerFactory = require('./numato.js');

function BootTestFactory() {

  var factory = this;

  function BootTest(times, port_name, baudrate) {
    this.test_state = "idle";
    this.current_num_trials = 0;
    this.end_num_trials = times;
    this.test_result = "";
    this.numato_controller = new NumatoControllerFactory.NumatoController(port_name, baudrate);
    console.log("end time is "+this.end_num_trials);
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
  function gotoNextState(test, next_state, callback) {
    test.test_state = next_state;
    fms(test, callback);
  }

  function fms(test, callback) {
    var current_test = test;
    var completion_routine = callback;

    switch (current_test.test_state) {
      case "controller ready": // foreign event
        // clear status
        current_test.numato_controller.reset(function (error) {
          if (error) {
            console.log('fail to reset numato')
            gotoNextState(current_test, "error", function(error) {
              completion_routine(error);
            });
            return;
          } else {
            console.log('reset numato')
            // wait link up with agent
            current_test.test_state = "linkup_wait"
            completion_routine(error);
          }
        });
        break;
      case "agent ready": // foreign event
        setTimeout(function () {
          gotoNextState(current_test, "cold boot");
        }, 5000);
        completion_routine(false);
        break;
      case "cold boot":
        console.log('start cold boot test ' + current_test.current_num_trials);
        
        // power off
        current_test.numato_controller.powerOff(function (error) {
          if (error) {
            console.log('fail to powerOff')
            gotoNextState(current_test, "error",function (error) {
                      completion_routine(error);
            });
            return;
          }
          // wait power off
          current_test.numato_controller.waitPowerOff(function (error) {
            if (error) {
              gotoNextState(current_test, "error",function (error) {
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
                    gotoNextState(current_test, "error", function (error) {
                      completion_routine(error);
                    });
                    return;
                  }
                  // power led check
                  console.log('POWERED ON');
                  
                  setTimeout(function() {
                      //current_test.test_state = "wait did cold boot";
                      gotoNextState(current_test, "did cold boot", function (error) {
                        completion_routine(error);
                      });
                      console.log("finish cold boot" + current_test.current_num_trials)
                  },40000);
                  
             /*   
                  current_test.numato_controller.waitPowerOn(function (error) {
                    if (error) {
                      gotoNextState(current_test, "error");
                    } else {
                      // wait did boot
                      gotoNextState(current_test, "did cold boot");
                    }
                  });
               */  
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
        console.log("Did cold boot");
        
        current_test.current_num_trials = current_test.current_num_trials + 1;
        if (current_test.current_num_trials != current_test.end_num_trials) {

          console.log("Current number is "+current_test.current_num_trials);
          console.log("End number is "+current_test.end_num_trials);
          gotoNextState(current_test, "cold boot",function (error) {
                      completion_routine(error);
                    });
        } else {
          gotoNextState(current_test, "finished",function (error) {
                      completion_routine(error);
                    });
        }
        break;        
      case "reboot":
        console.log('start reboot test ' + current_test.current_num_trials);

        // request reboot
        
        // wait did reboot
        current_test.test_state = "wait did reboot";
        completion_routine(true);
        break;
      case "did reboot": // foreign event
        // status check
        if (current_test.test_result == "success") {
          
        } else {
          
        }
        // save status
        
        completion_routine(false);

        current_test.current_num_trials = current_test.current_num_trials + 1;
        if (current_test.current_num_trials != current_test.end_num_trials) {
          gotoNextState(test, "cold boot");
        } else {
          gotoNextState(test, "finished");
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
        completion_routine(true);
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
  BootTest.prototype.start = function (callback) {
    this.test_state = "controller ready";
    fms(this, callback);
  }
  BootTest.prototype.action = function (action_name, callback) {
    this.test_state = action_name;
    fms(this, callback);
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
