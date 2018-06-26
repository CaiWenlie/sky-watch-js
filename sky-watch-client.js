var socket;
var _log = window.console.log
var _error = window.console.error
var msgQueue = []

// auto reconnect
var connect = function () {
  socket = new WebSocket(`ws://${location.hostname}:1000`)

  // Connection opened
  socket.addEventListener('open', function (event) {
    _log('connected')
    socket.send('Hello Server! from ' + window.location.href);

    // resolve message queue
    for(var i = 0; i < msgQueue.length; i++) {
      socket.send(msgQueue[i])
    }
    msgQueue = []
  });

  // Listen for messages
  socket.addEventListener('message', function (event) {
    _log('Message from server ', event.data);
    var data = event.data
    if (typeof data == 'string' && data.indexOf('javascript:') == 0) {
      try {
        eval(event.data.replace('javascript:', ''))
      }
      catch (e) {

      }
    }
  });

  socket.addEventListener('close', function () { _log('closed'); setTimeout(connect, 3000) })
  socket.addEventListener('error', function () { _log('error'); })
}
connect()

// report messages
function send() {
  try {
    var msg = flatArguments(arguments)
    if (socket.readyState != socket.OPEN) {
      msgQueue.push(msg)
    }
    else {
      socket.send(msg)
    }
  } catch (e) {

  } finally {

  }
}

// transform arguments to string
function flatArguments(args) {
  var result = []
  var len = args.length
  for (var i = 0; i < len; i++) {
    var value = args[i]
   // prevent undefined and null
    if(value === undefined || value === null) {
      value = ''
    }
    // transform arguments
    else if (value.toString() == "[object Arguments]") {
      value = flatArguments(value)
    }
    // transform object
    else if (typeof value == 'object') {
      value = JSON.stringify(value)
    }
    result.push(value)
  }
  return result.join()
}

// catch window error
window.addEventListener('error', function (e) {
  send('error', e.message, e.lineno, e.colno, e.error ? e.error.stack : undefined)
})

// report console.log
window.console.log = function() {
  _log.apply(null, arguments)
  send(arguments)
}

// report console.error
window.console.error = function() {
  _error.apply(null, arguments)
  send('error log', arguments)
}
