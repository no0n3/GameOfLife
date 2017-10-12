const express = require('express');
var bodyParser = require('body-parser');
apiController = require('./src/controllers/api.controller')

const app = express()

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    next();
});

app.get('/api/next-generation', apiController.nextGeneration);
app.get('/api/check-status', apiController.checkStatus);
app.post('/api/reset', apiController.reset);

app.listen(3000, () => {
    console.log('REST API now listens on port 3000.')
})
