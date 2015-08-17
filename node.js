function darker(color) {
    var shift = -50;
    var c = Konva.Util.getRGB(color);
    c = {
        r: Math.max(0, c.r - shift),
        g: Math.max(0, c.g - shift),
        b: Math.max(0, c.b - shift),
    };
    return 'rgb(' + c.r + ',' + c.g + ',' + c.b + ')';
}

function Node(data) {
    var that = this;
    that.view = null;
    _.each(data, function(v, k) {
        that[k] = v;
    });
    this._createView();
    this._animateAppending();
}

Node.prototype.update = function() {
    if (this.view.isDragging()) {
        return;
    }
    var width = window.innerWidth;
    var height = window.innerHeight;
    this.view.x(Math.max(0, Math.min(width, this.x)));
    this.view.y(Math.max(0, Math.min(height, this.y)));
};

Node.prototype.destroy = function() {
    this.view.to({
        opacity: 0,
        y: -50,
        scaleX : 0,
        scaleY: 0,
        onFinish: function() {
            this.view.destroy();
        }.bind(this)
    });
};

Node.prototype._animateAppending = function () {
    this.view.opacity(0);
    this.view.to({
        opacity: 1
    });
};


function Page(data) {
    this.type = 'page';
    this.radius = 20 + Math.random() * 20;
    Node.call(this, data);

    if (this._isValuable()) {
        this.radius += 10;
    }
}

Page.prototype = Object.create(Node.prototype);

Page.prototype._isValuable = function() {
    var words = ['checkout', 'payment','registration', 'signup'];
    var contain = _.find(words, function(word) {
        return this.page.indexOf(word) > -1;
    }.bind(this));
    return !!contain;
};

Page.prototype._createView = function() {
    this.view = new Konva.Group({
        transformsEnabled: 'position',
        draggable: true
    });
    this.circle = new Konva.Circle({
        radius: this.radius,
        // fill: 'white',
        fillRadialGradientStartPoint: 0,
        fillRadialGradientStartRadius: 0,
        fillRadialGradientEndPoint: 0,
        fillRadialGradientEndRadius: this.radius,
        // fillRadialGradientColorStops: [0, 'red', 0.5, 'yellow', 1, 'blue'],
        // stroke: 'white',
        opacity: 0.7,
        strokeHitEnabled: false
    });
    var color = this.circle.colorKey;
    this.circle.fillRadialGradientColorStops([0, darker(color), 0.7, color, 1, 'rgba(0,0,255,0.3)']);
    // this.circle.fill(this.circle.colorKey);
    this.view.add(this.circle);
    this.view.on('mouseenter', this._mouseEnter.bind(this));
    this.view.on('mouseleave', this._mouseLeave.bind(this));
    this.view.on('dragstart', function() {
        this.fixed = true;
    }.bind(this));
    this.view.on('dragmove', function() {
        this.x = this.px = this.view.x();
        this.y = this.py = this.view.y();
        // this.view.getLayer().batchDraw();
    }.bind(this));
    this.view.on('dragend', function() {
        this.x = this.view.x();
        this.y = this.view.y();
        this.fixed = false;
    }.bind(this));


    this.view.cache();
};

Page.prototype._mouseEnter = function () {
    this.view.clearCache();
    var offset = 4;

    this.pageText = new Konva.Text({
        text: this.page,
        fill: 'white'
    });
    this.pageText.x(-this.pageText.width() / 2);
    this.pageText.y(-(this.circle.radius() + this.pageText.height() + offset));

    this.userNumberText = new Konva.Text({
        text: 'users: ' + this.users,
        fill: 'white'
    });
    this.userNumberText.x(-this.userNumberText.width() / 2);
    this.userNumberText.y((this.circle.radius() + offset));

    this.view.add(this.pageText, this.userNumberText);
    this.circle.to({
        radius: this.circle.radius() + 3,
        strokeWidth: this.circle.strokeWidth() + 2,
        duration: 0.2
    });
    this.view.getLayer().batchDraw();
};

Page.prototype._mouseLeave = function () {
    if (!this.pageText || !this.userNumberText) {
        return;
    }
    this.pageText.destroy();
    this.userNumberText.destroy();
    this.circle.to({
        radius: this.radius,
        duration: 0.2
    });
    this.view.getLayer().batchDraw();
};


function User(data) {
    Node.call(this, data);
    this.type = 'user';
    var directrion = Math.random() > 0.5 ? -1 : 1;
    this.speed = directrion * (Math.random() * 0.006 + 0.001);
}

User.prototype = Object.create(Node.prototype);

User.prototype.update = function () {
    Node.prototype.update.call(this);
    var maxTailLength = 15;
    var dx = this.px - this.x;
    var dy = this.py - this.y;
    var length = Math.abs(dx) + Math.abs(dy);
    if (length > maxTailLength) {
        this.tail.points([0,0, 0, 0]);
    } else if (length > maxTailLength / 2) {
        this.tail.points([0,0, dx, dy]);
    } else {
        this.tail.points([0,0, dx * 2, dy * 2]);
    }

};

User.prototype._createView = function() {
    this.view = new Konva.Group({
        transformsEnabled: 'position',
        listening: false
    });
    this.circle = new Konva.Circle({
        radius: 2,
        fill: '#a8d3e7',
        listening: false
    });
    this.tail = new Konva.Line({
        points : [],
        stroke: '#a8d3e7',
        opacity: 0.3
    });
    this.view.add(this.circle, this.tail);
};