// const player = require('play-sound')(opts = {})

// player.play('./sfx/amongusstart.wav', function (err) {
//  if (err && !err.killed) throw err
// })

import Audic from 'audic';

let soundQueue = []

class Sound {
	constructor(file, priority = 0, loop = false) {
		this.file = file
		this.priority = priority
		this.audio = new Audic(this.file)
		this.audio.loop = loop
	}
}

function playSound(file, priority = 0, loop = false) {
	let sound = new Sound(file, priority, loop)

	let index = soundQueue.length
	for (let i = 0; i < soundQueue.length; i++) {
		if (soundQueue[i].priority < sound.priority) {
			index = i
			break
		}
	}

	if (soundQueue[0] && index == 0)
		soundQueue[0].audio.pause()

	soundQueue.splice(index, 0, sound)

	if (index == 0)
		soundQueue[0].audio.play()

	soundQueue[index].audio.addEventListener('ended', () => {
		// this line stops the next sound from playing when it is added but not played
		// do not remove it will break the queue
		if (soundQueue[0].audio.duration != 0) return

		if (soundQueue[0].audio.loop) return

		soundQueue[0].audio.destroy()
		soundQueue.shift()

		if (soundQueue[0])
			soundQueue[0].audio.play()
	})
}

playSound('./bgm/amongusdrip.mp3')

setTimeout(() => {
	playSound('./sfx/babyshark.wav', 1)
	playSound('./sfx/bruh.wav', 1, true)
}, 15000);

setTimeout(() => {
	playSound('./sfx/bombdefused.wav', 2)
}, 18000);

setTimeout(() => {
	soundQueue[0].audio.loop = false
}, 35000);
