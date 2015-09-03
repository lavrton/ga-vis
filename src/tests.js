function test() {
    window.TEST = true;
    var user;

    prepareNodes([{page: 'hello', users: 1}])
    .then(function() {
        console.assert(nodes.length === 2);
        reset();  
    })

    .then(function() {
        return prepareNodes([{page: 'hello', users: 2}, {page: 'about', users: 1}]);
    })
    .then(function() {
        console.assert(nodes.length === 5);
        reset();
    })

    .then(function() {
        return prepareNodes([{page: 'hello', users: 1}, {page: 'about', users: 1}]);
    })
    .then(function() {
        console.assert(nodes.length === 4);
        reset();
    })

    .then(function() {
        return prepareNodes([{page: 'hello', users: 1}, {page: 'about', users: 1}]);
    })
    .then(function() {
        console.assert(nodes.length === 4);
        reset();
    })

    .then(function() {
        return prepareNodes([{page: 'hello', users: 10}, {page: 'about', users: 2}]);
    })
    .then(function() {
        console.assert(nodes.length === 14);
        var n = _.filter(nodes, function(node) {
            return node.isUser && node.page === 'hello';
        }).length;
        console.assert(n === 10);
        reset();
    })

    .then(function() {
        return prepareNodes([{page: 'hello', users: 2}, {page: 'about', users: 1}]);
    })
    .then(function() {
        return prepareNodes([{page: 'hello', users: 1}, {page: 'about', users: 2}]);
    })
    .then(function() {
        console.assert(nodes.length === 5);
        reset();
    })

    .then(function() {
        return prepareNodes([{page: '/', users: 1}, {page: 'about', users: 1}]);
    })
    .then(function() {
        return prepareNodes([{page: '/', users: 1}, {page: 'home', users: 1}]);
    })
    .then(function() {
        console.assert(nodes.length === 4);
        console.assert(links.length === 2);
        var n = _.filter(nodes, function(node) {
            return node.isUser && node.page === 'home';
        }).length;
        console.assert(n === 1);
        reset();
    })

    .then(function() {
        return prepareNodes([{page: '/', users: 1}, {page: 'about', users: 1}]);
    })
    .then(function() {
        return prepareNodes([{page: '/', users: 1}, {page: 'about', users: 1}]);
    })
    .then(function() {
        return prepareNodes([{page: 'circle', users: 1}, {page: 'home', users: 3}]);
    })
    .then(function() {
        console.assert(nodes.length === 6);
        reset();
    })

    .then(function() {
        return prepareNodes([{page: '/', users: 2}]);
    })
    .then(function() {
        return prepareNodes([{page: '/', users: 1}]);
    })
    .then(function() {
        console.assert(nodes.length === 2);
        reset();
    })

    .then(function() {
        return prepareNodes([{
              page: '/about', users: 2
          },{
              page: '/about/?query=1', users: 1
          },{
              page: '/about?query=1', users: 1
          }]);
    })
    .then(function() {
        console.assert(nodes.length === 5);
        reset();
    })

    .then(function() {
        return prepareNodes([{
            page: '/about', users: 1, device: "MOBILE"
        }]);
    })
    .then(function() {
        user = _.find(nodes, function(n) {
            return n.isUser
        });
        return user;
    })
    .then(function() {
        return prepareNodes([{
            page: '/home', users: 1, device: "MOBILE"
        }]);
    })
    .then(function() {
        console.assert(nodes.indexOf(user) > -1)
        reset();
        console.log('tests is ok!');
    }).catch(function(error) {
        console.error(error);
    });
}

// test();
