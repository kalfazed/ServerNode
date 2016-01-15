'use strict';

var serialport = require("serialport");
var led = require('./app.js');



function NumatoControllerFactory() {

    var factory = this;

    NumatoController.prototype.release = function (callback) {
        this.serial_port.close();
        this.serial_port = null;

        if (this.timer_id) {
            clearInterval(this.timer_id);
            this.timer_id = null;
        }
        callback(false);
    }

    function NumatoController(port_name, baudrate) {

        var self = this;
        // members
        self.timer_id = null;
        self.serial_port = null;
        self.sum = 0;
        self.counter = 0;

        self.serial_port = new serialport.SerialPort(port_name, {
            baudrate: baudrate,
            dataBits: 8,
            parity: 'none',
            stopBits: 1,
            flowControl: false,
            parser: serialport.parsers.readline("\n")
            //parser: serialport.parsers.raw
        }, false);

        self.serial_port.on('data', function (received_data) {
            var trimed_data = received_data.trim();
            //console.log("received_data:" + trimed_data);
            if (self.read_data_callback) {
                self.read_data_callback(trimed_data);
            }
        });

        self.serial_port.on('error', function (err) {
            console.log('error occurred: ' + err);
        });

        self.serial_port.on('open', function (error) {
            if (error) {
                console.log('failed to open: ' + error);
            } else {
                console.log('opened serial port');
                writeAndDrain(this, "\r", function (err, results) {
                });
            }
        });

        self.serial_port.on('close', function () {
            console.log('serial port closed');
        });
    }

    function writeAndDrain(serial_port, data, callback) {
        if (!serial_port.isOpen()) {
            serial_port.open(function () {
                serial_port.write(data, function () {
                    serial_port.drain(callback);
                });
            });
        } else {
            serial_port.write(data, function () {
                serial_port.drain(callback);
            });
        }
    }
    
    function isTimerActive(self) {
        if (self.read_data_callback != null ||
            self.timer_id != null) {
            return true;
        } else {
            return false;
        }
    }

    function clearTimer(self) {
        self.read_data_callback = null;
        clearInterval(self.timer_id);
        self.timer_id = null;
        self.sum = 0;
        self.counter = 0;
    }

    NumatoController.prototype.reset = function (callback) {
        var self = this;
  //      console.log("serial port is "+ this.serial_port)
        writeAndDrain(self.serial_port, "gpio clear 3\r", function () {
            writeAndDrain(self.serial_port, "relay off 0\r", callback);
        });
    }

    NumatoController.prototype.turnOnRelay = function (callback) {
        writeAndDrain(this.serial_port, "relay on 0\r", callback);
    }

    NumatoController.prototype.turnOffRelay = function (callback) {
        writeAndDrain(this.serial_port, "relay off 0\r", callback);
    }


    NumatoController.prototype.waitPowerOn = function (callback) {
        var self = this;
        var completion_routine = callback;

        if (isTimerActive(self)) {
            console.log('[waitPowerOn] timer is already active');
            callback(true);
            return;
        }

        self.read_data_callback = function (data) {
            //console.log('read_data_callback');
            var value = Number(data)
            if (isNaN(value)) {
                return;
            }
            if (value > 0) {
                console.log('[waitPowerOn] adc 3 is ' + value);
                clearTimer(self);
                completion_routine(true);
            } else {
                console.log('[waitPowerOn] adc 3 is ' + value);
            }
            // TODO : timeout
        }

        self.timer_id = setInterval(function () {
            writeAndDrain(self.serial_port, "adc read 3\r", function (error) {
                if (error) {
                    clearTimer(self);
                    completion_routine(error);
                    return;
                }
            });
        }, 1000);
    }

    NumatoController.prototype.waitPowerOff = function (callback) {
        var self = this;
        var completion_routine = callback;
        var read_function = function () {
            writeAndDrain(self.serial_port, "adc read 3\r", function (error) {
                if (error) {
                    clearTimer(self);
                    completion_routine(true);
                }
            });
        }

        if (isTimerActive(self)) {
 //           console.log('[waitPowerOff] timer is already active');
            callback(true);
            return;
        }


        self.read_data_callback = function (data) {
            //console.log('read_data_callback');
            var value = Number(data)
            if (isNaN(value)) {
                return;
            }
            var sum_tmp;
            sum_tmp = 10 * led.led_off_setted(); 
            self.sum += value;
            if (self.counter >= 10) {
                if (self.sum < sum_tmp) {
  //                  console.log('[waitPowerOff] Current counter is ' + self.counter);
   //                 console.log('[waitPowerOff] adc 3 sum is ' + self.sum);
   //                 console.log('Have finished Waiting');              
                    clearTimer(self);
                    completion_routine(false);
                } else {
     //               console.log('[waitPowerOff] Current counter is ' + self.counter);
     //               console.log('[waitPowerOff] adc 3 sum is ' + self.sum);
                    self.sum = 0;
                    self.counter = 0;
                    setTimeout(read_function, 1000);
                }

                // TODO : timeout
            } else {
                self.counter++;
                read_function();
            }
        }
        
        setTimeout(read_function, 1000);
    }

    NumatoController.prototype.pushPowerSwitch = function (callback) {
        var self = this;
        writeAndDrain(self.serial_port, "relay on 0\r", function () {
            setTimeout(function () {
                writeAndDrain(self.serial_port, "relay off 0\r", callback);
            }, 1000);
        });
        /*
        console.log("In numato.js, Parameter is called like this\n");
        console.log("LED On is "+ led.led_on_setted());
        console.log("LED OFF is "+ led.led_off_setted());
             var sum_tmp;
            sum_tmp = 10 * led.led_off_setted(); 
        console.log("sum is "+ sum_tmp);
          */  
    }

    NumatoController.prototype.powerOn = function (callback) {
        var self = this;
        var completion_routine = callback;
        var read_function = function () {
            writeAndDrain(self.serial_port, "adc read 3\r", function (error) {
                if (error) {
                    clearTimer(self);
                    completion_routine(true);
                }
            });
        }
        
        if (isTimerActive(self)) {
            console.log('[powerOn] timer is already active');
            completion_routine(true);
            return;
        }

        self.read_data_callback = function (data) {
            //console.log('read_data_callback');
            var value = Number(data)
            if (isNaN(value)) {
                //console.log('value is NaN:' + data);
                return;
            }
                       
            self.sum += value;
            var sum_tmp;
            sum_tmp = 10 * led.led_off_setted(); 
            if (self.counter >= 10) {
                if (self.sum <= sum_tmp) { // power off
     //               console.log('[powerOn] Current counter is ' + self.counter);
     //               console.log('[powerOn] sum is ' + self.sum);
                    self.pushPowerSwitch();
                } else {
  //                  console.log('[powerOn] Current counter is ' + self.counter);
     //               console.log('[powerOn] already power on. adc 3 sum is ' + self.sum);
                    // already power on
                }
            
                clearTimer(self);
                completion_routine(false);
            } else {
                self.counter++;
                read_function();
            }
        }

        read_function();
    }

    NumatoController.prototype.powerOff = function (callback) {
        var self = this;
        var completion_routine = callback;
        var read_function = function () {
            writeAndDrain(self.serial_port, "adc read 3\r", function (error) {
                if (error) {
                    clearTimer(self);
                    completion_routine(true);
                }
            });
        }
        
        if (isTimerActive(self)) {
            console.log('[powerOff] timer is already active');
            completion_routine(true);
            return;
        }

        self.read_data_callback = function (data) {
    //        console.log('read_data_callback');
            var value = Number(data)
            if (isNaN(value)) {
 //               console.log('value is NaN:' + data);
                return;
            }

            self.sum += value;
            var sum_tmp;
            sum_tmp = 10 * led.led_off_setted(); 
            if (self.counter >= 10) {
                if (self.sum > sum_tmp) { // power off
   //                 console.log('[powerOff] Current counter is ' + self.counter);
   //                 console.log('[powerOff] sum is ' + self.sum);
                    self.pushPowerSwitch();
                } else {
    //                console.log('[poweOff] Current counter is ' + self.counter);
     //               console.log('[powerOff] already power off. adc 3 sum is ' + self.sum);
                    // already power off
                }
            
                clearTimer(self);
                completion_routine(false);
            } else {
                self.counter++;
                read_function();
            }
        }

        read_function();
    }

    factory.NumatoController = NumatoController;
}

module.exports = new NumatoControllerFactory();
