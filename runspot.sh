#!/bin/bash

if [[ $UID == 0 ]] ; then
    exec sudo -u spot `realpath $0` $*
fi

jupytertoken=`tr -dc A-Za-z0-9 < /dev/urandom | head -c 16`

rm -f /tmp/jupytertoken
umask 0077
echo $jupytertoken > /tmp/jupytertoken

node /usr/gapps/spot/app.js &
/opt/conda/bin/jupyter notebook --notebook-dir=/notebooks --NotebookApp.token=$jupytertoken --NotebookApp.password="" --no-browser &

wait


