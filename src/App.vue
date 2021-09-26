<template>
  <router-view></router-view>
</template>

<script lang="ts">
import {injectMixin} from "./store";
import {Client} from "./utils/socket";

export default {
  mixins: [injectMixin],
  created() {
    const socket = new Client();
    this.setSocket(socket);
  }
}
</script>

<style>
</style>
