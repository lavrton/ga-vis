function test() {
  prepareNodes([{page: 'hello', users: 1}]);
  console.assert(nodes.length === 2);
  reset();


  prepareNodes([{page: 'hello', users: 2}, {page: 'about', users: 1}]);
  console.assert(nodes.length === 5);
  reset();

  prepareNodes([{page: 'hello', users: 1}, {page: 'about', users: 1}]);
  console.assert(nodes.length === 4);
  reset();

  prepareNodes([{page: 'hello', users: 10}, {page: 'about', users: 2}]);
  console.assert(nodes.length === 14);
  var n = _.filter(nodes, function(node) {
    return node.isUser && node.page === 'hello';
  }).length;
  console.assert(n === 10);
  reset();


  prepareNodes([{page: 'hello', users: 2}, {page: 'about', users: 1}]);
  prepareNodes([{page: 'hello', users: 1}, {page: 'about', users: 2}]);
  console.assert(nodes.length === 5);
  reset();


  prepareNodes([{page: '/', users: 1}, {page: 'about', users: 1}]);
  prepareNodes([{page: '/', users: 1}, {page: 'home', users: 1}]);
  console.assert(nodes.length === 4);
  console.assert(links.length === 2);
  n = _.filter(nodes, function(node) {
    return node.isUser && node.page === 'home';
  }).length;
  console.assert(n === 1);
  reset();


  prepareNodes([{page: '/', users: 1}, {page: 'about', users: 1}]);
  prepareNodes([{page: '/', users: 1}, {page: 'home', users: 1}]);
  prepareNodes([{page: '/', users: 1}, {page: 'about', users: 1}]);
  prepareNodes([{page: 'circle', users: 1}, {page: 'home', users: 3}]);
  console.assert(nodes.length === 6);
  reset();

  prepareNodes([{page: '/', users: 2}]);
  prepareNodes([{page: '/', users: 1}]);
  console.assert(nodes.length === 2);
  reset();

  prepareNodes([{
      page: '/about', users: 2
  },{
      page: '/about/?query=1', users: 1
  },{
      page: '/about?query=1', users: 1
  }]);
  console.assert(nodes.length === 5);
  reset();
}

var PAGES = 10;
var USERS = 50;
function generateData() {
  // reset();
  var data = [];
  var types = ['NEW', 'RETURNING'];
  var devices = ['DESKTOP', 'MOBILE', 'TABLET'];
  for (var i = 0; i < PAGES; i++) {
    data.push({
      page : 'page with long links so be ready' + i,
      users: Math.round(Math.random() * USERS),
      type: _.sample(types),
      device: _.sample(devices),
    });
  }
  prepareNodes(data);
  force.gravity(PAGES * 0.0005 + 0.01);
  force.start();
}

test();


// var pagesInput = document.getElementById('pagesInput');
// var gravityInput = document.getElementById('gravityInput');
// var chargeInput = document.getElementById('chargeInput');
//
// pagesInput.addEventListener('input', updateParams);
// gravityInput.addEventListener('input', updateParams);
// chargeInput.addEventListener('input', updateParams);
//
// function updateParams() {
//   PAGES = parseInt(pagesInput.value);
//   force.charge(-200 * parseInt(chargeInput.value) / 100);
//   force.gravity(PAGES * 0.01 * parseInt(gravityInput.value) / 100 + 0.01);
//   generateData();
// }
