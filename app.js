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
var spotBaseUrl = process.env.SPOTBASEURL || ''

app.use(express.json())

app.set('view engine', 'pug');
app.set('views', '/usr/gapps/spot/static/views');

function formatBaseUrl()
{
    if (spotBaseUrl.trim().length == 0) {
        spotBaseUrl = ''
        return
    }
    if (!spotBaseUrl.startsWith('/')) {
        spotBaseUrl = '/' + spotBaseUrl
    }
    while (spotBaseUrl.endsWith('/')) {
        spotBaseUrl = spotBaseUrl.substring(0, spotBaseUrl.length - 1)
    }
}

var sessionkey = ""
function setServerSessionKey()
{
    try {
        sessionkey = fs.readFileSync("/etc/spot/sessionkey").toString().trim()
    }
    catch (err) { }

    if (!sessionkey.length) {
        sessionkey = crypto.randomBytes(64).toString('hex')
    }
    
}

var pythonconfig = ""
function setPythonConfig()
{
    if (fs.existsSync("/etc/spot/backend_config.yaml")) {
        try {
            fs.accessSync("/etc/spot/backend_config.yaml", fs.constants.R_OK)
            pythonconfig = "/etc/spot/backend_config.yaml"
        }
        catch (err) {
            console.log("Warning: /etc/spot/backend_config.yaml exists but isn't readable")
        }
    }

    if (pythonconfig == "") {
        pythonconfig = "/usr/gapps/spot/backend_config.yaml";
    }
}
setPythonConfig()

setServerSessionKey()
formatBaseUrl()
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(upload.array());
app.use(cookieParser());
app.use(session({
    secret: sessionkey,
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
        hashedpw = fs.readFileSync("/etc/spot/defaultpw").toString().trim()
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
        req.session.initialpage = req.originalUrl
        res.redirect(spotBaseUrl + '/login')
    }
}

app.use('/favicon.ico', express.static('/usr/gapps/spot/static/images/favicon.ico'))

app.get('/login', function(req, res){
    res.render('login', { loginurl: spotBaseUrl + '/login'});
});

app.get('*', checkSignIn)

// Handle static files
app.use(express.static('/usr/gapps/spot/static/'))

app.post('/login', function(req, res){
    if (!req.body.password){
        res.render('login', {message: "Please enter a password", loginurl: spotBaseUrl + '/login' });
    }
    else if (!bcrypt.compareSync(req.body.password, hashedpw)) {
        res.render('login', {message: "Invalid password", loginurl: spotBaseUrl + '/login' });
    }
    else {
        req.session.signedin = true
        if (req.session.hasOwnProperty("initialpage")) {
            redirectto = req.session.initialpage
            req.session.initialpage = null
            res.redirect(spotBaseUrl + redirectto)
        }
        else {
            res.redirect(spotBaseUrl + '/')
        }
    }
});

app.get('/logout', function(req, res){
    req.session.destroy(function(){
        console.log("user logged out.")
    });
    res.redirect(spotBaseUrl + '/login');
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
    

    const command = "/opt/conda/bin/python3 /usr/gapps/spot/backend.py --config " + pythonconfig + " getData " + 
                    sanitizepath(req.body.dataSetKey) + 
                     " '" + JSON.stringify(req.body.cachedRunCtimes) + "'"

    var com = 'command=' + command;
    console.log(com);

    exec(command, {maxBuffer:1024*1024*1024}, (err, stdout, stderr) => {
            res.send(stdout.toString())
        })
})


app.post('(/sankey)?/getTimeseriesData',(req, res) =>{

    console.log('req.body.filepath=' + req.body.filepath );

    var filepath = sanitizepath( req.body.filepath );

    const command = "/opt/conda/bin/python3 /usr/gapps/spot/backend.py --config " + pythonconfig + " getTimeseriesData " +
                filepath;
    console.log('getTimeseriesData command=' + command);

    exec(command, {maxBuffer:1024*1024*1024}, (err, stdout, stderr) => {
            res.send(stdout.toString())
        })
})


app.post('/getTemplates', (req, res) => {

    var pathToCheck = 'lul_sept_28_timeseries';
    const command = "/opt/conda/bin/python3 /usr/gapps/spot/backend.py --config " + pythonconfig + " getTemplates " +
                    sanitizepath(pathToCheck);

    exec(command, {maxBuffer:1024*1024*1024}, (err, stdout, stderr) => {
            res.send(stdout.toString())
        })
});

app.post('(/sankey)?/getmemory',(req, res) =>{

    var filepath = sanitizepath( req.body.filepath );

    const command = "/opt/conda/bin/python3 /usr/gapps/spot/backend.py --config " + pythonconfig + " memory " +
                filepath;
    
    exec(command, {maxBuffer:1024*1024*1024}, (err, stdout, stderr) => {
            res.send(stdout.toString())
        })
})


app.post('/spotJupyter',(req, res) =>{
    const command = `/opt/conda/bin/python3 /usr/gapps/spot/backend.py --config ` + pythonconfig + ` --container jupyter '` + sanitizepath(req.body.filepath) + `'`
    console.log('spotJupyter: command=' + command);
    
    exec(command, {maxBuffer:1024*1024*1024}, (err, stdout, stderr) => {
             res.send(stdout.toString())
         })
})

app.post('/spotMultiJupyter',(req, res) =>{

    var custom_template = "";

    if( req.body.selected_notebook ) {
        custom_template += " --custom_template=" + req.body.selected_notebook;
    }

    const command = `/opt/conda/bin/python3 /usr/gapps/spot/backend.py --config ` + pythonconfig + ` --container multi_jupyter '` +
          sanitizepath(req.body.basepath) + `' '${JSON.stringify(req.body.subpaths)}'` + custom_template;

    console.log('spotMultiJupyter: command=' + command);

    exec(command, {maxBuffer:1024*1024*1024}, (err, stdout, stderr) => {
             res.send(stdout.toString())
         })
})

// Start Server
app.listen(port, () => console.log(`listening on port ${port}`))
