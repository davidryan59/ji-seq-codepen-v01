// To test, copy this page into the JS section on Codepen:
// https://codepen.io/davidryan59/pen/gOOrXmJ

// Uses Tone.js module and Web Audio API to play back sequenced notes

(function() {

  // Setup control variables
  const masterVolume = 0.5;
  const masterNotePercent = 82;
  const masterFreqMult = 6.00;
  const beatsPerMinute = 180;
  const numChannels = 5;
  const playTotalBeats = 480;

  const startAtBeat = 0;
  const chordArray = [
    [6, [[24,,,,,18], [60,,,64,60,,48,,,,, ,], [72,,,80,72,,60,,,,, ,]]],
    [3, [24, [60,,,64,60, ,], [72,,,80,72, ,]]],
    [3, [[0,30,32], 48, 60]],

    [3, [36, [90,,90], [108,,108]]],
    [3, [18, [72,,63], 90]],
    [6, [[24,,,,27,30], [60,,60,48,, ,], [96,,96,72,, ,]]],

    [3, [[32,,32], [48,,48], [80,,80]]],
    [3, [[40,,,36,32, ,], [64,,64], [96,,,90,80, ,]]],
    [3, [[30,,,32,30, ,], [48,,48], [72,80,72]]],
    [3, [[24, 27, 30], 48, 60]],

    [3, [32, [48,,48], [80,,80]]],
    [3, [16, [64,,,72,64, ,], [96,90,80]]],
    [6, [[15,20], [54,,,,,,,,45,,50, ,], [72,,,161/2,72,,60,,,,, ,]]],  // 80+81 = 161

    [3, [20, [48,,48], [80,,80]], 4/3],
    [3, [[30,,30], 75, [255/2,,,105,90, ,]]],
    [3, [[20,,24], 60, 96]],
    [3, [20, 50, 90], 4/3],

    [3, [18, [60,,48], [96,72,60]]],
    [3, [[9,,9*5/4], [45,,63/2], [72,63,54]]],
    [6, [12, 30, 48]],
  ];
  // Above, the chords are setup as an array.
  // Each chord is itself an array of format:
  // [chordBeats, [chordFreqArray], chordFreqMult, chordVolDb, chordNotePercent]
  // Defaults are:
  // [1, [], 1, 0, masterNotePercent]
  // Note that chordVolDb is normally less than 0 (negative) to quieten a note.
  // In chordFreqArray, a positive number A specifies a frequency,
  // and an array [A, B...] specifies a short melody of multiple frequencies
  // e.g. [A, B, C] for a triplet to play within the chord.
  // You can also tie notes using nulls: [A,,B] or [A,B, ,]
  // and specify rests using 0: [A,0,B], [0,A] etc
  // or do both: [A,,0,,B, ,]
  // Note - if the last elt is null, an extra comma is needed!

  // Setup synthArray via Tone.js module
  Tone.Transport.bpm.value = beatsPerMinute;
  let isSynthPlaying = false
  let synthArray = [];

  function setupSynths() {
    synthArray = []
    for (let i1 = 0; i1 < numChannels; i1++) {
      synthArray[i1] = new Tone.FMSynth({
        harmonicity : 1 ,
        modulationIndex : 8 ,
        detune : 0 ,
        oscillator : {
          type : `sine`
        } ,
        envelope : {
          attack : 0.12 ,
          decay : 0.5 ,
          sustain : 0.8 ,
          release : 1
        } ,
        modulation : {
          type : `sine`
        } ,
        modulationEnvelope : {
          attack : 0.01 ,
          decay : 1 ,
          sustain : 0.75 ,
          release : 0.5
        }
      }).toMaster();
    }
    isSynthPlaying = true
  }

  function teardownSynths() {
    synthArray.forEach( synth => synth.dispose() )
    synthArray = []
    isSynthPlaying = false
  }

  // Function that actually plays the specified chords
  function toggleSynth() {
    if (isSynthPlaying) {
      teardownSynths()
    } else {
      setupSynths()
      let currentBeat = 0;
      chordArray.forEach( chordRow => {
        const chordBeats = chordRow[0] || 1;
        const chordFreqArray = chordRow[1] || [];
        const chordFreqMult = chordRow[2] || 1;
        const chordVolDb = chordRow[3] || 0;
        const chordNotePercent = chordRow[4] || masterNotePercent;
        const freqArrayChannels = chordFreqArray.length;
        const currBeatAdj = currentBeat - startAtBeat;
        const chordNoteFraction = Math.max(0, Math.min(1, 0.01 * chordNotePercent));
        const chordPlayBeats = chordBeats * chordNoteFraction;
        if (0 <= currBeatAdj && currBeatAdj <= playTotalBeats && freqArrayChannels > 0) {
          const noteAmplitude = masterVolume * Math.pow(10, 0.05*chordVolDb) / freqArrayChannels;
          for (let i2 = 0; i2 < Math.min(freqArrayChannels, numChannels); i2++) {
            let freqVoice = chordFreqArray[i2]
            // freqVoice is either:
            // 1) a number, representing a single frequency / note
            // Deal with case 1) by converting it to single note in case 2)
            if (Number.isInteger(freqVoice)) freqVoice = [freqVoice]
            // 2) an array of numbers, representing a melody of several frequencies
            // Deal with non-case-2) by converting it to a rest in case 2)
            if (!Array.isArray(freqVoice)) freqVoice = [0]
            // Now freqVoice must be an array.
            // Convert to freqArray with timings.
            let currSize = 0
            const freqArray = []
            const timingArray = []
            let timingSum = 0
            for (let i3 = 0; i3 < freqVoice.length; i3++) {
              const thisFreq = freqVoice[i3]
              if (Number.isFinite(thisFreq)) {
                freqArray.push(Math.abs(thisFreq)) // 0 is a rest, positive number is a frequency
                timingArray[currSize] = 1
                currSize++
                timingSum++
              } else if (thisFreq == null && currSize > 0) {
                // thisFreq is either null or undefined.
                // Treat this as a tied note, by incrementing length of previous note
                timingArray[currSize - 1]++
                timingSum++
              } else {
                // Do nothing if invalid input received
              }
            }

            let thisCumulTiming = 0
            for (let i4 = 0; i4 < currSize; i4++) {
              const thisRelFreq = freqArray[i4]
              const thisTiming = timingArray[i4]
              const freqHz = thisRelFreq * masterFreqMult * chordFreqMult;
              if (0 < freqHz) {
                // NOTE
                const timingFraction = thisTiming / timingSum
                const noteLenBeats = chordPlayBeats * timingFraction
                const noteLenTxt = `0:${noteLenBeats}:0`;
                const noteStartBeats = thisCumulTiming / timingSum
                const noteStartTxt = `+0:${currBeatAdj + chordBeats * noteStartBeats}:0`;
                synthArray[i2].triggerAttackRelease(freqHz, noteLenTxt, noteStartTxt, noteAmplitude);
              } else {
                // REST
                // DO NOTHING
              }
              thisCumulTiming += thisTiming
            }
          }
        }
        currentBeat += chordBeats;
      });
    }
  }

  // User controls when synth gets played
  document.querySelector("body").addEventListener("click", toggleSynth)
})();
