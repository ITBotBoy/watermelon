// Learn cc.Class:
//  - https://docs.cocos.com/creator/manual/en/scripting/class.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html

cc.Class({
    extends: cc.Component,

    properties: {
        id: 0,
        knockAudio: {
            default: null,
            type: cc.AudioClip
        },
    },

    // LIFE-CYCLE CALLBACKS:
    // 实例放在可以在其他组件中调用
    init(data) {
        this.id = data.id
        // 根据传入的参数修改贴图资源
        const sp = this.node.getComponent(cc.Sprite)
        sp.spriteFrame = data.iconSF
    },
    onBeginContact(contact, self, other) {
        // 检测到是两个相同水果的碰撞
        if (self.node && other.node) {
            const s = self.node.getComponent('Fruit');
            const o = other.node.getComponent('Fruit');
            if(s && !o && other.node.group==='ground' && !this.isPlaying){
                this.isPlaying=true
                cc.audioEngine.play(this.knockAudio, false,1)
            }
            if (s && o && s.id === o.id) {
                self.node.emit('sameContact', {self, other});
            }else {
                self.node.emit('checkBound', { self, other });
            }
        }
    },
    onLoad () {
        this.isPlaying=false
    },
    // start () {},

    // update (dt) { },
});
