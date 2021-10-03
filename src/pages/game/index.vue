<template>
  <div class="game s100">
    <nav class="flex w100">
      <el-button type="danger" @click="leave" icon="el-icon-back">离开</el-button>
      <span>观战人数：<b>{{watcherNum}}</b></span>
    </nav>
    <section :style="{height: borderSize}">
    <div>
      <div class="board" :style="{width: borderSize}">
        <del v-for="i in 15" :style="computeLine(i)"></del>
        <del v-for="i in 15" :style="computeColumn(i)"></del>
        <a v-for="pos in [[3, 3], [3, 11], [7, 7], [11, 3], [11, 11]]" :style="{left: pos[0]*interval+padding+'px', top: pos[1]*interval+padding+'px'}"></a>
        <span v-for="chess in myPos" :style="computePos(chess[0], chess[1])" :class="color"></span>
        <span v-for="chess in enemyPos" :style="computePos(chess[0], chess[1])"
              :class="color==='white'?'black':'white'"></span>
        <span v-show="canHover" :style="computePos(...hoverPos)" :class="color" class="hover"></span>
        <div v-if="!isWatch" class="s100"
             @mousemove="mouseMove"
             @mouseleave="hoverPos=[-1, -1]"
             @click="mouseClick"
             :style="{cursor: canHover?'grab':'not-allowed'}"
        ></div>
      </div>
      <div class="menu flexc">
        <div class="player flex">
          <img :src="avatars[gameInfo.enemyAvatar]"/>
          <div class="flexc">
            <h4>{{gameInfo.enemy}}</h4>
            <label class="flex">
              <el-icon :size="20">
                <alarm-clock />
              </el-icon>
              <span :style="{color: !gameInfo.turnTo&&clock<=5?'red':'black'}">{{computeClock(!gameInfo.turnTo)}}</span>
            </label>
          </div>
        </div>
        <div class="msg flexc">
          <b class="flex">请勿发布不良信息!</b>
          <div class="msg-box flexc">
            <p v-for="msg in msgBox">
              <b>{{msg.nick}}:</b><span>{{msg.msg}}</span>
            </p>
          </div>
          <el-autocomplete :fetch-suggestions="querySearch" class="send" maxlength="20" show-word-limit v-model="msgSend" @select="msgSend=$event" placeholder="发送聊天">
            <template #append><el-button type="primary" :disabled="gameOver || !msgSend" @click="sendMsg">发送</el-button></template>
            <template #default="{ item }">
              <p>{{ item }}</p>
            </template>
          </el-autocomplete>
        </div>
        <div class="player flex">
          <img :src="avatars[gameInfo.meAvatar]"/>
          <div class="flexc">
            <h4>{{gameInfo.me}}</h4>
            <label class="flex">
              <el-icon :size="20">
                <alarm-clock />
              </el-icon>
              <span :style="{color: gameInfo.turnTo&&clock<=5?'red':'black'}">{{computeClock(gameInfo.turnTo)}}</span>
            </label>
          </div>
        </div>
      </div>
    </div>
    </section>
  </div>
</template>

<script lang="ts">
import {injectMixin} from "../../store";
import {defineComponent} from "vue";
import {ElMessage, ElMessageBox, MessageType} from "element-plus";
import {post} from "../../utils/http";
import {avatars, throttle} from "../../utils/utils";
import {AlarmClock} from "@element-plus/icons";

export default defineComponent({
  name: "index",
  components: {AlarmClock},
  mixins: [injectMixin],
  props: {
    isWatch: {
      type: Boolean,
      default: false
    }
  },
  setup() {
    const links = [
      '快点啊，我等得花都谢了',
      '你是GG还是MM',
      '不要走，决战到天亮!',
    ];

    const querySearch = (queryString: string, cb: Function) => {
      const results = queryString
          ? links.filter(v => v.toLowerCase().indexOf(queryString.toLowerCase()) === 0)
          : links;
      cb(results)
    }
    return {querySearch}
  },
  data() {
    return {
      avatars,
      padding: 40,
      borderNum: 15,
      interval: 50,
      chessSize: 40,
      watcherNum: 0,
      color: 'black' as 'white' | 'black',

      myPos: [] as number[][],
      enemyPos: [] as number[][],
      hoverPos: [-1, -1],
      clock: 0,
      clockHandle: null as number|null,
      msgSend: '',
      msgBox: [] as Record<'msg'|'nick', any>[],
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
    this.color = this.gameInfo.isHost === 1 ? 'black':'white';
    if (this.gameInfo.secret || (this.isWatch && create)) {
      this.socket.listenUpdate(this.chessUpdate);
      this.socket.listenWatcherChange(this.watcherChange);
      this.socket.listenMsgUpdate(this.msgUpdate);
      this.socket.listenEnd(this.gameEnd);
      this.startClock();
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
        // 计时
        this.startClock();
      }
    },
    watcherChange (data: Record<string, any>) {
      const num = data.num;
      if (typeof num === 'number'){
        this.watcherNum = num
      }
    },
    msgUpdate (data: Record<string, any>) {
      const {nick, msg} = data;
      this.msgBox.push({nick, msg});
    },
    gameEnd(data: Record<string, any>) {
      const type = data.type;
      const isWatch = this.isWatch;
      const isHost = this.gameInfo.isHost;
      let msg = '';
      let msgType :MessageType = 'success';
      switch (type) {
        case 0:
          msg = isWatch ? '玩家离开了游戏' : '对手离开了游戏';
          msgType = 'warning';
          break
        case 1:
        case 2:
          msg = isWatch ? '游戏结束' : isHost===type?'你获胜了':'你输了';
          break
        case -1:
          msg = '打成平手';
          msgType = 'info';
          break
        case -2:
          msg = '等待超时';
          msgType = 'error';
          break
      }
      this.setGameInfo({
        turnTo: false
      });
      this.gameOver = true;
      ElMessageBox.confirm(msg+'，游戏结束!', {
        type: msgType,
        confirmButtonText: '返回到游戏列表',
        cancelButtonText: '我知道了',
      }).then(() => {
        this.$router.push('/')
      }).catch(() => {

      })
    },
    sendMsg (){
      if (this.msgSend) {
        this.socket.sendMsg(this.msgSend);
        this.msgSend = '';
      }
    },
    startClock() {
      this.clock = 30;
      if (this.clockHandle) clearInterval(this.clockHandle);
      this.clockHandle = setInterval(() => {
        this.clock--;
        if (this.clockHandle && this.clock === 0) {
          clearInterval(this.clockHandle);
        }
      }, 1000)
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
    mouseMove: throttle(function (e: MouseEvent) {
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
    }),
    mouseClick() {
      if (this.gameInfo.turnTo) {
        if (this.hoverPos[0] > -1) {
          this.socket.putChess(this.hoverPos);
        }
      }
    },
    computeClock (turn: boolean): string{
      if (turn) {
        return this.clock.toString();
      }
      return '--'
    }
  }
})
</script>

<style scoped lang="scss">
.game{
  nav{
    padding: 20px 0;
    justify-content: center;
    position: relative;
    button{
      position: absolute;
      left: 10px;
    }
  }
  section{
    text-align: center;
    >div{
      text-align: unset;
      height: 100%;
      display: inline-flex;
      justify-content: center;
      align-items: stretch;
    }
  }
  .board{
    background: #ffe5b5;
    position: relative;
    flex-shrink: 0;
    box-shadow: 0 0 20px #ff920066 inset;
    border: 1px solid #ff9200;
    *{
      position: absolute;
      background: black;
    }
    del{
      display: block;
    }
    a{
      width: 6px;
      height: 6px;
      transform: translate(-45%, -45%);
      border-radius: 50%;
      background: #464646;
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
        opacity: 0.8;
      }
    }
    div{
      background: transparent;
    }
  }
  .menu{
    justify-content: space-between;
    margin: 0 20px;
    align-items: stretch;
    height: 100%;
    .msg{
      flex-grow: 1;
      margin: 10px 0;
      align-items: stretch;
      overflow: hidden;
      position: relative;
      >b{
        position: absolute;
        width: 100%;
        top: 0;
        left: 0;
        height: 30px;
        justify-content: center;
        font-size: 0.9rem;
        color: #ffffff;
        background: rgb(102 102 102);
      }
      .msg-box{
        flex-grow: 1;
        align-items: stretch;
        border: 1px solid gainsboro;
        padding-top: 30px;
        width: 300px;
        overflow: auto;
        p{
          margin-bottom: 8px;
          font-size: 14px;
          word-break: break-word;
          text-align: start;
          padding: 5px;
          b{
            margin-right: 5px;
          }
          span{
            color: gray;
            font-size: 0.95em;
          }
        }
      }
      ::v-deep .send{
        margin-top: 15px;
      }
    }
    .player{
      border-radius: 4px;
      padding: 20px 10px;
      justify-content: space-evenly;
      background: #fafdff;
      box-shadow: 0 0 5px #00000026;
      border: 1px solid #cfe0ff;
      >img{
        width: 60px;
        height: 60px;
        border: 1px solid #e3e3e3;
        margin-right: 10px;
        border-radius: 8px;
      }
      >div{
        label{
          margin-top: 10px;
          span{
            margin-left: 8px;
            font-size: 15px;
            width: 30px;
          }
        }
      }
    }
  }
}
</style>
