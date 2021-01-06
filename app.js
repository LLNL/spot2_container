const path = require('path')
const express = require('express')
const app = express()
const {exec, execSync} = require('child_process')
const port = process.env.PORT || 8080
var bodyParser = require('body-parser')
var multer = require('multer')
var upload = multer()
var session = require('express-session')
var cookieParser = require('cookie-parser')
const bcrypt = require('bcryptjs')
const fs = require('fs')
const crypto = require('crypto')


app.use(express.json())

app.set('view engine', 'pug');
app.set('views', '/usr/gapps/spot/static/views');

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(upload.array());
app.use(cookieParser());
app.use(session({
    secret: crypto.randomBytes(64).toString('hex'),
    resave: false,
    saveUninitialized: false
}))

var hashedpw = undefined

function loadPassword() {
    try {
        pw = fs.readFileSync(0).toString().trim()
        if (pw && pw.length != 0) {
            hashedpw = bcrypt.hashSync(pw, 10)
            return
        }
    }
    catch (err) {
    }

    try {
        hashedpw = fs.readFileSync("/usr/gapps/spot/defaultpw").toString().trim()
        if (hashedpw.length) {
            return
        }
    }
    catch (err) {
    }

    console.log("Running SPOT without a password.  Use 'SPOTPW=<password> docker run -e SPOTPW ...' to set a site password.")
    hashedpw = ""
}
loadPassword()

function checkSignIn(req, res, next){
    if(req.session.signedin){
        next();
    }
    else if (hashedpw === "") {
        next();
    }
    else {
        if (req.originalUrl == '/favicon.ico') {
            req.session.initialpage = '/'
        }
        else {
            req.session.initialpage = req.originalUrl
        }
        res.redirect('/login')
    }
}

app.get('/login', function(req, res){
    res.render('login');
});

app.get('*', checkSignIn)

// Handle static files
app.use(express.static('/usr/gapps/spot/static/'))

app.post('/login', function(req, res){
    if (!req.body.password){
        res.render('login', {message: "Please enter a password"});
    }
    else if (!bcrypt.compareSync(req.body.password, hashedpw)) {
        res.render('login', {message: "Invalid password"});
    }
    else {
        req.session.signedin = true
        if (req.session.hasOwnProperty("initialpage")) {
            redirectto = req.session.initialpage
            req.session.initialpage = null
            res.redirect(redirectto)
        }
        else {
            res.redirect('/')
        }
    }
});

app.get('/logout', function(req, res){
    req.session.destroy(function(){
        console.log("user logged out.")
    });
    res.redirect('/login');
});

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

    console.log('getdata test.');

    exec(command, {maxBuffer:1024*1024*1024}, (err, stdout, stderr) => {
            res.send(stdout.toString())
        })
})


app.post('/getmemory',(req, res) =>{

    var filepath = req.body.filepath;
    console.log("filepath2: " + filepath);

    //filepath = 'lul_sept_28_timeseries/200924-16330964138.cali';

    //  /usr/gapps/spot/venv_python/bin/python3 /usr/gapps/spot/dev/spot.py memory /usr/gapps/spot/datasets/lulesh_gen/100/1.cali
    const command = "/opt/conda/bin/python3 /usr/gapps/spot/backend.py --config /usr/gapps/spot/backend_config.yaml memory /data/" +
                filepath;


    console.log('getmemory: ' + command);

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
