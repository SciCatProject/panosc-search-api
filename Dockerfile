FROM node:16-alpine

RUN apk update && apk upgrade


# set environment variable for node app
ENV NODE_ENV="production"
ENV BASE_URL="https://scicat.ess.eu/api/v3"
ENV FACILITY="ESS"
ENV PSS_BASE_URL="http://scicat08.esss.lu.se:32222"
ENV PSS_ENABLE=1

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
