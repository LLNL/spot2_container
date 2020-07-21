
build with charlieweb from :

1. cd to dir with Dockerfile
1. ch-build2dir -t spot-image . ..
1. start web-server: ch-run spot-image --bind=/home/chavez35/Desktop/spot-container/data:/data -w -- node /usr/gapps/spot/app.js
1. start jupyter:    ch-run spot-image --bind=/home/chavez35/Desktop/spot-container/data:/data -w -- /opt/conda/bin/jupyter notebook --notebook-dir=/notebooks --NotebookApp.token="" --NotebookApp.password="" --no-browser


build to tar:
1. cd to dir with Dockerfile
1. ch-build -t spot-image .
1. ch-builder2tar spot-image .   (creates a spot-image.tar.gz )



unpack image: 
    ch-tar2dir spot-image.tar.gz .

start web-server: 
    ch-run spot-image --bind=/home/chavez35/Desktop/spot-container/spot-elm/data:/data -w -- node /usr/gapps/spot/app.js

start jupyter:
    ch-run spot-image --bind=/home/chavez35/Desktop/spot-container/spot-elm/data:/data -w -- /opt/conda/bin/jupyter notebook --notebook-dir=/notebooks --NotebookApp.token="" --NotebookApp.password="" --no-browser

open browser url address:
    localhost:8080