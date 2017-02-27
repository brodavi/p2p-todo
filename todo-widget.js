const html = require('choo/html')
const widget = require('cache-element/widget')

function range(start, count) {
  return Array.apply(0, Array(count))
    .map(function (element, index) { 
      return index + start;  
  });
}

const dates = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31]
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const years = range((new Date()).getFullYear(), 10)

const thisMonth = (new Date()).getMonth()
const thisDate = (new Date()).getDate()
const thisYear = (new Date()).getFullYear()

module.exports = () => {
  return widget({
    render: (opts) => {
      const date = opts.todo ? opts.todo.date ? new Date(opts.todo.date) : null : null
      const todoMonth = date ? date.getMonth() : null
      const todoDate = date ? date.getDate() : null
      const todoYear = date ? date.getFullYear() : null

      const compareMonth = todoMonth || thisMonth
      const compareDate = todoDate || thisDate
      const compareYear = todoYear || thisYear

      return html`
        <div class="todo-item" data-id=${opts.todo ? opts.todo.id : 0}>
          <button class=${!opts.todo ? "hidden" : ""} onclick=${opts.onToggleDone}>${opts.todo && opts.todo.done ? "Mark Undone" : "Mark Done"}</button>
          <button class=${!opts.todo ? "hidden" : ""} onclick=${opts.onTogglePrioritized}>${opts.todo && opts.todo.prioritized ? "DePrioritize" : "Prioritize"}</button>
          <textarea class="todo-text ${opts.todo && opts.todo.done ? 'done' : ''}"
                    placeholder="new todo">${opts.todo ? opts.todo.text : ''}</textarea>
          <div class="saveDeleteContainer">
            <button onclick=${opts.onSaveTodo}>SAVE</button>
            <button class=${!opts.todo ? "hidden" : ""} onclick=${opts.onDeleteTodo}>Delete</button>
          </div>
          <div class="date-selectors">
            <select class="month-select">
            ${months.map((month) => {
              return html`
              <option value=${month}
              ${months.indexOf(month) === compareMonth ? 'selected' : ''}>
              ${month}
              </option>`
            })}
            </select>
            <select class="date-select">
            ${dates.map((date) => {
              return html`
              <option value=${date}
              ${date === compareDate ? 'selected' : ''}>
              ${date}
              </option>`
            })}
            </select>
            <select class="year-select">
            ${years.map((year) => {
              return html`
              <option value=${year}
              ${(year === compareYear) ? 'selected' : ''}>
              ${year}
              </option>`
            })}
            </select>
            <input class="tags-input"
            type="text"
            placeholder="optional tags"
            value=${opts.todo ? (opts.todo.tags ? opts.todo.tags.join(' ') : '') : ''}
            />
          </div>
        </div>
      `
    },
    onupdate: (el, opts) => {
      console.log('updated todo with opts: ', opts)
    }
  })
}