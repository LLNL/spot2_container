# SPOT container

This is the container recipe for SPOT, a web-based visualization for ubiquitous performance data.  In short,
you can link the caliper performance library into an application, and every run of the application will
produce a .cali performance data file.  SPOT will then visualize the collective performance of an application
across many runs.  This could involve tracking performance changes over time, comparing the performance
achieved by different users, running scaling studies across time, etc.

This is the container recipe for SPOT, which depends on sever projects linked in via git submodules.
You should clone or checkout this project with the --recurse-submodules option.  This project can be built
with Docker or with charliecloud (which allows you to run without root).  

This SPOT container will only show .cali performance files mounted in the /data area.
You can also show test data in the /demos/mpi and /demos/test.

## Instructions for using Docker

### Build the Image

1. cd to directory with Dockerfile
2. docker build -t spot2 .

### start image

1. start web-server: 
   >docker run -v </path/to/host/data/>:/data -p 8080:8080/tcp -p 8888:8888/tcp spot2

open browser url address:
    localhost:8080

## Configuring SPOT ##

Configuration files can be optionally stored in the container in /etc/spot/.  For a persistant configuration,
mount an external directory onto /etc/spot.  There are three configuration files you may care about:

- /etc/spot/defaultpw: You can put a site-wide password on the SPOT web page that must be provided
by each user when first accessing the site.  The password is stored in a hashed form.  To generate the
file run something like:
  ``echo seespotrun | node /usr/gapps/spot/hashpw.js > /etc/spot/defaultpw``
in the container.  Substitute your own password for seespotrun.

You can alternatively provide a password at container launch.  To do so set the password in the SPOTPW
environment variable and pass it to the container with something like:
  ``SPOTPW=seespotrun docker run -e SPOTPW ....``

If no passwords are provided then the SPOT data is available to any users who connect to the web server.
Note that SPOT's Jupyter integration essentionally gives any connected user a terminal in the container.

- The web server's session key can be stored in /etc/spot/sessionkey.  This can be any relatively random
string that will be used to maintain session state across launches of the SPOT container.  To generate
a random session key you can run:
  ``node /usr/gapps/spot/gensession.js > /etc/spot/sessionkey``
in the container.

- General configuration can be set in the /etc/spot/backend_config.yaml file.  If this file doesn't exist,
SPOT will use static /usr/gapps/spot/backend_config.yaml instead.  This file can be used to point at
other versions of caliper, different Jupyter templates, or Jupyter connection information.

## Instructions for Using Charliecloud

### Build to a Directory Image:

1. cd to directory with Dockerfile
2. ch-build -t spot2 .
3. create a spot2.tar.gz 
   >ch-builder2tar spot2 .
4. Unpack new image
   >ch-tar2dir spot2.tar.gz .

Or build straight to a directory without a tarball:

2. mkdir spot2/
3. ch-build2dir -t spot2 . spot2/

### Start the Image: 

1. start web-server: 
   >ch-run ./spot2 --bind=</path/to/host/data/>:/data /usr/gapps/spot/runspot.sh

open browser url address:
    localhost:8080

## Copyright

Copyright (c) 2021, Lawrence Livermore National Security, LLC. Produced at
the Lawrence Livermore National Laboratory. LLNL-CODE-813387. All rights reserved.
