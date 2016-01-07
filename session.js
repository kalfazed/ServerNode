
'use strict';

function TestSessionController() {
  
  var factory = this;
  
  factory.sessions = new Array();

  function TestSessionContext(test_name, target_address, test_case) {
    this.test_name = test_name;
    this.test_state = "idle";
    this.target_address = target_address;
    this.test_case = test_case;

    TestSessionContext.prototype.reset = function (callback) {
      console.log('reset session ' + test_name)
      this.test_state = "idle";
      test_case.reset(callback);
    }
    TestSessionContext.prototype.start = function (callback) {
      console.log('start kalfazed session ' + test_name)
      this.test_state = "running";
      test_case.start(callback);
    }
    TestSessionContext.prototype.action = function (action_name, callback) {
  //    console.log('action session ' + test_name)
      test_case.action(action_name, callback);
    }
    TestSessionContext.prototype.abort = function (callback) {
      console.log('abort session ' + test_name)
      this.test_state = "aborted";
      test_case.abort(callback);
    }
    TestSessionContext.prototype.pause = function (callback) {
      console.log('pause session ' + test_name)
      this.test_state = "paused";
      test_case.pause(callback);
    }
    TestSessionContext.prototype.resume = function (callback) {
      console.log('resume session ' + test_name)
      this.test_state = "running";
      test_case.resume(callback);
    }
    TestSessionContext.prototype.release = function (callback) {
      console.log('release session ' + test_name)
      test_case.release(callback);
    }
  }

  TestSessionController.prototype.createNewTestSession = function (test_name, target_address, test_case) {
    var exist = factory.sessions.some(function (element) {
      //console.log('createNewTestSession ' + test_name)
      return (element.test_name == test_name);
    });

    if (exist) {
      return null;
    }

    var new_sesstion = new TestSessionContext(test_name, target_address, test_case);
    factory.sessions.push(new_sesstion);

    return new_sesstion;
  }

  TestSessionController.prototype.getSession = function (test_name) {
    for (var i in factory.sessions) {
      if (factory.sessions[i].test_name == test_name) {
        return factory.sessions[i];
      }
    }
  }

  TestSessionController.prototype.deleteNewTestSession = function (sesstion, callback) {
    factory.sessions = factory.sessions.filter(function (element) {
      //console.log('deleteNewTestSession ' + element.test_name + ' == ' +sesstion.test_name)
      if (element.test_name == sesstion.test_name) {
        sesstion.release(callback);
        return false;
      } else {
        return true;
      }
    });
  }

  factory.TestSessionController = TestSessionController;
}

module.exports = new TestSessionController();
