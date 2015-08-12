gapi.analytics.ready(function() {

    var CLIENT_ID = '32030338980-jop5s699r3elkk1p0k17ceeugbqkka0n.apps.googleusercontent.com';

    gapi.analytics.auth.authorize({
      container: 'auth-button',
      clientid: CLIENT_ID,
    });

    var viewSelector = new gapi.analytics.ViewSelector({
      container: 'view-selector'
    });

    gapi.analytics.auth.on('success', function(response) {
      viewSelector.execute();
    });

    viewSelector.on('change', function(ids) {
        run(ids);
    });
});


var container = document.getElementById('data');

function render(state) {
  container.innerHTML = JSON.stringify(state, null, 2);
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
  gapi.client.analytics.data.realtime.get({
    ids:state.ids,
    metrics:state.metrics,
    dimensions:state.dimensions
  }).execute(function(result) {
    console.log(result);
    cb(result.rows || 'looks like no users on site...')
  });
}

function run(ids) {
  clearTimeout(updateTimeout);
  var delay = 5;
  var state = {
    data : {},
    ids: ids,
    delay: delay,
    timeLeft: delay,
    updateTimeLeft: 5,
    metrics: "rt:activeUsers",
    dimensions:"rt:pagePath"
  };
  update(state);
}
