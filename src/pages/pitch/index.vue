<template>
  <div class="pitch flexc s100">
    <nav class="flex w100">
      <el-button size="medium" :loading="getting" icon="el-icon-search" @click="getTables">刷新棋桌</el-button>
      <el-button type="primary" size="medium" icon="el-icon-cherry" @click="openDialog('create')">创建</el-button>
    </nav>
    <el-divider></el-divider>
    <div class="flex tables" v-loading="getting">
      <template v-if="tables.length">
        <the-table v-for="item in tables" :item="item" :key="item.player2.nick" :update-time="generateTimeClock(item.create)"
                   @join="openDialog('join');joinItem=item"></the-table>
      </template>
      <el-empty v-else description="啥也没有"></el-empty>
    </div>
  
    <el-dialog :title="dialogType==='create'?'创建游戏':'加入游戏'" :show-close="false" v-model="showStartDialog"
               :close-on-click-modal="false" :append-to-body="true">
      <template v-if="inputing">
        <label>
          <span style="display: inline-block;margin-bottom: 8px">请输入昵称：</span>
          <el-input v-model="nick" maxlength="10" show-word-limit></el-input>
        </label>
        <label>
          <span style="display: inline-block;margin-top: 10px">请选择头像：</span>
          <div class="avatars flex">
            <img v-for="(v,k) in avatars" :class="{active: chosenAvatar===k}" :src="v" :title="k" :alt="k" @click="chosenAvatar=k"/>
          </div>
        </label>
      </template>
      <div class="flex" v-else>
        <el-icon :size="23" class="is-loading" style="margin-right: 10px;color: #2a00ff">
          <loading/>
        </el-icon>
        <span>{{ createState }}</span>
      </div>
      <template #footer>
        <el-button type="danger" @click="clickCancel">取消</el-button>
        <el-button v-if="inputing" @click="clickOk" type="primary">{{ dialogType === 'create' ? '创建' : '加入' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script lang="ts">
import {post} from '../../utils/http';
import Table from "./table.vue";
import {Loading} from '@element-plus/icons'
import {injectMixin} from "../../store";
import {computed, defineComponent} from "vue";
import {ElMessage} from "element-plus";
import {avatars, enhanceTime} from "../../utils/utils";
import dayjs from "dayjs";

type dialogType = 'create' | 'join'

export default defineComponent({
  name: "index",
  components: {TheTable: Table, Loading},
  data() {
    return {
      avatars,
      chosenAvatar: 'rabbit',
      getting: false,
      showStartDialog: false,
      inputing: true,
      nick: '',
      createState: '未知状态',
      dialogType: 'create' as dialogType,
      joinItem: null,
      timeNow: Date.now(),
      timeHandle: 0,
      tables: []
    }
  },
  mixins: [injectMixin],
  created() {
    this.getTables();
    this.timeHandle = setInterval(() => {
      this.timeNow = Date.now()
    }, 1000)
  },
  beforeUnmount() {
    clearInterval(this.timeHandle);
  },
  methods: {
    async getTables() {
      this.getting = true;
      this.tables = (await post('get_table')) as [] || [];
      this.getting = false;
    },
    generateTimeClock (create: number){
      return computed(() => enhanceTime(Math.floor(dayjs(dayjs(this.timeNow).diff(create))/1000)));
    },
    openDialog(type: dialogType) {
      this.dialogType = type;
      this.showStartDialog = true;
      this.nick = '';
      this.inputing = true;
    },
    clickCancel() {
      this.showStartDialog = false;
      if (this.dialogType === 'create' && this.socketConnected) {
        this.socket.cancelCreate();
      }
    },
    async clickOk() {
      if (!this.socketConnected) return;
      if (!this.nick) {
        ElMessage({
          type: 'error',
          showClose: true,
          message: '昵称不能为空!'
        })
        return
      }
      if (this.dialogType === 'create') {
        this.inputing = false;
        this.createState = '创建中...';
        const result = await post('create_table', {
          nick: this.nick,
          avatar: this.chosenAvatar
        }) as Record<string, any>;
        if (result) {
          this.createState = '等待玩家加入...';
          this.setGameInfo({
            isHost: 1,
            secret: result.secret,
            create: result.create,
          })
          this.socket.listenStart(result.create, result.secret, this.gameStarted)
        }
      } else {
        await this.joinGame()
      }
    },
    gameStarted(e: Record<string, any>) {
      this.setGameInfo({
        enemy: e.player2.nick,
        enemyAvatar: e.player2.avatar,
        me: this.nick,
        meAvatar: this.chosenAvatar,
        turnTo: true
      })
      this.$router.push('/game')
    },
    async joinGame() {
      if (!this.socketConnected) return;
      const create = this.joinItem.create;
      const result = await post('join_table', {
        nick: this.nick,
        create,
        avatar: this.chosenAvatar
      }) as Record<string, any>;
      if (result) {
        this.setGameInfo({
          isHost: 2,
          secret: result.secret,
          create,
          enemy: result.player1.nick,
          enemyAvatar: result.player1.avatar,
          me: this.nick,
          meAvatar: this.chosenAvatar,
          turnTo: false
        })
        this.socket.joinRoom(create, result.secret);
        await this.$router.push('/game')
      } else {
        this.showStartDialog = false;
      }
    }
  }
})
</script>

<style scoped lang="scss">
.pitch{
  nav{
    justify-content: center;
    padding-top: 20px;
  }
  .tables{
    flex-grow: 1;
    flex-wrap: wrap;
    align-content: flex-start;
    padding: 0 20px 20px 0;
    overflow: auto;
  }
}
.avatars{
  flex-wrap: wrap;
  align-content: flex-start;
  img{
    width: 60px;
    height: 60px;
    border-radius: 4px;
    cursor: pointer;
    margin: 10px;
    border: 1px solid gray;
    &.active{
      border-color: red;
      box-shadow: 0 0 0 1px red;
    }
    &:not(.active):hover{
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
    }
  }
}
</style>
