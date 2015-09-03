var ID;
var FACKED = false;

gapi.analytics.ready(function() {

    var CLIENT_ID = '322251229813-7hvtgir3i6u47sputh7q1ekab251sddt.apps.googleusercontent.com';

    gapi.analytics.auth.authorize({
      container: 'auth-button',
      clientid: CLIENT_ID
    });

    var viewSelector = new gapi.analytics.ViewSelector({
      container: 'view-selector'
    });

    gapi.analytics.auth.on('success', function(response) {
      viewSelector.execute();
    });

    viewSelector.on('change', function(ids) {
        ID = ids;
        run(ids);
    });
});


// PREPARE STAGE
var stage = new Konva.Stage({
    container: 'canvas'
});
var layer = new Konva.Layer();
stage.add(layer);

function updateStageSize() {
    var width = window.innerWidth;
    var height = window.innerHeight;
    stage.size({width:width, height:height});
}
window.addEventListener('resize', updateStageSize);
updateStageSize();






var nodes = [];
var links = [];


// SETUP CORE PHYSICS
var force = d3.layout.force()
    .nodes(nodes)
    .links(links)
    .size([window.innerWidth, window.innerHeight])
    .gravity(0.05)
    // .distance(100)
    .linkDistance(function(d) {
        return d.source.radius + 5;
    })
    .charge(-26)
    .friction(0.85)
    .on('tick', tick)
    .on('end', function() {force.start(); })
    .start();

window.addEventListener('resize', function updateForceSize() {
    force.size([window.innerWidth, window.innerHeight]);
});



function tick(e) {
  // rotate stars around planets
  links.forEach(function(link) {
      var planet = link.source;
      var star = link.target;
      var dx = star.x - planet.x;
      var dy = star.y - planet.y;

      var radius = Math.sqrt(dx * dx + dy * dy);

      // do nothing if start to far away...
      if (radius > force.linkDistance() * 2) {
          return;
      }
      var angle = Math.atan2(dy, dx);
      angle += star.speed;

      star.x = radius * Math.cos(angle) + planet.x;
      star.y = radius * Math.sin(angle) + planet.y;
  });

  // redraw each object
  nodes.forEach(function(o) {
    o.update();
  });
  stage.batchDraw();
}


// MAIN FUNCTION
// IT UPDATES OLD STATE FROM NEW STATE

function prepareNodes(data) {
    console.log('mergig new data');
    breakLastChain();
    var planets, freeUsers;
    var promise = new Promise(function(resolve) {
        resolve();
    })
    // 1. add new planets if required
    .then(function() {
        data.forEach(function(row) {
            var pageNode = nodes.filter(function(node) {
                return node.page === row.page && node.type !== 'user';
            })[0];
            if (!pageNode) {
                pageNode = new Page({
                    page: row.page
                });
                layer.add(pageNode.view);
                nodes.push(pageNode);
            }
        });

        planets = nodes.filter(function(node) {
            return !node.isUser;
        });
        freeUsers = [];
        return delay(200);
    })
    // reset user count
    // and clear link for planets without users
    .then(function() {
        _.forEach(planets, function(planet) {
            planet.users = 0;
            var planetDatas = _.filter(data, function(row) {
                return planet.page === row.page;
            });
            planetDatas.forEach(function(planetData) {
                planet.users += planetData.users;
            });
            if (planet.users === 0) {
                var usersNearPlanet = _.filter(nodes, function(node){
                    return node.isUser === true &&
                        node.page === planet.page;
                });
                freeUsers = freeUsers.concat(usersNearPlanet);
                // unlink users
                usersNearPlanet.forEach(function(user) {
                    var link = _.find(links, function(l) {
                        return l.source === planet && l.target === user;
                    });
                    _.pullAt(links, links.indexOf(link));
                });
            }
        });
        force.start();
        return delay(200);
    })
    // 2. unlink users from pages if they gone away
    .then(function() {
        planets.forEach(function(planetNode) {
            var planetDatas = _.filter(data, function(row) {
                return row.page === planetNode.page;
            });
            planetDatas.forEach(function(planetData) {
                var newUsersNumber = planetData ? planetData.users : 0;

                var usersNearPlanet = _.filter(nodes, function(node){
                    return node.isUser === true &&
                        node.page === planetNode.page &&
                        node.type === planetData.type &&
                        node.device === planetData.device;
                });

                for(var i = newUsersNumber; i < usersNearPlanet.length; i++) {
                    var userNode = usersNearPlanet[i];
                    if (usersNearPlanet) {
                        var link = _.find(links, function(l) {
                            return l.source === planetNode && l.target === userNode;
                        });
                        if (link) {
                            _.pullAt(links, links.indexOf(link));
                            freeUsers.push(userNode);
                        }
                    } else {
                        break;
                    }
                }
            });
        });
        force.start();
        return delay(1000);
    })
    // 3. link free users to another page or create new user
    .then(function() {
        planets.forEach(function(planetNode) {
            var planetDatas = _.filter(data, function(row) {
                return row.page === planetNode.page;
            });
            planetDatas.forEach(function(planetData) {
                var newUsersNumber = planetData ? planetData.users : 0;
                var usersNearPlanet = _.filter(nodes, function(node){
                    return node.isUser === true &&
                        node.page === planetNode.page &&
                        node.type === planetData.type &&
                        node.device === planetData.device;
                });
                for(var i = usersNearPlanet.length; i < newUsersNumber; i++ ) {
                    var userNode = _.find(freeUsers, function(freeUser) {
                        return  freeUser.type === planetData.type &&
                                freeUser.device === planetData.device;
                    });

                    if (userNode) {
                        _.pullAt(freeUsers, freeUsers.indexOf(userNode));
                        userNode.page = planetNode.page;
                        links.push({source: planetNode, target: userNode});
                    } else {
                        userNode = new User({
                            page: planetNode.page,
                            isUser: true,
                            type: planetData.type,
                            device: planetData.device
                        });
                        layer.add(userNode.view);
                        nodes.push(userNode);
                        links.push({
                            source: planetNode, target: userNode
                        });
                    }
                }
            });
        });
        force.start();
        return delay(3000);
    })
    // remove free users and planets without users
    .then(function() {

        freeUsers.forEach(function(userNode) {
            userNode.destroy();
            _.pullAt(nodes, nodes.indexOf(userNode));
        });

        planets.forEach(function(planet) {
            if (planet.users === 0) {
                planet.destroy();
                _.pullAt(nodes, nodes.indexOf(planet));
            }
        });
        force.start();
    })
    .catch(function(error) {
        console.error(error);
    })

    return promise;
}

function render(state) {
  if (state.data instanceof Array) {
      var data = _.map(state.data, function(row) {
        return {
            type: row[0],
            page : row[1],
            device: row[2],
            users: parseInt(row[3])
        };
      });
      prepareNodes(data);
      var pagesNumber = state.data.length;
      force.gravity(pagesNumber * 0.0005 + 0.01);
      force.start();
  }

}

var updateTimeout;
function update(state) {
    if (state.updatesNumberLeft === -1) {
        return;
    }
    if (state._timeToNextUpdate === 0 || state._timeToNextUpdate === state.delay) {
        state._timeToNextUpdate = state.delay;
        getData(state, function(data) {
            state.data = data;
            render(state);
            state.updatesNumberLeft -=1;
        });
    }
    state._timeToNextUpdate -= 1000;
    console.log('time to next update', state._timeToNextUpdate);
    updateTimeout = setTimeout(update.bind(null, state), 1000);
}


function getData(state, cb) {
    if (!FACKED) {
        gapi.client.analytics.data.realtime.get({
            ids: ID,
            metrics: state.metrics,
            dimensions: state.dimensions
        }).execute(function(result) {
            cb(result.rows || 'looks like no users on site...');
        });
    } else {
        cb(generateData());
    }
}

function run() {
  clearTimeout(updateTimeout);
  reset();
  var delay = 15000;
  var state = {
    data : {},
    delay: delay,
    _timeToNextUpdate: delay,
    updatesNumberLeft: 20,
    metrics: 'rt:activeUsers',
    dimensions: 'rt:userType,rt:pagePath,rt:deviceCategory'
  };
  update(state);
}

d3.select('#fake').on('change', function() {
    FACKED = this.checked;
    run();
});


function reset() {
  var i = nodes.length;
  while(i--) {
    nodes.pop().destroy();
  }
  i = links.length;
  while(i--) {
    links.pop();
  }
}


 function generateData() {
     var PAGES = 5;
     var USERS = 4;
     // reset();
     var data = [];
     var types = ['NEW', 'RETURNING'];
     var devices = ['DESKTOP', 'MOBILE', 'TABLET'];
     var pages = _.times(PAGES, function() {
         return 'https://example.com/page/' + Math.round(Math.random() * PAGES);
     })
     _.each(devices, function(device) {
        _.each(pages, function(page) {
            data.push([
            /*type*/ _.sample(types),
            /*page*/ page,
            /*device:*/ device,
            /*users*/ Math.round(Math.random() * USERS)
             ]);
        });
     });
     for (var i = 0; i < PAGES; i++) {

   }
   return data;
 }


var TIMEOUT;
function delay(timeout) {
    return new Promise(function(resolve) {
        if (window.TEST) {
            timeout = 0;
        }
        TIMEOUT = setTimeout(resolve, timeout);
    });
}

function breakLastChain() {
    clearTimeout(TIMEOUT);
}
