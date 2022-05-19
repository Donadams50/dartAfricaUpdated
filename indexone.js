const getSingleOccurenceInArray = (array) => {
    const freq = new Map();
    for (let i = 0; i < arr.length; i++) {
        if (freq.has(arr[i])) {
            freq.set(arr[i], freq.get(arr[i]+1))
        }else{
            freq.set(arr[i], 1)
        }
    }
    const ans = []
    for (let [k, v] of freq.entries()) {
        if (v === 1) {
            ans.push(k)
        }
    }
    
    return ans
}


const arr = [1,1,3,3,3,3];

console.log(getSingleOccurenceInArray(arr))