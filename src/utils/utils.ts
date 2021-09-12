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
