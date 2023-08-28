import {ChildProcess} from "child_process";
import {lstatSync, readdirSync} from "fs";
import {join as pathJoin, sep as pathSep} from "path";
import {Writable} from "stream";
import {writeFileSync} from "fs";

/***
 * Returns true if running pulumi in preview mode
 */
export const isPulumiPreview = () =>
    process.env.PULUMI_NODEJS_DRY_RUN == "true";

/***
 * Ensure path starts with a /
 * @param path
 */
export const ensureLeadingSlash = (path: string) =>
    "/" + path.replace(/^\/+/, "");

/***
 * Ensure path ends with a /
 * @param path
 */
export const ensureTrailingSlash = (path: string) =>
    path.replace(/\/+$/, "") + "/";

/***
 * Strip leading / from path
 * @param path
 */
export const stripLeadingSlash = (path: string) => path.replace(/^\/+/, "");

/***
 * Strip trailing / from path
 * @param path
 */
export const stripTrailingSlash = (path: string) => path.replace(/\/+$/, "");

/***
 * Ensure S3 prefix ends with a / and does not start with /
 * @param prefix
 */
export const normalizeS3Prefix = (prefix: string) =>
    stripLeadingSlash(ensureTrailingSlash(prefix));

/***
 * Ensure path uses / as separator and removes trailing slashes.
 * @param path Path to normalize.
 */
export const normalizePath = (path: string) =>
    stripTrailingSlash(pathSep !== "/" ? path.replace(/(\\+)/g, "/") : path);

/***
 * Returns an array of files under @dir.
 * @param dir Directory to search.
 * @param recursive Should search be recursive. Default true.
 * @param sortFiles Should returned array be sorted. Useful for hashing. Default true.
 * @param includePattern If provided only files matching RegExp will be returned.
 * @param excludePattern If provided files matching RegExp will be omitted.
 * @param depth Used internally to limit recursion to no more than 50 and optimize sort.
 */
export const folderFileList = (
    dir: string,
    recursive: boolean = true,
    sortFiles: boolean = true,
    includePattern: RegExp | null = null,
    excludePattern: RegExp | null = null,
    depth: number = 0
): string[] => {
    console.log("hashing dir: ", dir);

    const itemOutputs: string[] = [];
    if (depth > 50) {
        throw new Error("Recursion limit of 50 exceeded!");
    }
    for (let item of readdirSync(dir)) {
        // console.log("tryin readdirSync: ", item);
        const filePath = normalizePath(pathJoin(dir, item));
        if (excludePattern && excludePattern.test(filePath)) {
            continue;
        }
        if (includePattern && !includePattern.test(filePath)) {
            continue;
        }
        if (recursive && lstatSync(filePath).isDirectory()) {
            const items = folderFileList(
                filePath,
                recursive,
                sortFiles,
                includePattern,
                excludePattern,
                depth + 1
            );
            itemOutputs.push(...items);
            continue;
        }
        itemOutputs.push(normalizePath(filePath));
        // console.log(item, " synced");
    }
    // only sort files if requested and only at depth 0
    return sortFiles && depth === 0 ? itemOutputs.sort() : itemOutputs;
};

/***
 * Returns child process exit code and or signal. Used by promiseFromChildProcess
 */
export interface childListenerExit {
    code: number | null;
    signal: NodeJS.Signals | null;
}

/***
 * Convert writable to a Promise that resolves to string.
 * @param stream
 * @param enc Optional encoding for output string.
 * @param cb Optional callback function with output string as parameter.
 */
export const streamToString = (
    stream: Writable,
    enc?: string,
    cb?: (err: Error | null, output?: string) => void
): Promise<string> => {
    let str = "";

    return new Promise(function (resolve, reject) {
        stream.on("data", function (data) {
            str += enc ? data.toString(enc) : data.toString();
        });
        stream.on("end", function () {
            resolve(str);
            cb?.(null, str);
        });
        stream.on("error", function (err) {
            reject(err);
            cb?.(err);
        });
    });
};

/* Writable memory stream */
// export class MemStream extends Writable {
//   private buffer: Buffer = new Buffer('');
//
//   constructor(opts?: WritableOptions) {
//     super(opts);
//   }
//
//   public toString(encoding?: BufferEncoding): string {
//     return this.buffer.toString(encoding || 'utf8');
//   }
//
//   public _write(chunk: any, encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
//     const buffer = (Buffer.isBuffer(chunk)) ? chunk : new Buffer(chunk, encoding);
//     this.buffer = Buffer.concat([this.buffer, buffer]);
//     callback();
//   }
// }

/***
 * Wraps exec child in promise that rejects on error or resolves on clean exit
 * @param child ChildProcess object to wrap
 * @param stdout Optional writable to capture child process stdout
 * @param stderr Optional writable to capture child process stderr
 * @param timeout time in milliseconds to cancel command with error. Defaults to 0 which means no timeout
 */
export const promiseFromChildProcess = async (
    child: ChildProcess,
    stdout: Writable | null = null,
    stderr: Writable | null = null,
    timeout: number = 0
): Promise<void> => {
    return await new Promise((resolve, reject) => {
        if (timeout && timeout > 1000) {
            setTimeout(() => reject(new Error("Build timeout")), timeout);
        }
        const err_cb = (err: Error) => {
            reject(err);
        };
        const close_cb = (code: number | null) => {
            if (code) {
                reject(Error("Non-zero exit code: " + code));
                return;
            }
            resolve();
        };
        child.once("error", err_cb);
        child.once("close", close_cb);
        if (stdout && child.stdout) {
            child.stdout.pipe(stdout);
        }
        if (stderr && child.stderr) {
            child.stderr.pipe(stderr);
        }
        // child.stdout.on('data', function (data) {
        //   console.log('stdout: ' + data.toString());
        // });
        //
        // child.stderr.on('data', function (data) {
        //   console.log('stderr: ' + data.toString());
        // });
    });
};

/***
 * Updates Angular environment file with newValues
 * @param inFileName Input environment file
 * @param newValues New values to inject or overwrite in file
 * @param outFileName Output file to write new environment back to. Defaults to InFileName
 */
export const updateEnvFile = (
    inFileName: string,
    newValues: object,
    outFileName?: string
): object => {
    const jf = require(inFileName);
    const environment = {...jf.environment, ...newValues};

    outFileName = outFileName || inFileName;
    writeFileSync(
        outFileName,
        "export const environment = " + JSON.stringify(environment, null, 2) + ";"
    );
    return jf;
};

/***
 * Returns a promise that resolves after delay milliseconds or 0 ms if skipIfPreview is true and running in preview mode.
 * @param delay delay in milliseconds
 * @param skipIfPreview skip delay if running in preview mode. defaults to true
 */
export const delayedPromise = (
    delay: number,
    skipIfPreview: boolean = true
): Promise<void> =>
    new Promise((resolve) =>
        setTimeout(resolve, skipIfPreview && isPulumiPreview() ? 0 : delay)
    );

/***
 * Class to auto increment delays for each invocation of delay method.
 * Used to stagger starting of concurrent build providers or other tasks
 */
export class AutoIncrementDelayedPromise {
    private currentCount = 0;

    /***
     * Create instance of AutoIncrementDelayedPromise
     * @param startingCount used to set initial count in case you want starting delay being something other than 0
     * @param delayIncrement number of milliseconds to delay each subsequent call to delay method. defaults to 10000
     * @param skipIfPreview skips delay if running in preview mode. defaults to true
     */
    constructor(
        startingCount: number = 0,
        private delayIncrement: number = 20000,
        private skipIfPreview: boolean = true
    ) {
        this.currentCount = startingCount;
    }

    /***
     * Returns a promise that resolves after current call count * delayIncrement or 0 ms if skipIfPreview is true and running in preview mode.
     */
    delay(): Promise<void> {
        return delayedPromise(
            this.delayIncrement * this.currentCount++,
            this.skipIfPreview
        );
    }
}

export const autoIncrementDelayedPromise: AutoIncrementDelayedPromise =
    new AutoIncrementDelayedPromise();
