const ws281x = require('rpi-ws281x-native')
const { io } = require('socket.io-client')

const classCode = 'd5f5'
const brightness = 100
const api = 'f5f91296026fcc3880c548bf88ca470f9f281fb1562596996e311eb29394e218443d561aa92a886f39eb40da5b254135fc0eb302c6fa6df87705af2f0bdf6108'
// school
const ip = 'http://172.16.3.103:420'
const maxPixels = 12
const gpio = 21
const stripType = ws281x.stripType.WS2811_RGB
// home
// const ip = 'http://192.168.0.8:420'
// const maxPixels = 52
// const gpio = 18
// const stripType = ws281x.stripType.SK6812_GRBW

let strip = ws281x(maxPixels, {
	dma: 10,
	freq: 800000,
	gpio: gpio,
	invert: false,
	brightness: brightness,
	stripType: stripType
})
let pixels = strip.array

// fill strip with color
function fill(color, start = 0, length = pixels.length) {
	if (length >= pixels.length) length = pixels.length

	for (let i = 0; i < length; i++) {
		pixels[i + start] = color
	}
}

// clear strip
fill(0x000000)
ws281x.render()

const socket = io(ip, {
	query: {
		api: api,
		classCode: classCode
	}
})

socket.on('connect_error', (err) => {
	console.log(err.message)

	fill(0x000000)
	ws281x.render()

	setTimeout(() => {
		socket.connect()
	}, 5000)
})

socket.on('connect', () => {
	console.log('connected')
	socket.emit('vbUpdate')
})

socket.on('vbUpdate', (pollsData) => {
	console.log('vbUpdate', pollsData)
	let pixelsPerStudent

	if (!pollsData.pollStatus) {
		fill(0x000000)
		ws281x.render()
		return
	}

	fill(0x808080)

	// convert colors to integers
	for (let pollData of Object.values(pollsData.polls)) {
		pollData.color = parseInt(pollData.color.slice(1), 16)
	}

	let pollResponses = 0

	for (let poll of Object.values(pollsData.polls)) {
		pollResponses += poll.responses
	}

	if (pollsData.totalStudents == pollResponses) pollsData.blindPoll = false

	if (pollsData.blindPoll) {
		if (pollsData.totalStudents <= 0) pixelsPerStudent = 0
		else pixelsPerStudent = Math.floor((pixels.length - 1) / pollsData.totalStudents)

		fill(
			0xFFAA00,
			0,
			pixelsPerStudent * pollResponses
		)

		ws281x.render()
		return
	}

	// count non-empty polls
	let nonEmptyPolls = -1
	for (let poll of Object.values(pollsData.polls)) {
		if (poll.responses > 0) {
			nonEmptyPolls++
		}
	}
	if (pollsData.totalStudents <= 0) pixelsPerStudent = 0
	else pixelsPerStudent = Math.floor((pixels.length - nonEmptyPolls) / pollsData.totalStudents)

	// add polls
	let currentPixel = 0
	for (let [name, poll] of Object.entries(pollsData.polls)) {
		let length = pixelsPerStudent * poll.responses

		if (length > 0)
			fill(
				poll.color,
				currentPixel,
				length
			)

		if (poll.responses > 0) currentPixel++
		currentPixel += length
	}

	ws281x.render()
})