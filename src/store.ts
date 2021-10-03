import {App} from "@vue/runtime-core";
import {ComponentOptionsMixin, reactive} from "vue";

export default function (app: App): void{
    app.provide('socket_', {val: undefined})
        .provide('game_', reactive({val: {
            isHost: false,
            secret: '',
            create: '',
            enemy: 'unknown',
            enemyAvatar: 'dog',
            me: 'unknown',
            meAvatar: 'dog',
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
        },
        socketConnected (){
            return this.socket.connected
        }
    },
    methods: {
        setSocket (v: any){
            this.socket_.val = v; 
        },
        setGameInfo (v: Record<string, any>){
            for (const k of Object.keys(v)) {
                this.game_.val[k] = v[k];
            }
        }
    }
}
