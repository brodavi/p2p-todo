const level = require('level-browserify')
const memdb = require('memdb')
const swarmlog = require('unsigned-swarmlog')
const queryString = require('query-string')
const extend = require('xtend')
const choo = require('choo')
const html = require('choo/html')
const app = choo()
const utils = require('./utils.js')
const Todo = require('./todo-widget.js')

const searchObj = queryString.parse(window.location.search)

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

const log = swarmlog({
  db: db,
  topic: 'p2p-todo.' + key,
  valueEncoding: 'json',
  hubs: [ signalhub ]
})

function handleRemoteData (state, data, send, done) {
  if (data.log === log.id) {
    return
  }
         if (data.value.action === 'create-todo') {
    send('remoteAddTodo', data.value.value, done)
  } else if (data.value.action === 'delete-todo') {
    send('remoteDeleteTodo', data.value.value, done)
  } else if (data.value.action === 'update-todo') {
    send('remoteUpdateTodo', data.value.value, done)
  }
}

app.model({
  state: {
    todos: [],
    peerNum: 0,
    importVisible: false,
    exportVisible: false
  },
  reducers: {
    receiveNewTodo: (state, newTodo) => {
      const newTodos = state.todos.slice()
      newTodos.push(newTodo)
      return { todos: newTodos }
    },
    replaceTodo: (state, newTodo) => {
      const newTodos = state.todos.slice()
      const oldTodo = state.todos.find(function (t) { return t.id === newTodo.id })
      const idx = state.todos.indexOf(oldTodo)
      newTodos[idx] = newTodo
      return { todos: newTodos }
    },
    removeTodo: (state, id) => {
      const newTodos = state.todos.filter(todo => todo.id !== id)
      return { todos: newTodos }
    },
    peerNum: (state, num) => {
      return { peerNum: num }
    },
    toggleImport: (state) => {
      return { importVisible: !state.importVisible }
    },
    toggleExport: (state) => {
      return { exportVisible: !state.exportVisible }
    },
    closeImportExport: (state) => {
      return { exportVisible: false, importVisible: false }
    }
  },
  effects: {
    init: (state, data, send, done) => {
      log.createReadStream({ live: true })
      .on('data', function (logdata) {
        handleRemoteData(state, logdata, send, done)
      })
      log.swarm.on('peer', function (peer) {
        send('peerNum', log.swarm.peers.length, done)
      })
    },
    remoteAddTodo: (state, data, send, done) => {
      send('receiveNewTodo', data, done)
    },
    addTodo: (state, data, send, done) => {
      send('receiveNewTodo', data, done)
      log.append({
        action: 'create-todo',
        value: data
      })
    },
    remoteUpdateTodo: (state, data, send, done) => {
      const oldTodo = state.todos.find(function (t) { return t.id === data.id })
      const newTodo = extend(oldTodo, data)
      send('replaceTodo', newTodo, done)
    },
    updateTodo: (state, data, send, done) => {
      const oldTodo = state.todos.find(function (t) { return t.id === data.id })
      const newTodo = extend(oldTodo, data)
      send('replaceTodo', newTodo, done)
      if (data.text === undefined &&
          data.date === undefined &&
          data.tags === undefined &&
          data.done === undefined &&
          data.prioritized === undefined) {
      } else {
        log.append({
          action: 'update-todo',
          value: data
        })
      }
    },
    remoteDeleteTodo: (state, data, send, done) => {
      send('removeTodo', data, done)
    },
    deleteTodo: (state, data, send, done) => {
      send('removeTodo', data, done)
      log.append({
        action: 'delete-todo',
        value: data
      })
    },
    importJSON: (state, json, send, done) => {
      send('closeImportExport', json, done)
      JSON.parse(json).todos.map(function (t) {
        if (!t.date) t.date = new Date()
        if (!t.tags) t.tags = []
        send('receiveNewTodo', t, done)
        log.append({
          action: 'create-todo',
          value: t
        })
      })
    }
  }
})

// const datepickerInstance = Datepicker()
const todoInstance = Todo()

const view = (state, prev, send) => {
  return html`
    <div onload=${() => send('init')}>
      <div id="newTodoContainer">
        ${Todo()({
          onSaveTodo: onSaveTodo
        })}
      </div>
      <div id="importExportContainer">
        <button class="action" onclick=${onExport}>export</button>
        to export your todos to JSON.
        <button class="action" onclick=${onImport}>import</button>
        your todos via JSON.
      </div>
      <div id="todoListContainer">
        <div id="todoList">
          ${state.todos.map((todo, index) => {
            return todo.prioritized ? Todo()({
              todo: todo,
              onSaveTodo: onSaveTodo,
              onDeleteTodo: onDeleteTodo,
              onToggleDone: onToggleDone,
              onTogglePrioritized: onTogglePrioritized
            }) : ''
          })}
        </div>
      </div>
      <div id="todoListSomeday">
        ${state.todos.map((todo, index) => {
          return todo.prioritized ? '' : Todo()({
            todo: todo,
            onSaveTodo: onSaveTodo,
            onToggleDone: onToggleDone,
            onDeleteTodo: onDeleteTodo,
            onTogglePrioritized: onTogglePrioritized
          })
        })}
      </div>
      <span id="appInfoSpan" class="instructions">
      copy this link to replicate this app:
      <a id="appInfo"
         href=${window.location.origin + '?signalhub=' + signalhub + '&' + 'key=' + key + '&' + 'db=' + (prompt || searchObj.db)}>
        ${'signalhub: "' + signalhub + '" | app key: "' + key + '" | db id: "' + (prompt || searchObj.db) + '"'}
      </a>
      </span>
      <div id="peerNum"># of peers: (${state.peerNum})</div>
      <button id="importBtn" class="${state.importVisible ? '' : 'hidden'}" onclick=${onImportJSON}>import</button>
      <button id="closeBtn" class="${state.exportVisible || state.importVisible ? '' : 'hidden'}" onclick=${onCloseImportExport}>x</button>
      <textarea id="jsonExport" class="jsonTextArea ${state.exportVisible ? '' : 'hidden'}" rows="8" cols="40">${JSON.stringify({todos: state.todos})}</textarea>
      <textarea id="jsonImport" class="jsonTextArea ${state.importVisible ? '' : 'hidden'}" rows="8" cols="40"></textarea>
    </div>`

  function onImport (e) {
    send('toggleImport')
  }

  function onExport (e) {
    send('toggleExport')
  }

  function onCloseImportExport (e) {
    send('closeImportExport')
  }

  function onImportJSON (e) {
    const importedTodos = document.querySelector('#jsonImport')
    send('importJSON', importedTodos.value)
  }

  function onToggleDone (e) {
    const id = e.target.parentElement.dataset.id
    const oldTodo = state.todos.find(function (t) { return t.id === id })
    send('updateTodo', {
      id: oldTodo.id,
      done: !oldTodo.done
    })
  }

  function onTogglePrioritized (e) {
    const id = e.target.parentElement.dataset.id
    const oldTodo = state.todos.find(function (t) { return t.id === id })
    send('updateTodo', {
      id: oldTodo.id,
      prioritized: !oldTodo.prioritized
    })
  }

  function onDeleteTodo (e) {
    send('deleteTodo', e.target.parentElement.parentElement.dataset.id)
  }

  function onSaveTodo (e) {
    const id = e.target.parentElement.parentElement.dataset.id === "0" ? null : e.target.parentElement.parentElement.dataset.id
    const oldTodo = id ? state.todos.find(function (t) { return t.id === id }) : null

    const children = e.target.parentElement.parentElement.children
    var todoInput, tagsInput, daySelect, monthSelect, yearSelect

    for (var x = 0; x < children.length; x++) {
      if (children[x].classList.contains('todo-text')) {
        todoInput = children[x]
      }
      if (children[x].classList.contains('date-selectors')) { 
        const subchildren = children[x].children
        for (var y = 0; y < subchildren.length; y++) {
          if (subchildren[y].classList.contains('date-select')) {
            dateSelect = subchildren[y]
          }
          if (subchildren[y].classList.contains('month-select')) {
            monthSelect = subchildren[y]
          }
          if (subchildren[y].classList.contains('year-select')) {
            yearSelect = subchildren[y]
          }
          if (subchildren[y].classList.contains('tags-input')) {
            tagsInput = subchildren[y]
          }
        }
      }
    }

    const date = new Date(monthSelect.value + ' ' + dateSelect.value + ' ' + yearSelect.value)

    const newTodo = {
      text: todoInput.value,
      date: date,
      tags: tagsInput.value.split(' ')
    }

    var diff = {
      id: id
    }

    if (oldTodo) {
      if (newTodo.text !== oldTodo.text) {
        diff.text = newTodo.text
      }
      if (newTodo.date.valueOf() !== oldTodo.date.valueOf()) {
        diff.date = newTodo.date
      }
      if (newTodo.tags.reduce(function (acc, i, idx) {
        const different = i !== oldTodo.tags[idx]
        return different || acc
      }, false)) {
        diff.tags = newTodo.tags
      }
      todoInput.value = ''
      tagsInput.value = ''
      send('updateTodo', diff)
    } else {
      diff = extend(newTodo, {
        id: utils.generateId(),
        done: false,
        prioritized: true
      })
      todoInput.value = ''
      tagsInput.value = ''
      send('addTodo', diff)
    }
  }
}

app.router([
  ['/', view]
])

const tree = app.start()
document.body.appendChild(tree)