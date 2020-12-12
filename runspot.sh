#!/bin/bash

if [[ $UID == 0 ]] ; then
    exec sudo -u spot `realpath $0` $*
fi

node /usr/gapps/spot/app.js &
/opt/conda/bin/jupyter notebook --notebook-dir=/notebooks --NotebookApp.token="" --NotebookApp.password="" --no-browser &

wait


