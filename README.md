# SPOT container

## instructions using charliecloud


### build to a directory image:

1. cd to dir with Dockerfile

1. build with charliecloud
   >ch-build2dir -t spot-image . ..


### build to a tar image:

1. cd to dir with Dockerfile
1. ch-build -t spot-image .
1. create a spot-image.tar.gz 
   >ch-builder2tar spot-image .   


### unpack image: 

   >ch-tar2dir spot-image.tar.gz .

### start image: 

1. start web-server: 
   >ch-run ../spot-image --bind=</path/to/host/data/>:/data -w -- node /usr/gapps/spot/app.js 

1. start jupyter server:    
   >ch-run ../spot-image --bind=</path/to/host/data/>:/data -w -- /opt/conda/bin/jupyter notebook --notebook-dir=/notebooks --NotebookApp.token="" --NotebookApp.password="" --no-browser


open browser url address:
    localhost:8080