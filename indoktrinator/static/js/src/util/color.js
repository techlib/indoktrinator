export function UuidToRgba(uuid) {

 function HSVtoRGB(h, s, v) {
			// http://stackoverflow.com/questions/17242144/javascript-convert-hsb-hsv-color-to-rgb-accurately

      var r, g, b, i, f, p, q, t
      if (arguments.length === 1) {
          s = h.s, v = h.v, h = h.h
      }
      i = Math.floor(h * 6)
      f = h * 6 - i
      p = v * (1 - s)
      q = v * (1 - f * s)
      t = v * (1 - (1 - f) * s)
      switch (i % 6) {
          case 0: r = v, g = t, b = p; break
          case 1: r = q, g = v, b = p; break
          case 2: r = p, g = v, b = t; break
          case 3: r = p, g = q, b = v; break
          case 4: r = t, g = p, b = v; break
          case 5: r = v, g = p, b = q; break
      }
      return {
          r: Math.round(r * 255),
          g: Math.round(g * 255),
          b: Math.round(b * 255)
      }
  }

  let hue = parseInt('0x' + uuid.substr(0, 4))
  let saturation = parseInt('0x' + uuid.substr(4, 2))
  let value = parseInt('0x' + uuid.substr(6, 2))

	hue /= 0xffff
	saturation = saturation / 0xff * 0.2 + 0.8
	value = value / 0xff * 0.2 + 0.8

	let color = HSVtoRGB(hue, saturation, value)

	return `rgba(${color.r},${color.g},${color.b}, 0.25)`

}
