FROM node:18-alpine

RUN apk update && apk upgrade

# please change the following variable according to your deployment
# the current values are set for ESS environment
ARG NODE_ENV="production"
ARG BASE_URL="https://scicat.ess.eu/api/v3"
ARG FACILITY="ESS"
ARG PSS_BASE_URL="http://scicat08.esss.lu.se:32222"
ARG PSS_ENABLE=1
#
# if your deployment does not have any the search scoring services
# you should configure the PSS variables as follow:
#ARG PSS_BASE_URL=""
#ARG PSS_ENABLE=0
#

# set environment variable for node app
ENV NODE_ENV="${NODE_ENV}"
ENV BASE_URL="${BASE_URL}"
ENV FACILITY="${FACILITY}"
ENV PSS_BASE_URL="${PSS_BASE_URL}"
ENV PSS_ENABLE=${PSS_ENABLE}

# Prepare app directory
WORKDIR /home/node/app
COPY package*.json /home/node/app/
COPY .snyk /home/node/app/

# Set up local user to avoid running as root
RUN chown -R node:node /home/node/app
USER node

# Install app dependencies
RUN npm ci --only=production

# Bundle app source code
COPY --chown=node:node . /home/node/app/

# Bind to all network interfaces so that it can be mapped to the host OS
ENV HOST=0.0.0.0 PORT=3000
EXPOSE ${PORT}

# Start the app
CMD [ "node", "." ]
