'use strict';

var NumatoControllerFactory = require('./numato.js');

function BootTestFactory() {

  var factory = this;

  function BootTest(num_trials, port_name, baudrate) {
    this.test_state = "idle";
    this.current_num_trials = 0;
    this.end_num_trials = num_trials;
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
  
  function gotoNextState(test, next_state) {
    test.test_state = next_state;
    fms(test, fms);
  }

  function fms(test, callback) {
    var completion_routine = callback;

    switch (test.test_state) {
      case "controller ready": // foreign event
        // clear status
        test.numato_controller.reset(function (error) {
          if (error) {
            console.log('fail to reset numato')
            gotoNextState(test, "error");
            completion_routine(error);
            return;
          } else {
            console.log('reset numato')
            // wait link up with agent
            test.test_state = "linkup_wait"
            completion_routine(error);
          }
        });
        break;
      case "agent ready": // foreign event
        setTimeout(function () {
          gotoNextState(test, "cold boot");
        }, 5000);
        completion_routine(false);
        break;
      case "cold boot":
        console.log('start cold boot test ' + test.current_num_trials);
        
        // power off
        test.numato_controller.powerOff(function (error) {
          if (error) {
            console.log('fail to powerOff')
            gotoNextState(test, "error");
            return;
          }
          // wait power off
          test.numato_controller.waitPowerOff(function (error) {
            if (error) {
              gotoNextState(test, "error");
            } else {
              console.log('target power state is powered off')
              setTimeout(function () {
                // if (power off) power on
                test.numato_controller.powerOn(function (error) {
                  if (error) {
                    console.log('fail to powerOn')
                    gotoNextState(test, "error");
                    return;
                  }
                  // power led check
                  console.log('POWERED ON');
                  test.numato_controller.waitPowerOn(function (error) {
                    if (error) {
                      gotoNextState(test, "error");
                    } else {
                      // wait did boot
                      test.test_state = "wait did cold boot";
                    }
                  });
                });
              }, 5000);
            }
          });
        });
        break;
      case "did cold boot": // foreign event
        // status check
        if (test.test_result == "success") {
          
        } else {
          
        }
        // save status

        completion_routine(false);
        
        test.current_num_trials = test.current_num_trials + 1;
        if (test.current_num_trials != test.end_num_trials) {
          gotoNextState(test, "reboot");
        } else {
          gotoNextState(test, "finished");
        }
        break;        
      case "reboot":
        console.log('start reboot test ' + test.current_num_trials);

        // request reboot
        
        // wait did reboot
        test.test_state = "wait did reboot";
        break;
      case "did reboot": // foreign event
        // status check
        if (test.test_result == "success") {
          
        } else {
          
        }
        // save status

        completion_routine(false);

        test.current_num_trials = test.current_num_trials + 1;
        if (test.current_num_trials != test.end_num_trials) {
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
        break;
      case "finished":
        // save status
        // go idle
        console.log('Finished test without error state.');
        break;
      case "relay_on":
        test.numato_controller.turnOnRelay(function (error) {
            completion_routine(error);
        });
        break;
      case "relay_off":
        test.numato_controller.turnOffRelay(function (error) {
            completion_routine(error);
        });
        break;
      case "push_power_switch":
      // Can`t power_on with just relay_on()
        test.numato_controller.pushPowerSwitch(function (error) {
            completion_routine(error);
        });
        break;
      case "power_on":
        test.numato_controller.powerOn(function (error) {
            completion_routine(error);
        });
        break;  
      default:
        console.log('Unknown test state = ' + test.test_status);
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

module.exports = new BootTestFactory();
