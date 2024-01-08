const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, 'todoApplication.db')

const app = express()
app.use(express.json())

let db = null
const initlize = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => console.log('success'))
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initlize()

const hasPriorityAndStatus = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}
const hasPriority = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatus = requestQuery => {
  return requestQuery.status !== undefined
}

app.get('/todos/', async (request, response) => {
  let data = null

  let getTodoQuery = ''

  const {search_q = '', priority, status} = request.query

  switch (true) {
    case hasPriorityAndStatus(request.query):
      getTodoQuery = `
        SELECT *
        FROM
          todo
        WHERE
          todo LIKE '%${search_q}%'
          AND status= '${status}'
          AND priority='${priority}';`
      break
    case hasPriority(request.query):
      getTodoQuery = `
        SELECT * 
        FROM 
          todo
        WHERE
          todo LIKE '%${search_q}%'
          AND priority='${priority}';`

      break
    case hasStatus(request.query):
      getTodoQuery = `
        SELECT * 
        FROM 
          todo
        WHERE
          todo LIKE '%${search_q}%'
          AND status ='${status}';`
      break
    default:
      getTodoQuery = `
        SELECT * 
        FROM 
          todo
        WHERE
          todo LIKE '%${search_q}%';`
  }
  data = await db.all(getTodoQuery)
  response.send(data)
})

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodoQuery = `
      SELECT 
        *
      FROM
        todo 
      WHERE
        id = ${todoId};`

  const todo = await db.get(getTodoQuery)
  response.send(todo)
})

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body
  const postTodoQuery = `
      INSERT INTO 
        todo(id, todo, priority,status)
      VALUES
        (${id},'${todo}','${priority}','${status}');`
  await db.run(postTodoQuery)
  response.send('Todo Successfully Added')
})

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  let updateColumn = ''
  const requestBody = request.body
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = 'Status'
      break
    case requestBody.priority !== undefined:
      updateColumn = 'Priority'
      break
    case requestBody.todo !== undefined:
      updateColumn = 'Todo'
      break
  }
  const previousTodoQuery = `
    SELECT
      * 
    FROM
      todo 
    WHERE 
      id = ${todoId};`
  const previousTodo = await db.get(previousTodoQuery)
  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body

  const updtaeTodoQuery = `
      UPDATE  
        todo 
      SET 
        todo ='${todo}',
        priority = '${priority}',
        status = '${status}'
      WHERE
        id = ${todoId};`
  await db.run(updtaeTodoQuery)
  response.send(`${updateColumn} Updated`)
})

app.delete('/todos/:todoId', async (request, response) => {
  const {todoId} = request.params
  const deleteTodo = `
    DELETE 
    FROM 
      todo
    WHERE
      id = ${todoId};`
  await db.run(deleteTodo)
  response.send('Todo Deleted')
})
module.exports = app
