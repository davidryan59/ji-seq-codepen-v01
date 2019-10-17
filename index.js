// To test, copy this page into the JS section on Codepen:
// https://codepen.io/davidryan59/pen/gOOrXmJ

// Uses Tone.js module and Web Audio API to play back sequenced notes

(function() {

  // Setup control variables
  const masterVolumeDb = -6;
  const masterNotePercent = 82;
  const masterFreqMult = 6.00;
  const beatsPerMinute = 180;
  const playTotalBeats = 480;

  const s = {    // s is shorthand for Synth Setup
    channelNames: ['Bass', 'C2', 'c3', 'C4', 'c5'],
    channelSolo:  [0, 0, 0, 0, 0],   // 0 or 1 for these
    channelMute:  [0, 0, 0, 0, 0],
    channelVolDb: [-3, -3, -3, -3, -3],  // 0 is no change
    oscTypes: ['sine', 'sine', 'sine', 'sine', 'sine'],
    modTypes: ['sine', 'sine', 'sine', 'sine', 'sine'],
    oscAttack:  [0.12, 0.12, 0.12, 0.12, 0.12], // Positive decimals
    oscDecay:   [0.50, 0.50, 0.50, 0.50, 0.50],
    oscSustain: [0.80, 0.80, 0.80, 0.80, 0.80],
    oscRelease: [1.00, 1.00, 1.00, 1.00, 1.00],
    harmonic:   [1,    1,    1,    1,    1   ], // Positive integer
    modIndex:   [8.00, 8.00, 8.00, 8.00, 8.00],
    modAttack:  [0.01, 0.01, 0.01, 0.01, 0.01],
    modDecay:   [1.00, 1.00, 1.00, 1.00, 1.00],
    modSustain: [0.75, 0.75, 0.75, 0.75, 0.75],
    modRelease: [0.50, 0.50, 0.50, 0.50, 0.50],
  }

  const startAtBeat = 0;
  const sequencedData = [
    // Silent Night - verse 1
    {channelMap: ['Bass', 'C2', 'C3']},
    [6,    , [[24,,,,,18], [60,,,64,60,,48,,,,, ,], [72,,,80,72,,60,,,,, ,]]],
    [3,    , [24, [60,,,64,60, ,], [72,,,80,72, ,]]],
    [3,    , [[0,30,32], 48, 60]],

    [3,    , [36, [90,,90], [108,,108]]],
    [3,    , [18, [72,,63], 90]],
    [6,    , [[24,,,,27,30], [60,,60,48,, ,], [96,,96,72,, ,]]],

    [3,    , [[32,,32], [48,,48], [80,,80]]],
    [3,    , [[40,,,36,32, ,], [64,,64], [96,,,90,80, ,]]],
    [3,    , [[30,,,32,30, ,], [48,,48], [72,80,72]]],
    [3,    , [[24, 27, 30], 48, 60]],

    [3,    , [32, [48,,48], [80,,80]]],
    [3,    , [16, [64,,,72,64, ,], [96,90,80]]],
    [6,    , [[15,20], [54,,,,,,,,45,,50, ,], [72,,,161/2,72,,60,,,,, ,]]],  // 80+81 = 161

    [3, 4/3, [20, [48,,48], [80,,80]]],
    [3,    , [[30,,30], 75, [255/2,,,105,90, ,]]],
    [3,    , [[20,,24], 60, 96]],
    [3, 4/3, [20, 50, 90]],

    [3,    , [18, [60,,48], [96,72,60]]],
    [3,    , [[9,,9*5/4], [45,,63/2], [72,63,54]]],
    [6,    , [12, 30, 48]],
  ];
  // Above, the chords are setup as an array.
  // Each chord is itself an array of format:
  // [chordBeats, chordFreqMult, [chordFreqArray], chordVolDb, chordNotePercent]
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

  let soloActive = false
  s.channelSolo.forEach( elt => elt ? (soloActive = true) : null )
  console.log(`Solo active: ${soloActive}`)

  // Setup synthArray via Tone.js module
  const numChannels = s.channelNames.length;
  Tone.Transport.bpm.value = beatsPerMinute;
  let isSynthPlaying = false
  let synthArray = [];

  function setupSynths() {
    console.log('Setting up synths')
    synthArray = []
    for (let i1 = 0; i1 < numChannels; i1++) {
      synthArray[i1] = new Tone.FMSynth({
        oscillator: {type: s.oscTypes[i1]},
        envelope: {
          attack: s.oscAttack[i1],
          decay: s.oscDecay[i1],
          sustain: s.oscSustain[i1],
          release: s.oscRelease[i1]
        },
        modulation: {type: s.modTypes[i1]},
        harmonicity: s.harmonic[i1],
        modulationIndex: s.modIndex[i1],
        modulationEnvelope: {
          attack: s.modAttack[i1],
          decay: s.modDecay[i1],
          sustain: s.modSustain[i1],
          release: s.modRelease[i1]
        }
      }).toMaster();
    }
    isSynthPlaying = true
  }

  function teardownSynths() {
    console.log('Tearing down synths')
    synthArray.forEach( synth => synth.dispose() )
    synthArray = []
    isSynthPlaying = false
  }

  let channelMapArray = []
  function updateChannelMap(channelMapData) {
    channelMapArray = channelMapData.map(
      mapChanName => s.channelNames.findIndex(
        chanName => chanName.toLowerCase() === mapChanName.toLowerCase()
      ) + 1   // The +1 makes index truthy iff its valid
    )
    console.log('Updated channel map', channelMapData, 'maps to channels', channelMapArray)
  }

  // Function that actually plays the specified chords
  function toggleSynth() {
    if (isSynthPlaying) {
      teardownSynths()
    } else {
      setupSynths()
      let currentBeat = 0;
      sequencedData.forEach( sequencedRow => {
        if (!Array.isArray(sequencedRow)) {
          // Assume row is an object which is a control message
          let currData;
          if (currData = sequencedRow.channelMap) {
            // channelMap control message
            updateChannelMap(currData)
          }
          // Insert any other control messages here
        } else {
          // Row is an array describing a chord or polyphonic part
          const chordBeats = sequencedRow[0] || 1;
          const chordFreqMult = sequencedRow[1] || 1;
          const chordFreqArray = sequencedRow[2] || [];
          const chordVolDb = sequencedRow[3] || 0;
          const chordNotePercent = sequencedRow[4] || masterNotePercent;
          const freqArrayChannels = chordFreqArray.length;
          const currBeatAdj = currentBeat - startAtBeat;
          const chordNoteFraction = Math.max(0, Math.min(1, 0.01 * chordNotePercent));
          const chordPlayBeats = chordBeats * chordNoteFraction;
          if (0 <= currBeatAdj && currBeatAdj <= playTotalBeats && freqArrayChannels > 0) {
            for (let i2 = 0; i2 < freqArrayChannels; i2++) {
              // Map channels in chord (i2) to synth channels (i2m)
              const i2m_plus1 = channelMapArray[i2]  // [1, 2, 3...]
              const i2m = i2m_plus1 - 1            // [0, 1, 2...]
              if (i2m_plus1 && !s.channelMute[i2m] && !(soloActive && !s.channelSolo[i2m]))  {
                const noteAmplitude = Math.pow(10, 0.05 * (masterVolumeDb + s.channelVolDb[i2m] + chordVolDb));
                let freqData = chordFreqArray[i2m]
                // freqData is either:
                // 1) a number, representing a single frequency / note
                // Deal with case 1) by converting it to single note in case 2)
                if (Number.isInteger(freqData)) freqData = [freqData]
                // 2) an array of numbers, representing a melody of several frequencies
                // Deal with non-case-2) by converting it to a rest in case 2)
                if (!Array.isArray(freqData)) freqData = [0]
                // Now freqData must be an array.
                // Convert to freqArray with timings.
                let currSize = 0
                const freqArray = []
                const timingArray = []
                let timingSum = 0
                for (let i3 = 0; i3 < freqData.length; i3++) {
                  const thisFreq = freqData[i3]
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
                    synthArray[i2m].triggerAttackRelease(freqHz, noteLenTxt, noteStartTxt, noteAmplitude);
                  } else {
                    // REST
                    // DO NOTHING
                  }
                  thisCumulTiming += thisTiming
                }
              }
            }
          }
          currentBeat += chordBeats;
        }
      });
    }
  }

  // User controls when synth gets played
  document.querySelector("body").addEventListener("click", toggleSynth)
})();
