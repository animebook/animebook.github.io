# Animebook
https://animebook.github.io

An HTML5 video player with navigable subtitles. Since subtitles are in the browser, you can quickly look up words using popup dictionaries like [yomichan](https://foosoft.net/projects/yomichan/).

![Animebook Screenshot](screenshot.png)

This is a modified version of https://github.com/katspaugh/videobook, with some quality-of-life improvements to match the workflow described in https://www.animecards.site.
- Dark color scheme by default
- Resizable sidebar
- Ability to offset subtitles by a static time directly in the web player. Useful for the majority of subtitles on https://kitsunekko.net/ and https://itazuraneko.neocities.org/library/sub.html, which almost always need to be retimed to the video you're watching. Animebook can only offset when the subs start though, so for any retiming more complicated than that, you'll need to either regularly offset the subs while watching, or use the [alass scripts from animecards](https://www.animecards.site/#h.p_JJ4k20WaHvx2).
- App is a single html page, making it easier to download and save locally
- Built-in browser zoom works more reliably, in case you need to change the font size

## Usage
Drag and drop your video file and your subtitle file (vtt, srt, or ass) onto the webpage and you should be good to go. Some videos will show an error message when you drop them onto the screen, and that's usually because the video format isn't supported by web players (H.265 video and AC3 audio have this problem). Also, different browsers use different video codecs, so for best results it's recommended to use Chrome, since as of writing it supports the most video formats I've seen among major browsers.

You can also right click on the video and disable "Show controls" if you find the browser's built-in controls distracting. I typically do this and rely on the sidebar and hotkeys for navigation.
- Left/Up - Move backward
- Right/Down - Move forward
- Space - Pause/Play
- Enter - Replay caption
- , - Find last screenshot. Moves video to the middle of the last caption.
- . - Find next screenshot. Moves video to the middle of the next caption.
- / - Find current screenshot. Moves video to the middle of the current caption.
- A - Toggle auto pause mode
- Double click sidebar edge - collapse/expand sidebar