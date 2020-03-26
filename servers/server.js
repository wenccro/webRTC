var express = require('express')
const bodyParser = require('body-parser')
var app = express()
const Router = require('router')
const router = Router()

router.__dataStore = {}

// 自定义跨域中间件
var allowCors = function (req, res, next) {
  res.header('Access-Control-Allow-Origin', req.headers.origin)
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  res.header('Access-Control-Allow-Credentials', 'true')
  next()
}
app.use(allowCors) // 使用跨域中间件

app.get('/data/:id', function (req, res) {
  console.log('get')
  const deviceId = req.params.id
  console.log(deviceId)
  if (!router.__dataStore[deviceId] || router.__dataStore[deviceId].length === 0) {
    console.log('无数据')
    res.statusCode = 200
    res.end('11')
  } else {
    console.log(router.__dataStore)
    const data = router.__dataStore[deviceId].shift()
    console.log('我发给了谁' + deviceId)
    console.log(data)
    res.statusCode = 200
    res.end(JSON.stringify(data))
  }
})
app.use(bodyParser.urlencoded({
  extended: true
}))
app.use(bodyParser.json({ type: 'application/*+json' }))
// var urlencodedParser = bodyParser.urlencoded({ extended: true })
app.post('/data/:id', (req, res) => {
  console.log('post请求成功')
  const deviceId = req.params.id
  console.log(deviceId)
  if (!router.__dataStore[deviceId]) {
    router.__dataStore[deviceId] = []
  }
  console.log('我准备push了')
  console.log(req.body)
  router.__dataStore[deviceId].push(req.body)
  res.statusCode = 200
  res.end('11')
})

app.listen(3001, () => {
  console.log(3001)
})
