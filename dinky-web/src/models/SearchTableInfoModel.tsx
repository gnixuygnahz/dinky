import { useState,useCallback  } from "react";



export default () => {
    const [searchTableName, setSearchTable] = useState<string>('');
    // 缓存函数对象，避免每一次渲染都给新的函数对象，只有状态变化时才给新的
    const setSearchTableName = useCallback((str: string) => setSearchTable((old:string)=>str == old?str+"'":str), []);
    return {
        searchTableName,
        setSearchTableName
    }
}