<template>
  <div class="game flexc s100">
    <nav class="flex w100">
      <el-button type="danger" @click="leave" icon="el-icon-back">离开</el-button>
      <span>观战人数：<b>{{watcherNum}}</b></span>
    </nav>
    <section class="flex">
      <div class="board" :style="{width: borderSize,height: borderSize}">
        <del v-for="i in 15" :style="computeLine(i)"></del>
        <del v-for="i in 15" :style="computeColumn(i)"></del>
        <span v-for="chess in this.myPos" :style="computePos(chess[0], chess[1])" :class="color"></span>
        <span v-for="chess in this.enemyPos" :style="computePos(chess[0], chess[1])"
              :class="color==='white'?'black':'white'"></span>
        <span v-show="canHover" :style="computePos(...hoverPos)" :class="color" class="hover"></span>
        <div v-if="!isWatch" class="s100"
             @mousemove="mouseMove"
             @mouseleave="hoverPos=[-1, -1]"
             @click="mouseClick"
        ></div>
      </div>
      <div class="menu flexc">
        <div v-for="[name, turnTo] in [[gameInfo.me, gameInfo.turnTo], [gameInfo.enemy, !gameInfo.turnTo]]">
          {{name}}{{turnTo}}
        </div>
      </div>
    </section>
  </div>
</template>

<script lang="ts">
import {injectMixin} from "../../store";
import {defineComponent} from "vue";
import {ElMessage, ElMessageBox} from "element-plus";
import {post} from "../../utils/http";
import {throttle} from "../../utils/utils";

export default defineComponent({
  name: "index",
  mixins: [injectMixin],
  props: {
    isWatch: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      padding: 40,
      borderNum: 15,
      interval: 50,
      chessSize: 40,
      watcherNum: 0,
      mouseMove: ()=>{},
      color: 'black' as 'white' | 'black',

      myPos: [] as number[][],
      enemyPos: [] as number[][],
      hoverPos: [-1, -1],
      gameOver: false
    }
  },
  computed: {
    canHover(): boolean {
      return !this.isWatch && this.gameInfo.turnTo && this.hoverPos[0] > -1
    },
    borderSize(): string {
      return this.interval * (this.borderNum - 1) + this.padding * 2 + 'px'
    },
    lineSize(): string {
      return this.interval * (this.borderNum - 1) + 'px'
    },
  },
  async created() {
    const create = this.gameInfo.create;
    if (this.gameInfo.secret || (this.isWatch && create)) {
      this.socket.listenUpdate(this.chessUpdate);
      this.socket.listenWatcherChange(this.watcherChange);
      this.socket.listenEnd(this.gameEnd);
      if (this.isWatch) {
        // get period table
        const result = await post('watch_table', {create}) as Record<string, any>;
        if (result) {
          this.setGameInfo({
            me: result.player1.nick,
            enemy: result.player2.nick,
          });
          this.myPos = result.player1.piece;
          this.enemyPos = result.player2.piece;
          this.watcherNum = result.watch;
          this.socket.joinRoom(create, result.secret);
        }
      }
    } else {
      ElMessage({
        type: 'error',
        showClose: true,
        message: '还未加入游戏!'
      })
    }
    this.mouseMove = throttle((e: MouseEvent)=>{
      const {offsetX, offsetY} = e;
      const originX = offsetX - this.padding + this.interval / 2;
      const originY = offsetY - this.padding + this.interval / 2;
      const x = Math.floor(originX / this.interval);
      const y = Math.floor(originY / this.interval);
      if ([x, y].some(v => v < 0 || v >= 15) ||
          Math.abs((originX - (this.interval - this.chessSize) / 2) % this.interval) > this.chessSize ||
          Math.abs((originY - (this.interval - this.chessSize) / 2) % this.interval) > this.chessSize ||
          [...this.myPos, ...this.enemyPos].some(pos => pos[0] === x && pos[1] === y)
      ) {
        return this.hoverPos = [-1, -1];
      }
      this.hoverPos = [x, y];
    })
  },
  beforeUnmount() {
    this.mouseMove = null;
  },
  methods: {
    async leave() {
      if (this.isWatch) {
        this.socket.leaveRoom();
      } else if (!this.gameOver) {
        try {
          await ElMessageBox.confirm('中途退出，游戏将直接结束', {
            type: 'warning',
            confirmButtonText: '退出',
            cancelButtonText: '取消',
          })
        } catch {
          return
        }
        this.socket.leaveRoom();
      }
      await this.$router.push('/');
    },
    chessUpdate(data: Record<string, any>) {
      const pos: number[] | undefined = data.pos;
      const turnTo = this.gameInfo.turnTo;
      if (pos instanceof Array) {
        this.setGameInfo({
          turnTo: !turnTo
        });
        (turnTo ? this.myPos : this.enemyPos).push(pos);
      }
    },
    watcherChange (data: Record<string, any>) {
      const num = data.num;
      if (typeof num === 'number'){
        this.watcherNum = num
      }
    },
    gameEnd(data: Record<string, any>) {
      const type = data.type;
      const isWatch = this.isWatch;
      const isHost = this.gameInfo.isHost;
      let msg = '';
      switch (type) {
        case 0:
          msg = isWatch ? '玩家离开了游戏!' : '对手离开了游戏!';
          break
        case 1:
        case 2:
          msg = isWatch ? '游戏结束!' : isHost===type?'你获胜了!':'你输了!';
          break
        case -1:
          msg = '打成平手!';
          break
      }
      this.setGameInfo({
        turnTo: false
      });
      this.gameOver = true;
      ElMessageBox.confirm(msg, {
        confirmButtonText: '返回到游戏列表',
        cancelButtonText: '我知道了',
      }).then(() => {
        this.$router.push('/')
      }).catch(() => {

      })
    },

    // ---------------------------------------------
    computeLine(idx: number): Record<string, any> {
      return {
        height: '1px',
        width: this.lineSize,
        left: this.padding + 'px',
        top: this.padding + (idx - 1) * this.interval + 'px'
      }
    },
    computeColumn(idx: number): Record<string, any> {
      return {
        width: '1px',
        height: this.lineSize,
        top: this.padding + 'px',
        left: this.padding + (idx - 1) * this.interval + 'px'
      }
    },
    computePos(x: number, y: number): Record<string, any> {
      return {
        width: this.chessSize + 'px',
        height: this.chessSize + 'px',
        top: y * this.interval - this.chessSize / 2 + this.padding + 'px',
        left: x * this.interval - this.chessSize / 2 + this.padding + 'px',
      }
    },
    mouseClick() {
      if (this.gameInfo.turnTo) {
        if (this.hoverPos[0] > -1) {
          this.socket.putChess(this.hoverPos);
        }
      }
    }
  }
})
</script>

<style scoped lang="scss">
.game{
  nav{
    margin: 20px 0;
    justify-content: center;
    position: relative;
    button{
      position: absolute;
      left: 0;
    }
  }
  .board{
    background: #ffe5b5;
    position: relative;
    *{
      position: absolute;
      background: black;
    }
    del{
      display: block;
    }
    span{
      border-radius: 50%;
      &.black{
        background: black;
        box-shadow: 0 1px 6px rgb(0, 0, 0, 0.6);
        overflow: hidden;
        &:before{
          content: "";
          display: block;
          position: absolute;
          width: 2px;
          height: 2px;
          background: transparent;
          border-radius: 50%;
          top: 3px;
          left: 3px;
          box-shadow: 0 0 18px 15px white;
        }
      }
      &.white{
        background: white;
        box-shadow: -2px -2px 9px rgb(0, 0, 0, 0.4) inset, 0 2px 4px rgb(0, 0, 0, 0.6)
      }
      &.hover{
      }
    }
    div{
      background: transparent;
    }
  }
  .menu{
  }
}
</style>
