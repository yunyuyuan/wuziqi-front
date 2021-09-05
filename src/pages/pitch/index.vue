<template>
  <el-button type="primary" :loading="getting" icon="el-icon-search" @click="getTables">获取棋桌</el-button>
  <el-button type="primary" :loading="creating" icon="el-icon-cherry" @click="createTable">创建</el-button>
</template>

<script lang="ts">
import { post } from '../../utils/http'

export default {
  name: "index",
  data(){
    return {
      getting: false,
      creating: false,
      tables: []
    }
  },
  created() {
    this.getTables();
  },
  methods: {
    async getTables(): void{
      this.getting = true;
      this.tables = await post('get_table');
      this.getting = false;
    },
    async createTable(): void{
      this.creating = true;
      this.tables = await post('create_table', {
        nick: 'nick1'
      });
      this.creating = false;
    }
  }
}
</script>

<style scoped>

</style>
