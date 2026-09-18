import { generateProceduralLevel } from './src/game/block-puzzle/core/pcg';

(global as any).localStorage = {
    getItem: () => null,
    setItem: () => {}
};

console.log("Generating 200 levels...");
let fails = 0;
for (let i = 21; i <= 220; i++) {
    const config = generateProceduralLevel(i, 'normal', `test_seed_${i}`);
    if (config.missions[0].description.includes('Failsafe')) {
        console.log(`Level ${i} failed and used failsafe.`);
        fails++;
    }
}
console.log(`Generated 200 levels with ${fails} fails.`);
