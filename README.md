## Just Intonation (JI) Synth

A simple JI synth and sequencer, using Codepen for UI, and Tone.js + Web Audio API for audio generation.

Notes and chords are sequenced using JavaScript arrays. Each note must have timing and frequency specified, with some other optional inputs.

This sequencer uses Just Intonation, since the frequencies are raw Hz values (with optional multipliers). For example, the array [400, 500, 600] specifies a Just Intonation major triad starting at 400 Hz.

### Running the sequencer
- Open this Codepen: https://codepen.io/davidryan59/pen/gOOrXmJ
- You can play the sequenced notes by clicking the webpage
- Click again to stop sequener
- You can live-edit the chords (code) in Codepen
- You can edit the `index.js` file above, and then copy and paste the whole file (including code) into Codepen

### Reference documents
- Tone.js: https://tonejs.github.io/
- Just Intonation: https://en.wikipedia.org/wiki/Just_intonation
