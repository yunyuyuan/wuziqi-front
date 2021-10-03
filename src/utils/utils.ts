export function enhanceTime (time: number): string{
    const hour = Math.floor(time / 3600);
    const hour_sec = hour*3600;
    const minute = Math.floor((time - hour_sec) / 60);
    const second = time - hour_sec - minute*60;
    let s_hour = '00:';
    let s_minute = `${minute}:`;
    let s_second = `${second}`;
    if (hour > 0){
        s_hour = `${hour}:`;
        if (hour < 10){
            s_hour = '0'.concat(s_hour);
        }
    }
    if (minute < 10){
        s_minute = '0'.concat(s_minute);
    }
    if (second < 10){
        s_second = '0'.concat(s_second);
    }
    return s_hour+s_minute+s_second;
}

export function throttle(func: Function, interval=32): Function{
    let isFirst = true;
    let handler: number|null = null;
    return function () {
        const args = arguments;
        if (isFirst) {
            isFirst = false;
            func.apply(this, args);
        } else if (!handler){
            handler = setTimeout(()=>{
                func.apply(this, args);
                handler = null;
            }, interval)
        }
    }
}

import mouse from '../assets/image/avatar/mouse.png'
import cow from '../assets/image/avatar/cow.png'
import tiger from '../assets/image/avatar/tiger.png'
import rabbit from '../assets/image/avatar/rabbit.png'
import dragon from '../assets/image/avatar/dragon.png'
import snake from '../assets/image/avatar/snake.png'
import horse from '../assets/image/avatar/horse.png'
import sheep from '../assets/image/avatar/sheep.png'
import monkey from '../assets/image/avatar/monkey.png'
import chicken from '../assets/image/avatar/chicken.png'
import dog from '../assets/image/avatar/dog.png'
import pig from '../assets/image/avatar/pig.png'

export const avatars = {
    mouse,
    cow,
    tiger,
    rabbit,
    dragon,
    snake,
    horse,
    sheep,
    monkey,
    chicken,
    dog,
    pig,
}
