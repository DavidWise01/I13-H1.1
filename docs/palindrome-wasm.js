const bytes=new Uint8Array([0,97,115,109,1,0,0,0,1,7,1,96,2,127,127,1,127,3,2,1,0,7,8,1,4,115,116,101,112,0,0,10,9,1,7,0,32,0,32,1,115,11]);
export async function palindromeWasm(){const {instance}=await WebAssembly.instantiate(bytes);return{step:instance.exports.step,bytes}}
