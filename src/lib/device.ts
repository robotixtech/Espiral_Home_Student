/** iPad/iPhone/iPod detection, robust against Chrome/Safari "Request Desktop Site" which
 *  rewrites the UA string to look like a desktop. Apple vendor + multi-touch is a
 *  hardware-reported signal that can't be spoofed. */
export function isIOSDevice(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (/Apple/.test(navigator.vendor) && navigator.maxTouchPoints > 1);
}
