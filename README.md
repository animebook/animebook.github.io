# Animebook
https://animebook.github.io

An HTML5 video player with navigable subtitles. Since subtitles are in the browser, you can quickly look up words using popup dictionaries like [yomichan](https://foosoft.net/projects/yomichan/).

![Animebook Screenshot](screenshot.png)

This is a modified version of https://github.com/katspaugh/videobook, with some quality-of-life improvements to match the workflow described in https://www.animecards.site.
- Dark color scheme by default
- Resizable sidebar
- Ability to retime subtitles directly in the web player. Useful for the majority of subtitles on https://kitsunekko.net/ and https://itazuraneko.neocities.org/library/sub.html, which almost always need to be retimed to the video you're watching.
- Built-in browser zoom works more reliably, in case you need to change the font size
- App is a single html page, making it easier to download and save locally. If you want this, download at https://raw.githubusercontent.com/animebook/animebook.github.io/master/index.html by right clicking and hitting 'Save As...'.


## Usage
Drag and drop your video file and your subtitle file (vtt, srt, or ass) onto the webpage and you should be good to go. You can also right click on the video and disable "Show controls" if you find the browser's built-in controls distracting. I typically do this and rely on the sidebar and hotkeys for navigation.

| Command | Description |
|---|---|
| Left/Right | Move backward/forward |
| Up/Down | Move backward/forward |
| Space | Pause/Play |
| Enter | Replay caption |
| a | Toggle auto pause mode |
| \ | Skip next auto pause. Only applies in auto pause mode. |
| v | Toggle subtitle visibility on/off |
| c | Copy current subtitle text to clipboard |
| s | Copy screenshot of video to clipboard |
| / | Move video to the middle of the current caption and take a screenshot. Hold 'Shift' to move only. |
| , | Move video to the middle of the previous caption and take a screenshot. Hold 'Shift' to move only. |
| . | Move video to the middle of the next caption and take a screenshot. Hold 'Shift' to move only. |
| b (or double click sidebar edge) | Collapse/expand sidebar |
| t | Cycle through available audio tracks. Currently (as of July 2020), this only works in Chrome and other chromium-based browsers if ``enable-experimental-web-platform-features`` is enabled in chrome://flags. On Firefox, ``media.track.enabled`` must be set to true in about:config. |
| Page Up/Page Down | OP Skip. Move backward/forward 87 seconds. |
| Shift D | Download retimed subs as an srt file |


## Video format support

If you find your video can't play, or that your video will play but there's no audio, it's almost always because your browser can't play the video or audio format associated with your file. This is the case with HEVC/H.265 video and AC3 audio, which almost all browsers can't support due to licensing issues. Refer to the following for the current state of browser support:

| Browser | Support |
|---|---|
|Microsoft Edge with Windows 10 HEVC Video Extensions|Will play almost any video file. Requires Windows 10.|
| Chrome and other Chromium based browsers (except Vivaldi/Opera)|Will play almost any file that doesn't use HEVC video or AC3 audio|
|Vivaldi and Opera|Will play few video formats (these browsers deviate from Chrome by rolling their own implementation of HTML video)|
|Firefox|Will play few video formats|
|Everything else|Probably not a good option|

So, if you want animebook to play almost all files, and you happen to be on Windows 10, the new Microsoft Edge is your best option, and you can install Yomichan on it since it's based on Chromium. Otherwise your best bet is Chrome, and you'll need to avoid using HEVC video or AC3 audio with it.

If you want to use Edge, note it won't support HEVC video out of the box. You need to follow these instructions to enable it.
1. Install Microsoft Edge based on Chromium. https://www.microsoft.com/en-us/edge
1. Install the HEVC Video Extensions from Microsoft: https://www.microsoft.com/en-us/p/hevc-video-extensions-from-device-manufacturer/9n4wgh0z6vhq
1. Open Microsoft Edge. Navigate to ``edge://flags`` in the browser
1. Enable ``PlayReady DRM for Windows 10``
1. Ensure ``Hardware-accelerated video encode`` and ``Hardware-accelerated video decode`` are enabled
1. Restart Edge