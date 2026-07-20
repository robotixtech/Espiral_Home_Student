/** iPad/iPhone/iPod detection, robust against Chrome/Safari "Request Desktop Site" which
 *  rewrites the UA string to look like a desktop. Apple vendor + multi-touch is a
 *  hardware-reported signal that can't be spoofed. */
export function isIOSDevice(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (/Apple/.test(navigator.vendor) && navigator.maxTouchPoints > 1);
}

/** Real Mac (MacBook/iMac), not an iPad masquerading as desktop — same Apple-vendor
 *  signal as isIOSDevice() above, but WITHOUT touch support (maxTouchPoints === 0 on
 *  a Mac with no touchscreen; iPadOS "Request Desktop Site" reports UA "Macintosh" too,
 *  but keeps maxTouchPoints > 1, which isIOSDevice() catches first). */
export function isMacDevice(): boolean {
  return /Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints === 0;
}
