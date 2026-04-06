export const translations = {
  en: {
    // Interface buttons & status
    "interface.online": "Online",
    "interface.offline": "Offline",
    "interface.setBanks": "Configure Banks",
    "interface.program": "Program",
    "interface.factory": "Factory",
    
    // Popup Common
    "popup.close": "Close",
    "popup.set": "Set",
    "popup.bank": "Bank",
    "popup.pedal": "Pedal",
    "popup.midiChannel": "MIDI Channel",
    "popup.currentSettings": "Current Settings",
    
    // PC Popup
    "pc.title": "Program Change",
    "pc.pcNumber": "PC#",
    
    // CC Popup
    "cc.title": "Control Change",
    "cc.ccNumber": "CC#",
    "cc.value": "Value (0-127)",
    
    // CC Latch Popup
    "cclatch.title": "Control Change (On/Off)",
    
    // Multiples CC Latch Popup
    "mcc.title": "Multiples Control Change (On/Off)",
    "mcc.message": "Message",
    
    // Notes Popup
    "notes.title": "Sending: Single Note or Chords",
    "notes.noteByNote": "Note by Note",
    "notes.chordBuilder": "Chord Builder",
    "notes.root": "Root",
    "notes.type": "Type",
    "notes.octave": "Octave",
    "notes.note": "Note",
    "notes.activeNotes": "Active Notes",
    "notes.chord": "Chord",

    // Bank Types
    "banktype.title": "User bank types",
    "banktype.description": "Select the behavior you want mapping to the pedals in this bank.",
    "banktype.save": "Save Changes",
    "banktype.warningTitle": "Warning",
    "banktype.warningDesc": "Are you sure you want to change the bank type? All current pedal presets for this bank will be deleted and replaced with default values for the new bank type. You can change them later to your preferences.",
    "banktype.accept": "Accept",
    "banktype.cancel": "Cancel",

    // Device Disconnect
    "disconnect.title": "Device Disconnected",
    "disconnect.desc": "SuperFoot MIDI is not connected or powered off.",
    "disconnect.action": "Please connect the device and refresh the page if it doesn't automatically reconnect.",
    "disconnect.statusRetry": "Waiting for device...",
    
    // Confirm Write
    "write.title": "Temporary Changes Applied",
    "write.desc": "The pedal settings have been updated in the application's memory.",
    "write.warning": "Remember to click the 'Program' button on the main screen to save these changes to the physical device. Otherwise, they will be lost when you turn off SuperFoot MIDI.",
    "write.dontShow": "Don't show this tip again",
    "write.ok": "Got it",
    
    // Success
    "success.title": "Success",
    "success.desc": "Configurations have been successfully sent and saved to the device.",
    "success.ok": "OK",
    
    // Confirm Write Main
    "confirm.ack": "I understand this will modify the currently saved presets on my device",
    "confirm.program.title": "Confirm send to device",
    "confirm.program.p1": "By continuing, all changes made in this web app will be sent to the <strong>SuperFoot MIDI</strong>.",
    "confirm.program.p2": "This will <strong>overwrite on the device</strong> the banks and presets according to what you have here. Everything modified on the app will replace the hardware configuration.",
    "confirm.factory.title": "Restore Factory Settings",
    "confirm.factory.p1": "If you continue, the <strong>Factory settings</strong> will be sent to <strong>SuperFoot MIDI</strong>.",
    "confirm.factory.p2": "<strong>All banks and presets</strong> will revert back to their default factory settings, completely replacing the configuration currently saved natively on the device."
  },
  es: {
    // Interface buttons & status
    "interface.online": "En línea",
    "interface.offline": "Desconectado",
    "interface.setBanks": "Configurar Bancos",
    "interface.program": "Programar",
    "interface.factory": "Ajustes de Fábrica",
    
    // Popup Common
    "popup.close": "Cerrar",
    "popup.set": "Asignar",
    "popup.bank": "Banco",
    "popup.pedal": "Pedal",
    "popup.midiChannel": "Canal MIDI",
    "popup.currentSettings": "Valores Actuales",
    
    // PC Popup
    "pc.title": "Program Change",
    "pc.pcNumber": "PC#",
    
    // CC Popup
    "cc.title": "Control Change",
    "cc.ccNumber": "CC#",
    "cc.value": "Valor",
    
    // CC Latch Popup
    "cclatch.title": "Control Change (On/Off)",
    
    // Multiples CC Latch Popup
    "mcc.title": "Multiples Control Change (On/Off)",
    "mcc.message": "Mensaje",
    
    // Notes Popup
    "notes.title": "Enviando: Notas o Acordes",
    "notes.noteByNote": "Nota a nota",
    "notes.chordBuilder": "Constructor de acordes",
    "notes.root": "Tónica",
    "notes.type": "Tipo",
    "notes.octave": "Octava",
    "notes.note": "Nota",
    "notes.activeNotes": "Notas Activas",
    "notes.chord": "Acorde",

    // Bank Types
    "banktype.title": "Tipos de banco de usuario",
    "banktype.description": "Elija cómo se comportarán los pedales dentro del banco.",
    "banktype.save": "Guardar Cambios",
    "banktype.warningTitle": "Advertencia",
    "banktype.warningDesc": "¿Estás seguro de que quieres cambiar el tipo de banco? Todos los presets actuales de los pedales para este banco se borrarán y se reemplazarán con los valores predeterminados para el nuevo tipo de banco. Puedes cambiarlos después a tu gusto.",
    "banktype.accept": "Aceptar",
    "banktype.cancel": "Cancelar",

    // Device Disconnect
    "disconnect.title": "Dispositivo Desconectado",
    "disconnect.desc": "SuperFoot MIDI no está conectado o está apagado.",
    "disconnect.action": "Por favor, conecta el dispositivo y actualiza la página si no se reconecta automáticamente.",
    "disconnect.statusRetry": "Esperando al dispositivo...",
    
    // Confirm Write
    "write.title": "Cambios Temporales Aplicados",
    "write.desc": "La configuración del pedal ha sido actualizada en la memoria de la aplicación.",
    "write.warning": "Recuerda presionar el botón 'Programar' en la pantalla principal para guardar permanentemente en el equipo físico. Si no lo haces, perderás los cambios al apagar SuperFoot MIDI.",
    "write.dontShow": "No volver a mostrar",
    "write.ok": "Entendido",
    
    // Success
    "success.title": "Éxito",
    "success.desc": "Las configuraciones se han enviado y guardado correctamente en el dispositivo.",
    "success.ok": "OK",

    // Confirm Write Main
    "confirm.ack": "Entiendo que con esto modificaré los presets actualmente presentes en mi dispositivo",
    "confirm.program.title": "Confirmar envío al dispositivo",
    "confirm.program.p1": "Si continúa, se enviarán al dispositivo <strong>SuperFoot MIDI</strong> todos los cambios que haya realizado en esta aplicación web.",
    "confirm.program.p2": "Eso <strong>reemplazará en el dispositivo</strong> los bancos y presets según lo que tenga ahora en la app: todo lo que haya modificado aquí sustituirá la configuración correspondiente en el hardware.",
    "confirm.factory.title": "Restaurar ajustes de fábrica",
    "confirm.factory.p1": "Si continúa, se enviará al dispositivo <strong>SuperFoot MIDI</strong> la configuración de <strong>fábrica</strong>.",
    "confirm.factory.p2": "<strong>Todos los bancos y todos los presets</strong> volverán a los valores predeterminados de fábrica, reemplazando por completo la configuración que esté guardada actualmente en el dispositivo."
  }
};
