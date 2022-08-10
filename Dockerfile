################################################
FROM jupyter/minimal-notebook
USER root
WORKDIR /usr/gapps/spot
RUN apt-get update
RUN apt-get install -y --fix-missing make cmake g++ nodejs npm
RUN /opt/conda/bin/pip3 install pandas matplotlib
RUN /opt/conda/bin/pip3 install pyyaml graphframes
RUN npm init -y
COPY package*.json /usr/gapps/spot/
RUN npm install express path express-session multer body-parser cookie-parser pug bcryptjs
RUN sudo apt-get -y install python3-pip
RUN sudo pip install caliper-reader
RUN pip3 install caliper-reader
RUN sudo pip install llnl-sina
RUN pip3 install llnl-sina
RUN sudo pip install tqdm

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
COPY spotbe/RunTable.py ./RunTable.py
COPY spotbe/ErrorHandling.py ./ErrorHandling.py
COPY spotbe/CustomTemplates.py ./CustomTemplates.py
COPY spotbe/templates/ templates
COPY spotbe/demos /demos
COPY spotbe/spotdb spotdb
COPY backend_config.yaml .
COPY app.js .
COPY runspot.sh .
COPY hashpw.js .
COPY gensession.js .
COPY readconf.py .

RUN chmod 755 runspot.sh
RUN chmod 777 /notebooks

RUN addgroup spot
RUN useradd --create-home --shell /bin/bash -g spot spot

RUN mkdir -p /notebooks/spot
RUN chown spot /notebooks/spot
RUN chgrp spot /notebooks/spot
RUN chmod 0755 /notebooks/spot
RUN ln -s /demos/hatchet-ecp2021-materials /notebooks/hatchet

EXPOSE 8080/tcp 8888/tcp

CMD [ "/usr/gapps/spot/runspot.sh" ]
