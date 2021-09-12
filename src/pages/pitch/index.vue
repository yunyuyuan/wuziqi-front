<template>
  <el-button type="primary" :loading="getting" icon="el-icon-search" @click="getTables">获取棋桌</el-button>
  <el-button type="primary" icon="el-icon-cherry" @click="openDialog('create')">创建</el-button>
  <ul v-loading="getting">
    <the-table v-for="item in tables" :item="item" @join="openDialog('join');joinItem=item"></the-table>
  </ul>
  
  <el-dialog :title="dialogType==='create'?'创建游戏':'加入游戏'" :show-close="false" v-model="creating" :close-on-click-modal="false">
    <template v-if="inputing">
      <label>
        <span>请输入昵称:</span>
        <el-input v-model="nick"></el-input>
      </label>
    </template>
    <template v-else>
      <el-icon size="20px" class="is-loading">
        <loading />
      </el-icon>
      <span>{{createState}}</span>
    </template>
    <template #footer>
      <el-button type="danger" @click="clickCancel">取消</el-button>
      <el-button v-if="inputing" @click="createOk" type="primary">{{dialogType==='create'?'创建':'加入'}}</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts">
import { post } from '../../utils/http';
import Table from "./table.vue";
import {Loading} from '@element-plus/icons'
import {injectMixin} from "../../store";
import {Client} from "../../utils/socket";
import {defineComponent} from "vue";

type dialogType = 'create'|'join'

export default defineComponent({
  name: "index",
  components: {TheTable: Table, Loading},
  data(){
    return {
      getting: false,
      creating: false,
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
    async getTables(): Promise<void>{
      this.getting = true;
      this.tables = (await post('get_table')) || [];
      this.getting = false;
    },
    openDialog (type: dialogType){
      this.dialogType = type;
      this.creating = true;
      this.nick = '';
      this.inputing = true
    },
    clickCancel (): void{
      this.creating = false;
      if (this.dialogType === 'create' && this.socket){
        this.socket.close();
      }
      this.setSocket(undefined)
    },
    async createOk(): Promise<void>{
      if (this.socket) return ;
      if (this.dialogType === 'create') {
        this.inputing = false;
        this.createState = '创建中...';
        const result = await post('create_table', {
          nick: this.nick
        });
        if (result) {
          this.createState = '等待玩家加入...';
          const socket = new Client(result.secret, result.create, this.gameStarted);
          this.setSocket(socket);
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
    async joinGame (){
      if (this.socket) return ;
      const create = this.joinItem.create;
      const result = await post('join_table', {
        nick: this.nick,
        create,
      });
      if (result){
        const socket = new Client(result.secret, create);
        this.setSocket(socket);
        this.setGameInfo({
          enemy: result.player1,
          me: this.nick,
          turnTo: false
        })
        await this.$router.push('/game')
      }
    }
  }
})
</script>

<style scoped>

</style>
