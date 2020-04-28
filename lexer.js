export function parse(Q,B="@"){if(!A)return init.then(()=>parse(Q));const C=(A.__heap_base.value||A.__heap_base)+4*Q.length+-A.memory.buffer.byteLength;if(C>0&&A.memory.grow(Math.ceil(C/65536)),function(A,Q){const B=A.length;let C=0;for(;C<B;)Q[C]=A.charCodeAt(C++)}(Q,new Uint16Array(A.memory.buffer,A.sa(Q.length),Q.length+1)),!A.parse())throw Object.assign(new Error(`Parse error ${B}:${Q.slice(0,A.e()).split("\n").length}:${A.e()-Q.lastIndexOf("\n",A.e()-1)}`),{idx:A.e()});const I=[],g=[];for(;A.ri();)I.push({s:A.is(),e:A.ie(),ss:A.ss(),se:A.se(),d:A.id()});for(;A.re();)g.push(Q.slice(A.es(),A.ee()));return[I,g]}let A;export const init=WebAssembly.compile((A=>"function"==typeof atob?Uint8Array.from(atob(A),A=>A.charCodeAt(0)):Buffer.from(A,"base64"))("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")).then(WebAssembly.instantiate).then(({exports:Q})=>{A=Q});