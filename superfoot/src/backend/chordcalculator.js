const C = 0;
const C_SHARP = 1;
const D = 2;
const D_SHARP = 3;
const E = 4;
const F = 5;
const F_SHARP = 6;
const G = 7;
const G_SHARP = 8;
const A = 9;
const A_SHARP = 10;
const B = 11;

const notes = [
    { name: 'C', value: C },
    { name: 'C#', value: C_SHARP },
    { name: 'D', value: D },
    { name: 'D#', value: D_SHARP },
    { name: 'E', value: E },
    { name: 'F', value: F },
    { name: 'F#', value: F_SHARP },
    { name: 'G', value: G },
    { name: 'G#', value: G_SHARP },
    { name: 'A', value: A },
    { name: 'A#', value: A_SHARP },
    { name: 'B', value: B },
]

const chordQualities = {
    'major': [0, 4, 7],
    'minor': [0, 3, 7],
    'dominant': [4, 7, 10],
    'minor7': [3, 7, 10],
    'major7': [4, 7, 11],
    'dim': [0, 3, 6],
    'half-diminished': [3, 6, 10],
    'diminished': [3, 6, 9],
    'augmented': [0, 4, 8],
}

export const calculateChord = (root, quality) => {
    const rootNote = notes.find(note => note.name === root);
    const qualityNotes = chordQualities[quality];
    const chord = qualityNotes.map(note => ((rootNote.value + note) % 12) + 60);
    chord.unshift(rootNote.value + 24);
    return chord;
}

export const detectChord = (inputNotes) => {
    if (!inputNotes || !Array.isArray(inputNotes) || inputNotes.length < 3) return 'undetected';

    const uniqueNoteValues = [...new Set(inputNotes.map(n => {
        const cleanName = n.replace(/[0-9-]/g, '');
        const noteObj = notes.find(x => x.name === cleanName);
        return noteObj ? noteObj.value : -1;
    }).filter(v => v !== -1))];

    if (uniqueNoteValues.length < 3) return 'undetected';

    for (let potentialRoot of uniqueNoteValues) {
        const intervals = uniqueNoteValues
            .map(v => (v - potentialRoot + 12) % 12)
            .sort((a, b) => a - b);
        
        for (const [quality, qualityIntervals] of Object.entries(chordQualities)) {
            const expectedIntervals = [...new Set([0, ...qualityIntervals])].sort((a, b) => a - b);
            if (intervals.length === expectedIntervals.length && intervals.every((val, index) => val === expectedIntervals[index])) {
                const rootName = notes.find(x => x.value === potentialRoot).name;
                
                if (quality === 'major') return rootName;
                if (quality === 'minor') return rootName + 'm';
                if (quality === 'dominant') return rootName + '7';
                if (quality === 'minor7') return rootName + 'm7';
                if (quality === 'major7') return rootName + 'maj7';
                if (quality === 'dim') return rootName + 'dim';
                if (quality === 'half-diminished') return rootName + 'm7b5';
                if (quality === 'diminished') return rootName + 'º';
                if (quality === 'augmented') return rootName + 'aug';
                
                return rootName + quality; 
            }
        }
    }

    return 'undetected';
}

