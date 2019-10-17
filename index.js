// To test, copy this page into the JS section on Codepen:
// https://codepen.io/davidryan59/pen/gOOrXmJ

// Uses Tone.js module and Web Audio API to play back sequenced notes

(function() {

  // <------- USER INPUT AREA START --------->

  // Channel / Voice setup
  // Currently it is Bass, Tenor, Alto, Soprano, Descant; 2 channels for each
  const s = {
    channelNames: ['B1', 'B2', 'T1', 'T2', 'A1', 'A2', 'S1', 'S2', 'D1', 'D2'],
    channelSolo:  [   0,    0,    0,    0,    0,    0,    0,    0,    0,    0], // 1 to solo
    channelMute:  [   0,    0,    0,    0,    0,    0,    0,    0,    0,    0], // 1 to mute
    channelVolDb: [  -2,   -2,   -2,   -2,   -2,   -2,   -2,   -2,   -2,   -2], // 0 is no change
    oscAttack:    [0.12, 0.12, 0.12, 0.12, 0.12, 0.12, 0.12, 0.12, 0.12, 0.12], // Positive decimal
    oscDecay:     [0.50, 0.50, 0.50, 0.50, 0.50, 0.50, 0.50, 0.50, 0.50, 0.50], // Positive decimal
    oscSustain:   [0.80, 0.80, 0.80, 0.80, 0.80, 0.80, 0.80, 0.80, 0.80, 0.80], // Positive decimal
    oscRelease:   [1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00], // Positive decimal
    harmonic:     [   1,    1,    1,    1,    1,    1,    1,    1,    1,    1], // Positive INTEGER
    modIndex:     [8.00, 8.00, 8.00, 8.00, 8.00, 8.00, 8.00, 8.00, 8.00, 8.00], // Positive decimal
    modAttack:    [0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01, 0.01], // Positive decimal
    modDecay:     [1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00, 1.00], // Positive decimal
    modSustain:   [0.75, 0.75, 0.75, 0.75, 0.75, 0.75, 0.75, 0.75, 0.75, 0.75], // Positive decimal
    modRelease:   [0.50, 0.50, 0.50, 0.50, 0.50, 0.50, 0.50, 0.50, 0.50, 0.50], // Positive decimal
  }

  // Control variables
  const beatsPerMinute = 180;
  const playTotalBeats = 480;
  const startAtBeat = 0;

  // Sequenced Data
  const sequencedData = [
    // Channel Tester
    {volumeDb: -3, notePercent: 75, freqMult: 5},
    {channelMap: ['B1', 'B2', 'T1', 'T2', 'A1', 'A2', 'S1', 'S2', 'D1', 'D2']},
    [2,   , [,,,,[64,,0]]],
    [4,   , [[8,,16,32,,0]]],
    [4,   , [,[9,,18,36,,0]]],
    [4,   , [,,[16,,32,64,,0]]],
    [4,   , [,,,[18,,36,72,,0]]],
    [4,   , [,,,,[30,,60,120,,0]]],
    [4,   , [,,,,,[32,,64,128,,0]]],
    [4,   , [,,,,,,[50,,100,200,,0]]],
    [4,   , [,,,,,,,[55,,110,220,,0]]],
    [4,   , [,,,,,,,,[80,,160,320,,0]]],
    [4,   , [,,,,,,,,,[90,,180,360,,0]]],

    // Add sequenced rows here
  ];
  // The sequenced data is a big array.
  // Each row is either an object with control values, or an array containing notes to play.
  // A note array has the following format:
  // [time (beats), optional frequency multiplier, [notes to play], gain in dB, note play %]
  // Defaults are:
  // [1, 1, [play no notes], 0, 90]
  // The gain is normally negative, to quieten a note, or zero for no change in gain.
  // The frequency multiplier will transpose frequencies of all notes in this sequence row.
  // In chordFreqArray, a positive number A specifies a frequency,
  // and an array [A, B...] specifies a short melody of multiple frequencies
  // e.g. [A, B, C] for a triplet to play within the chord.
  // You can also tie notes using nulls: [A,,B] or [A,B, ,]
  // and specify rests using 0: [A,0,B], [0,A] etc
  // or do both: [A,,0,,B, ,]
  // Note - if the last array element is null, an extra comma is needed!

  // <------- USER INPUT AREA FINISH --------->


  let volumeDb, notePercent, freqMult

  let soloActive = false
  s.channelSolo.forEach( elt => elt ? (soloActive = true) : null )
  console.log(`Solo active: ${soloActive}`)

  // Setup synthArray via Tone.js module
  const numChannels = s.channelNames.length;
  console.log(`There are ${numChannels} channels available`)
  Tone.Transport.bpm.value = beatsPerMinute;
  let isSynthPlaying = false
  let synthArray = [];

  let channelMapArray = []
  function updateChannelMap(channelMapData) {
    channelMapArray = channelMapData.map(
      mapChanName => s.channelNames.findIndex(
        chanName => chanName.toLowerCase() === mapChanName.toLowerCase()
      ) + 1   // The +1 makes index truthy iff its valid
    )
    console.log('Updated channel map', channelMapData, 'maps to channels', channelMapArray)
  }

  function setupSynths() {
    console.log('Setting up synths')
    synthArray = []
    for (let i1 = 0; i1 < numChannels; i1++) {
      synthArray[i1] = new Tone.FMSynth({
        oscillator: {type: 'sine'},
        envelope: {
          attack: s.oscAttack[i1],
          decay: s.oscDecay[i1],
          sustain: s.oscSustain[i1],
          release: s.oscRelease[i1]
        },
        modulation: {type: 'sine'},
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
          if (currData = sequencedRow.volumeDb) {
            volumeDb = Number.isFinite(currData) && -200 <= currData && currData <= 100
              ? currData
              : volumeDb
          }
          if (currData = sequencedRow.notePercent) {
            notePercent = Number.isFinite(currData) && 0 <= currData && currData <= 100
              ? currData
              : notePercent
          }
          if (currData = sequencedRow.freqMult) {
            freqMult = Number.isFinite(currData) && 0 < currData
              ? currData
              : freqMult
          }
          // Insert any other control messages here
        } else {
          // Row is an array describing a chord or polyphonic part
          const chordBeats = sequencedRow[0] || 1;
          const chordFreqMult = sequencedRow[1] || 1;
          const chordFreqArray = sequencedRow[2] || [];
          const chordVolDb = sequencedRow[3] || 0;
          const chordNotePercent = sequencedRow[4] || notePercent || 90;
          const freqArrayChannels = chordFreqArray.length;
          const currBeatAdj = currentBeat - startAtBeat;
          const chordNoteFraction = Math.max(0, Math.min(1, 0.01 * chordNotePercent));
          const chordPlayBeats = chordBeats * chordNoteFraction;
          if (0 <= currBeatAdj && currBeatAdj <= playTotalBeats && freqArrayChannels > 0) {
            for (let i2 = 0; i2 < freqArrayChannels; i2++) {
              let freqData = chordFreqArray[i2]
              // Map channels in chord (i2) to synth channels (i2m)
              const i2m_plus1 = channelMapArray[i2]  // [1, 2, 3...]
              const i2m = i2m_plus1 - 1            // [0, 1, 2...]
              if (i2m_plus1 && !s.channelMute[i2m] && !(soloActive && !s.channelSolo[i2m]))  {
                const noteAmplitude = Math.pow(10, 0.05 * (volumeDb + s.channelVolDb[i2m] + chordVolDb));
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
                  const freqHz = thisRelFreq * freqMult * chordFreqMult;
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
