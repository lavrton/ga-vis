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

// var fontSize = 5;
// var maxChars = 23;
// function drawPage(context, data) {
//   var title = data.page;
//
//   if (title.length > maxChars) {
//     title = title.slice(0, maxChars - 5) + '..' + title.slice(title.length - 3, title.length);
//   }
//   context.beginPath();
//   context.arc(data.x, data.y, title.length * fontSize / 2 + 4, 0, 2 * Math.PI);
//   context.closePath();
//   context.fillStyle = 'white';
//   context.fill();
//   context.fillStyle = 'grey';
//   context.fillText(title, data.x - title.length * fontSize / 2.2, data.y + fontSize / 2);
// }
//
// function drawUser(context, data) {
//   context.beginPath();
//   context.arc(data.x, data.y, 3, 0, 2 * Math.PI);
//   context.closePath();
//   context.fillStyle = 'yellow';
//   context.fill();
// }

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
        return node.type !== 'user';
    });
    var freeUsers = [];

    // 2. unlink users from pages if they gone away
    planets.forEach(function(planetNode) {
        var planetData = _.find(data, function(row) {
            return row.page === planetNode.page;
        });
        var newUsersNumber = planetData ? planetData.users : 0;
        planetNode.users = newUsersNumber;

        var usersNearPlanet = _.filter(nodes, function(node){
            return node.type === 'user' && node.page === planetNode.page;
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

    // 3. link free users to another page or create new user
    planets.forEach(function(planetNode) {
        var planetData = _.find(data, function(row) {
            return row.page === planetNode.page;
        });
        var newUsersNumber = planetData ? planetData.users : 0;
        var usersNearPlanet = _.filter(nodes, function(node){
            return node.type === 'user' && node.page === planetNode.page;
        });
        for(var i = usersNearPlanet.length; i < newUsersNumber; i++ ) {
            var userNode = _.pullAt(freeUsers, freeUsers.length - 1)[0];
            if (userNode) {
                userNode.page = planetNode.page;
                links.push({source: planetNode, target: userNode});
            } else {
                userNode = new User({page: planetNode.page, type: 'user'});
                layer.add(userNode.view);
                nodes.push(userNode);
                links.push({
                    source: planetNode, target: userNode
                });
            }
        }
    });

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
}

function render(state) {
  // container.innerHTML = JSON.stringify(state, null, 2);
  if (state.data instanceof Array) {
      var data = _.map(state.data, function(row) {
        return {page : row[0], users: parseInt(row[1])};
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
  updateTimeout = setTimeout(update.bind(null, state), 1000);
}


function getData(state, cb) {
    // gapi.client.analytics.data.realtime.get({
    //     ids:state.ids,
    //     metrics:state.metrics,
    //     dimensions:state.dimensions
    // }).execute(function(result) {
    //     cb(result.rows || 'looks like no users on site...');
    // });
    var url = window.location.search.replace("?url=", "");
    if (!url) {
        cb([]);
        return;
    }
    loadJSON(url, function(result) {
        cb(result.rows || 'looks like no users on site...');
    });
}

function run(ids) {
  clearTimeout(updateTimeout);
  reset();
  var delay = 15;
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

 // loadJSON('https://tbbtco.appspot.com/query?id=aghzfnRiYnRjb3IVCxIIQXBpUXVlcnkYgICAgICAgAoM', console.log.bind(console));
