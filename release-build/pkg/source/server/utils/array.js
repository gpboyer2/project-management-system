/**
 * 数组工具函数
 * @fileoverview 提供数组相关的工具函数
 * @author CSSC Node View
 * @version 1.0.0
 * @since 2025-11-28
 */

function isArrContainsItem(arr, item) {
    for(let idx in arr) {
        if(arr[idx] === item) {
            return true
        }
    }
    return false
}


module.exports = isArrContainsItem