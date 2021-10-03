<template>
  <div class="flexc table">
    <p><b>玩家1</b>{{player1}}</p>
    <p><b>玩家2</b><span class="can-join" v-if="player2==null">可加入</span>{{player2}}</p>
    <p><b>对局时间</b>{{player2==null?'暂无':updateTime.value}}</p>
    <div class="flex w100 footer">
      <el-button type="success" v-if="player2==null" @click="$emit('join')" plain>加入</el-button>
      <el-button @click="watchGame" :disabled="player2==null" type="info" plain>观战</el-button>
    </div>
  </div>
</template>

<script lang="ts">
import {injectMixin} from "../../store";

export default {
  name: "the-table",
  props: {
    item: Object,
    updateTime: Object
  },
  mixins: [injectMixin],
  emits: ['join', 'watch'],
  setup (props){
    const data = props.item;
    return {
      create: data.create,
      player1: data.player1.nick,
      player2: data.player2.nick
    }
  },
  methods: {
    watchGame (){
      const item = this.$props.item;
      this.setGameInfo({
        secret: '',
        create: item.create,
        me: item.player1.nick,
        meAvatar: item.player1.avatar,
        enemy: item.player2.nick,
        enemyAvatar: item.player2.avatar,
        turnTo: false
      })
      this.$router.push('/watch')
    }
  }
}
</script>

<style scoped lang="scss">
.table{
  padding: 15px 20px;
  border: 1px solid #e5a5ff;
  border-radius: 5px;
  margin: 20px 0 0 20px;
  align-items: flex-start;
  &:hover{
    box-shadow: 0 0 0 1px #c83eff;
  }
  p{
    margin-bottom: 8px;
    font-size: .85rem;
    font-weight: bold;
    b{
      display: inline-block;
      font-weight: normal;
      width: 5rem;
    }
    .can-join{
      background: #ff9e5e;
      color: white;
      border-radius: 4px;
      padding: 1px 6px;
      font-size: .7rem;
    }
  }
  .footer{
    margin-top: 10px;
    justify-content: center;
  }
}
</style>
