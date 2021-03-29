// Learn cc.Class:
//  - https://docs.cocos.com/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html
const Fruit = cc.Class({
    name: 'FruitItem',
    properties: {
        id: 0, // 水果的类型
        iconSF: cc.SpriteFrame // 贴图资源
    }
});
const Juice= cc.Class({
    name: 'JuiceItem',
    properties: {
        particle: cc.SpriteFrame,
        circle: cc.SpriteFrame,
        slash: cc.SpriteFrame,
    }
});
cc.Class({
    extends: cc.Component,

    properties: {
        endNodeBG: {
            default: null,
            type: cc.Node
        },

        endNode: {
            default: null,
            type: cc.Node
        },
        fruits: {
            default: [],
            type: Fruit
        },
        juices: {
            default: [],
            type: Juice
        },
        fruitPrefab: {
            default: null,
            type: cc.Prefab
        },
        juicePrefab: {
            default: null,
            type: cc.Prefab
        },
        // todo 可以实现一个audioManager
        boomAudio: {
            default: null,
            type: cc.AudioClip
        },

        waterAudio: {
            default: null,
            type: cc.AudioClip
        },
        scoreLabel: {
            default: null,
            type: cc.Label
        },
        fingerBtn: {
            default: null,
            type: cc.Button
        }
    },

    // LIFE-CYCLE CALLBACKS:

    onLoad () {
        this.fruitPool = new cc.NodePool();
        let initCount = 2;
        for (let i = 0; i < initCount; ++i) {
            let enemy = cc.instantiate(this.fruitPrefab); // 创建节点
            this.fruitPool.put(enemy); // 通过 put 接口放入对象池
        }
        this.lastWidth = this.node.width;
        // 记录西瓜数量
        this.count = 0;
        this.score = 0

        this.isCreating = false
        this.fruitCount = 0
        this.isEnd=false


        this.useFinger = false
        // 距离上边界的位置
        this.topBound = 20;
        // 地面位置
        this.buttomBound = 20;
        this.initPhysics()
        this.initBound()
        // 监听点击事件 todo 是否能够注册全局事件
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this)
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.initOneFruit()
    },
    // 监听屏幕移动
    onTouchMove(e) {
        if (this.isCreating) {
            return;
        }

        const width = this.node.width;
        const pos = e.getLocation();
        let x;
        if (pos.x <= this.currentFruit.width / 2 || pos.x >= width - this.currentFruit.width / 2) {
            return;
        } else {
            x = pos.x - width / 2;
        }
        this.currentFruit.x = x;
    },
    // 监听屏幕点击完毕
    onTouchEnd(e){
        if (this.isCreating) return
        if (this.isEnd) {
            if (this.currentFruit) {
                this.currentFruit.removeFromParent(false);
            }
            return;
        }
        if (this.lastWidth !== this.node.width) {
            // 屏幕大小改变了，重新设置边界
            this.initBound();
        }
        this.isCreating = true
        const {width, height} = this.node

        const fruit = this.currentFruit
        const pos = e.getLocation()
        let {x, y} = pos
        x = x - width / 2
        y = y - height / 2
        fruit.x = x;

        cc.tween(fruit)
        .by(0, { position: cc.v2(0, 0) }, { easing: t => 100000 * t * t })
        .call(() => {
            // 开启物理效果
            this.startFruitPhysics(fruit)

            // 1s后重新生成一个
            this.scheduleOnce(() => {
                const nextId = this.getNextFruitId()
                this.initOneFruit(nextId)
                this.isCreating = false
            }, .75)
        }).start();
    },
    // 获取下一个水果的id
    getNextFruitId() {
        if (this.fruitCount < 3) {
            return 1
        } else if (this.fruitCount === 3) {
            return 2
        } else {
            // 随机返回前5个
            return Math.floor(Math.random() * 5) + 1
        }
        // return Math.floor(Math.random() * 5) + 1
    },
    // 合并时的动画效果
    createFruitJuice(id, pos, n) {
        // 播放合并的声音
        cc.audioEngine.play(this.boomAudio, false, 1);
        cc.audioEngine.play(this.waterAudio, false, 1);

        // 展示动画
        let juice = cc.instantiate(this.juicePrefab);
        this.node.addChild(juice);

        const config = this.juices[id - 1]
        const instance = juice.getComponent('Juice')
        instance.init(config)
        instance.showJuice(pos, n)
    },
    // 两个水果碰撞
    onSameFruitContact({self, other}) {
        other.node.off('sameContact') // 两个node都会触发，todo 看看有没有其他方法只展示一次的
        const id = other.getComponent('Fruit').id
        // todo 可以使用对象池回收
        // self.node.removeFromParent(true)
        // other.node.removeFromParent(true)
        this.fruitPool.put(self.node);
        this.fruitPool.put(other.node);
        const {x, y} = other.node

        this.createFruitJuice(id, cc.v2({x, y}), other.node.width)

        this.addScore(id)

        const nextId = id + 1
        if (nextId <= 11) {
            const newFruit = this.createFruitOnPos(x, y, nextId)

            this.startFruitPhysics(newFruit)

            // 展示动画 todo 动画效果需要调整
            newFruit.scale = 0
            cc.tween(newFruit).to(.5, {
                scale: 0.6
            }, {
                easing: "backOut"
            }).start()
        } else {
            // this.count++;
            // todo 合成两个西瓜
            console.log(' todo 合成两个西瓜 还没有实现哦~ ')
        }
    },
    // 添加得分分数
    addScore(fruitId) {
        this.score += fruitId * 2
        // todo 处理分数tween动画
        this.scoreLabel.string = this.score
    },
    startFruitPhysics(fruit) {
        fruit.getComponent(cc.RigidBody).type = cc.RigidBodyType.Dynamic
        const physicsCircleCollider = fruit.getComponent(cc.PhysicsCircleCollider)
        physicsCircleCollider.radius = fruit.height / 2
        physicsCircleCollider.apply()
    },
    // Game.js
    createOneFruit(num) {
        /*let fruit = null;
        if (this.fruitPool.size() > 0) { // 通过 size 接口判断对象池中是否有空闲的对象
            fruit = this.fruitPool.get();
        } else { // 如果没有空闲对象，也就是对象池中备用对象不够时，我们就用 cc.instantiate 重新创建
            fruit = cc.instantiate(this.fruitPrefab);
        }*/
        let fruit = cc.instantiate(this.fruitPrefab);
        // 获取到配置信息
        const config = this.fruits[num - 1]
        // 获取到节点的Fruit组件并调用实例方法
        fruit.getComponent('Fruit').init({
            id: config.id,
            iconSF: config.iconSF
        });
        fruit.getComponent(cc.RigidBody).type = cc.RigidBodyType.Static
        fruit.getComponent(cc.PhysicsCircleCollider).radius = 0

        this.node.addChild(fruit);
        fruit.scale = 0.6

        // 有Fruit组件传入
        fruit.on('sameContact', this.onSameFruitContact.bind(this))
        fruit.on('checkBound', this.onCheckBound.bind(this));
        /*fruit.on(cc.Node.EventType.TOUCH_END, (e) => {
            // 选择道具时直接消除对应水果
            if (this.useFinger && fruit !== this.currentFruit) {
                const {x, y, width} = fruit
                this.createFruitJuice(config.id, cc.v2({x, y}), width)
                e.stopPropagation()
                this.useFinger = false
                fruit.removeFromParent(true)
            }
        })*/
        return fruit
    },

    onCheckBound({ self, other }){
        setTimeout(() => {
            if (self.node.y + self.node.width / 2 > this.node.y - this.topBound) {
                console.log("超出范围啦");
                // 设置显示结束
                this.endNode.y =  0;
                this.endNodeBG.y = 0;
                this.endNode.zIndex=1000
                this.endNodeBG.zIndex=1000
                // let endMsg = this.endNode.getComponent(cc.Label);
                this.isEnd = true;
            }
        }, 1500);
    },
    // 开启物理引擎和碰撞检测
    initPhysics() {
        // 物理引擎
        const instance = cc.director.getPhysicsManager();
        instance.enabled = true;
        // instance.debugDrawFlags = 4
        instance.gravity = cc.v2(0, -1000);

        // 碰撞检测
        const collisionManager = cc.director.getCollisionManager();
        collisionManager.enabled = true
    },
    initBound() {
        // 设置四周的碰撞区域
        let width = this.node.width;
        let height = this.node.height;

        let node = new cc.Node();

        let body = node.addComponent(cc.RigidBody);
        body.type = cc.RigidBodyType.Static;

        const _addBound = (node, x, y, width, height) => {
            let collider = node.addComponent(cc.PhysicsBoxCollider);
            collider.offset.x = x;
            collider.offset.y = y;
            collider.size.width = width;
            collider.size.height = height;
        }
        //
        _addBound(node, 0, -height / 2 + this.buttomBound, width, 1);
        _addBound(node, 0, height / 2, width, 1);
        _addBound(node, -width / 2, 0, 1, height);
        _addBound(node, width / 2, 0, 1, height);

        node.parent = this.node;

    },
    // 在指定位置生成水果
    createFruitOnPos(x, y, type = 1) {
        const fruit = this.createOneFruit(type)
        fruit.setPosition(cc.v2(x, y));
        return fruit
    },
    initOneFruit(id = 1) {
        this.fruitCount++
        this.currentFruit = this.createFruitOnPos(0, 400, id)
    },
    start () {

    },

    // update (dt) {},
});
