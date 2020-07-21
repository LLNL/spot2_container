################################################
FROM jupyter/minimal-notebook
USER root
WORKDIR /usr/gapps/spot
RUN apt update 
RUN apt install -y make cmake g++ python3 nodejs npm
RUN pip install pandas matplotlib
RUN npm init -y
RUN npm install express
COPY Caliper Caliper
COPY hatchet hatchet
# COPY templates/ templates
RUN mkdir /notebooks /data
RUN cd /usr/gapps/spot/Caliper \    && mkdir build \
    && cd build \
    && cmake -DCMAKE_INSTALL_PREFIX=/usr/gapps/spot/caliper-install \
        -DCMAKE_C_COMPILER=/usr/bin/gcc \
        -DCMAKE_CXX_COMPILER=/usr/bin/c++ \
        -DWITH_GOTCHA=Off \
        .. \
    && make \
    && make install

# main front-end
COPY dcvis/ static/

# Environment values for front-end 
COPY Environment.js static/web/js/
COPY spotbe/spot.py ./backend.py
COPY app.js .
