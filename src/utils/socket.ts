import {io} from 'socket.io-client';
import {ElMessage, ElNotification} from "element-plus";
import {Socket} from "socket.io-client/build/socket";
const socketUrl = import.meta.env.VITE_SOCKET_URL as string;

export class Client{
    private readonly socket: Socket;
    gameStartFn: Function | undefined;
    chessUpdateFn: Function | undefined;
    gameEndFn: Function | undefined;
    watcherNumChangeFn: Function | undefined;
    msgUpdateFn: Function | undefined;
    
    constructor() {
        this.socket = io(socketUrl, {
            path: '/api/socket.io',
            reconnection: true
        });
        this.socket.on('connect', () => {
            ElMessage({
                type: 'success',
                showClose: true,
                message: 'websocket连接成功!',
            });
        });
        this.socket.on('connect_error', (e: any) => {
            ElMessage({
                type: 'error',
                showClose: true,
                message: `websocket连接失败: ${e}`,
            });
            this.socket.close();
        });
        this.socket.on('reconnect', () => {
            ElMessage({
                type: 'warning',
                showClose: true,
                message: '尝试重新连接websocket!',
            });
        });
        this.socket.on('disconnect', (e: any) => {
            ElMessage({
                type: 'warning',
                showClose: true,
                message: `websocket连接断开: ${e}`,
            })
        });
        this.socket.on('game_start', (data: any)=>this.gameStarted(data))
        this.socket.on('chess_update', (data: any)=>this.chessUpdated(data))
        this.socket.on('game_end', (data: any)=>this.gameEnded(data))
        this.socket.on('watcher_num_change', (data: any)=>this.watcherNumChanged(data))
        this.socket.on('msg_update', (data: any)=>this.msgUpdate(data))
        this.socket.on('_error', Client.socketError)
    }
    
    private gameStarted(data: any): void{
        const gameStartFn = this.gameStartFn;
        if (typeof gameStartFn == 'function'){
            gameStartFn(data)
        }
    }
    
    private chessUpdated(data: any): void{
        const chessUpdateFn = this.chessUpdateFn;
        if (typeof chessUpdateFn == 'function'){
            chessUpdateFn(data)
        }
    }
    
    private gameEnded(data: any): void{
        const gameEndFn = this.gameEndFn;
        if (typeof gameEndFn == 'function'){
            gameEndFn(data)
        }
    }
    
    private watcherNumChanged(data: any): void{
        const watcherNumChangeFn = this.watcherNumChangeFn;
        if (typeof watcherNumChangeFn == 'function'){
            watcherNumChangeFn(data)
        }
    }
    
    
    private msgUpdate(data: any): void{
        const msgUpdateFn = this.msgUpdateFn;
        if (typeof msgUpdateFn == 'function'){
            msgUpdateFn(data)
        }
    }
    
    private static socketError(data: Record<string, any>){
        ElNotification({
            type: 'error',
            title: '出错了!',
            message: data.msg
        })
    }
    
    public get connected (): boolean{
        return this.socket.connected
    }
        
    private checkConnected (): boolean{
        const connected = this.connected;
        if (!connected) {
            ElMessage({
                type: 'warning',
                showClose: true,
                message: '当前无websocket连接!请尝试刷新页面',
            });
        }
        return connected
    }
    
    public close(): void{
        if (this.checkConnected()) {
            this.socket.close()
        }
    }
    
/* --------------------------------------------------------------- */
    
    public joinRoom (create: string, secret: string): void{
        this.socket.emit('join_room', {create, secret});
    }    
    
    public leaveRoom (): void{
        this.socket.emit('leave_room');
        this.gameStartFn = undefined;
        this.chessUpdateFn = undefined;
        this.gameEndFn = undefined;
        this.watcherNumChangeFn = undefined;
    }
    
    public listenStart (create: string, secret: string, cb: Function): void{
        this.joinRoom(create, secret);
        this.gameStartFn = cb;
    }
    
    public listenUpdate (cb: Function): void{
        this.chessUpdateFn = cb;
    }
    
    public listenWatcherChange (cb: Function): void{
        this.watcherNumChangeFn = cb;
    }
    
    public listenMsgUpdate (cb: Function): void{
        this.msgUpdateFn = cb;
    }
    
    public listenEnd (cb: Function): void{
        this.gameEndFn = cb;
    }
    
    public cancelCreate (): void{
        this.socket.emit('cancel_create')
    }

    public putChess(pos: number[]): void{
        if (this.checkConnected()) {
            this.socket.emit('put_chess', {
                pos,
            })
        }
    }

    public sendMsg(msg: string): void{
        if (this.checkConnected()) {
            this.socket.emit('send_msg', {
                msg,
            })
        }
    }
}
