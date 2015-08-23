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
    this.radius = 20 + Math.random() * 5;
    Node.call(this, data);
    if (this._isValuable()) {
        this.radius += 15;
        this._createView();
    }


}

Page.prototype = Object.create(Node.prototype);

Page.prototype.destroy = function () {
    Node.prototype.destroy.call(this);
    if (this.selected) {
        hideDetails();
    }
    // explose!!!!
    this.view.clearCache();
    this.view.children[0].to({
        scaleX: 3,
        scaleY: 3,
    });
};

Page.prototype.update = function () {
    Node.prototype.update.call(this);
    if (this.userNumberText) {
        this.userNumberText.text('Users: ' + this.users);
    }
};
Page.prototype._isValuable = function() {
    var words = getParameterByName('words') || '';
    words = words.split(',');

    var contain = _.find(words, function(word) {
        return this.page.indexOf(word) > -1;
    }.bind(this));

    return !!contain;
};

Page.prototype._createView = function() {
    // delete previous view
    this.view && this.view.destroy();

    // create new
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
    this.circle.fillRadialGradientColorStops([0, darker(color), 0.8, color, 1, 'rgba(0,0,0,0.3)']);
    // this.circle.fill(this.circle.colorKey);
    this.view.add(this.circle);

    this.view.on('click tap', this._showDetails.bind(this));

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

Page.prototype._showDetails = function () {
    if (this.selected) {
        return;
    }
    hideDetails();
    this.selected = true;
    this.view.clearCache();
    var offset = 4;

    this.pageText = new Konva.Text({
        text: 'Page: ' + this.page,
        fontSize: 15,
        fill: 'white'
    });

    this.pageText.x(layer.getWidth() - this.pageText.width() - offset);
    this.pageText.y(offset);

    this.userNumberText = new Konva.Text({
        text: 'Users: ' + this.users,
        fontSize: 15,
        fill: 'white'
    });

    this.userNumberText.x(layer.getWidth() - this.userNumberText.width() - offset);
    this.userNumberText.y(offset + this.pageText.height() + offset);

    layer.add(this.pageText, this.userNumberText);
    this.circle.to({
        radius: this.circle.radius(),
        strokeWidth: 2,
        stroke: 'white',
        duration: 0.2
    });
    this.view.getLayer().batchDraw();
};

var background = new Konva.Shape({
    opacity: 0.01,
    sceneFunc: function(ctx) {
        ctx.beginPath();
        ctx.rect(0,0, this.getLayer().getWidth(), this.getLayer().getHeight());
        ctx.closePath();
        ctx.fillStrokeShape(this);
    }
});

layer.add(background);
background.on('click tap', hideDetails);

function hideDetails() {
    var node = _.find(nodes, function(node) {
        return node.selected;
    });

    if (!node) {
        return;
    }
    node.hideDetails();
}

Page.prototype.hideDetails = function () {
    this.selected = false;
    if (!this.pageText || !this.userNumberText) {
        return;
    }
    this.pageText.destroy();
    this.userNumberText.destroy();
    this.userNumberText = null;
    this.circle.to({
        stroke: 'rgba(0,0,0,0)',
        strokeWidth: 0,
        duration: 0.2,
        onFinish: function() {
            this.view.remove();
            this.view.cache();
            layer.add(this.view);
        }.bind(this)
    });
    this.view.getLayer().batchDraw();
};


function User(data) {
    Node.call(this, data);
    this.isUser = true;
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
    if (this.device === 'DESKTOP') {
        this.circle.fill('#e3935f');
    } else if (this.device === 'TABLET'){
        this.circle.fill('#64bbe3');
    } else {
        this.circle.fill('#7ce267');
    }
    // if (this.selected) {
    //     var scale = 1.5;
    //     layer.x(-this.x + (layer.width() / 2 * scale));
    //     layer.y(-this.y + (layer.height() / 2 * scale));
    //     layer.scaleX(scale);
    //     layer.scaleY(scale);
    // }

};

User.prototype._createView = function() {
    this.view = new Konva.Group({
        transformsEnabled: 'position',
        listening: false
    });
    this.circle = new Konva.Circle({
        radius: 2,
        fill: '#a8d3e7',
        // listening: false,
    });
    // this.hit = new Konva.Circle({
    //     radius: 5,
    //     fill: 'rgba(100,100,100,0.5)',
    // });
    this.tail = new Konva.Line({
        points : [],
        stroke: '#a8d3e7',
        opacity: 0.3
    });
    this.view.add(this.circle, this.tail);
    this.view.on('click tap', function() {
        this.selected = true;
    }.bind(this));
};
