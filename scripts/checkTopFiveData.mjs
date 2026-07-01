import data from "../data/top-five.json" with { type:"json" };
if(data.challenges.length<500)throw new Error("Muy pocos retos generados");
for(const challenge of data.challenges){if(challenge.answers.length!==5)throw new Error(`${challenge.id}: no tiene cinco respuestas`);if(new Set(challenge.answers.map((answer)=>answer.name)).size!==5)throw new Error(`${challenge.id}: jugadores duplicados`);for(let i=1;i<5;i+=1)if(challenge.answers[i].value>challenge.answers[i-1].value)throw new Error(`${challenge.id}: orden incorrecto`);}
console.log(`${data.challenges.length} rankings validados.`);
