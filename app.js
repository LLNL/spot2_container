const path = require('path')
const express = require('express')
const app = express()
const {exec, execSync} = require('child_process')
const port = process.env.PORT || 8080

app.use(express.json())

// Handle static files
app.use(express.static('/usr/gapps/spot/static/'))

function sanitizepath(userpath) {
    if (typeof(userpath) !== 'string')
        return "/invalidpath";

    abspath = ""
    if (path.isAbsolute(userpath)) {
        abspath = userpath;
    }
    else {
        abspath = "/data/" + userpath;
    }

    real = path.normalize(abspath);
    valid = real.startsWith("/data/") || real.startsWith("/demos/");
    if (!valid) {
        return "/invalidpath";
    }
    return real;
}

// API for data
app.post('/getdata',(req, res) =>{
    

    const command = "/opt/conda/bin/python3 /usr/gapps/spot/backend.py --config /usr/gapps/spot/backend_config.yaml getData " + 
                    sanitizepath(req.body.dataSetKey) + 
                     " '" + JSON.stringify(req.body.cachedRunCtimes) + "'"

    exec(command, {maxBuffer:1024*1024*1024}, (err, stdout, stderr) => {
            res.send(stdout.toString())
        })
})


app.post('/getmemory',(req, res) =>{

    //console.log('app.js /getmemory');
    var filepath = req.body.filepath;

    //  /usr/gapps/spot/venv_python/bin/python3 /usr/gapps/spot/dev/spot.py memory /usr/gapps/spot/datasets/lulesh_gen/100/1.cali
    const command = "/opt/conda/bin/python3 /usr/gapps/spot/backend.py --config /usr/gapps/spot/backend_config.yaml memory /data/" +
                filepath;


    //console.log( filepath );
    //console.log(command);
    //console.log(req.body.filepath);

    exec(command, {maxBuffer:1024*1024*1024}, (err, stdout, stderr) => {

            //console.log("memory resposne")
            res.send(stdout.toString())
        })
})


app.post('/spotJupyter',(req, res) =>{
    const command = `/opt/conda/bin/python3 /usr/gapps/spot/backend.py --config /usr/gapps/spot/backend_config.yaml --container jupyter '` + sanitizepath(req.body.filepath) + `'`
    
    exec(command, {maxBuffer:1024*1024*1024}, (err, stdout, stderr) => {
             res.send(stdout.toString())
         })
})

app.post('/spotMultiJupyter',(req, res) =>{
    const command = `/opt/conda/bin/python3 /usr/gapps/spot/backend.py --config /usr/gapps/spot/backend_config.yaml --container multi_jupyter '` +
          sanitizepath(req.body.basepath) + `' '${JSON.stringify(req.body.subpaths)}'`
    exec(command, {maxBuffer:1024*1024*1024}, (err, stdout, stderr) => {
             res.send(stdout.toString())
         })
})

// Start Server
app.listen(port, () => console.log(`listening on port ${port}`))
