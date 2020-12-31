#!/bin/bash

if [[ $UID == 0 ]] ; then
    exec sudo --preserve-env=SPOTPW -u spot `realpath $0` $*
fi

jupytertoken=`tr -dc A-Za-z0-9 < /dev/urandom | head -c 16`

/opt/conda/bin/jupyter notebook --notebook-dir=/notebooks --NotebookApp.token=$jupytertoken --NotebookApp.password="" --no-browser &
JUPYTERPID=$!
export JUPYTERSERVER=`/opt/conda/bin/jupyter --runtime-dir`/nbserver-$JUPYTERPID.json

echo $SPOTPW | node /usr/gapps/spot/app.js &

wait


