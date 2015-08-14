function reset() {
  var i = nodes.length;
  while(i--) {
    nodes.pop();
  }
  i = links.length;
  while(i--) {
    links.pop();
  }
}

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
    return node.type === 'user' && node.page === 'hello';
  }).length;
  console.assert(n === 10);
  reset();


  prepareNodes([{page: 'hello', users: 2}, {page: 'about', users: 1}]);
  prepareNodes([{page: 'hello', users: 1}, {page: 'about', users: 2}]);
  console.assert(nodes.length === 5);
  reset();


  prepareNodes([{page: '/', users: 1}, {page: 'about', users: 1}]);
  prepareNodes([{page: '/', users: 1}, {page: 'home', users: 1}]);
  console.assert(nodes.length === 5);
  console.assert(links.length === 2);
  var n = _.filter(nodes, function(node) {
    return node.type === 'user' && node.page === 'home';
  }).length;
  console.assert(n === 1);
  reset();


  prepareNodes([{page: '/', users: 1}, {page: 'about', users: 1}]);
  prepareNodes([{page: '/', users: 1}, {page: 'home', users: 1}]);
  prepareNodes([{page: '/', users: 1}, {page: 'about', users: 1}]);
  prepareNodes([{page: 'circle', users: 1}, {page: 'home', users: 3}]);
  console.assert(nodes.length === 8);
  reset();



}

test();
