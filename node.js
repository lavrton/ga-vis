function Node(data) {
    var that = this;
    that.view = null;
    _.each(data, function(v, k) {
        that[k] = v;
    });
    this._createView();
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
    this.view.destroy();
};


function Page(data) {
    Node.call(this, data);
    this.type = 'page';
}

Page.prototype = Object.create(Node.prototype);

Page.prototype._createView = function() {
    this.view = new Konva.Group({
        transformsEnabled: 'position',
        draggable: true
    });
    this.circle = new Konva.Circle({
        radius: 10,
        fill: 'white',
        stroke: 'white',
        opacity: 0.9,
        strokeHitEnabled: false
    });
    this.circle.fill(this.circle.colorKey);
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
        radius: 10,
        strokeWidth: 2,
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

User.prototype._createView = function() {
    this.view = new Konva.Group({
        transformsEnabled: 'position'
    });
    this.circle = new Konva.Circle({
        radius: 2,
        fill: 'yellow',
        listening: false,
        stroke: 'rgba(255, 255, 255, 0.8)',
        strokeWidth: 2
    });
    this.view.add(this.circle);
};
