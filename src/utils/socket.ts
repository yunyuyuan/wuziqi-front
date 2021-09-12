import {io} from 'socket.io-client';
import {ElMessage} from "element-plus";
import {socketUrl} from "../config";


export class Client{
    private socket;
    
    constructor(secret: string = '', id: string, gameStartCb: Function|undefined = undefined) {
        this.socket = io(socketUrl, {
            path: '/'+id,
            reconnection: true,
            auth: {
                secret,
            }
        });
        this.socket.on('connect', () => {
            ElMessage({
                type: 'success',
                message: '连接成功!',
            });
        })
        this.socket.on('connect_error', (e: any) => {
            ElMessage({
                type: 'error',
                message: `连接失败: ${e}`,
            });
            this.socket.close();
        })
        this.socket.on('reconnect', () => {
            ElMessage({
                type: 'warning',
                message: '尝试重新连接!',
            });
        })
        this.socket.on('disconnect', (e: any) => {
            ElMessage({
                type: 'warning',
                message: `连接断开: ${e}`,
            });
        })

        if (gameStartCb) {
            this.socket.on('game_start', gameStartCb)
        }
        this.socket.on('chess_update', this.chessUpdated)
        this.socket.on('game_end', this.gameEnded)       
    }
    
    private chessUpdated(): void{
        console.log(arguments)
    }
    
    private gameEnded(): void{
        console.log(arguments)
    }
    
    public close(): void{
        this.socket.close()
    }
}
