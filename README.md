# SPOT container

This is the container recipe for SPOT, a web-based visualization for ubiquitous performance data.  In short,
you can link the caliper performance library into an application, and every run of the application will
produce a .cali performance data file.  SPOT will then visualize the collective performance of an application
across many runs.  This could involve tracking performance changes over time, comparing the performance
achieved by different users, running scaling studies across time, etc.

This is the container recipe for SPOT, which depends on sever projects linked in via git submodules.
You should clone or checkout this project with the --recurse-submodules option.  This project can be built
with Docker or with charliecloud (which allows you to run without root).  

This SPOT container will only show .cali performance files mounted in the /data area.  Use relative
paths when selecting subdirectories in /data, not absolute paths.

Note that this container image is not secure.  Do not expose the ports opened outside of the local machine.

## Instructions for Using Charliecloud

### Build to a Directory Image:

1. cd to directory with Dockerfile
2. ch-build -t spot2 .
3. create a spot2.tar.gz 
   >ch-builder2tar spot2 .
4. Unpack new image
   >ch-tar2dir spot2.tar.gz .

Or build straight to a directory without a tarball:

2. ch-build2dir -t spot2 . spot2/

### Start the Image: 

1. start web-server: 
   >ch-run ./spot2 --bind=</path/to/host/data/>:/data -w -- node /usr/gapps/spot/app.js 

2. start jupyter server:    
   >ch-run ./spot2 --bind=</path/to/host/data/>:/data -w -- /opt/conda/bin/jupyter notebook --notebook-dir=/notebooks --NotebookApp.token="" --NotebookApp.password="" --no-browser

open browser url address:
    localhost:8080

## Instructions for using Docker

### Build the Image

1. cd to directory with Dockerfile
2. docker build -t spot2 .

### start image

1. start web-server: 
   >docker run -v </path/to/host/data/>:/data -p 8080:8080/tcp -p 8888:8888/tcp spot2

open browser url address:
    localhost:8080


## Copyright

Copyright (c) 2020, Lawrence Livermore National Security, LLC. Produced at
the Lawrence Livermore National Laboratory. Written by Matthew LeGendre
'legendre1 at llnl dot gov'. LLNL-CODE-813387. All rights reserved.
