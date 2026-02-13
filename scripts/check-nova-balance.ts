// Convertir valores de yoctoNEAR a NEAR

const balance = '100000000000000000000000'; // yoctoNEAR
const cost = '670120111096490000000000'; // yoctoNEAR

const balanceNEAR = parseFloat(balance) / 1e24;
const costNEAR = parseFloat(cost) / 1e24;
const neededNEAR = costNEAR - balanceNEAR;

console.log('\n💰 Estado de Fondos NOVA\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Cuenta:', 'ecuador10.nova-sdk.near');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('Balance actual:        ', balanceNEAR.toFixed(4), 'NEAR');
console.log('Costo de vault:        ', costNEAR.toFixed(4), 'NEAR');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Necesitas agregar:     ', neededNEAR.toFixed(4), 'NEAR');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('');
console.log('📋 Pasos para agregar fondos:');
console.log('');
console.log('1. Ve a https://nova-sdk.com');
console.log('2. Inicia sesión con ecuador10.nova-sdk.near');
console.log('3. Busca la opción "Add Funds" o "Deposit"');
console.log('4. Transfiere al menos', (neededNEAR + 0.1).toFixed(4), 'NEAR');
console.log('   (Se recomienda agregar un poco más para futuras operaciones)');
console.log('');
console.log('💡 Recomendación: Agrega 1 NEAR para tener suficiente para:');
console.log('   - Crear vault (~0.67 NEAR)');
console.log('   - Subir archivos (~0.01 NEAR cada uno)');
console.log('   - Operaciones futuras');
console.log('');
