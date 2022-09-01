class FFmpeg {
    constructor() {
        this.ffmpegCore = null;
        this.ffmpegMain = null;
        this.videoFile = null;
        this.running = false;
        this.runResolve = null;
        this.fileCount = 0;
        this.defaultArgs = [
            /* args[0] is always the binary path */
            './ffmpeg',
            /* Disable interaction mode */
            '-nostdin',
            /* Force to override output file */
            '-y',
        ];
    }

    detectCompletion(message) {
        if (message === 'FFMPEG_END' && this.runResolve !== null) {
            this.runResolve();
            this.runResolve = null;
            this.running = false;
            let hangingWorkers = this.ffmpegCore.runningWorkers;
            hangingWorkers.forEach(w => {
                w.postMessage({ cmd: 'cancel' })
            });
        }
    }

    log(message) {
        console.log(message);
        this.detectCompletion(message);
    }

    async createCore() {
        try {
            return await createFFmpegCore({
                mainScriptUrlOrBlob: '/bg/js/ffmpeg/ffmpeg-core.js',
                printErr: message => this.log(message),
                print: message => this.log(message),
                locateFile: (path, prefix) => {
                    if (path.endsWith('ffmpeg-core.wasm')) {
                        return '/bg/js/ffmpeg/ffmpeg-core.wasm';
                    }
                    if (path.endsWith('ffmpeg-core.worker.js')) {
                        return '/bg/js/ffmpeg/ffmpeg-core.worker.js';
                    }
                    return prefix + path;
                }
            });
        } catch (e) {
            if (e.message === 'bad memory') {
                throw new UserFacingError(`ffmpeg didn't start. #enable-webassembly-threads may not be enabled in chrome://flags. Open chrome console for more info.`)
            }
            throw new Error(`ffmpeg didn't start: ` + e.message);
        }
    }

    async load() {
        this.ffmpegCore = await this.createCore();
        this.ffmpegMain = this.ffmpegCore.cwrap('_emscripten_proxy_main', 'number', ['number', 'number']);
        return 'Loaded ffmpeg';
    }

    updateFile(newFile) {
        this.videoFile = newFile;
        const FS = this.ffmpegCore.FS;
        const rootDirs = FS.readdir('/');
        if (rootDirs.indexOf('input') === -1) {
            FS.mkdir('/input');
        }
        else {
            this.ffmpegCore.FS_unmount('/input');
        }
        if (rootDirs.indexOf('output') === -1) {
            FS.mkdir('/output');
        }

        const WORKERFS = this.ffmpegCore.FS_filesystems.WORKERFS;
        const tmpfile = new File( [ newFile ], 'tmpfile', { type: newFile.type } );
        this.ffmpegCore.FS_mount(WORKERFS, { files: [ tmpfile ]}, '/input');
    }

    parseArgs(args) {
        const argsPtr = this.ffmpegCore._malloc(args.length * Uint32Array.BYTES_PER_ELEMENT);
        args.forEach((s, idx) => {
          const buf = this.ffmpegCore._malloc(s.length + 1);
          this.ffmpegCore.writeAsciiToMemory(s, buf);
          this.ffmpegCore.setValue(argsPtr + (Uint32Array.BYTES_PER_ELEMENT * idx), buf, 'i32');
        });
        return [args.length, argsPtr];
    }

    FS(method, ...args) {
        if (!this.ffmpegCore)
            throw new Error("Failed to run command. ffmpeg isn't loaded yet");
        var ret = null;
        try {
            ret = this.ffmpegCore.FS[method](...args);
        } catch (e) {
            if (method === 'readdir') {
                throw Error(`ffmpeg.FS('readdir', '${args[0]}') error. Check if the path exists, ex: ffmpeg.FS('readdir', '/')`);
            } else if (method === 'readFile') {
                throw Error(`ffmpeg.FS('readFile', '${args[0]}') error. Check if the path exists`);
            } else {
                throw Error('Oops, something went wrong in FS operation.');
            }
        }
        return ret;
    }

    async run(..._args) {
        if (!this.ffmpegCore)
            throw new Error("Failed to run command. ffmpeg isn't loaded yet");
        else if (this.running) {
            throw new Error("ffmpeg.wasm can only run one command at a time");
        }
        else {
            this.running = true;
            return new Promise((resolve) => {
                const args = [...this.defaultArgs, ..._args].filter((s) => s.length !== 0);
                console.log(`Run: ${args.join(' ')}`)
                this.runResolve = resolve;
                this.ffmpegMain(...this.parseArgs(args));
            });
        }
    }
}