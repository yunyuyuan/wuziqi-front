<template>
  <li>
    <p><b>玩家1</b>{{player1}}</p>
    <p><b>玩家2</b><span class="can-join" v-if="player2==null">可加入</span>{{player2}}</p>
    <p><b>对局时间</b>{{play_time}}</p>
    <el-button @click="$emit('join')">加入</el-button>
  </li>
</template>

<script lang="ts">
import dayjs from "dayjs";
import {enhanceTime} from "../../utils/utils";
import {injectMixin} from "../../store";
import {watchEffect} from "vue";

export default {
  name: "the-table",
  props: {
    item: {
      type: Object
    }
  },
  mixins: [injectMixin],
  emits: ['join'],
  data (){
    return {
      
    }
  },
  setup (props){
    const data = props.item;
    const times = Math.floor(dayjs(dayjs().diff(data.create))/1000);
    return {
      player1: data.player1.nick,
      player2: data.player2.nick,
      play_time: data.player2.nick==null?'暂无':enhanceTime(times)
    }
  },
}
</script>

<style scoped lang="scss">
li{
  p{
    b{
      display: inline-block;
      width: 5rem;
    }
    .can-join{
      background: #ff6600;
      color: white;
      border-radius: 4px;
      padding: 1px 6px;
      font-size: .85rem;
    }
  }
}
</style>
