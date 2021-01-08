#!/bin/bash

if [[ $UID == 0 ]] ; then
    exec sudo --preserve-env=SPOTPW -u spot `realpath $0` $*
fi

if [[ -r /etc/spot/backend_config.yaml ]] ; then
    CONFIGFILE=/etc/spot/backend_config.yaml
else
    CONFIGFILE=/usr/gapps/spot/backend_config.yaml
fi

cd /usr/gapps/spot
JUPYTER_PORT=`/opt/conda/bin/python3 /usr/gapps/spot/readconf.py $CONFIGFILE jupyter_port`
if [[ x$JUPYTER_PORT != "x0" && x$JUPYTER_PORT != "x" && x$JUPYTER_PORT != "xNone" ]]; then
    JUPYTER_PORT_ARG="--port $JUPYTER_PORT"
else
    JUPYTER_PORT_ARG=""
fi

JUPYTER_USE_TOKEN=`/opt/conda/bin/python3 /usr/gapps/spot/readconf.py $CONFIGFILE jupyter_use_token`
if [[ x$JUPYTER_USE_TOKEN == "xTrue" ]] ; then
    JUPYTER_TOKEN=`/opt/conda/bin/python3 /usr/gapps/spot/readconf.py $CONFIGFILE jupyter_token`
    if [[ x$JUPYTER_TOKEN == "x" || x$JUPYTER_TOKEN == "xNone" ]] ; then
        JUPYTER_TOKEN=`tr -dc A-Za-z0-9 < /dev/urandom | head -c 16`
    fi
    JUPYTER_TOKEN_ARG="--NotebookApp.token=$JUPYTER_TOKEN"
else
    JUPYTER_TOKEN_ARG="--NotebookApp.token="
fi

/opt/conda/bin/jupyter notebook --notebook-dir=/notebooks $JUPYTER_TOKEN_ARG $JUPYTER_PORT_ARG --NotebookApp.password="" --no-browser &
JUPYTERPID=$!
export JUPYTERSERVER=`/opt/conda/bin/jupyter --runtime-dir`/nbserver-$JUPYTERPID.json

echo $SPOTPW | node /usr/gapps/spot/app.js &

wait


