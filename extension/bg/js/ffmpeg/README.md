FFmpeg is a tool used to process video files. Animebook uses it to take screenshots and record audio, and the reason it's usable in the browser because it's been compiled to WebAssembly for Animebook, the project of which you can view here: https://github.com/animebook/ffmpeg.wasm-core

For future reference, I basically took the ffmpeg.wasm project, changed a few compiler flags so I could e.g. read files off disk, and dropped the result in this folder.
