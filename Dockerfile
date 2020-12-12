################################################
FROM jupyter/minimal-notebook
USER root
WORKDIR /usr/gapps/spot
RUN sudo apt update 
RUN sudo apt install -y --fix-missing make cmake g++ nodejs npm
RUN sudo /opt/conda/bin/pip install pandas matplotlib
run sudo /opt/conda/bin/pip3 install pyyaml graphframes
RUN npm init -y
RUN npm install express
RUN mkdir /notebooks /data
COPY Caliper Caliper
RUN cd /usr/gapps/spot/Caliper \
    && mkdir build \
    && cd build \
    && cmake -DCMAKE_INSTALL_PREFIX=/usr/gapps/spot/caliper-install \
        -DCMAKE_C_COMPILER=/usr/bin/gcc \
        -DCMAKE_CXX_COMPILER=/usr/bin/c++ \
        -DWITH_GOTCHA=Off \
        .. \
    && make \
    && make install

# Hatchet
COPY hatchet hatchet_install
COPY mkhatchetlink.sh .
RUN chmod 700 mkhatchetlink.sh
RUN /usr/gapps/spot/mkhatchetlink.sh
ENV PATH="/opt/conda/bin:${PATH}"
WORKDIR /usr/gapps/spot/hatchet_install
RUN /usr/gapps/spot/hatchet_install/install.sh
WORKDIR /usr/gapps/spot

# main front-end
COPY spotfe/ static/

# Environment values for front-end 
COPY Environment.js static/web/js/
COPY spotbe/spot.py ./backend.py
COPY spotbe/templates/ templates
COPY backend_config.yaml .
COPY app.js .
COPY runspot.sh .

RUN chmod 755 runspot.sh
RUN chmod 777 /notebooks

RUN addgroup spot
RUN useradd --create-home --shell /bin/bash -g spot spot

EXPOSE 8080/tcp 8888/tcp

CMD [ "/usr/gapps/spot/runspot.sh" ]
