<template>
  <div class="game flex s100">
    <div class="board" :style="{width: borderSize,height: borderSize}">
      <del v-for="i in 15" :style="computeLine(i)"></del>
      <del v-for="i in 15" :style="computeColumn(i)"></del>
      <span v-if="gameInfo.turnTo && hoverPos[0]>=0" :style="computeHover"></span>
      <div class="s100" @mousemove="mouseMove" @mouseleave="hoverPos=[-1, -1]"></div>
    </div>
    <div class="menu">
      
    </div>
  </div>
</template>

<script lang="ts">
import {injectMixin} from "../../store";
import {defineComponent} from "vue";

export default defineComponent({
  name: "index",
  mixins: [injectMixin],
  data (){
    return {
      padding: 40,
      borderNum: 15,
      interval: 50,
      chessSize: 40,
      hoverPos: [-1, -1]
    }
  },
  computed: {
    borderSize (){
      return this.interval*(this.borderNum-1)+this.padding*2+'px'
    },
    lineSize (){
      return this.interval*(this.borderNum-1)+'px'
    },
    computeHover (): Record<string, any>{
      return {
        width: this.chessSize+'px', 
        height: this.chessSize+'px',
        top: this.hoverPos[1]*this.interval-this.chessSize/2+this.padding+'px',
        left: this.hoverPos[0]*this.interval-this.chessSize/2+this.padding+'px',
      }
    },
  },
  methods: {
    computeLine (idx: number): Record<string, any>{
      return {
        height: '1px',
        width: this.lineSize,
        left: this.padding+'px',
        top: this.padding+(idx-1)*this.interval+'px'
      }
    },
    computeColumn (idx: number): Record<string, any>{
      return {
        width: '1px',
        height: this.lineSize,
        top: this.padding+'px',
        left: this.padding+(idx-1)*this.interval+'px'
      }
    },
    mouseMove (e: MouseEvent){
      const {offsetX, offsetY} = e;
      const originX = offsetX-this.padding+this.interval/2;
      const originY = offsetY-this.padding+this.interval/2;
      const x = Math.floor(originX / this.interval);
      const y = Math.floor(originY / this.interval);
      if ([x, y].some(v => v <0 || v >= 15) ||
          Math.abs((originX-(this.interval-this.chessSize)/2)%this.interval)>this.chessSize ||
          Math.abs((originY-(this.interval-this.chessSize)/2)%this.interval)>this.chessSize) {
        return this.hoverPos = [-1, -1];
      }
      this.hoverPos = [x, y];
    }
  }
})
</script>

<style scoped lang="scss">
.game{
  justify-content: center;
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
      background: black;
    }
    div{
      background: transparent;
    }
  }
  .menu{
    
  }
}
</style>
