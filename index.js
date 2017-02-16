var level = require('level-browserify')
var memdb = require('memdb')
var swarmlog = require('unsigned-swarmlog')
var queryString = require('query-string')

// from http://stackoverflow.com/questions/9407892/how-to-generate-random-sha1-hash-to-use-as-id-in-node-js#14869745
// str byteToHex(uint8 byte)
//   converts a single byte to a hex string 
function byteToHex (byte) {
  return ('0' + byte.toString(16)).slice(-2)
}

// from http://stackoverflow.com/questions/9407892/how-to-generate-random-sha1-hash-to-use-as-id-in-node-js#14869745
// str generateId(int len);
//   len - must be an even number (default: 40)
function generateId (len) {
  var arr = new Uint8Array((len || 40) / 2)
  window.crypto.getRandomValues(arr)
  return [].map.call(arr, byteToHex).join("")
}






var searchObj = queryString.parse(window.location.search)

var signalhub, key, db

if (!searchObj.signalhub) {
  signalhub = window.prompt('Enter a signaling server for peer discovery or hit Cancel for default.') || 'https://signalhub.mafintosh.com'
} else {
  signalhub = searchObj.signalhub
}

if (!searchObj.key) {
  key = window.prompt('Enter an app key for sharing via p2p or hit Cancel.') || (Math.ceil(Math.random()*100000000000)).toString()
} else {
  key = searchObj.key
}

if (!searchObj.db) {
  var prompt = window.prompt('Specify a persistent database id, "memdb" to use disposable in-memory database, or hit Cancel for default persistent database.') || 'default'
  db = prompt === 'memdb' ? memdb() : level(prompt)
} else {
  db = searchObj.db === 'memdb' ? memdb() : level(searchObj.db)
}

console.log(signalhub, key, prompt || searchObj.db)

var log = swarmlog({
  db: db,
  topic: 'p2p-todo.' + key,
  valueEncoding: 'json',
  hubs: [ signalhub ]
})

window.onload = function () {
  // notify user of current app key in bottom right of screen
  appInfo.innerHTML = 'app key: ' + key + ' | db id: ' + (prompt || searchObj.db)

  // handle the creation of a todo with the input field
  todoInput.addEventListener('keyup', handleCreateTodo)

  log.swarm.on('peer', function (peer) {
    console.log('got peer: ', peer)
    peerNum.innerHTML = '# of peers: (' + log.swarm.peers.length + ')'
  })

  log.createReadStream({live: true})
  .on('data', function (data) {
    handleRemoteData(data)
  })
}

// note that "remote" in this case means from the hyperlog.
// we might have appended to the hyperlog ourselves, but we don't want to care.
function handleRemoteData (data) {
  console.log('remote data: ', data)

  if (data.value.action === 'create-todo') {
    remoteCreateTodo(data.value.value)
  } else if (data.value.action === 'delete-todo') {
    remoteDeleteTodo(data.value.value.id)
  } else if (data.value.action === 'update-todo') {
    remoteUpdateTodo(data.value.value)
  }
}

// user wants to create a todo. append this action to the hyperlog
function handleCreateTodo (e) {
  if (e.keyCode === 13) {

    // append the action to the hyperlog
    log.append({
      action: 'create-todo',
      value: {
        id: generateId(),
        text: e.target.value,
        done: false,
        prioritized: true
      }
    })

    // clear the input field
    todoInput.value = ''
  }
}

// user wants toggle the priority of a todo. append this action to the hyperlog
function handleTogglePriority (e) {
  var todo = e.target.parentElement.parentElement
  var id = todo.dataset.id

  // append the action to the hyperlog
  log.append({
    action: 'update-todo',
    value: {
      id: id,
      prioritized: todo.parentElement === todoList ? false : true
    }
  })

  return true
}

// user wants to set a todo to done. append this action to the hyperlog
function handleToggleDone (e) {
  var todo = e.target.parentElement

  var textEl
  for (var x = 0; x < todo.children.length; x++) {
    if (todo.children[x].classList.contains('todo-text')) {
      textEl = todo.children[x]
      break
    }
  }

  // append the action to the hyperlog
  log.append({
    action: 'update-todo',
    value: {
      id: todo.dataset.id,
      done: textEl.classList.contains('done') ? false : true
    }
  })

  return true
}

// user wants to delete a todo. append this action to the hyperlog
function handleDeleteTodo (e) {
  var id = e.target.parentElement.dataset.id

  // append the action to the hyperlog
  log.append({
    action: 'delete-todo',
    value: {
      id: id
    }
  })

  return true
}

// returns the DOM element with the id matching the argument
function findTodo (id) {
  var allTodos = document.querySelectorAll('.todo-item')
  for (var x = 0; x < allTodos.length; x++) {
    if (allTodos[x].dataset.id === id) {
      return allTodos[x]
    }
  }
  return null
}

// perform the DOM manipulations
function remoteCreateTodo (opts) {
  var todo = document.createElement('div')
  todo.classList.add('todo-item')
  todo.dataset.id = opts.id
  var toggleDone = document.createElement('div')
  toggleDone.classList.add('toggle-done')
  toggleDone.addEventListener('click', handleToggleDone)
  var todoText = document.createElement('div')
  todoText.classList.add('todo-text')
  todoText.innerHTML = opts.text
  var togglePriority = document.createElement('div')
  togglePriority.classList.add('toggle-priority')
  togglePriority.classList.add('arrow-down')
  togglePriority.addEventListener('click', handleTogglePriority)
  var priorityContainer = document.createElement('div')
  priorityContainer.classList.add('priority-container')
  priorityContainer.appendChild(togglePriority)
  var deleteTodo = document.createElement('div')
  deleteTodo.classList.add('delete-todo')
  deleteTodo.innerHTML = '×'
  deleteTodo.addEventListener('click', handleDeleteTodo)

  todo.appendChild(toggleDone)
  todo.appendChild(priorityContainer)
  todo.appendChild(todoText)
  todo.appendChild(deleteTodo)

  todoList.appendChild(todo)
}

function remoteDeleteTodo (id) {
  var todo = findTodo(id)
  if (todo.parentElement === todoList) {
    todoList.removeChild(todo)
  } else {
    todoListSomeday.removeChild(todo)
  }
}

function remoteUpdateTodo (opts) {
  var todo = findTodo(opts.id)
  if (opts.hasOwnProperty('prioritized')) {
    if (opts.prioritized) {
      todoList.appendChild(todo)
    } else {
      todoListSomeday.appendChild(todo)
    }
  } else if (opts.hasOwnProperty('done')) {
    var textEl
    for (var x = 0; x < todo.children.length; x++) {
      if (todo.children[x].classList.contains('todo-text')) {
        textEl = todo.children[x]
        break
      }
    }
    if (opts.done) {
      textEl.classList.add('done')
    } else {
      textEl.classList.remove('done')
    }
  }
}