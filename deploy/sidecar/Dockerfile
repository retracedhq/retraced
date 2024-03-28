FROM node:20.10.0-alpine3.19

WORKDIR /src
ADD package.json /src
ADD package-lock.json /src
RUN npm install
# Copy the Node.js application code
ADD . /src
RUN npm run build
ENV PORT 3002
# Expose the port used by the Node.js application
EXPOSE 3002
EXPOSE 9229
CMD  ["node", "--inspect=0.0.0.0", "--enable-source-maps", "/src/build/src/ee/sidecar/index.js"]