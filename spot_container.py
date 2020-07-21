#! /usr/gapps/spot/venv_python/bin/python3
import argparse, json, sys, os, subprocess, getpass, urllib.parse, socket, time
from datetime import datetime

CONFIG = { 'caliquery': '/usr/gapps/spot/caliper-install/bin/cali-query'
         , 'template_notebook': '/usr/gapps/spot/templates/TemplateNotebook_hatchet-v1.0.0-singlecali.ipynb'
         , 'multi_template_notebook': '/usr/gapps/spot/templates/TemplateNotebook_hatchet-v1.0.0-manycali.ipynb'
         }

def _sub_call(cmd): 
    # call a subcommand in a new process and parse json results into object
    return json.loads(subprocess.check_output(cmd).decode('utf-8'))

def _cali_to_json(filepath):

    cali_json = _sub_call([CONFIG['caliquery'] , '-q', 'format json(object)', filepath])
    return cali_json

def defaultKey(filepath):
    records = _cali_to_json(filepath)['records']
    key = (list(records[0].keys())[0])
    return key

def multi_jupyter(args):

    # create notebook in ~/spot_jupyter dir

    #  - first create directory
    cali_path = args.cali_filepath
    cali_keys = args.cali_keys.split(' ')
    ntbk_dir = os.path.expanduser('~/spot_jupyter')

    try:
      os.mkdir(ntbk_dir)
    except: pass

    #  - copy template (replacing CALI_FILE_NAME)
    #metric_name = defaultKey(str(cali_path))  
    path = cali_path[ cali_path.rfind('/')+1:cali_path.rfind(".") ]
    path = "combo"

    line_strs = '"CALI_FILES = [ '
    loop0 = 0
    first_metric_name = ""

    for i in cali_keys:
        full_c_path = cali_path + '/' + i
        metric_name = defaultKey(str(full_c_path))  

        if loop0 == 0:
            first_metric_name = metric_name

        dira = cali_path + '/' + i
        line_strs = line_strs + '\\n { \\"cali_file\\": \\"' + dira + '\\", \\"metric_name\\": \\"' + metric_name + '\\"}, '
        loop0 = loop0 + 1


    line_strs = line_strs + '\\n]\\n"'

    ntbk_path = os.path.join(ntbk_dir, path + '.ipynb')
    ntbk_template_str = open(CONFIG['multi_template_notebook']).read().replace('MUTLI_CALI_FILES', line_strs ).replace('CALI_METRIC_NAME', str(first_metric_name))
    print('ntbok_path', ntbk_path)
    print('ntbok_template_str', ntbk_template_str)

    open(ntbk_path, 'w').write(ntbk_template_str)
    #print( cali_path )

    # return Jupyterhub address
    rz_or = "rz" if socket.gethostname().startswith('rz') else ""
    end_path = urllib.parse.quote(os.path.basename(ntbk_path))

    print('https://{}lc.llnl.gov/jupyter/user/{}/notebooks/spot_jupyter/{}'.format( rz_or, getpass.getuser(), end_path ))

def jupyter(args):

    # create notebook in ~/spot_jupyter dir

    #  - first create directory
    cali_path = args.cali_filepath
    isContainer = args.container

    if isContainer:
        metric_name = defaultKey('/data/' + str(cali_path))
        (ntbk_path, ntbk_name) = os.path.split(os.path.join('/notebooks', cali_path[:cali_path.rfind(".") ] + '.ipynb'))

        ntbk_template_str = open(CONFIG['template_notebook']).read().replace('CALI_FILE_NAME', '/data/' + str(cali_path)).replace('CALI_METRIC_NAME', str(metric_name))

        os.makedirs(ntbk_path,exist_ok=True)

        open(os.path.join(ntbk_path, ntbk_name), 'w').write(ntbk_template_str)
        print('succesfully made notebook')

    else: 
        ntbk_dir = os.path.expanduser('~/spot_jupyter')
        try:
            os.mkdir(ntbk_dir)
        except: pass

        metric_name = defaultKey(str(cali_path))  

        ntbk_name = cali_path[ cali_path.rfind('/')+1:cali_path.rfind(".") ] + '.ipynb'
        ntbk_path = os.path.join(ntbk_dir, ntbk_name)
        ntbk_template_str = open(CONFIG['template_notebook']).read().replace('CALI_FILE_NAME', str(cali_path)).replace('CALI_METRIC_NAME', str(metric_name))

        open(ntbk_path, 'w').write(ntbk_template_str)

        # return Jupyterhub address
        rz_or = "rz" if socket.gethostname().startswith('rz') else ""
        end_path = urllib.parse.quote(os.path.basename(ntbk_path))

        print('https://{}lc.llnl.gov/jupyter/user/{}/notebooks/spot_jupyter/{}'.format( rz_or, getpass.getuser(), end_path ))



        


def _prependDir(dirpath, fnames):
    return [os.path.join(dirpath, fname) for fname in fnames]


def _getAdiakType(run, global_):
    try: return run['attributes'][global_]["adiak.type"]
    except: return None

def _getAllDatabaseRuns(dbFilepath: str, lastRead: int):
    if dbFilepath.endswith('.yaml'):
        import yaml
        import mysql.connector
        dbConfig = yaml.load(open(dbFilepath), Loader=yaml.FullLoader)
        mydb = mysql.connector.connect(**dbConfig)
        db_placeholder = "%s"
    else:
        import sqlite3
        mydb = sqlite3.connect(dbFilepath)
        db_placeholder = "?"

    cursor = mydb.cursor()

    # get runs
    runs = {}
    runNum = int(lastRead)
    cursor.execute('SELECT run, globals, records FROM Runs Where run > ' + db_placeholder, (runNum,))
    for (runNum, _globals, record) in cursor:
        runData = {}
        for rec in json.loads(record):
            funcpath = rec.pop('path', None)
            if funcpath:
                runData[funcpath] = rec
        runGlobals = json.loads(_globals)
        runs[runNum] = {'Globals': runGlobals, 'Data': runData}

    # get global meta
    cursor.execute('SELECT name, datatype FROM Metadata')
    runGlobalMeta = {name: {'type': datatype} for (name, datatype) in cursor if datatype is not None}

    return { 'Runs': runs
           # 'RunDataMeta': runNum
           , 'RunGlobalMeta': runGlobalMeta
           , 'RunSetMeta': {'LastReadPosix': runNum}
           }

def _getAllCaliRuns(filepath, subpaths):
    import multiprocessing

    cali_json = multiprocessing.Pool(18).map( _cali_to_json, _prependDir(filepath, subpaths))

    # process all new files to transfer to front-end
    runs = {}
    runDataMeta = {}
    runGlobalMeta = {}

    for (subpath, run) in zip(subpaths, cali_json):

        runData = {}
        runGlobals = {}

        # get runData and runDataMeta
        for record in run['records']:
            funcpath = record.pop('path', None)
            if funcpath:
                runData[funcpath] = record
        for metricName in list(runData.items())[0][1]:
            runDataMeta[metricName] = {'type': run['attributes'][metricName]["cali.attribute.type"]}

        # get runGlobals and runGlobalMeta
        for (global_, val) in run['globals'].items():
            adiakType = _getAdiakType(run, global_)
            if adiakType:
                runGlobals[global_] = val
                runGlobalMeta[global_] = {'type': adiakType}

        # collect run
        runs[subpath] = { 'Data': runData
                      , 'Globals': runGlobals 
                      }

    # output new data
    return { 'Runs': runs
           , 'RunDataMeta': runDataMeta
           , 'RunGlobalMeta': runGlobalMeta
           }

def _getAllJsonRuns(filepath, subpaths):
    output = {}
    runs = {}
    for subpath in subpaths:
        data = json.load(open(os.path.join(filepath, subpath)))
        commits = data.pop('commits')
        title = data.pop('title')
        yAxis = data.pop('yAxis')
        show_exclusive = data.pop('show_exclusive')
        series = data.pop('series')
        dates = [str(int(datetime.strptime(date, '%a %b %d %H:%M:%S %Y\n').timestamp())) for date in data.pop('XTics')]
        runSetName = subpath[0:subpath.find('.json')]

        for i in range(len(dates)):
            runs[runSetName + '-' + str(i)] = { 'Globals': { 'launchdate': dates[i]
                                                           , 'commit': commits[i]
                                                           , 'title': title
                                                           }  
                                              , 'Data': {} 
                                              }


        for funcpath, values in data.items():
            for value in values:
                runs[runSetName + '-' + str(value[0])]['Data']['main'] = {yAxis: 0}
                runs[runSetName + '-' + str(value[0])]['Data']['main/'+funcpath] = {yAxis: value[1]}




    return { 'Runs': runs
           , 'RunDataMeta': {yAxis: {'type': 'double'}}
           , 'RunGlobalMeta': { 'launchdate': {'type': 'date'}
                              , 'commit': {'type': 'string'}
                              }
           }


def getData(args):
    dataSetKey = args.dataSetKey
    lastRead = args.lastRead or 0
    cachedRunCtimes = json.loads(args.cachedRunCtimes)
        # {subpath: cachedCtime}

    output = {}

    # sql database
    if dataSetKey.endswith(('.yaml', '.sqlite')):
        output = _getAllDatabaseRuns(dataSetKey, lastRead)

    # file directory
    else:
        lastReadTime = float(lastRead)

        # get subpaths of data files that were added since last read time
        newRuns = []
        jsonSubpaths = []
        runCtimes = {}
        for (dirpath, dirnames, filenames) in os.walk(dataSetKey):
            for fname in filenames:
                fp = os.path.join(dirpath, fname)
                newCtime = os.stat(fp).st_ctime
                runKey = fp.split(dataSetKey + '/')[1]

                if fname.endswith('.cali'): 
                    runCtimes[runKey] = newCtime
                    if newCtime > cachedRunCtimes.get(runKey, 0):
                        newRuns.append(runKey)
                if fname.endswith('.json'):
                        jsonSubpaths.append(runKey)

        deletedRuns = set(cachedRunCtimes.keys()).difference(set(runCtimes.keys()))


        if jsonSubpaths: 
            output = _getAllJsonRuns(dataSetKey, jsonSubpaths)
        if newRuns: 
            output = _getAllCaliRuns(dataSetKey, newRuns)

        output['deletedRuns'] = list(deletedRuns)
        output['runCtimes'] = runCtimes

    json.dump(output, sys.stdout, indent=4)


def getRun(runId, db=None):
    # sql database
    if db:
        if db.endswith('.yaml'):
            import yaml
            import mysql.connector
            dbConfig = yaml.load(open(db), Loader=yaml.FullLoader)
            mydb = mysql.connector.connect(**dbConfig)
            db_placeholder = "%s"
        else:
            import sqlite3
            mydb = sqlite3.connect(db)
            db_placeholder = "?"

        cursor = mydb.cursor()

        # get run
        cursor.execute('SELECT globals, records FROM Runs Where run = ' + db_placeholder, (runId,))
        rec = next(cursor)
        runGlobals = json.loads(rec[0])
        runData = json.loads(rec[1])
        output = {'records': runData, 'globals': runGlobals}

    # .cali file directory
    else:
        output = _cali_to_json(runId)
        del output['attributes']
    return output


def getHatchetLiteral(runId, db=None):
    funcPathDict = {line.pop('path'): line for line in getRun(runId, db)['records'] if line.get('path', None)}

    def buildTree(nodeName):
        node = {}
        node['name'] = nodeName.split('/')[-1]
        node['metrics'] = funcPathDict[nodeName]
        childrenPaths = [childPath for childPath in funcPathDict.keys() 
                         if len(childPath.split('/')) == len(nodeName.split('/')) + 1 and childPath.startswith(nodeName)]
        if childrenPaths:
            node['children'] = [buildTree(childPath) for childPath in childrenPaths]
        return node

    return [buildTree(min(funcPathDict.keys()))]


if __name__ == "__main__":  

    # argparse
    parser = argparse.ArgumentParser(description="utility to access data from .cali files/directory or database")
    parser.add_argument("--config", help="filepath to yaml config file")
    subparsers = parser.add_subparsers(dest="sub_name")


    jupyter_sub = subparsers.add_parser("jupyter")
    jupyter_sub.add_argument("cali_filepath", help="create a notebook to check out a sweet cali file")
    jupyter_sub.add_argument("--container", action="store_true", help="use if running container version of spot")
    jupyter_sub.set_defaults(func=jupyter)

    multi_jupyter_sub = subparsers.add_parser("multi_jupyter")
    multi_jupyter_sub.add_argument("cali_filepath", help="create a notebook to check out a sweet cali file")
    multi_jupyter_sub.add_argument("cali_keys", help="cali filenames used to construct the multi jupyter")
    multi_jupyter_sub.set_defaults(func=multi_jupyter)

    getData_sub = subparsers.add_parser("getData")
    getData_sub.add_argument("dataSetKey",  help="directory path of files, or yaml config file")
    getData_sub.add_argument("cachedRunCtimes",  help="list of subpaths with timestamps")
    getData_sub.add_argument("--lastRead",  help="posix time with decimal for directories, run number for database")
    getData_sub.set_defaults(func=getData)

    getRun_sub = subparsers.add_parser("getRun")
    getRun_sub.add_argument("runId",  help="filepath or db run number")
    getRun_sub.add_argument("--db",  help="yaml config file, or sqlite DB")
    getRun_sub.set_defaults(func=lambda args: json.dump(getRun(args.runId, args.db), sys.stdout, indent=4))

    args = parser.parse_args()
    if args.config:
        import yaml
        CONFIG.update(yaml.load(open(args.config), Loader=yaml.FullLoader))
    args.func(args)

    
    
   
