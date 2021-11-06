#!/bin/bash

if [[ -r /etc/spot/backend_config.yaml ]] ; then
    CONFIGFILE=/etc/spot/backend_config.yaml
else
    CONFIGFILE=/usr/gapps/spot/backend_config.yaml
fi

USE_JUPYTERHUB=`/opt/conda/bin/python3 /usr/gapps/spot/readconf.py $CONFIGFILE use_jupyterhub`

if [[ $UID == 0 ]] ; then
    if [[ x$USE_JUPYTERHUB == "xTrue" || x$USE_JUPYTERHUB == "xtrue" ]] ; then
        JUPYTERCONF_OPT=
        if [[ -f /etc/jupyterhub/jupyterhub_config.py ]] ; then
            JUPYTERCONF_OPT="-f /etc/jupyterhub/jupyterhub_config.py"
        fi
        jupyterhub $JUPYTERCONF_OPT &
    fi
    
    exec sudo --preserve-env=SPOTPW -u spot `realpath $0` $*
fi

cd /usr/gapps/spot

if [[ x$USE_JUPYTERHUB == "x" || x$USE_JUPYTERHUB == "xFalse" || x$USE_JUPYTERHUB == "xfalse" ]] ; then
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

  JUPYTER_BASE_URL=`/opt/conda/bin/python3 /usr/gapps/spot/readconf.py $CONFIGFILE jupyter_base_url`
  if [[ x$JUPYTER_BASE_URL != "x" && x$JUPYTER_BASE_URL != "xNone" ]]; then
      JUPYTER_BASE_URL_ARG="--NotebookApp.base_url=$JUPYTER_BASE_URL"
  else
      JUPYTER_BASE_URL_ARG=""
  fi

  /opt/conda/bin/jupyter notebook --notebook-dir=/notebooks $JUPYTER_TOKEN_ARG $JUPYTER_PORT_ARG $JUPYTER_BASE_URL_ARG --NotebookApp.password="" --no-browser &
  JUPYTERPID=$!
  export JUPYTERSERVER=`/opt/conda/bin/jupyter --runtime-dir`/nbserver-$JUPYTERPID.json
fi

SPOT_BASE_URL=`/opt/conda/bin/python3 /usr/gapps/spot/readconf.py $CONFIGFILE spot_base_url`
if [[ x$SPOT_BASE_URL != "x" ]] ; then
    export SPOTBASEURL=$SPOT_BASE_URL
fi

echo $SPOTPW | node /usr/gapps/spot/app.js &

wait


