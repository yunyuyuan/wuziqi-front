<template>
  <div class="pitch flexc s100">
    <nav class="flex w100">
      <el-button size="medium" :loading="getting" icon="el-icon-search" @click="getTables">获取棋桌</el-button>
      <el-button type="primary" size="medium" icon="el-icon-cherry" @click="openDialog('create')">创建</el-button>
    </nav>
    <el-divider></el-divider>
    <div class="flex tables" v-loading="getting">
      <template v-if="tables.length" v-for="i in 10">
        <the-table v-for="item in tables" :item="item" 
                   @join="openDialog('join');joinItem=item"></the-table>
      </template>
      <span v-else>啥也没有</span>
    </div>
  
    <el-dialog :title="dialogType==='create'?'创建游戏':'加入游戏'" :show-close="false" v-model="showStartDialog"
               :close-on-click-modal="false">
      <template v-if="inputing">
        <label>
          <span style="display: inline-block;margin-bottom: 8px">请输入昵称：</span>
          <el-input v-model="nick"></el-input>
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
import {defineComponent} from "vue";
import {ElMessage} from "element-plus";

type dialogType = 'create' | 'join'

export default defineComponent({
  name: "index",
  components: {TheTable: Table, Loading},
  data() {
    return {
      getting: false,
      showStartDialog: false,
      inputing: true,
      nick: '',
      createState: '未知状态',
      dialogType: 'create' as dialogType,
      joinItem: null,
      tables: []
    }
  },
  mixins: [injectMixin],
  created() {
    this.getTables();
  },
  methods: {
    async getTables(): Promise<void> {
      this.getting = true;
      this.tables = (await post('get_table')) as [] || [];
      this.getting = false;
    },
    openDialog(type: dialogType) {
      this.dialogType = type;
      this.showStartDialog = true;
      this.nick = '';
      this.inputing = true;
    },
    clickCancel(): void {
      this.showStartDialog = false;
      if (this.dialogType === 'create' && this.socketConnected) {
        this.socket.cancelCreate(this.gameInfo.create);
      }
    },
    async clickOk(): Promise<void> {
      if (!this.socketConnected) return;
      if (!this.nick) return ElMessage({
        type: 'error',
        showClose: true,
        message: '昵称不能为空!'
      });
      if (this.dialogType === 'create') {
        this.inputing = false;
        this.createState = '创建中...';
        const result = await post('create_table', {
          nick: this.nick
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
        enemy: e.player2,
        me: this.nick,
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
      }) as Record<string, any>;
      if (result) {
        this.setGameInfo({
          isHost: 2,
          secret: result.secret,
          create,
          enemy: result.player1,
          me: this.nick,
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
    padding: 20px 0;
  }
  .tables{
    flex-grow: 1;
    flex-wrap: wrap;
    align-content: flex-start;
    padding: 0 20px 20px 0;
    overflow: auto;
  }
}
</style>
