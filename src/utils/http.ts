import axios from "axios";
import { ElNotification } from 'element-plus';
import { h } from 'vue';

export async function post(path: string, data: {[key: string]: any}): Promise<object>{
    const result = await axios({
        url: `http://localhost:6769/${path}`,
        method: 'post',
        data,
    });
    if (result.status !== 200){
        ElNotification({
            title: '出错了',
            message: h(
                'i',
                {style: 'font-weight: bold;'},
                `状态码: ${result.status}`
            )
        })
    }
    return result.data;
}
