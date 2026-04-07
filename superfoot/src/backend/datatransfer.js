import { FACTORY_SETTINGS, BANK_TYPES, EXPRESSION_SETTINGS } from '../data/factory.js'

//Flujo de datos
//1. La app se inicia y chequea si el dispositivo esta conectado, si no lo esta no se inicia
//   Si esta conectado la app se inicia.
//2. La app envía un sysex de requerimiento de datos al dispositivo y se queda esperando.
//3. El dispositivo envía un sysex con todos los datos guardados en el dispositivo
//4. La app recibe los datos y los guarda en la variable tempData
//5. Si el usuario cambia el tipo de Banco  el tempData del banco indicado se modifica con los 
//   datos de fábrica. Previamente se le informa al usuario que al cambiar el tipo de banco se 
//   perderá toda la info  de los pedales de ese banco y se le asignaran los valores de fábrica.
//6. Si el usuario modifica un preset de cualquier pedal, este se modificará en el tempData, no
//   se enviará aún al dispositivo.
//7. Si el usuario hace click en "Guardar en dispositivo" se envía un sysex con toda la info de
//   tempData al dispositivo, allí se procesa y se guarda.

export const banksData = [...BANK_TYPES]
export const presetsData = JSON.parse(JSON.stringify(FACTORY_SETTINGS))
export const expressionData = [...EXPRESSION_SETTINGS]
