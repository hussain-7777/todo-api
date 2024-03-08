const express = require('express')
const app = express()
app.use(express.json())
const path = require('path')
const dbPath = path.join(__dirname, 'todoApplication.db')
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')

let db = null
const initDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initDBAndServer()

// The following code is used to select the SQL query based on
// the query parameters passed to the API.
const hasPriorityAndStatusProperty = requestQuery => {
  if (
    requestQuery.priority !== undefined &&
    requestQuery.status !== undefined
  ) {
    return true
  }
}
const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}
const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

// The variable hasPriorityAndStatusProperties gives true or
// false if priority and status are given as query parameters.
// According to it we are selecting the SQL query
// while writing the code.

// Get list of all todos who's status is To do has 4 cases/scenarios
app.get('/todos/', async (request, response) => {
  let allTodos = null
  let getTodosQuery = ''
  const {search_q = '', priority, status} = request.query

  switch (true) {
    case hasPriorityAndStatusProperty(request.query):
      getTodosQuery = `select * from todo 
    where todo like '%${search_q}%'
    and status = '${status}'
    and priority = '${priority}';`
      break
    case hasPriorityProperty(request.query):
      getTodosQuery = `select * from todo
    where todo like '%${search_q}%'
    and priority = '${priority}';`
      break
    case hasStatusProperty(request.query):
      getTodosQuery = `select * from todo
    where todo like '%${search_q}%'
    and status = '${status}';`
      break
    default:
      getTodosQuery = `select * from todo
    where todo like '%${search_q}%'`
  }
  allTodos = await db.all(getTodosQuery)
  response.send(allTodos)
})

// Get todo
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodoQuery = `select * from todo
  where id = '${todoId}';`
  const todo = await db.get(getTodoQuery)
  response.send(todo)
})

// Create todo
app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body
  const createTodoQuery = `insert into todo
  (id, todo, priority, status) 
  values ('${id}', '${todo}', '${priority}', '${status}');`
  const newTodo = await db.run(createTodoQuery)
  response.send('Todo Successfully Added')
})

// Update todo 3cases
app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  let column = ''
  const requestBody = request.body

  switch (true) {
    case requestBody.status !== undefined:
      column = 'Status'
      break
    case requestBody.priority !== undefined:
      column = 'Priority'
      break
    case requestBody.todo !== undefined:
      column = 'Todo'
      break
  }

  const prevTodoQuery = `select * from todo
  where id = ${todoId};`
  const prevTodo = await db.get(prevTodoQuery)
  const {
    todo = prevTodo.todo,
    priority = prevTodo.priority,
    status = prevTodo.status,
  } = request.body

  const updateTodoQuery = `update todo set
  todo = '${todo}',
  priority = '${priority}',
  status = '${status}'
  where id = ${todoId};`
  const updatedTodo = await db.run(updateTodoQuery)
  response.send(`${column} Updated`)
})

// Delete todo
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteTodoQuery = `delete from todo
  where id = ${todoId};`
  const deletedTodo = await db.run(deleteTodoQuery)
  response.send('Todo Deleted')
})

module.exports = app
