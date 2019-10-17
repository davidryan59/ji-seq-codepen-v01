// To test, copy this page into the JS section on Codepen:
// https://codepen.io/davidryan59/pen/gOOrXmJ

// Uses Tone.js module and Web Audio API to play back sequenced notes

(function() {

  // <------- USER INPUT AREA START --------->

  // Channel / Voice setup
  // Currently it is Bass, Tenor, Alto, Soprano, Descant; 2 channels for each
  const s = {
    channelNames: [  'B1',  'B2',  'T1',  'T2',  'A1',  'A2',  'S1',  'S2',  'D1',  'D2'],
    channelSolo:  [     0,     0,     0,     0,     0,     0,     0,     0,     0,     0], // 1 to solo
    channelMute:  [     0,     0,     0,     0,     0,     0,     0,     0,     0,     0], // 1 to mute
    channelGainDb:[    -4,    -4,    -4,    -4,    -4,    -4,    -3,    -3,    -6,    -6], // 0 is no change
    oscAttack:    [  0.10,  0.01,  0.05,  0.01,  0.04,  0.02,  0.04,  0.02,  0.50,  0.60], // Positive decimal
    oscDecay:     [  0.30,  0.30,  1.00,  1.00,  1.00,  0.50,  0.60,  0.50,  0.60,  0.50], // Positive decimal
    oscSustain:   [  0.90,  0.90,  0.80,  0.77,  0.77,  0.77,  0.80,  0.80,  0.90,  0.85], // Positive decimal
    oscRelease:   [  5.00,  5.00,  3.00,  2.50,  2.50,  2.50,  2.00,  2.00,  1.50,  1.50], // Positive decimal
    harmonic:     [     1,     4,     1,     3,     1,     6,     1,     2,     1,     2], // Positive INTEGER
    modIndex:     [  13.0,  12.0,  10.0,   9.0,   6.0,   5.0,   6.0,   6.0,   5.0,   6.0], // Positive decimal
    modAttack:    [  0.05, 0.001,  0.03, 0.002, 0.035, 0.003,  0.04, 0.004,  0.80,  0.65], // Positive decimal
    modDecay:     [  0.70,  0.50,  0.80,  0.50,  0.70,  0.30,  1.00,  0.25,  4.00,  4.00], // Positive decimal
    modSustain:   [  0.80,  0.50,  0.80,  0.30,  0.88,  0.40,  0.80,  0.35,  0.80,  0.80], // Positive decimal
    modRelease:   [  2.00,  1.20,  1.00,  1.50,  0.60,  0.90,  0.50,  0.80,  0.75,  0.80], // Positive decimal
  }

  // Control variables
  const beatsPerMinute = 140;
  const playTotalBeats = 480;
  const startAtBeat = 0;

  // Sequenced Data
  const sequencedData = [
    // Channel Tester
    {gainDb: -3, notePercent: 75, freqMult: 5},
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
  // In 'notes to play', a positive number A specifies a frequency,
  // and an array [A, B...] specifies a short melody of multiple frequencies
  // e.g. [A, B, C] for a triplet to play within the chord.
  // You can also tie notes using nulls: [A,,B] or [A,B, ,]
  // and specify rests using 0: [A,0,B], [0,A] etc
  // or do both: [A,,0,,B, ,]
  // Note - if the last array element is null, an extra comma is needed!

  // <------- USER INPUT AREA FINISH --------->


  let gainDb, notePercent, freqMult

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
          if (currData = sequencedRow.gainDb) {
            gainDb = Number.isFinite(currData) && -200 <= currData && currData <= 100
              ? currData
              : gainDb
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
          const rowBeats = sequencedRow[0] || 1;
          const rowFreqMult = sequencedRow[1] || 1;
          const rowFreqArray = sequencedRow[2] || [];
          const rowGainDb = sequencedRow[3] || 0;
          const rowNotePercent = sequencedRow[4] || notePercent || 90;
          const rowNumChannels = rowFreqArray.length;
          const currBeatAdj = currentBeat - startAtBeat;
          const rowNoteFraction = Math.max(0, Math.min(1, 0.01 * rowNotePercent));
          const rowPlayBeats = rowBeats * rowNoteFraction;
          if (0 <= currBeatAdj && currBeatAdj <= playTotalBeats && rowNumChannels > 0) {
            for (let i2 = 0; i2 < rowNumChannels; i2++) {
              let freqData = rowFreqArray[i2]
              // Map channels in chord (i2) to synth channels (i2m)
              const i2m_plus1 = channelMapArray[i2]  // [1, 2, 3...]
              const i2m = i2m_plus1 - 1            // [0, 1, 2...]
              if (i2m_plus1 && !s.channelMute[i2m] && !(soloActive && !s.channelSolo[i2m]))  {
                const noteAmplitude = Math.pow(10, 0.05 * (gainDb + s.channelGainDb[i2m] + rowGainDb));
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
                  const freqHz = thisRelFreq * freqMult * rowFreqMult;
                  if (0 < freqHz) {
                    // NOTE
                    const timingFraction = thisTiming / timingSum
                    const noteLenBeats = rowPlayBeats * timingFraction
                    const noteLenTxt = `0:${noteLenBeats}:0`;
                    const noteStartBeats = thisCumulTiming / timingSum
                    const noteStartTxt = `+0:${currBeatAdj + rowBeats * noteStartBeats}:0`;
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
          currentBeat += rowBeats;
        }
      });
    }
  }

  // User controls when synth gets played
  document.querySelector("body").addEventListener("click", toggleSynth)
})();
