# Animebook
https://animebook.github.io

An HTML5 video player with navigable subtitles. Since subtitles are in the browser, you can quickly look up words with popup dictionaries like [yomichan](https://foosoft.net/projects/yomichan/), and you can quickly create flashcards for Anki using the [Animebook Chrome extension](https://chrome.google.com/webstore/detail/animebook-anki-export/ohcbgkombhgcbjcikjlgdmjkpibafppa).

![Animebook Screencapture](screencapture.gif)

Animebook is designed to match the mining workflow described in https://www.animecards.site, with features such as:
- Ability to retime subtitles directly in the web player. Useful for the majority of subtitles on https://kitsunekko.net/ and https://itazuraneko.neocities.org/library/sub.html, which almost always need to be retimed to the video you're watching.
- Fast flashcard creation using the [Animebook Chrome extension](https://chrome.google.com/webstore/detail/animebook-anki-export/ohcbgkombhgcbjcikjlgdmjkpibafppa). If you use Yomichan to add a word to Anki while watching a show, you can then use Animebook to add screenshots, audio, and subtitle lines automatically to your flashcard.
- App is a single html page, making it easier to download and save locally. If you want this, download [here](https://raw.githubusercontent.com/animebook/animebook.github.io/master/index.html) by right clicking and hitting 'Save As...'.
- Optional auto pause for when a caption is done playing, giving you time to scan any words or phrases you didn't catch.

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
| , | Move video to the middle of the previous caption and take a screenshot. Hold 'Shift' to move only. |
| . | Move video to the middle of the next caption and take a screenshot. Hold 'Shift' to move only. |
| b (or double click sidebar edge) | Collapse/expand sidebar |
| h | Hide content in parentheses (configurable in the 'Appearance' tab) |
| ? | Open help menu |
| t | Cycle through available audio tracks. Currently (as of July 2020), this only works in Chrome and other chromium-based browsers if ``enable-experimental-web-platform-features`` is enabled in chrome://flags. On Firefox, ``media.track.enabled`` must be set to true in about:config. |
| -/= | Decrease/Increase subtitle font size |
| Page Up/Page Down | OP Skip. Move backward/forward 87 seconds. |
| F11 | Full screen toggle. This is a browser shortcut. |
| Shift D | Download retimed subs as an srt file |
| e | Add context to most recent anki card (requires the [Animebook Chrome extension](https://chrome.google.com/webstore/detail/animebook-anki-export/ohcbgkombhgcbjcikjlgdmjkpibafppa) to be installed) |


## Video format support

If you find your video can't play, or that your video will play but there's no audio, it's almost always because your browser can't play the file's video or audio codec. This is the case with HEVC/H.265 video and AC3 audio, which almost all browsers can't support due to licensing issues. Current state of browser support:

| Browser | Support |
|---|---|
|[Marmaduke all-codecs builds of Chromium](https://chromium.woolyss.com/)|Will play almost any file that doesn't use AC3 audio|
|Chrome and other Chromium based browsers (except Vivaldi/Opera)|Will play almost any file that doesn't use HEVC video or AC3 audio|
|Vivaldi and Opera|Will play few video codecs (these browsers deviate from Chrome by rolling their own implementation of HTML video)|
|Firefox|Will play few video codecs|
|Everything else|Probably not a good option|

So, if you want animebook to play the most video files, the Marmaduke all-codecs builds of chromium are your best bet, and you can install Yomichan on it (instructions below). Otherwise your best bet is Chrome, and you'll need to avoid using HEVC video or AC3 audio with it. And in my experience, while a lot of anime uses HEVC video, AC3 audio is relatively rare, so I've been able to get by with just using Marmaduke and occasionally having to avoid releases with AC3.

Marmaduke Chromium installation instructions:
1. Find and install a Marmaduke all-codecs build of Chromium on https://chromium.woolyss.com/. Make sure both the tags "Marmaduke" and "all-codecs" are tagged on the release.
2. Enter the browser flag `chrome://flags/#enable-clear-hevc-for-testing` into your url bar and enable it in the page that shows up.
3. Enable the Chrome web store, by manually installing https://github.com/NeverDecaf/chromium-web-store into Chromium (this is required because the Chromium build is ungoogled).

Note: I used to recommend Microsoft Edge with HEVC Video Extensions to watch HEVC video on animebook, but as of October 2020 the Microsoft store started charging money for HEVC support, so I removed it from the browser list. It technically does support AC3 audio though, unlike Ungoogled Chromium.

## Similar Software
- https://github.com/killergerbah/asbplayer - Web based player like animebook but with a ton of neat features and regular updates
- https://github.com/ripose-jp/Memento - Desktop video player with Japanese support, based on mpv
- [Anacreon's mpv script](https://anacreondjt.gitlab.io/docs/mpvscript/) - Lets you mine using mpv and a texthooker
- https://github.com/katspaugh/videobook - Not currently maintained, but the original idea for animebook comes from this web player
