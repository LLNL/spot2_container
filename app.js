const express = require('express')
const app = express()
const {exec, execSync} = require('child_process')
const port = process.env.PORT || 8080

app.use(express.json())

// Handle static files
app.use(express.static('/usr/gapps/spot/static/'))

// API for data
app.post('/getdata',(req, res) =>{
    
    const command = "python3 /usr/gapps/spot/backend.py getData /data/" + 
                     req.body.dataSetKey + 
                     " '" + JSON.stringify(req.body.cachedRunCtimes) + "'"
    const subprocess = exec(command, {maxBuffer:1024*1024*1024}, (err, stdout, stderr) => {
            res.send(stdout.toString())
        })
})

// API for data
app.post('/spotJupyter',(req, res) =>{
    const command = `python3 /usr/gapps/spot/backend.py jupyter --container '${req.body.filepath}'`
    exec(command, {maxBuffer:1024*1024*1024}, (err, stdout, stderr) => {
             res.send(stdout.toString())
         })
})

// Start Server
app.listen(port, () => console.log(`listening on port ${port}`))