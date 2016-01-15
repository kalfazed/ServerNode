
'use strict';

function TestSessionController() {
  
  var factory = this;
  
  factory.sessions = new Array();

  function TestSessionContext(test_name, target_address, test_case, test_num) {
    this.test_name = test_name;
    this.test_state = "idle";
    this.target_address = target_address;
    this.test_case = test_case;
    this.test_num = test_num;

    TestSessionContext.prototype.reset = function (callback) {
      console.log('reset session ' + test_name)
      this.test_state = "idle";
      test_case.reset(callback);
    }
    TestSessionContext.prototype.start = function (res, callback) {
      console.log('start session ' + test_name)
      this.test_state = "running";
      test_case.start(res, callback);
    }
    TestSessionContext.prototype.action = function (action_name, res, callback) {
  //    console.log('action session ' + test_name)
      test_case.action(action_name, res, callback);
    }
    
     TestSessionContext.prototype.changeTime = function (times, callback) {
  //    console.log('action session ' + test_name)
      test_case.changeTime(times, callback);
    }   
 
      TestSessionContext.prototype.getStatus = function (callback) {
  //    console.log('action session ' + test_name)
      test_case.getStatus(callback);
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

  TestSessionController.prototype.createNewTestSession = function (test_name, target_address, test_case, test_num) {
/*
    var exist = factory.sessions.some(function (element) {
      //console.log('createNewTestSession ' + test_name)
      return (element.test_name == test_name);
    });

    if (exist) {
      return null;
    }
*/
    var new_sesstion = new TestSessionContext(test_name, target_address, test_case, test_num);
    factory.sessions.push(new_sesstion);

    return new_sesstion;
  }

  TestSessionController.prototype.getSession = function (test_num) {
    for (var i in factory.sessions) {
      if (factory.sessions[i].test_num == test_num) {
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
