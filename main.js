// gapi.analytics.ready(function() {
//
//     var CLIENT_ID = '32030338980-jop5s699r3elkk1p0k17ceeugbqkka0n.apps.googleusercontent.com';
//
//     gapi.analytics.auth.authorize({
//       container: 'auth-button',
//       clientid: CLIENT_ID,
//     });
//
//     var viewSelector = new gapi.analytics.ViewSelector({
//       container: 'view-selector'
//     });
//
//     gapi.analytics.auth.on('success', function(response) {
//       viewSelector.execute();
//     });
//
//     viewSelector.on('change', function(ids) {
//         run(ids);
//     });
// });


// var container = document.getElementById('data');

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






// var canvas = document.getElementById('canvas');
// canvas.width = width;
// canvas.height = height;
// var context = canvas.getContext('2d');

var nodes = [];
var links = [];


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
    .on("tick", tick)
    .on('end', function() {force.start();})
    .start();

window.addEventListener('resize', function updateForceSize() {
    force.size([window.innerWidth, window.innerHeight]);
});


function tick(e) {

  // turn stars
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

  nodes.forEach(function(o, i) {
    o.update();
  });
  stage.draw();
}

function prepareNodes(data) {
    // 0 clear query data like about/?query=1
    var newdata = [];
    data.forEach(function(row) {
        var page = row.page.split("?")[0];
        if (page[page.length - 1] === '/' && page.length > 1) {
            page = page.slice(0, page.length - 1);
        }
        row.page = page;
    });

    // join same rows
    var checked = [];
    data.forEach(function(row) {
        var same = _.find(checked, function(r) {
            return  r.page === row.page &&
                    r.type === row.type &&
                    r.device === row.device;
        });
        if (same) {
            same.users += row.users;
        } else {
            checked.push(row);
        }
    });
    data = checked;

    //

    // 1. add new planets if required
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

    var planets = nodes.filter(function(node) {
        return !node.isUser;
    });
    var freeUsers = [];
    // reset user count
    // and clear link for planets without users
    setTimeout(function() {
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
    }, 200);


    // 2. unlink users from pages if they gone away
    setTimeout(function() {
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
    }, 400);

    // 3. link free users to another page or create new user
    setTimeout(function() {

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
                        return freeUser.page === planetNode.page &&
                            freeUser.type === planetData.type &&
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
    }, 1500);

    setTimeout(function() {

        // 4. remove free unlinked users
        freeUsers.forEach(function(userNode) {
            userNode.destroy();
            _.pullAt(nodes, nodes.indexOf(userNode));
        });

        // 5. remove pages without user
        planets.forEach(function(planet) {
            if (planet.users === 0) {
                planet.destroy();
                _.pullAt(nodes, nodes.indexOf(planet));
            }
        });
        force.start();
    }, 2500);
}

function render(state) {
  // container.innerHTML = JSON.stringify(state, null, 2);
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
  if (state.updateTimeLeft === -1) {
    return;
  }
  if (state.timeLeft === 0 || state.timeLeft === state.delay) {
    state.timeLeft = state.delay;
    getData(state, function(data) {
      state.data = data;
      render(state);
      state.updateTimeLeft -=1;
    });
  }
  state.timeLeft -=1;
  render(state);
  updateTimeout = setTimeout(update.bind(null, state), 3000);
}


function getData(state, cb) {
    // gapi.client.analytics.data.realtime.get({
    //     ids:state.ids,
    //     metrics:state.metrics,
    //     dimensions:state.dimensions
    // }).execute(function(result) {
    //     cb(result.rows || 'looks like no users on site...');
    // });
    var url = getParameterByName('url');
    if (!url) {
        cb([]);
        return;
    }
    loadJSON(url, function(result) {
        if (result.columnHeaders.length === 2) {
            var rows = _.map(result.rows || [], function(row) {
                return ['NEW', row[0], 'DESKTOP', row[1]];
            });
            cb(rows);
        } else {
            cb(result.rows || []);
        }
    });
}

function run(ids) {
  clearTimeout(updateTimeout);
  reset();
  var delay = 5;
  var state = {
    data : {},
    ids: ids,
    delay: delay,
    timeLeft: delay,
    updateTimeLeft: 99999999,
    metrics: "rt:activeUsers",
    dimensions:"rt:pagePath"
  };
  update(state);
}

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

 run();


 function loadJSON(path, success, error)
 {
     var xhr = new XMLHttpRequest();
     xhr.onreadystatechange = function()
     {
         if (xhr.readyState === XMLHttpRequest.DONE) {
             if (xhr.status === 200) {
                 if (success)
                     success(JSON.parse(xhr.responseText));
             } else {
                 if (error)
                     error(xhr);
             }
         }
     };
     xhr.open("GET", path, true);
     xhr.send();
 }

 function getParameterByName(name) {
     name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
     var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
         results = regex.exec(location.search);
     return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
 }
