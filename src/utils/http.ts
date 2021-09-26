import axios from "axios";
import { ElNotification } from 'element-plus';
import { h } from 'vue';
import {httpUrl} from "../config";

export async function post(path: string, data: {[key: string]: any} = {}): Promise<object | undefined>{
    try {
        const result = await axios({
            url: `${httpUrl}/${path}`,
            method: 'post',
            data,
            timeout: 5000
        });
        if (result.status !== 200){
            ElNotification({
                title: '出错了',
                message: h(
                    'strong',
                    {style: 'color: red;'},
                    `状态码: ${result.status}`
                )
            })
            return undefined;
        }
        const resp: Record<string, any> = result.data;
        if (resp.err){
            ElNotification({
                title: '出错了',
                message: h(
                    'strong',
                    {style: 'color: red;'},
                    resp.msg
                )
            })
            return undefined
        }
        return resp
    }catch (e) {
        ElNotification({
            title: '出错了',
            message: h(
                'strong',
                {style: 'color: red;'},
                `${e}`
            )
        })
        return undefined;
    }
}
