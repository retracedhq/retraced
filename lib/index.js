'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const _ = require('lodash');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Needed for Kubernetes health checks
app.get('/healthy', (req, res) => {
  res.send('');
});

app.post('/v1/user/signup', (req, res) => {
  const lambdaEvent = getLambdaEvent(req);
  require('../userCreate').default(lambdaEvent, {}, (err, body) => {
    if (err) {
      sendError(err, res);
      return;
    }
    res.send(body);
  });
});

app.post('/v1/user/login', (req, res) => {
  const lambdaEvent = getLambdaEvent(req);
  require('../userLogin').default(lambdaEvent, {}, (err, body) => {
    if (err) {
      sendError(err, res);
      return;
    }
    res.send(body);
  });
});

app.get('/v1/projects', (req, res) => {
  const lambdaEvent = getLambdaEvent(req);
  require('../listProjects').default(lambdaEvent, {}, (err, body) => {
    if (err) {
      sendError(err, res);
      return;
    }
    res.send(body);
  });
});

app.post('/v1/project', (req, res) => {
  const lambdaEvent = getLambdaEvent(req);
  require('../createProject').default(lambdaEvent, {}, (err, body) => {
    if (err) {
      sendError(err, res);
      return;
    }
    res.send(body);
  });
});

app.get('/v1/project/:projectId', (req, res) => {
  const lambdaEvent = getLambdaEvent(req);
  require('../getProject').default(lambdaEvent, {}, (err, body) => {
    if (err) {
      sendError(err, res);
      return;
    }
    res.send(body);
  });
});

app.post('/v1/project/:projectId/events/search', (req, res) => {
  const lambdaEvent = getLambdaEvent(req);
  require('../searchEvents').default(lambdaEvent, {}, (err, body) => {
    if (err) {
      sendError(err, res);
      return;
    }
    res.send(body);
  });
});

app.post('/v1/project/:projectId/events/search/deep', (req, res) => {
  const lambdaEvent = getLambdaEvent(req);
  require('../deepSearch').default(lambdaEvent, {}, (err, body) => {
    if (err) {
      sendError(err, res);
      return;
    }
    res.send(body);
  });
});

app.post('/v1/project/:projectId/events/bulk', (req, res) => {
  const lambdaEvent = getLambdaEvent(req);
  require('../getEventsBulk').default(lambdaEvent, {}, (err, body) => {
    if (err) {
      sendError(err, res);
      return;
    }
    res.send(body);
  });
});

app.get('/v1/project/:projectId/team', (req, res) => {
  const lambdaEvent = getLambdaEvent(req);
  require('../listTeam').default(lambdaEvent, {}, (err, body) => {
    if (err) {
      sendError(err, res);
      return;
    }
    res.send(body);
  });
});

app.post('/v1/project/:projectId/event', (req, res) => {
  const lambdaEvent = getLambdaEvent(req);
  require('../createEvent').default(lambdaEvent, {}, (err, body) => {
    if (err) {
      sendError(err, res);
      return;
    }
    res.send(body);
  });
});

app.post('/v1/project/:projectId/environment', (req, res) => {
  const lambdaEvent = getLambdaEvent(req);
  require('../createEnvironment').default(lambdaEvent, {}, (err, body) => {
    if (err) {
      sendError(err, res);
      return;
    }
    res.send(body);
  });
});

app.post('/v1/project/:projectId/token', (req, res) => {
  const lambdaEvent = getLambdaEvent(req);
  require('../createApiToken').default(lambdaEvent, {}, (err, body) => {
    if (err) {
      sendError(err, res);
      return;
    }
    res.send(body);
  });
});

app.post('/v1/viewersession', (req, res) => {
  const lambdaEvent = getLambdaEvent(req);
  require('../viewerSession').default(lambdaEvent, {}, (err, body) => {
    if (err) {
      sendError(err, res);
      return;
    }
    res.send(body);
  });
});

app.get('/v1/viewer/:projectId/events/search', (req, res) => {
  const lambdaEvent = getLambdaEvent(req);
  require('../viewerEvents').default(lambdaEvent, {}, (err, body) => {
    if (err) {
      sendError(err, res);
      return;
    }
    res.send(body);
  });
});

app.post('/v1/viewer/:projectId/events/bulk', (req, res) => {
  const lambdaEvent = getLambdaEvent(req);
  require('../viewerGetEventsBulk').default(lambdaEvent, {}, (err, body) => {
    if (err) {
      sendError(err, res);
      return;
    }
    res.send(body);
  });
});

app.post('/v1/viewer/:projectId/events/bulk', (req, res) => {
  const lambdaEvent = getLambdaEvent(req);
  require('../viewerGetEventsBulk').default(lambdaEvent, {}, (err, body) => {
    if (err) {
      sendError(err, res);
      return;
    }
    res.send(body);
  });
});

app.post('/v1/viewer/:projectId/events/search/deep', (req, res) => {
  const lambdaEvent = getLambdaEvent(req);
  require('../viewerDeepSearch').default(lambdaEvent, {}, (err, body) => {
    if (err) {
      sendError(err, res);
      return;
    }
    res.send(body);
  });
});

app.get('/v1/project/:projectId/objects', (req, res) => {
  const lambdaEvent = getLambdaEvent(req);
  require('../listObjects').default(lambdaEvent, {}, (err, body) => {
    if (err) {
      sendError(err, res);
      return;
    }
    res.send(body);
  });
});

app.get('/v1/project/:projectId/actors', (req, res) => {
  const lambdaEvent = getLambdaEvent(req);
  require('../listActors').default(lambdaEvent, {}, (err, body) => {
    if (err) {
      sendError(err, res);
      return;
    }
    res.send(body);
  });
});

app.post('/v1/project/:projectId/invite', (req, res) => {
  const lambdaEvent = getLambdaEvent(req);
  require('../createInvite').default(lambdaEvent, {}, (err, body) => {
    if (err) {
      sendError(err, res);
      return;
    }
    res.send(body);
  });
});

app.get('/v1/invite', (req, res) => {
  const lambdaEvent = getLambdaEvent(req);
  require('../getInvite').default(lambdaEvent, {}, (err, body) => {
    if (err) {
      sendError(err, res);
      return;
    }
    res.send(body);
  });
});

app.post('/v1/invite/accept', (req, res) => {
  const lambdaEvent = getLambdaEvent(req);
  require('../acceptInvite').default(lambdaEvent, {}, (err, body) => {
    if (err) {
      sendError(err, res);
      return;
    }
    res.send(body);
  });
});

app.get('/v1/project/:projectId/event/:eventId', (req, res) => {
  const lambdaEvent = getLambdaEvent(req);
  require('../getEvent').default(lambdaEvent, {}, (err, body) => {
    if (err) {
      sendError(err, res);
      return;
    }
    res.send(body);
  });
});

app.get('/v1/project/:projectId/actions', (req, res) => {
  const lambdaEvent = getLambdaEvent(req);
  require('../listActions').default(lambdaEvent, {}, (err, body) => {
    if (err) {
      sendError(err, res);
      return;
    }
    res.send(body);
  });
});

app.get('/v1/project/:projectId/actor/:actorId', (req, res) => {
  const lambdaEvent = getLambdaEvent(req);
  require('../getActor').default(lambdaEvent, {}, (err, body) => {
    if (err) {
      sendError(err, res);
      return;
    }
    res.send(body);
  });
});

app.get('/v1/project/:projectId/action/:actionId', (req, res) => {
  const lambdaEvent = getLambdaEvent(req);
  require('../getAction').default(lambdaEvent, {}, (err, body) => {
    if (err) {
      sendError(err, res);
      return;
    }
    res.send(body);
  });
});

app.put('/v1/project/:projectId/action/:actionId', (req, res) => {
  const lambdaEvent = getLambdaEvent(req);
  require('../updateAction').default(lambdaEvent, {}, (err, body) => {
    if (err) {
      sendError(err, res);
      return;
    }
    res.send(body);
  });
});

app.get('/v1/project/:projectId/viewertoken', (req, res) => {
  const lambdaEvent = getLambdaEvent(req);
  require('../viewerToken').default(lambdaEvent, {}, (err, body) => {
    if (err) {
      sendError(err, res);
      return;
    }
    res.send(body);
  });
});

app.listen(3000, () => {
  console.log('Example app listening on port 3000!');
});

function getLambdaEvent(req) {
  const lambdaEvent = {
    body: req.body,
    path: req.params,
    headers: req.headers,
    query: req.query,
  };

  if (_.has(lambdaEvent.headers, 'authorization')) {
    lambdaEvent.headers.Authorization = lambdaEvent.headers.authorization;
    delete lambdaEvent.headers.authorization;
  }
  return lambdaEvent;
}

function sendError(err, res) {
  let errorStatusCode = 500;
  const errorMessage = (err.message || err).toString();
  const re = /\[(\d{3})\]/;
  const found = errorMessage.match(re);
  if (found && found.length > 1) {
    errorStatusCode = parseInt(found[1], 10);
  }

  res.status(errorStatusCode).send(errorMessage);
}
