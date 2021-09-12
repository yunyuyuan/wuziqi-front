import {App} from "@vue/runtime-core";
import {ComponentOptionsMixin, reactive} from "vue";

export default function (app: App): void{
    app.provide('socket_', {val: undefined})
        .provide('game_', reactive({val: {
            enemy: '',
            me: '',
            turnTo: false
        }}))
}


export const injectMixin: ComponentOptionsMixin = {
    inject: ['socket_', 'game_'],
    computed: {
        socket (){
            return this.socket_.val
        },
        gameInfo (){
            return this.game_.val
        }
    },
    methods: {
        setSocket (v: any){
            this.socket_.val = v; 
        },
        setGameInfo (v: any){
            this.game_.val = v; 
        }
    }
}
