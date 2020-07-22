################################################
FROM jupyter/minimal-notebook
USER root
WORKDIR /usr/gapps/spot
RUN sudo apt update 
RUN sudo apt install -y --fix-missing make cmake g++ python3 nodejs npm python3-pip
RUN pip install pandas matplotlib
RUN pip3 install pyyaml
RUN npm init -y
RUN npm install express
COPY Caliper Caliper
COPY hatchet hatchet
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
COPY spotbe/templates/ templates
COPY backend_config.yaml .
COPY app.js .
